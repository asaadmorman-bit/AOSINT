import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siemAlertId, siemAlertData } = await req.json();

    if (!siemAlertId || !siemAlertData) {
      return Response.json({ error: 'SIEM alert data required' }, { status: 400 });
    }

    // Fetch historical data for context
    const [osintAlerts, leaIntel, osintEntities, threatActors] = await Promise.all([
      base44.entities.OsintAlert.list('-triggered_at', 100).catch(() => []),
      base44.entities.LEAIntelligence.list('-last_updated', 100).catch(() => []),
      base44.entities.OsintEntity.list('-last_seen', 100).catch(() => []),
      base44.entities.ThreatActor?.list?.('-created_date', 50).catch(() => []) || Promise.resolve([])
    ]);

    // Fetch previous correlation analysis for pattern learning
    const previousCorrelations = await base44.entities.CorrelationAnalysis.list('-analysis_timestamp', 200).catch(() => []);

    // Prepare context for AI analysis
    const analysisContext = {
      current_alert: siemAlertData,
      historical_osint_alerts: osintAlerts.slice(0, 30),
      lea_intelligence: leaIntel.slice(0, 20),
      known_entities: osintEntities.slice(0, 30),
      threat_actors: threatActors.slice(0, 10),
      previous_correlations: previousCorrelations.slice(0, 20),
      current_timestamp: new Date().toISOString()
    };

    // Use LLM for sophisticated correlation analysis
    const correlationAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a threat intelligence analyst specializing in alert correlation and pattern recognition. Analyze this SIEM alert and identify sophisticated correlations with existing ASOSINT data.

SIEM ALERT:
${JSON.stringify(siemAlertData, null, 2)}

HISTORICAL CONTEXT:
- Previous similar OSINT alerts: ${osintAlerts.length} records
- LEA Intelligence records: ${leaIntel.length} records  
- Known entities in system: ${osintEntities.length} records
- Known threat actors: ${threatActors.length} records

ANALYSIS REQUIREMENTS:
1. ENTITY MATCHING: Identify any IP addresses, domains, emails, or file hashes that match known entities
2. TEMPORAL ANALYSIS: Check if timing correlates with known campaigns or attack windows
3. PATTERN MATCHING: Look for similar attack patterns in historical data
4. THREAT ATTRIBUTION: Based on TTPs, infrastructure, and behavioral patterns, identify possible threat actors
5. HISTORICAL PATTERNS: Find similar past incidents and their resolution
6. RELATIONSHIP MAPPING: Build entity relationship chains showing how this alert connects to other intelligence
7. FALSE POSITIVE ASSESSMENT: Evaluate likelihood this is a false positive based on context

For each correlation found, provide:
- Type of correlation (entity_match, temporal, pattern, etc.)
- Confidence score (0-100)
- Evidence and reasoning
- Related entities and their relationships

RESPONSE FORMAT (JSON):
{
  "primary_correlation": {
    "type": "...",
    "confidence_score": ...,
    "target_alert_id": "...",
    "reasoning": "..."
  },
  "correlation_chain": [...],
  "temporal_analysis": {
    "time_delta_minutes": ...,
    "temporal_pattern": "...",
    "is_within_campaign_window": true/false
  },
  "pattern_insights": [...],
  "threat_attribution": {
    "likely_threat_actor": "...",
    "ttps_matched": [...],
    "attribution_confidence": ...
  },
  "false_positive_risk": ...,
  "historical_context": [...],
  "recommended_action": "...",
  "analysis_reasoning": "..."
}`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          primary_correlation: {
            type: "object",
            properties: {
              type: { type: "string" },
              confidence_score: { type: "number" },
              target_alert_id: { type: "string" },
              reasoning: { type: "string" }
            }
          },
          correlation_chain: { type: "array" },
          temporal_analysis: { type: "object" },
          pattern_insights: { type: "array", items: { type: "string" } },
          threat_attribution: { type: "object" },
          false_positive_risk: { type: "number" },
          historical_context: { type: "array" },
          recommended_action: { type: "string" },
          analysis_reasoning: { type: "string" }
        }
      }
    });

    // Store correlation analysis
    const analysis = await base44.entities.CorrelationAnalysis.create({
      siem_alert_id: siemAlertId,
      primary_asosint_alert_id: correlationAnalysis.primary_correlation?.target_alert_id,
      correlation_type: correlationAnalysis.primary_correlation?.type || 'pattern_similarity',
      confidence_score: correlationAnalysis.primary_correlation?.confidence_score || 0,
      correlation_chain: correlationAnalysis.correlation_chain || [],
      temporal_analysis: correlationAnalysis.temporal_analysis,
      pattern_insights: correlationAnalysis.pattern_insights || [],
      threat_attribution: correlationAnalysis.threat_attribution,
      false_positive_risk: correlationAnalysis.false_positive_risk || 0,
      recommended_action: correlationAnalysis.recommended_action,
      historical_context: correlationAnalysis.historical_context || [],
      analysis_reasoning: correlationAnalysis.analysis_reasoning,
      generated_by_ai: true,
      analysis_timestamp: new Date().toISOString(),
      tags: ['ai_correlation', correlationAnalysis.primary_correlation?.type]
    });

    return Response.json({
      success: true,
      analysis_id: analysis.id,
      correlation_type: analysis.correlation_type,
      confidence_score: analysis.confidence_score,
      false_positive_risk: analysis.false_positive_risk,
      has_strong_correlation: analysis.confidence_score > 65 && analysis.false_positive_risk < 30
    });
  } catch (error) {
    console.error('Error analyzing alert correlation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});