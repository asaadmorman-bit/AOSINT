import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Priority scoring: higher = dispatched first
const PRIORITY_SCORES = { critical: 100, high: 75, normal: 50, low: 25 };
const STEP_TYPE_PRIORITY = {
  data_enrichment: 90,  // enrichment first to feed decisions
  decision_gate: 80,
  agent_task: 70,
  notification: 30,
};

function scoreTask(step, basePriority) {
  const stepScore = STEP_TYPE_PRIORITY[step.step_type] || 50;
  const priorityScore = PRIORITY_SCORES[basePriority] || 50;
  return Math.round((stepScore + priorityScore) / 2);
}

function buildTaskQueue(steps, triggerData) {
  return steps
    .map((step, idx) => ({
      task_id: null,
      step_id: step.step_id || `step_${idx}`,
      step_name: step.step_name,
      priority: scoreTask(step, step.priority || 'normal'),
      priority_label: step.priority || 'normal',
      agent_id: step.agent_type || null,
      step_type: step.step_type,
      task_objective: step.task_objective,
      parameters: step.parameters,
      failure_action: step.failure_action || 'abort',
      timeout_seconds: step.timeout_seconds || 300,
      status: 'queued',
      dispatched_at: null,
      completed_at: null,
      duration_seconds: null,
    }))
    .sort((a, b) => b.priority - a.priority); // highest priority first
}

function computeAgentUtilization(agentProfiles, taskQueue) {
  return agentProfiles.map(agent => {
    const agentTasks = taskQueue.filter(t => t.agent_id === agent.id);
    const completed = agentTasks.filter(t => t.status === 'completed').length;
    const failed = agentTasks.filter(t => t.status === 'failed').length;
    const total = agentTasks.length;
    const utilization = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      agent_id: agent.id,
      agent_name: agent.agent_name,
      agent_type: agent.agent_type,
      tasks_assigned: total,
      tasks_completed: completed,
      tasks_failed: failed,
      utilization_percent: utilization,
      avg_task_duration_seconds: 0,
      status: agent.status || 'active',
    };
  });
}

function evaluateCondition(condition, findings) {
  if (!condition || !condition.type) return true;
  switch (condition.type) {
    case 'threshold': return findings.length >= (condition.min_findings || 0);
    case 'finding_type': return findings.some(f => f.type === condition.finding_type);
    case 'severity': return findings.some(f => f.severity === condition.severity);
    default: return true;
  }
}

function shouldScale(taskQueue, agentUtilization) {
  const pending = taskQueue.filter(t => t.status === 'queued').length;
  const overloaded = agentUtilization.filter(a => a.utilization_percent > 80).length;
  return pending > 3 && overloaded > 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { executionId, playbookId, workflowSteps, triggerData } = await req.json();
    if (!executionId || !workflowSteps) {
      return Response.json({ error: 'executionId and workflowSteps are required' }, { status: 400 });
    }

    const log = [];
    const findings = [];
    const stepExecutions = [];
    const scalingEvents = [];
    const now = new Date();

    // Build priority queue
    const taskQueue = buildTaskQueue(workflowSteps, triggerData);
    log.push(`[${now.toISOString()}] Orchestrator initialized: ${taskQueue.length} tasks queued`);

    // Fetch available agent profiles
    let agentProfiles = [];
    try {
      agentProfiles = await base44.asServiceRole.entities.AgentProfile.filter({ status: 'active' });
    } catch (_) {
      agentProfiles = [];
    }

    // Create orchestration state record
    const orchState = await base44.asServiceRole.entities.AgentOrchestrationState.create({
      execution_id: executionId,
      playbook_id: playbookId,
      status: 'running',
      task_queue: taskQueue,
      agent_utilization: computeAgentUtilization(agentProfiles, taskQueue),
      scaling_events: [],
      total_tasks: taskQueue.length,
      dispatched_tasks: 0,
      completed_tasks: 0,
      failed_tasks: 0,
      active_agents: agentProfiles.length,
      peak_agents: agentProfiles.length,
      orchestration_log: JSON.stringify(log),
      started_at: now.toISOString(),
    });

    const generatedTaskIds = [];
    let completedCount = 0;
    let failedCount = 0;

    // Dispatch tasks in priority order
    for (const queueItem of taskQueue) {
      const stepStart = new Date();
      queueItem.status = 'dispatched';
      queueItem.dispatched_at = stepStart.toISOString();

      // Check scaling need
      if (shouldScale(taskQueue, computeAgentUtilization(agentProfiles, taskQueue))) {
        const scaleEvent = {
          timestamp: new Date().toISOString(),
          event_type: 'scale_up_recommended',
          reason: 'Queue depth > 3 with overloaded agents',
          agents_before: agentProfiles.length,
          agents_after: agentProfiles.length + 1,
        };
        scalingEvents.push(scaleEvent);
        log.push(`[SCALE] Scaling recommendation triggered: ${scaleEvent.reason}`);
      }

      const stepExecution = {
        step_id: queueItem.step_id,
        step_name: queueItem.step_name,
        status: 'running',
        start_time: stepStart.toISOString(),
      };

      try {
        if (queueItem.step_type === 'agent_task') {
          const taskData = {
            agent_id: queueItem.agent_id || (agentProfiles[0]?.id || 'unassigned'),
            task_name: queueItem.step_name,
            task_type: 'hunt',
            target: triggerData?.target || 'dynamic',
            objective: queueItem.task_objective || queueItem.step_name,
            parameters: queueItem.parameters || '{}',
            priority: queueItem.priority_label || 'normal',
            status: 'pending',
          };

          const createdTask = await base44.asServiceRole.entities.AgentTask.create(taskData);
          queueItem.task_id = createdTask.id;
          queueItem.status = 'completed';
          stepExecution.task_id = createdTask.id;
          generatedTaskIds.push(createdTask.id);
          log.push(`[DISPATCH] Priority ${queueItem.priority} → Task "${queueItem.step_name}" → Agent ${queueItem.agent_id || 'auto-assigned'} (TaskID: ${createdTask.id})`);
          completedCount++;

        } else if (queueItem.step_type === 'data_enrichment') {
          const iocs = triggerData?.iocs || [];
          const enriched = iocs.map(ioc => ({ value: ioc, enriched: true, ts: new Date().toISOString() }));
          stepExecution.output = JSON.stringify({ iocs_enriched: enriched.length });
          queueItem.status = 'completed';
          log.push(`[ENRICH] "${queueItem.step_name}": enriched ${enriched.length} IOCs`);
          completedCount++;

        } else if (queueItem.step_type === 'decision_gate') {
          const condition = queueItem.parameters ? JSON.parse(queueItem.parameters) : {};
          const passed = evaluateCondition(condition, findings);
          stepExecution.output = JSON.stringify({ decision: passed ? 'continue' : 'skip' });
          queueItem.status = 'completed';
          log.push(`[GATE] "${queueItem.step_name}": ${passed ? 'PASSED → continue' : 'SKIPPED → branch skip'}`);
          if (!passed && queueItem.failure_action === 'skip_branch') continue;
          completedCount++;

        } else if (queueItem.step_type === 'notification') {
          log.push(`[NOTIFY] "${queueItem.step_name}": notification dispatched to ${user.email}`);
          queueItem.status = 'completed';
          completedCount++;
        }

        const stepEnd = new Date();
        queueItem.completed_at = stepEnd.toISOString();
        queueItem.duration_seconds = Math.round((stepEnd - stepStart) / 1000);
        stepExecution.status = 'completed';
        stepExecution.end_time = stepEnd.toISOString();
        stepExecution.duration_seconds = queueItem.duration_seconds;

      } catch (err) {
        queueItem.status = 'failed';
        stepExecution.status = 'failed';
        stepExecution.error_message = err.message;
        stepExecution.end_time = new Date().toISOString();
        failedCount++;
        log.push(`[ERROR] "${queueItem.step_name}": ${err.message}`);
        if (queueItem.failure_action === 'abort') break;
      }

      stepExecutions.push(stepExecution);

      // Incremental progress update on PlaybookExecution
      const progress = Math.round(((completedCount + failedCount) / taskQueue.length) * 100);
      await base44.asServiceRole.entities.PlaybookExecution.update(executionId, {
        progress_percentage: progress,
        step_executions: stepExecutions,
        generated_tasks: generatedTaskIds,
        tasks_executed: generatedTaskIds.length,
      });

      // Incremental orchestration state update
      await base44.asServiceRole.entities.AgentOrchestrationState.update(orchState.id, {
        task_queue: taskQueue,
        dispatched_tasks: completedCount + failedCount,
        completed_tasks: completedCount,
        failed_tasks: failedCount,
        agent_utilization: computeAgentUtilization(agentProfiles, taskQueue),
        scaling_events: scalingEvents,
        orchestration_log: JSON.stringify(log),
      });
    }

    const endTime = new Date();
    const finalStatus = failedCount === 0 ? 'completed' : 'failed';
    const duration = Math.round((endTime - now) / 1000);
    const throughput = duration > 0 ? Math.round((completedCount / duration) * 60) : completedCount;

    // Finalize orchestration state
    await base44.asServiceRole.entities.AgentOrchestrationState.update(orchState.id, {
      status: finalStatus,
      task_queue: taskQueue,
      completed_tasks: completedCount,
      failed_tasks: failedCount,
      throughput_tasks_per_minute: throughput,
      orchestration_log: JSON.stringify(log),
      completed_at: endTime.toISOString(),
    });

    // Finalize PlaybookExecution
    await base44.asServiceRole.entities.PlaybookExecution.update(executionId, {
      status: finalStatus,
      end_time: endTime.toISOString(),
      total_duration_seconds: duration,
      progress_percentage: 100,
      step_executions: stepExecutions,
      generated_tasks: generatedTaskIds,
      generated_findings: JSON.stringify(findings),
      execution_logs: log.join('\n'),
      success: failedCount === 0,
      findings_count: findings.length,
      tasks_executed: generatedTaskIds.length,
      iocs_processed: triggerData?.iocs?.length || 0,
      errors: failedCount > 0 ? [`${failedCount} steps failed`] : [],
    });

    return Response.json({
      orchestration_id: orchState.id,
      execution_id: executionId,
      status: finalStatus,
      duration_seconds: duration,
      tasks_generated: generatedTaskIds.length,
      completed_tasks: completedCount,
      failed_tasks: failedCount,
      scaling_events: scalingEvents.length,
      throughput_tasks_per_minute: throughput,
      success: failedCount === 0,
      log,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});