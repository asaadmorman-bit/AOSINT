import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { raw_data, data_source_type, detection_name } = await req.json();
    if (!raw_data || !data_source_type) {
      return Response.json({ error: 'raw_data and data_source_type are required' }, { status: 400 });
    }

    // Fetch platform context for richer correlation
    const [threatActors, existingIndicators, playbooks] = await Promise.all([
      base44.asServiceRole.entities.ThreatActor.list('', 30).catch(() => []),
      base44.asServiceRole.entities.ThreatIndicator.filter({ status: 'active' }).catch(() => []),
      base44.asServiceRole.entities.Playbook.filter({ status: 'active' }).catch(() => []),
    ]);

    // Step 1: AI anomaly detection on the raw data
    const anomalyPrompt = `You are an elite threat hunter and behavioral analyst specializing in detecting sophisticated, signature-evasive threats from raw log data.

Data Source Type: ${data_source_type}
Detection Session: ${detection_name || 'Ad-hoc Analysis'}

Raw Data to Analyze:
---
${raw_data.slice(0, 8000)}
---

Known threat actors on platform: ${threatActors.slice(0, 10).map(a => a.name || a.actor_name).join(', ') || 'none'}
Active IOCs in platform: ${existingIndicators.slice(0, 20).map(i => `${i.indicator_type}:${i.value}`).join(', ') || 'none'}

Your task: Perform deep behavioral anomaly detection. Identify patterns that:
1. Deviate from normal baselines (timing, volume, sequencing, geography, user behavior)
2. Suggest living-off-the-land techniques (LOLBins, legitimate tool abuse)
3. Indicate lateral movement, privilege escalation, persistence, or exfiltration
4. Show signs of slow/low-and-slow attacks that evade signature detection
5. Exhibit anomalous sequencing or impossible travel/activity patterns

For each anomaly found, provide specific evidence from the data, behavioral indicators, and why this evades traditional detection.`;

    const anomalyResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: anomalyPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          anomalies_detected: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                anomaly_id: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string' },
                confidence: { type: 'number' },
                affected_entities: { type: 'array', items: { type: 'string' } },
                behavioral_indicators: { type: 'array', items: { type: 'string' } },
                why_suspicious: { type: 'string' },
                first_observed: { type: 'string' },
                last_observed: { type: 'string' },
                frequency: { type: 'string' },
              }
            }
          },
          overall_risk_score: { type: 'number' },
          executive_summary: { type: 'string' },
          severity: { type: 'string' },
          kill_chain_stage: { type: 'string' },
          raw_data_summary: { type: 'string' },
        }
      }
    });

    const anomalies = anomalyResult.anomalies_detected || [];

    // Step 2: Correlate each anomaly to MITRE ATT&CK TTPs
    let mitreCorrelations = [];
    let threatActorHypothesis = [];
    let recommendedPlaybookSteps = [];

    if (anomalies.length > 0) {
      const mitrePrompt = `You are a MITRE ATT&CK expert. Map the following detected behavioral anomalies to specific MITRE ATT&CK techniques and generate an incident response playbook.

Anomalies detected:
${anomalies.map((a, i) => `${i+1}. [${a.severity}] ${a.description}
   Indicators: ${a.behavioral_indicators?.join(', ')}
   Why suspicious: ${a.why_suspicious}`).join('\n\n')}

Data source: ${data_source_type}
Kill chain stage observed: ${anomalyResult.kill_chain_stage || 'unknown'}
Known threat actors: ${threatActors.slice(0, 10).map(a => a.name || a.actor_name).join(', ')}

For each anomaly:
1. Map to the most specific MITRE ATT&CK technique(s) with tactic, technique ID, and name
2. Explain the mapping rationale
3. Hypothesize likely threat actor groups based on TTP fingerprint
4. Generate actionable IR playbook steps ordered by priority`;

      const mitreResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: mitrePrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            mitre_correlations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  anomaly_id: { type: 'string' },
                  tactic: { type: 'string' },
                  technique_id: { type: 'string' },
                  technique_name: { type: 'string' },
                  sub_technique: { type: 'string' },
                  confidence: { type: 'number' },
                  rationale: { type: 'string' },
                }
              }
            },
            threat_actor_hypothesis: { type: 'array', items: { type: 'string' } },
            recommended_playbook_steps: { type: 'array', items: { type: 'string' } },
          }
        }
      });

      mitreCorrelations = mitreResult.mitre_correlations || [];
      threatActorHypothesis = mitreResult.threat_actor_hypothesis || [];
      recommendedPlaybookSteps = mitreResult.recommended_playbook_steps || [];
    }

    // Step 3: Auto-generate a HuntTicket for high/critical severity findings
    const severity = anomalyResult.severity || 'medium';
    let generatedHuntTicketId = null;
    let generatedPlaybookId = null;

    if (['critical', 'high'].includes(severity) && anomalies.length > 0) {
      const allTTPs = mitreCorrelations.map(m => `${m.tactic}:${m.technique_id} - ${m.technique_name}`);

      const ticket = await base44.asServiceRole.entities.HuntTicket.create({
        title: `AI Anomaly Detection: ${detection_name || data_source_type} — ${severity.toUpperCase()} Risk`,
        description: anomalyResult.executive_summary,
        severity,
        status: 'open',
        hunt_type: 'anomaly_detection',
        data_sources: [data_source_type],
        ttps_identified: allTTPs,
        findings: JSON.stringify({
          anomalies: anomalies.length,
          top_anomaly: anomalies[0]?.description,
          mitre_count: mitreCorrelations.length,
          risk_score: anomalyResult.overall_risk_score,
        }),
        created_by: user.email,
        tags: ['ai_detected', 'anomaly', data_source_type],
      }).catch(() => null);
      if (ticket) generatedHuntTicketId = ticket.id;

      // Auto-generate playbook from IR steps
      if (recommendedPlaybookSteps.length > 0) {
        const playbookSteps = recommendedPlaybookSteps.map((step, idx) => ({
          step_id: `step_${idx}`,
          step_name: step.length > 60 ? step.slice(0, 57) + '...' : step,
          step_type: 'agent_task',
          task_objective: step,
          timeout_seconds: 600,
          retry_count: 1,
          failure_action: 'continue',
        }));

        const playbook = await base44.asServiceRole.entities.Playbook.create({
          playbook_name: `IR Playbook: ${detection_name || 'Anomaly Detection'} (${new Date().toISOString().slice(0, 10)})`,
          description: `Auto-generated from AI anomaly detection. ${anomalyResult.executive_summary}`,
          playbook_type: 'incident_response',
          trigger_type: 'anomaly_detection',
          trigger_conditions: JSON.stringify({
            data_source: data_source_type,
            mitre_ttps: mitreCorrelations.map(m => m.technique_id),
            threat_actors: threatActorHypothesis,
            kill_chain_stage: anomalyResult.kill_chain_stage,
          }),
          workflow_steps: playbookSteps,
          input_schema: JSON.stringify({
            type: 'object',
            properties: {
              anomaly_data: { type: 'string', description: 'Raw anomaly data' },
              affected_entities: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' },
              mitre_ttps: { type: 'array', items: { type: 'string' } },
            }
          }),
          status: 'active',
          tags: ['auto_generated', 'anomaly_detection', ...allTTPs.slice(0, 5)],
          created_by: user.email,
        }).catch(() => null);
        if (playbook) generatedPlaybookId = playbook.id;
      }
    }

    // Persist detection record
    const detection = await base44.asServiceRole.entities.ThreatAnomalyDetection.create({
      detection_name: detection_name || `${data_source_type} Analysis — ${new Date().toISOString().slice(0, 16)}`,
      data_source_type,
      raw_data_summary: anomalyResult.raw_data_summary || `${data_source_type} data, ${raw_data.split('\n').length} lines`,
      anomalies_detected: anomalies,
      mitre_correlations: mitreCorrelations,
      kill_chain_stage: anomalyResult.kill_chain_stage,
      threat_actor_hypothesis: threatActorHypothesis,
      severity,
      overall_risk_score: anomalyResult.overall_risk_score || 0,
      executive_summary: anomalyResult.executive_summary,
      recommended_playbook_steps: recommendedPlaybookSteps,
      generated_playbook_id: generatedPlaybookId,
      generated_hunt_ticket_id: generatedHuntTicketId,
      status: 'new',
      analyzed_by: user.email,
      tags: ['ai_detected', data_source_type],
    });

    return Response.json({
      detection_id: detection.id,
      anomalies_count: anomalies.length,
      severity,
      overall_risk_score: anomalyResult.overall_risk_score,
      executive_summary: anomalyResult.executive_summary,
      anomalies_detected: anomalies,
      mitre_correlations: mitreCorrelations,
      kill_chain_stage: anomalyResult.kill_chain_stage,
      threat_actor_hypothesis: threatActorHypothesis,
      recommended_playbook_steps: recommendedPlaybookSteps,
      generated_hunt_ticket_id: generatedHuntTicketId,
      generated_playbook_id: generatedPlaybookId,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});