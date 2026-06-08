import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function is called by the entity automation when a new OsintAlert is created.
// It checks all users' NotificationSettings and delivers email/SMS alerts.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Support both direct invocation and automation payload
    let alertData = null;
    let alertId = null;

    try {
      const body = await req.json();
      // Entity automation payload
      if (body?.event?.entity_id) {
        alertId = body.event.entity_id;
        alertData = body.data;
      } else if (body?.alert_id) {
        alertId = body.alert_id;
      }
    } catch (_) {}

    // If we have an ID but no data, fetch it
    if (alertId && !alertData) {
      alertData = await base44.asServiceRole.entities.OsintAlert.get(alertId).catch(() => null);
    }

    if (!alertData) {
      return Response.json({ success: false, error: 'No alert data provided' }, { status: 400 });
    }

    const alert = alertData;
    const alertSeverity = alert.severity || 'medium';

    // Fetch all notification settings
    const allSettings = await base44.asServiceRole.entities.NotificationSettings.list('-created_date', 500).catch(() => []);

    const results = { email_sent: 0, sms_sent: 0, skipped: 0, errors: [] };

    for (const settings of allSettings) {
      if (!settings.is_enabled) { results.skipped++; continue; }

      // Check severity filter
      const severityFilter = settings.severity_levels || ['high', 'critical'];
      if (!severityFilter.includes(alertSeverity)) { results.skipped++; continue; }

      // Check threat type filter
      const threatTypes = settings.threat_types || [];
      if (threatTypes.length > 0 && alert.alert_type && !threatTypes.includes(alert.alert_type)) {
        results.skipped++;
        continue;
      }

      const channels = settings.notification_channels || ['dashboard'];

      // --- EMAIL ---
      if (channels.includes('email')) {
        const toEmail = settings.email_address || settings.user_email;
        if (toEmail) {
          const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[alertSeverity] || '⚪';
          const subject = `${severityEmoji} [${alertSeverity.toUpperCase()}] ASOSINT Alert: ${alert.title}`;
          const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #e5e7eb; padding: 24px; border-radius: 8px;">
  <div style="border-bottom: 2px solid #00d4ff; padding-bottom: 16px; margin-bottom: 20px;">
    <h1 style="color: #00d4ff; font-size: 20px; margin: 0;">🛡️ ASOSINT Threat Alert</h1>
  </div>

  <div style="background: #111827; border-left: 4px solid ${alertSeverity === 'critical' ? '#ff4757' : alertSeverity === 'high' ? '#ff7f00' : alertSeverity === 'medium' ? '#ffd700' : '#2ed573'}; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 8px 0; color: white; font-size: 16px;">${alert.title}</h2>
    <span style="display: inline-block; background: ${alertSeverity === 'critical' ? '#ff4757' : alertSeverity === 'high' ? '#ff7f00' : '#ffd700'}22; color: ${alertSeverity === 'critical' ? '#ff4757' : alertSeverity === 'high' ? '#ff7f00' : '#ffd700'}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${alertSeverity}</span>
  </div>

  ${alert.description ? `<p style="color: #9ca3af; line-height: 1.6; margin-bottom: 16px;">${alert.description}</p>` : ''}

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #6b7280; font-size: 12px; width: 140px;">Alert Type</td><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb; font-size: 12px;">${(alert.alert_type || 'Unknown').replace(/_/g, ' ')}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #6b7280; font-size: 12px;">Status</td><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb; font-size: 12px;">${alert.status || 'new'}</td></tr>
    ${alert.confidence_score ? `<tr><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #6b7280; font-size: 12px;">Confidence</td><td style="padding: 8px; border-bottom: 1px solid #1f2937; color: #e5e7eb; font-size: 12px;">${Math.round(alert.confidence_score)}%</td></tr>` : ''}
    ${alert.tags?.length ? `<tr><td style="padding: 8px; color: #6b7280; font-size: 12px;">Tags</td><td style="padding: 8px; color: #e5e7eb; font-size: 12px;">${alert.tags.slice(0, 5).join(', ')}</td></tr>` : ''}
  </table>

  ${alert.recommended_actions?.length ? `
  <div style="background: #111827; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
    <p style="color: #00d4ff; font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">⚡ RECOMMENDED ACTIONS</p>
    <ul style="margin: 0; padding-left: 16px; color: #9ca3af; font-size: 12px;">
      ${alert.recommended_actions.slice(0, 3).map(a => `<li style="margin-bottom: 4px;">${a}</li>`).join('')}
    </ul>
  </div>` : ''}

  <p style="color: #4b5563; font-size: 11px; text-align: center; margin-top: 24px;">ASOSINT — Asaad & Shauntze's OSINT Platform • <a href="https://asosint.base44.app" style="color: #00d4ff;">View Dashboard</a></p>
</div>`;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: toEmail,
            subject,
            body,
          }).catch(e => results.errors.push(`Email to ${toEmail}: ${e.message}`));
          results.email_sent++;
        }
      }

      // --- SMS via Twilio ---
      if (channels.includes('sms') && settings.phone_number) {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (twilioSid && twilioToken && twilioFrom) {
          const smsBody = `🛡️ ASOSINT [${alertSeverity.toUpperCase()}] ${alert.title}. ${alert.description?.slice(0, 80) || ''}... View: https://asosint.base44.app`;

          const smsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: settings.phone_number,
              From: twilioFrom,
              Body: smsBody,
            }),
          });

          if (smsRes.ok) {
            results.sms_sent++;
          } else {
            const err = await smsRes.text();
            results.errors.push(`SMS to ${settings.phone_number}: ${err.slice(0, 100)}`);
          }
        } else {
          results.errors.push('SMS: Twilio credentials not configured');
        }
      }
    }

    return Response.json({
      success: true,
      alert_id: alert.id || alertId,
      alert_title: alert.title,
      alert_severity: alertSeverity,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});