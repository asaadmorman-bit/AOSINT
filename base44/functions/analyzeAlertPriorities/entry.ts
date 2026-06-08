import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all current alerts and intelligence items
    const [osintAlerts, leaIntel, vulnFindings] = await Promise.all([
      base44.entities.OsintAlert.list('-triggered_at', 50).catch(() => []),
      base44.entities.LEAIntelligence.list('-last_updated', 50).catch(() => []),
      base44.entities.VulnerabilityFinding.list('-created_date', 30).catch(() => [])
    ]);

    // Prepare data for LLM analysis
    const alertsData = [
      ...osintAlerts.map(a => ({
        id: a.id,
        type: 'osint_alert',
        title: a.title,
        severity: a.severity,
        description: a.description,
        source_agent: a.source_agent,
        confidence_score: a.confidence_score
      })),
      ...leaIntel.map(i => ({
        id: i.id,
        type: 'lea_intelligence',
        title: i.title,
        threat_level: i.threat_level,
        intel_type: i.intel_type,
        geographic_level: i.geographic_level,
        mission_related: i.mission_related,
        law_enforcement_tags: i.law_enforcement_tags,
        enforcement_status: i.enforcement_status
      })),
      ...vulnFindings.map(v => ({
        id: v.id,
        type: 'vulnerability',
        title: v.title,
        severity: v.severity,
        cvss_score: v.cvss_score,
        affected_assets: v.affected_systems
      }))
    ];

    // Use LLM to analyze and re-prioritize alerts
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a threat intelligence prioritization expert. Analyze the following alerts and intelligence items and re-prioritize them based on:

1. CURRENT THREAT LANDSCAPE: Consider recent major threat actor activities, new vulnerabilities, and emerging tactics
2. MISSION RELEVANCE: How critical is each item to ongoing operations and missions
3. ACTIONABILITY: Can operators take immediate action? Is the intelligence specific and timely?
4. CONVERGENCE: Are multiple related threats appearing (compound threats)?
5. GEOGRAPHIC & OPERATIONAL CONTEXT: Local/state/federal/international relevance
6. CONFIDENCE LEVEL: How reliable is the intelligence source?

Alerts and Intelligence:
${JSON.stringify(alertsData, null, 2)}

For EACH item, provide:
- ai_recommended_priority: low/medium/high/critical
- confidence_score: 0-100
- actionability_score: 0-100
- priority_justification: Why this priority level
- current_event_context: What current events affect this (if any)
- threat_landscape_factors: List of factors affecting priority
- immediate_action_required: true/false
- recommended_actions: List of specific operator actions

Focus on identifying high-confidence, immediately actionable intelligence that requires operator attention.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          analysis_results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                alert_id: { type: "string" },
                alert_type: { type: "string" },
                ai_recommended_priority: { type: "string" },
                confidence_score: { type: "number" },
                actionability_score: { type: "number" },
                priority_justification: { type: "string" },
                current_event_context: { type: "string" },
                threat_landscape_factors: { type: "array", items: { type: "string" } },
                immediate_action_required: { type: "boolean" },
                recommended_actions: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Store analysis results
    const analysisRecords = [];
    for (const result of analysisResult.analysis_results || []) {
      try {
        const originalAlert = alertsData.find(a => a.id === result.alert_id);
        const record = await base44.entities.AlertPriorityAnalysis.create({
          alert_id: result.alert_id,
          alert_type: result.alert_type,
          original_priority: originalAlert?.severity || originalAlert?.threat_level || 'medium',
          ai_recommended_priority: result.ai_recommended_priority,
          confidence_score: result.confidence_score,
          actionability_score: result.actionability_score,
          priority_justification: result.priority_justification,
          current_event_context: result.current_event_context,
          threat_landscape_factors: result.threat_landscape_factors || [],
          immediate_action_required: result.immediate_action_required,
          recommended_actions: result.recommended_actions || [],
          analysis_timestamp: new Date().toISOString(),
          tags: ['ai_analysis', 'priority_review']
        });
        analysisRecords.push(record);
      } catch (error) {
        console.error('Error storing analysis result:', error);
      }
    }

    return Response.json({
      success: true,
      analyzed_count: analysisRecords.length,
      immediate_action_items: analysisRecords.filter(r => r.immediate_action_required).length,
      critical_items: analysisRecords.filter(r => r.ai_recommended_priority === 'critical').length
    });
  } catch (error) {
    console.error('Error analyzing alert priorities:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});