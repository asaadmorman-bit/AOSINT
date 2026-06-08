import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ioc, ioc_type, indicator_id, playbook_ids, batch_iocs } = body;

    // Support both single IOC and batch
    const iocList = batch_iocs?.length
      ? batch_iocs
      : [{ ioc, ioc_type }];

    if (!iocList.length || !iocList[0]?.ioc) {
      return Response.json({ error: 'ioc or batch_iocs is required' }, { status: 400 });
    }

    // Fetch platform context once for all IOCs
    const [existingIndicators, threatActors, campaigns, playbooks] = await Promise.all([
      base44.asServiceRole.entities.ThreatIndicator.filter({ status: 'active' }),
      base44.asServiceRole.entities.ThreatActor.list('', 100).catch(() => []),
      base44.asServiceRole.entities.Campaign.list('', 100).catch(() => []),
      playbook_ids?.length
        ? Promise.all(playbook_ids.map(id =>
            base44.asServiceRole.entities.Playbook.filter({ id }).then(r => r[0]).catch(() => null)
          )).then(r => r.filter(Boolean))
        : base44.asServiceRole.entities.Playbook.filter({ status: 'active' }),
    ]);

    const platformContext = `
Known threat actors: ${threatActors.slice(0, 15).map(a => a.name || a.actor_name || a.id).join(', ') || 'none'}
Active campaigns: ${campaigns.slice(0, 10).map(c => c.name || c.id).join(', ') || 'none'}
Existing indicators count: ${existingIndicators.length}
    `.trim();

    // Process each IOC — batch in parallel (max 5 at once to avoid timeouts)
    const results = [];
    const chunkSize = 5;
    for (let i = 0; i < iocList.length; i += chunkSize) {
      const chunk = iocList.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(item => enrichSingle(item.ioc, item.ioc_type, existingIndicators, platformContext, base44)));
      results.push(...chunkResults);
    }

    // --- Merge all TTPs across the batch for cross-IOC attack vector prediction ---
    const allTTPs = [...new Set(results.flatMap(r => r.enrichment?.mitre_ttps || []))];
    const allActors = [...new Set(results.flatMap(r => r.enrichment?.threat_actors || []))];
    const allMalware = [...new Set(results.flatMap(r => r.enrichment?.malware_families || []))];

    let attackVectorPrediction = null;
    if (allTTPs.length > 0) {
      const predictionPrompt = `You are an elite threat intelligence analyst specializing in predictive attack modeling.

Based on the following correlated IOCs and TTPs from a batch analysis, predict the most likely future attack vectors and kill chain progression.

IOCs analyzed: ${iocList.map(i => `${i.ioc_type}:${i.ioc}`).join(', ')}
Correlated TTPs: ${allTTPs.join(', ')}
Threat actors: ${allActors.join(', ')}
Malware families: ${allMalware.join(', ')}
Platform context: ${platformContext}

Provide:
1. The most likely attack kill chain sequence (ordered phases) based on the TTP cluster
2. Predicted next-phase attack techniques the adversary is likely to execute
3. Predicted target asset types most at risk
4. Predicted timeline and urgency
5. Environmental indicators that would confirm the predicted attack path
6. Specific detection logic / hunting queries to get ahead of the attack
7. Recommended defensive actions to disrupt the predicted attack chain
8. Confidence in the prediction and key assumptions

Be precise, technical, and threat-hunt focused.`;

      attackVectorPrediction = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: predictionPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            kill_chain_sequence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  techniques: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                  status: { type: 'string', description: 'observed/predicted' },
                }
              }
            },
            predicted_next_techniques: { type: 'array', items: { type: 'string' } },
            target_assets_at_risk: { type: 'array', items: { type: 'string' } },
            predicted_timeline: { type: 'string' },
            urgency: { type: 'string', description: 'immediate/high/medium/low' },
            confirmation_indicators: { type: 'array', items: { type: 'string' } },
            detection_queries: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, query: { type: 'string' }, description: { type: 'string' } } } },
            defensive_actions: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string' },
            key_assumptions: { type: 'array', items: { type: 'string' } },
            overall_threat_narrative: { type: 'string' },
          }
        }
      });
    }

    // --- Update playbooks with merged enrichment context ---
    const updatedPlaybooks = [];
    for (const playbook of playbooks) {
      const existingTrigger = tryParse(playbook.trigger_conditions) || {};
      const existingSchema = tryParse(playbook.input_schema) || { type: 'object', properties: {} };

      const newTrigger = {
        ...existingTrigger,
        associated_ttps: [...new Set([...(existingTrigger.associated_ttps || []), ...allTTPs])].slice(0, 30),
        malware_families: [...new Set([...(existingTrigger.malware_families || []), ...allMalware])].slice(0, 20),
        threat_actors: [...new Set([...(existingTrigger.threat_actors || []), ...allActors])].slice(0, 20),
        predicted_next_techniques: attackVectorPrediction?.predicted_next_techniques || [],
        target_assets_at_risk: attackVectorPrediction?.target_assets_at_risk || [],
        auto_hunt_on_match: true,
        last_enriched: new Date().toISOString(),
        enriched_iocs: iocList.map(i => i.ioc),
        attack_urgency: attackVectorPrediction?.urgency || 'medium',
      };

      // Collect all schema fields from all IOC enrichments
      const allSuggestedFields = results.flatMap(r => r.enrichment?.suggested_input_schema_fields || []);
      const newSchemaProps = { ...existingSchema.properties };
      for (const field of allSuggestedFields) {
        if (field.field_name && !newSchemaProps[field.field_name]) {
          newSchemaProps[field.field_name] = { type: field.field_type || 'string', description: field.description || '' };
        }
      }
      // Core IOC fields always present
      Object.assign(newSchemaProps, {
        ioc_value: { type: 'string', description: 'Primary IOC value to hunt' },
        ioc_type: { type: 'string', description: 'Type of IOC' },
        severity: { type: 'string', description: 'Severity level' },
        associated_ttps: { type: 'array', items: { type: 'string' }, description: 'MITRE ATT&CK TTPs' },
        predicted_attack_vector: { type: 'string', description: 'AI-predicted next attack phase' },
      });

      await base44.asServiceRole.entities.Playbook.update(playbook.id, {
        trigger_conditions: JSON.stringify(newTrigger),
        input_schema: JSON.stringify({ type: 'object', properties: newSchemaProps }),
      });
      updatedPlaybooks.push({ id: playbook.id, name: playbook.playbook_name });
    }

    // Persist single IOC enrichment if indicator_id provided
    if (indicator_id && results[0]) {
      const e = results[0].enrichment;
      await base44.asServiceRole.entities.ThreatIndicator.update(indicator_id, {
        enrichment_data: JSON.stringify({ enrichment: e, attack_vector_prediction: attackVectorPrediction }),
        mitre_tactics: e.mitre_ttps || [],
        related_actors: e.threat_actors || [],
        severity: e.severity || 'medium',
        confidence: e.confidence_score || 70,
      });
    }

    return Response.json({
      mode: batch_iocs?.length ? 'batch' : 'single',
      ioc_count: iocList.length,
      results,
      attack_vector_prediction: attackVectorPrediction,
      batch_summary: {
        total_ttps: allTTPs.length,
        total_actors: allActors.length,
        total_malware: allMalware.length,
        all_ttps: allTTPs,
        all_actors: allActors,
        all_malware: allMalware,
        severity_breakdown: results.reduce((acc, r) => {
          const s = r.enrichment?.severity || 'unknown';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {}),
      },
      playbooks_updated: updatedPlaybooks,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enrichSingle(ioc, ioc_type, existingIndicators, platformContext, base44) {
  const related = existingIndicators.filter(ind => {
    const val = (ind.value || '').toLowerCase();
    const q = (ioc || '').toLowerCase();
    return val.includes(q) || q.includes(val.slice(0, 8));
  }).slice(0, 5);

  const prompt = `You are a senior threat intelligence analyst. Enrich this IOC with all available threat intelligence.

IOC: ${ioc}
IOC Type: ${ioc_type}
Related platform indicators: ${related.map(i => `${i.indicator_type}:${i.value}(${i.severity})`).join(', ') || 'none'}
${platformContext}

Provide:
1. Malware families associated with this IOC
2. Threat actor / APT attributions
3. Related campaigns
4. MITRE ATT&CK TTPs (format: "Tactic:TechniqueID - Name")
5. Exploited CVEs
6. Specific actionable threat hunting steps
7. Suggested playbook trigger conditions
8. Suggested input_schema fields for playbooks
9. Severity (critical/high/medium/low) and confidence score (0-100)
10. Brief executive summary

Be specific and technical.`;

  const enrichment = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        malware_families: { type: 'array', items: { type: 'string' } },
        threat_actors: { type: 'array', items: { type: 'string' } },
        campaigns: { type: 'array', items: { type: 'string' } },
        mitre_ttps: { type: 'array', items: { type: 'string' } },
        cves: { type: 'array', items: { type: 'string' } },
        hunting_steps: { type: 'array', items: { type: 'string' } },
        severity: { type: 'string' },
        confidence_score: { type: 'number' },
        summary: { type: 'string' },
        suggested_trigger_conditions: {
          type: 'object',
          properties: {
            ioc_type: { type: 'string' },
            severity_threshold: { type: 'string' },
            auto_hunt_on_match: { type: 'boolean' },
          }
        },
        suggested_input_schema_fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field_name: { type: 'string' },
              field_type: { type: 'string' },
              description: { type: 'string' },
            }
          }
        },
      }
    }
  });

  return { ioc, ioc_type, enrichment, related_count: related.length };
}

function tryParse(str) {
  try { return typeof str === 'string' ? JSON.parse(str) : str; }
  catch { return null; }
}