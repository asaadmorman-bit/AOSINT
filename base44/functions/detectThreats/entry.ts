import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch active detection rules
    const rules = await base44.asServiceRole.entities.ThreatDetectionRule.filter(
      { enabled: true },
      null,
      1000
    );

    // Fetch recent audit logs
    const recentLogs = await base44.asServiceRole.entities.SecurityAuditLog.filter(
      {},
      '-timestamp',
      5000
    );

    const detectedThreats = [];
    const now = new Date();

    for (const rule of rules) {
      const conditions = JSON.parse(rule.conditions || '{}');
      const thresholds = JSON.parse(rule.thresholds || '{}');

      let matchCount = 0;
      const matchedLogs = [];

      // Apply rule conditions to recent logs
      for (const log of recentLogs) {
        const logTime = new Date(log.timestamp);
        const timeWindow = thresholds.time_window_minutes || 60;

        // Check if log is within time window
        if ((now - logTime) / (1000 * 60) > timeWindow) continue;

        // Check conditions
        let conditionsMet = true;

        if (conditions.event_types && !conditions.event_types.includes(log.event_type)) {
          conditionsMet = false;
        }

        if (conditions.threat_level && log.threat_level !== conditions.threat_level) {
          conditionsMet = false;
        }

        if (conditions.status && !conditions.status.includes(log.status)) {
          conditionsMet = false;
        }

        if (conditionsMet) {
          matchCount++;
          matchedLogs.push(log.id);
        }
      }

      // Check if threshold breached
      const threshold = thresholds.count || 5;
      if (matchCount >= threshold) {
        // Create incident
        const incidentId = `INC-${Date.now()}`;
        
        const incident = await base44.asServiceRole.entities.IncidentResponse.create({
          incident_title: `Threat detected by rule: ${rule.rule_name}`,
          incident_id: incidentId,
          incident_type: rule.threat_category,
          severity: rule.severity,
          status: 'detected',
          detection_timestamp: now.toISOString(),
          detection_source: rule.rule_name,
          threat_actor: 'Unknown',
          attack_vector: 'unknown',
          investigation_notes: `Rule ${rule.rule_name} triggered ${matchCount} times in last ${thresholds.time_window_minutes || 60} minutes`,
          tags: [rule.rule_type, rule.threat_category]
        });

        detectedThreats.push({
          incidentId,
          rule: rule.rule_name,
          severity: rule.severity,
          matchCount,
          matchedLogs
        });

        // Update rule trigger count
        await base44.asServiceRole.entities.ThreatDetectionRule.update(rule.id, {
          trigger_count: (rule.trigger_count || 0) + 1,
          last_triggered: now.toISOString()
        });

        // Trigger notifications if configured
        if (rule.notification_channels && rule.notification_channels.includes('email')) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `SECURITY ALERT: Threat Detected - ${rule.rule_name}`,
            body: `
Threat detected by security rule: ${rule.rule_name}
Severity: ${rule.severity}
Incident ID: ${incidentId}
Matches: ${matchCount} in last hour

Please investigate immediately.
            `
          });
        }
      }
    }

    return Response.json({
      threatsDetected: detectedThreats.length,
      details: detectedThreats,
      timestamp: now.toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});