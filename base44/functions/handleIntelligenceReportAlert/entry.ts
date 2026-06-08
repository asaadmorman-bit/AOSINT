import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data || data.severity !== 'critical') {
      return Response.json({ skipped: true, reason: 'Not a critical intelligence report creation' });
    }

    // Get creator's user record to find Slack webhook
    const creator = await base44.asServiceRole.entities.User.filter({
      email: data.created_by
    });

    if (!creator || creator.length === 0) {
      return Response.json({ skipped: true, reason: 'Creator not found' });
    }

    const slackWebhook = creator[0].slack_webhook_url;
    if (!slackWebhook) {
      return Response.json({ skipped: true, reason: 'No Slack webhook configured' });
    }

    // Send alert to Slack
    const response = await base44.functions.invoke('sendSecurityAlertToSlack', {
      webhookUrl: slackWebhook,
      alertTitle: `🚨 Critical Threat Intelligence Report`,
      alertDescription: data.title,
      severity: data.severity,
      entityType: 'IntelligenceReport',
      entityId: data.id,
      threatDetails: data.description ? data.description.substring(0, 500) : data.executive_summary
    });

    return Response.json({
      success: true,
      message: 'Intelligence report alert sent to Slack',
      response: response.data
    });

  } catch (error) {
    console.error('Intelligence report alert error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});