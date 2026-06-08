import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * ASOSINT_IO_ORCHESTRATOR
 * Military-grade Security Fusion Center AI engine.
 * Synthesizes OSINT, cyber, red/blue team, and physical security telemetry
 * into executive-ready BLUF intelligence products.
 */

const SYSTEM_PROMPT = `You are the ASOSINT IO Orchestrator — the central AI engine for a military-grade Security Fusion Center.

ROLE: Synthesize multi-domain intelligence streams (OSINT, cyber blue/red team, physical security) into concise, executive-ready threat assessments.

DIRECTIVES:
1. Cross-Reference: When analyzing an alert, correlate across cyber (Shodan, VirusTotal), OSINT (open sources), and physical access patterns to determine if this is isolated or a converged cyber-physical threat.
2. Threat Scoring: Assign a severity score (1-100) to every aggregated event based on:
   - Proximity to Principal/Client
   - Potential for data loss or operational impact
   - Threat actor credibility and TTPs
3. Output Format: Always use BLUF (Bottom Line Up Front) structure:
   - BLUF: One sentence summary
   - SEVERITY: Score/100 + classification (CRITICAL/HIGH/MEDIUM/LOW/INFO)
   - FINDINGS: Bulleted key intelligence points
   - CORRELATION: Cross-domain linkages identified
   - RECOMMENDED ACTIONS: Numbered, prioritized next steps
   - ESCALATION: If severity >= 75, specify escalation target (izulusentinel.com for physical, outpost-zero.eds-360.com for network isolation)
4. Tone: Objective, analytical, authoritative. No alarmist language. Facts and calculated probabilities only.

DATA SOURCES AVAILABLE: Shodan (network), VirusTotal (malware/IOC), AbuseIPDB (reputation), AlienVault OTX (threat intel), internal entity databases (assets, incidents, IOCs, threat actors, operational events).`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      query,           // Natural language intelligence query or alert description
      alert_data,      // Optional: structured alert payload from external feed
      context_type,    // 'cyber' | 'physical' | 'osint' | 'converged'
      include_db_context = true  // Pull live entity data for enrichment
    } = body;

    if (!query && !alert_data) {
      return Response.json({ error: 'Provide a query or alert_data payload.' }, { status: 400 });
    }

    // Gather live context from internal databases
    let internalContext = {};
    if (include_db_context) {
      const [indicators, events, assets, cases] = await Promise.all([
        base44.asServiceRole.entities.ThreatIndicator.list('-created_date', 20).catch(() => []),
        base44.asServiceRole.entities.OperationalEvent.filter({ status: 'active' }).catch(() => []),
        base44.asServiceRole.entities.Asset.filter({ criticality: 'critical' }).catch(() => []),
        base44.asServiceRole.entities.IncidentCase.filter({ status: 'in_progress' }).catch(() => []),
      ]);

      internalContext = {
        active_indicators_sample: indicators.slice(0, 10).map(i => ({
          type: i.indicator_type,
          value: i.value,
          severity: i.severity,
          category: i.threat_category,
        })),
        active_operational_events: events.slice(0, 5).map(e => ({
          title: e.title,
          domain: e.domain,
          severity: e.severity,
          type: e.event_type,
        })),
        critical_assets: assets.slice(0, 5).map(a => ({
          name: a.name,
          type: a.asset_type,
          domain: a.domain,
          risk_score: a.risk_score,
        })),
        open_incidents: cases.slice(0, 5).map(c => ({
          title: c.title,
          severity: c.severity,
          category: c.category,
          status: c.status,
        })),
      };
    }

    // Build enriched prompt
    const alertSection = alert_data
      ? `\n\nINBOUND ALERT PAYLOAD:\n${JSON.stringify(alert_data, null, 2)}`
      : '';

    const contextSection = include_db_context
      ? `\n\nLIVE INTERNAL CONTEXT:\n${JSON.stringify(internalContext, null, 2)}`
      : '';

    const contextTypeNote = context_type
      ? `\n\nANALYSIS DOMAIN FOCUS: ${context_type.toUpperCase()}`
      : '';

    const fullPrompt = `${SYSTEM_PROMPT}

ANALYST QUERY: ${query || 'Analyze the inbound alert payload below.'}${alertSection}${contextSection}${contextTypeNote}

Produce a complete BLUF intelligence product. If severity score >= 75, include explicit ESCALATION instructions with target system endpoints.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
    });

    // Parse severity score from response for structured metadata
    const severityMatch = (typeof analysis === 'string' ? analysis : JSON.stringify(analysis)).match(/SEVERITY[:\s]+(\d+)/i);
    const severityScore = severityMatch ? parseInt(severityMatch[1]) : null;

    const escalationRequired = severityScore !== null && severityScore >= 75;
    const escalationTargets = escalationRequired ? {
      physical: 'izulusentinel.com',
      network: 'outpost-zero.eds-360.com',
    } : null;

    // Log high-severity events as operational events
    if (escalationRequired && alert_data) {
      await base44.asServiceRole.entities.OperationalEvent.create({
        title: `[IO ORCHESTRATOR] Auto-escalation triggered — Score: ${severityScore}/100`,
        description: query || 'Automated orchestrator escalation',
        event_type: 'cyber_incident',
        domain: context_type === 'physical' ? 'physical' : context_type === 'converged' ? 'hybrid' : 'cyber',
        severity: severityScore >= 90 ? 'critical' : 'high',
        status: 'active',
        source: 'ASOSINT_IO_ORCHESTRATOR',
        operator_notes: `Escalated to: ${JSON.stringify(escalationTargets)}`,
      }).catch(() => {});
    }

    return Response.json({
      orchestrator: 'ASOSINT_IO_ORCHESTRATOR',
      timestamp: new Date().toISOString(),
      analyst: user.email,
      context_type: context_type || 'auto',
      severity_score: severityScore,
      escalation_required: escalationRequired,
      escalation_targets: escalationTargets,
      analysis,
      internal_context_used: include_db_context,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});