import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId, dealData, forecastData } = await req.json();

    if (!dealId || !dealData || !forecastData) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Determine if follow-up is needed
    const needsFollowUp = forecastData.trend === 'declining' || forecastData.win_probability < 40;

    if (!needsFollowUp) {
      return Response.json({ success: true, tasks_created: 0, reason: 'Deal is healthy' });
    }

    const tasks = [];
    const triggerReason = forecastData.trend === 'declining' ? 'declining_trend' : 'low_probability';
    const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Generate email task with pre-filled content
    const emailTask = {
      deal_id: dealId,
      hubspot_deal_id: dealData.hubspot_deal_id,
      forecast_id: forecastData.id,
      task_type: 'email',
      subject: generateEmailSubject(dealData, forecastData),
      content: generateEmailContent(dealData, forecastData),
      trigger_reason: triggerReason,
      win_probability_at_creation: forecastData.win_probability,
      trend_at_creation: forecastData.trend,
      scheduled_for: scheduledFor.toISOString(),
      status: 'suggested',
      tags: ['auto_generated', triggerReason]
    };

    const createdEmailTask = await base44.entities.FollowUpTask.create(emailTask);
    tasks.push(createdEmailTask);

    // Generate call task if low probability and recent activity exists
    if (forecastData.win_probability < 40 && dealData.last_activity) {
      const callTask = {
        deal_id: dealId,
        hubspot_deal_id: dealData.hubspot_deal_id,
        forecast_id: forecastData.id,
        task_type: 'call',
        subject: `Follow-up call: ${dealData.deal_name}`,
        content: generateCallContent(dealData, forecastData),
        trigger_reason: 'low_probability',
        win_probability_at_creation: forecastData.win_probability,
        trend_at_creation: forecastData.trend,
        scheduled_for: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'suggested',
        tags: ['auto_generated', 'call']
      };

      const createdCallTask = await base44.entities.FollowUpTask.create(callTask);
      tasks.push(createdCallTask);
    }

    return Response.json({
      success: true,
      tasks_created: tasks.length,
      tasks: tasks.map(t => ({ id: t.id, type: t.task_type, subject: t.subject }))
    });
  } catch (error) {
    console.error('Error generating follow-up tasks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateEmailSubject(dealData, forecastData) {
  if (forecastData.trend === 'declining') {
    return `Re-engagement needed: ${dealData.deal_name}`;
  }
  return `Next steps for: ${dealData.deal_name}`;
}

function generateEmailContent(dealData, forecastData) {
  let content = `Hi,\n\n`;
  
  if (forecastData.trend === 'declining') {
    content += `We noticed that our recent discussions regarding ${dealData.deal_name} have slowed down. `;
    content += `We'd like to reconnect and understand any concerns or challenges you may have encountered.\n\n`;
  } else {
    content += `Following up on our previous conversation about ${dealData.deal_name}. `;
    content += `We believe this is a valuable opportunity to discuss further.\n\n`;
  }

  if (forecastData.recommended_actions && forecastData.recommended_actions.length > 0) {
    content += `To move forward, we suggest:\n`;
    forecastData.recommended_actions.slice(0, 2).forEach(action => {
      content += `• ${action}\n`;
    });
    content += `\n`;
  }

  content += `Threat Severity: ${dealData.threat_severity.toUpperCase()}\n`;
  content += `Estimated Value: $${dealData.deal_amount?.toLocaleString() || 'TBD'}\n\n`;
  content += `Would you be available for a brief call this week to discuss next steps?\n\n`;
  content += `Best regards\n`;

  return content;
}

function generateCallContent(dealData, forecastData) {
  let content = `Call Preparation Notes:\n\n`;
  content += `Deal: ${dealData.deal_name}\n`;
  content += `Threat: ${dealData.threat_title}\n`;
  content += `Win Probability: ${forecastData.win_probability}%\n`;
  content += `Trend: ${forecastData.trend}\n\n`;
  
  content += `Key Points to Discuss:\n`;
  if (forecastData.recommended_actions && forecastData.recommended_actions.length > 0) {
    forecastData.recommended_actions.slice(0, 3).forEach(action => {
      content += `• ${action}\n`;
    });
  }
  
  content += `\nObjective: Understand barriers and re-engage on mutual priorities\n`;
  
  return content;
}