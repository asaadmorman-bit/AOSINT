import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all enabled alert rules
    const alertRules = await base44.entities.AlertRule.filter({ is_enabled: true });
    if (!alertRules || alertRules.length === 0) {
      return Response.json({ triggered: 0, alerts: [] });
    }

    // Fetch recent leak intelligence
    const leaks = await base44.entities.LeakIntelligence.filter({ status: 'new' });
    const osintAlerts = await base44.entities.OsintAlert.filter({ status: 'new' });

    const triggeredAlerts = [];

    // Check each rule against findings
    for (const rule of alertRules) {
      const matches = [];

      // Check leaks
      for (const leak of leaks) {
        if (matchesTrigger(leak, rule)) {
          const findingValue = leak.title || leak.id;

          // Check suppression
          if (!isSuppressionActive(rule, findingValue)) {
            matches.push({
              type: 'leak',
              finding: leak,
              rule_id: rule.id,
              findingValue,
            });
          }
        }
      }

      // Check OSINT alerts
      for (const alert of osintAlerts) {
        if (matchesTrigger(alert, rule)) {
          const findingValue = alert.title || alert.id;

          // Check suppression
          if (!isSuppressionActive(rule, findingValue)) {
            matches.push({
              type: 'alert',
              finding: alert,
              rule_id: rule.id,
              findingValue,
            });
          }
        }
      }

      // Create notifications for matches
      if (matches.length > 0) {
        let updatedTracking = rule.last_triggered_entities || [];

        for (const match of matches) {
          for (const email of rule.notified_users) {
            const notification = await base44.entities.Notification.create({
              recipient_email: email,
              notification_type: 'security_event',
              title: `⚠️ Alert Rule Triggered: ${rule.rule_name}`,
              message: `${match.type === 'leak' ? 'Dark web leak' : 'OSINT alert'} matched your trigger: ${match.finding.title || match.finding.alert_type}`,
              severity: match.finding.severity || 'high',
              resource_type: match.type === 'leak' ? 'security' : 'osint',
              resource_id: match.finding.id,
              in_app_only: !rule.notification_channels?.includes('email'),
              email_sent: rule.notification_channels?.includes('email') ? false : null,
              action_url: match.type === 'leak' ? `/OsintHub?view=darkweb&id=${match.finding.id}` : `/OsintHub?view=alerts&id=${match.finding.id}`,
              triggered_by: 'automation',
              tags: [rule.id, rule.rule_name],
            });

            // Send webhook if configured
            if (rule.webhook_url) {
              try {
                await fetch(rule.webhook_url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    rule_id: rule.id,
                    rule_name: rule.rule_name,
                    notification_id: notification.id,
                    finding_type: match.type,
                    finding: match.finding,
                    recipient: email,
                    timestamp: new Date().toISOString(),
                  }),
                });
              } catch (webhookError) {
                console.error(`Webhook failed for rule ${rule.id}:`, webhookError.message);
              }
            }

            triggeredAlerts.push({
              rule: rule.rule_name,
              user: email,
              finding: match.finding.title || match.finding.alert_type,
              notification_id: notification.id,
              suppressed: false,
            });
          }

          // Update suppression tracking
          updatedTracking = updateSuppressionTracking(rule, match.findingValue);
        }

        // Update rule with new tracking data
        await base44.asServiceRole.entities.AlertRule.update(rule.id, {
          last_triggered: new Date().toISOString(),
          trigger_count: (rule.trigger_count || 0) + matches.length,
          last_triggered_entities: updatedTracking,
        });
      }
    }

    return Response.json({
      triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
      message: `Monitored ${leaks.length} leaks and ${osintAlerts.length} alerts against ${alertRules.length} rules`,
    });
  } catch (error) {
    console.error('Error in monitorDarkWebAlerts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function matchesTrigger(finding, rule) {
  const searchText = [
    finding.title,
    finding.description,
    finding.alert_type,
    finding.affected_emails?.join(' '),
    finding.affected_domains?.join(' '),
    finding.affected_persons?.join(' '),
    finding.affected_entities?.join(' '),
    finding.affected_professions?.join(' '),
    finding.threat_actor,
    finding.raw_excerpt,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check negative keywords first (must not match any)
  if (rule.negative_keywords && rule.negative_keywords.length > 0) {
    const hasNegativeKeyword = rule.negative_keywords.some(kw => searchText.includes(kw.toLowerCase()));
    if (hasNegativeKeyword) return false;
  }

  const conditions = [];

  // Keyword matching
  if (rule.keywords && rule.keywords.length > 0) {
    const hasKeyword = rule.keywords.some(kw => searchText.includes(kw.toLowerCase()));
    conditions.push(hasKeyword);
  }

  // Severity matching
  if (rule.min_severity) {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const findingSeverity = severityOrder[finding.severity] ?? -1;
    const minSeverity = severityOrder[rule.min_severity] ?? -1;
    conditions.push(findingSeverity >= minSeverity);
  }

  // Entity type matching
  if (rule.entity_types && rule.entity_types.length > 0 && finding.entity_type) {
    conditions.push(rule.entity_types.includes(finding.entity_type));
  }

  // Intelligence type matching
  if (rule.intelligence_types && rule.intelligence_types.length > 0 && finding.tags) {
    const hasIntelType = rule.intelligence_types.some(type => finding.tags.includes(type));
    conditions.push(hasIntelType);
  }

  // Threat actor matching
  if (rule.threat_actors && rule.threat_actors.length > 0) {
    conditions.push(finding.threat_actor && rule.threat_actors.includes(finding.threat_actor));
  }

  // Source platform matching
  if (rule.source_platforms && rule.source_platforms.length > 0) {
    conditions.push(finding.source_platform && rule.source_platforms.includes(finding.source_platform));
  }

  // Apply logic operator
  if (conditions.length === 0) return true;

  const operator = rule.logic_operator || 'OR';
  if (operator === 'AND') {
    return conditions.every(c => c === true);
  } else {
    return conditions.some(c => c === true);
  }
}

function isSuppressionActive(rule, findingValue) {
  if (!rule.suppression_period_hours || rule.suppression_period_hours === 0) {
    return false;
  }

  const lastTrigger = rule.last_triggered_entities?.find(e => e.entity_value === findingValue);
  if (!lastTrigger) return false;

  const now = new Date();
  const lastTriggeredTime = new Date(lastTrigger.last_triggered_at);
  const hoursSinceLastTrigger = (now - lastTriggeredTime) / (1000 * 60 * 60);

  return hoursSinceLastTrigger < rule.suppression_period_hours;
}

function updateSuppressionTracking(rule, findingValue) {
  const tracked = rule.last_triggered_entities || [];
  const index = tracked.findIndex(e => e.entity_value === findingValue);

  if (index >= 0) {
    tracked[index].last_triggered_at = new Date().toISOString();
  } else {
    tracked.push({
      entity_value: findingValue,
      last_triggered_at: new Date().toISOString(),
    });
  }

  // Keep only last 100 entries
  return tracked.slice(-100);
}