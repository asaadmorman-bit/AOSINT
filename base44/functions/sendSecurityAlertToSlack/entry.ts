import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { webhookUrl, alertTitle, alertDescription, severity, entityType, entityId, threatDetails } = await req.json();

    if (!webhookUrl || !alertTitle) {
      return Response.json({ error: 'webhookUrl and alertTitle required' }, { status: 400 });
    }

    // Color based on severity
    const severityColors = {
      critical: '#FF0000',
      high: '#FF6600',
      medium: '#FFAA00',
      low: '#00AA00',
      info: '#0066FF'
    };

    const color = severityColors[severity] || '#808080';

    // Build Slack message
    const slackMessage = {
      attachments: [
        {
          fallback: alertTitle,
          color: color,
          title: alertTitle,
          text: alertDescription,
          fields: [
            {
              title: 'Severity',
              value: severity.toUpperCase(),
              short: true
            },
            {
              title: 'Type',
              value: entityType,
              short: true
            },
            {
              title: 'Detected',
              value: new Date().toLocaleString(),
              short: true
            },
            {
              title: 'Reporter',
              value: user.full_name || user.email,
              short: true
            },
            ...threatDetails ? [
              {
                title: 'Threat Details',
                value: threatDetails,
                short: false
              }
            ] : []
          ],
          footer: 'ASOSINT Security Alert',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Send to Slack webhook
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      throw new Error(`Slack webhook failed: ${slackResponse.status} - ${errorText}`);
    }

    return Response.json({ success: true, message: 'Alert sent to Slack' });

  } catch (error) {
    console.error('Slack alert error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});