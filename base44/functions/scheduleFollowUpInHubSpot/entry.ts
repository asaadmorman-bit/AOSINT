import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, dealId } = await req.json();

    if (!taskId || !dealId) {
      return Response.json({ error: 'Missing required task or deal ID' }, { status: 400 });
    }

    // Get the task details
    const task = await base44.entities.FollowUpTask.get(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Create task in HubSpot based on type
    let hubspotTaskId;

    if (task.task_type === 'email') {
      // For email tasks, we'll create a task in HubSpot
      const hubspotTask = await createHubSpotTask(accessToken, task, 'email');
      hubspotTaskId = hubspotTask.id;
    } else if (task.task_type === 'call') {
      // For call tasks
      const hubspotTask = await createHubSpotTask(accessToken, task, 'call');
      hubspotTaskId = hubspotTask.id;
    }

    // Update the task record
    await base44.entities.FollowUpTask.update(taskId, {
      status: 'scheduled',
      hubspot_task_id: hubspotTaskId
    });

    return Response.json({
      success: true,
      hubspot_task_id: hubspotTaskId,
      message: `${task.task_type} task scheduled in HubSpot`
    });
  } catch (error) {
    console.error('Error scheduling follow-up task:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createHubSpotTask(accessToken, task, type) {
  const dueDate = new Date(task.scheduled_for);
  const taskData = {
    properties: {
      hs_task_subject: task.subject,
      hs_task_body: task.content,
      hs_task_type: type === 'email' ? 'EMAIL' : 'CALL',
      hs_task_status: 'NOT_STARTED',
      hs_task_priority: task.win_probability_at_creation < 40 ? 'HIGH' : 'MEDIUM',
      hs_timestamp: new Date().toISOString(),
      hs_task_due_date: dueDate.toISOString().split('T')[0]
    }
  };

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('HubSpot API error:', error);
    throw new Error(`Failed to create HubSpot task: ${response.statusText}`);
  }

  return await response.json();
}