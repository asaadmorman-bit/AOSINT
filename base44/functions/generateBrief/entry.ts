import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { brief_type = 'weekly_strategic', tenant_id } = await req.json();

    // Tier gating
    const tierOrder = ['community', 'pro', 'enterprise', 'gov'];
    const userTier = user.tier || 'community';
    const tierIndex = tierOrder.indexOf(userTier);

    const tierRequirements = {
      weekly_strategic: 0,       // community+
      daily_operational: 2,      // enterprise+
      executive_protection: 2,   // enterprise+
      law_enforcement: 3,        // gov+
      custom: 2,                 // enterprise+
    };

    if (tierIndex < (tierRequirements[brief_type] || 0)) {
      return Response.json({ error: 'Insufficient tier for this brief type' }, { status: 403 });
    }

    // Create placeholder brief
    const brief = await base44.entities.IntelBrief.create({
      title: getBriefTitle(brief_type),
      brief_type,
      status: 'generating',
      generated_at: new Date().toISOString(),
      period_start: getPeriodStart(brief_type),
      period_end: new Date().toISOString(),
      min_tier: getMinTier(brief_type),
      generated_by: user.email,
      tenant_id: tenant_id || user.id,
    });

    // Fetch live data for context
    const [questions, ttpClusters, convergenceNodes, ransomware, assets] = await Promise.all([
      base44.entities.AnalyticQuestion.list('-created_date', 10),
      base44.entities.TTPCluster.list('-created_date', 10),
      base44.entities.ConvergenceNode.list('-created_date', 5),
      base44.entities.RansomwareTracker.list('-last_activity', 5),
      base44.entities.Asset.list('-created_date', 10),
    ]);

    const contextSummary = buildContextSummary({ questions, ttpClusters, convergenceNodes, ransomware, assets, brief_type });

    // Generate the brief with AI
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(brief_type, contextSummary),
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          executive_summary: { type: 'string' },
          threat_landscape: { type: 'string' },
          fragmentation_index: { type: 'string' },
          convergence_patterns: { type: 'string' },
          ransomware_evolution: { type: 'string' },
          influence_narratives: { type: 'string' },
          sector_vulnerabilities: { type: 'string' },
          warning_time_analysis: { type: 'string' },
          regional_instability: { type: 'string' },
          asset_exposure_summary: { type: 'string' },
          unanswered_questions_summary: { type: 'string' },
          recommended_actions: { type: 'array', items: { type: 'string' } },
          key_metrics: {
            type: 'object',
            properties: {
              threat_level: { type: 'string' },
              fragmentation_score: { type: 'number' },
              convergence_score: { type: 'number' },
              warning_time_days: { type: 'number' },
              active_ransomware_families: { type: 'number' },
              top_targeted_sectors: { type: 'array', items: { type: 'string' } },
              top_regions_at_risk: { type: 'array', items: { type: 'string' } },
            }
          },
          tags: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    // Update brief with generated content
    const updatePayload = { status: 'ready' };
    if (result.executive_summary) updatePayload.executive_summary = result.executive_summary;
    if (result.threat_landscape) updatePayload.threat_landscape = result.threat_landscape;
    if (result.fragmentation_index) updatePayload.fragmentation_index = result.fragmentation_index;
    if (result.convergence_patterns) updatePayload.convergence_patterns = result.convergence_patterns;
    if (result.ransomware_evolution) updatePayload.ransomware_evolution = result.ransomware_evolution;
    if (result.influence_narratives) updatePayload.influence_narratives = result.influence_narratives;
    if (result.sector_vulnerabilities) updatePayload.sector_vulnerabilities = result.sector_vulnerabilities;
    if (result.warning_time_analysis) updatePayload.warning_time_analysis = result.warning_time_analysis;
    if (result.regional_instability) updatePayload.regional_instability = result.regional_instability;
    if (result.asset_exposure_summary) updatePayload.asset_exposure_summary = result.asset_exposure_summary;
    if (result.unanswered_questions_summary) updatePayload.unanswered_questions_summary = result.unanswered_questions_summary;
    if (result.recommended_actions?.length) updatePayload.recommended_actions = result.recommended_actions;
    if (result.key_metrics) updatePayload.key_metrics = result.key_metrics;
    if (result.tags?.length) updatePayload.tags = result.tags;
    const updated = await base44.entities.IntelBrief.update(brief.id, updatePayload);

    return Response.json({ brief: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getBriefTitle(type) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const titles = {
    weekly_strategic: `Weekly Strategic Intelligence Brief — ${dateStr}`,
    daily_operational: `Daily Operational Brief — ${dateStr}`,
    executive_protection: `Executive Protection Brief — ${dateStr}`,
    law_enforcement: `Law Enforcement Intelligence Brief — ${dateStr}`,
    custom: `Custom Intelligence Brief — ${dateStr}`,
  };
  return titles[type] || `Intelligence Brief — ${dateStr}`;
}

function getMinTier(type) {
  const map = { weekly_strategic: 'community', daily_operational: 'enterprise', executive_protection: 'enterprise', law_enforcement: 'gov', custom: 'enterprise' };
  return map[type] || 'community';
}

function getPeriodStart(type) {
  const now = new Date();
  const daysBack = type === 'daily_operational' ? 1 : 7;
  return new Date(now.getTime() - daysBack * 86400000).toISOString();
}

function buildContextSummary({ questions, ttpClusters, convergenceNodes, ransomware, assets, brief_type }) {
  const unanswered = questions.filter(q => q.status === 'unanswered' || q.status === 'partially_answered');
  const criticalAssets = assets.filter(a => a.criticality === 'critical');
  const activeRansomware = ransomware.filter(r => r.status === 'active');

  return `
PLATFORM DATA CONTEXT:
- Total Analytic Questions: ${questions.length} (${unanswered.length} unanswered/partial)
- TTP Clusters Tracked: ${ttpClusters.length}
- Active Convergence Nodes: ${convergenceNodes.length}
- Active Ransomware Families: ${activeRansomware.length}
- Critical Assets Monitored: ${criticalAssets.length}

TOP UNANSWERED QUESTIONS:
${unanswered.slice(0, 3).map(q => `- ${q.question}`).join('\n') || 'None'}

TOP RANSOMWARE FAMILIES:
${activeRansomware.slice(0, 3).map(r => `- ${r.variant_name} (${r.target_sectors?.join(', ') || 'unknown sectors'})`).join('\n') || 'None tracked'}

ACTIVE CONVERGENCE NODES:
${convergenceNodes.slice(0, 3).map(n => `- ${n.title} [Score: ${n.convergence_score || 'N/A'}]`).join('\n') || 'None'}

BRIEF TYPE: ${brief_type}
REPORT DATE: ${new Date().toISOString().split('T')[0]}
ALIGNED WITH: SOINT 2026 State of Security White Paper
  `.trim();
}

function buildPrompt(brief_type, context) {
  const typePrompts = {
    weekly_strategic: 'Generate a WEEKLY STRATEGIC INTELLIGENCE BRIEF for executive leadership and senior analysts. Cover global threat landscape, fragmentation trends, convergence patterns, ransomware evolution, influence narratives, sector vulnerabilities, and strategic recommended actions.',
    daily_operational: 'Generate a DAILY OPERATIONAL INTELLIGENCE BRIEF for cyber operators and security teams. Focus on new incidents, emerging threats, asset-specific exposure, and tactical warning indicators.',
    executive_protection: 'Generate an EXECUTIVE PROTECTION INTELLIGENCE BRIEF. Focus on regional instability, narrative shifts affecting physical safety, travel risk indicators, and protective intelligence recommendations.',
    law_enforcement: 'Generate a LAW ENFORCEMENT INTELLIGENCE BRIEF. Cover crimeware trends, influence-crime convergence, regional threat clusters, and public safety indicators.',
    custom: 'Generate a COMPREHENSIVE CUSTOM INTELLIGENCE BRIEF covering all major threat domains with detailed analysis.',
  };

  return `You are SENTINEL-AI, the intelligence engine for SOINT — a multi-domain threat intelligence platform aligned with the 2026 State of Security white paper.

${typePrompts[brief_type] || typePrompts.weekly_strategic}

IMPORTANT GUIDELINES:
- Write at executive level — strategic, clear, non-technical where possible
- No sensitive operational details, no exploit instructions, no harmful content
- Focus on trends, patterns, and actionable intelligence
- Reference real-world 2025-2026 threat landscape where known
- All sections should be 2-4 paragraphs of substantive analysis
- Recommended actions should be specific and actionable (5-8 items)
- Key metrics should be realistic estimates based on current threat intelligence

${context}

Generate a complete, professional intelligence brief now.`;
}