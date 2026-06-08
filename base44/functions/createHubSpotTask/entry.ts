import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, alertType, title, description, priority = 'normal', dueDate } = await req.json();

    if (!alertId || !title) {
      return Response.json({ error: 'Alert ID and title required' }, { status: 400 });
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Map alert priority to HubSpot priority
    const hubspotPriority = mapPriority(priority);

    // Create task in HubSpot
    const taskPayload = {
      properties: {
        hs_task_body: description || `Monitor ${title}`,
        hs_task_subject: title,
        hs_task_priority: hubspotPriority,
        hs_task_status: 'NOT_STARTED',
        hs_timestamp: new Date().toISOString()
      }
    };

    if (dueDate) {
      taskPayload.properties.hs_task_due_date = new Date(dueDate).toISOString().split('T')[0];
    }

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('HubSpot API error:', error);
      return Response.json({ error: error.message || 'Failed to create HubSpot task' }, { status: response.status });
    }

    const taskData = await response.json();

    // Store task reference in database
    try {
      await base44.entities.HubSpotTaskLink.create({
        alert_id: alertId,
        alert_type: alertType,
        hubspot_task_id: taskData.id,
        hubspot_task_url: `https://app.hubspot.com/sales/tasks/${taskData.id}`,
        title: title,
        created_date: new Date().toISOString(),
        status: 'created'
      });
    } catch (e) {
      console.log('Note: Could not store task reference (HubSpotTaskLink entity may not exist)');
    }

    return Response.json({
      success: true,
      hubspot_task_id: taskData.id,
      hubspot_task_url: `https://app.hubspot.com/sales/tasks/${taskData.id}`
    });
  } catch (error) {
    console.error('Error creating HubSpot task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapPriority(priority) {
  const priorityMap = {
    'critical': 'HIGH',
    'high': 'HIGH',
    'medium': 'MEDIUM',
    'low': 'LOW',
    'normal': 'MEDIUM'
  };
  return priorityMap[priority] || 'MEDIUM';
}