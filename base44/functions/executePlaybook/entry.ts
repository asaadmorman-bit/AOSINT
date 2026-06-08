import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { playbookId, triggerSource, triggerData } = await req.json();
    if (!playbookId) return Response.json({ error: 'playbookId is required' }, { status: 400 });

    // Fetch playbook
    const playbooks = await base44.asServiceRole.entities.Playbook.list({ id: playbookId });
    const playbook = playbooks[0];
    if (!playbook) return Response.json({ error: 'Playbook not found' }, { status: 404 });

    // Create execution record (initial state — orchestrator will update incrementally)
    const execution = await base44.asServiceRole.entities.PlaybookExecution.create({
      playbook_id: playbookId,
      execution_name: `${playbook.playbook_name} — ${new Date().toISOString().split('T')[0]}`,
      trigger_source: triggerSource || 'manual',
      trigger_data: typeof triggerData === 'string' ? triggerData : JSON.stringify(triggerData || {}),
      started_by: user.email,
      start_time: new Date().toISOString(),
      status: 'running',
      progress_percentage: 0,
    });

    // Delegate all task dispatch + lifecycle management to the orchestration layer
    const orchResult = await base44.functions.invoke('orchestrateAgentTasks', {
      executionId: execution.id,
      playbookId,
      workflowSteps: playbook.workflow_steps || [],
      triggerData: typeof triggerData === 'string' ? JSON.parse(triggerData || '{}') : (triggerData || {}),
    });

    // Update playbook-level stats
    const allExecutions = await base44.asServiceRole.entities.PlaybookExecution.filter({ playbook_id: playbookId });
    const successRate = allExecutions.length > 0
      ? Math.round((allExecutions.filter(e => e.success).length / allExecutions.length) * 100)
      : 0;
    const avgTime = allExecutions.length > 0
      ? Math.round(allExecutions.reduce((sum, e) => sum + (e.total_duration_seconds || 0), 0) / allExecutions.length)
      : 0;

    await base44.asServiceRole.entities.Playbook.update(playbookId, {
      execution_count: allExecutions.length,
      success_rate: successRate,
      last_executed: new Date().toISOString(),
      avg_execution_time_seconds: avgTime,
    });

    return Response.json({
      execution_id: execution.id,
      orchestration_id: orchResult.data?.orchestration_id,
      status: orchResult.data?.status,
      duration_seconds: orchResult.data?.duration_seconds,
      tasks_generated: orchResult.data?.tasks_generated,
      success: orchResult.data?.success,
      execution_log: orchResult.data?.log,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});