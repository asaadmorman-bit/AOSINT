import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active scheduled jobs
    const scheduledJobs = await base44.asServiceRole.entities.ScheduledQuantumJob.filter(
      { status: 'active' },
      'next_execution_time',
      1000
    );

    const now = new Date();
    const executedJobs = [];
    const jobsToUpdate = [];

    for (const scheduledJob of scheduledJobs) {
      const nextExecTime = new Date(scheduledJob.next_execution_time);

      // Check if it's time to execute
      if (nextExecTime <= now) {
        // Create the actual quantum job
        const jobParams = JSON.parse(scheduledJob.input_parameters || '{}');
        
        const newJob = {
          job_name: `${scheduledJob.job_name} - ${now.toISOString()}`,
          algorithm_type: scheduledJob.algorithm_type,
          execution_type: scheduledJob.execution_type,
          quantum_backend: scheduledJob.quantum_backend,
          problem_size: scheduledJob.problem_size,
          qubits_required: scheduledJob.qubits_required,
          priority: scheduledJob.priority,
          input_parameters: scheduledJob.input_parameters,
          resource_allocation: JSON.stringify({
            scheduled_job_id: scheduledJob.id,
            original_schedule: scheduledJob.schedule_type
          })
        };

        const createdJob = await base44.asServiceRole.entities.QuantumOrchestrationJob.create(newJob);
        executedJobs.push({
          scheduledJobId: scheduledJob.id,
          executedJobId: createdJob.id,
          executedAt: now.toISOString()
        });

        // Calculate next execution time
        const nextExecTime = calculateNextExecution(
          scheduledJob.schedule_type,
          scheduledJob.scheduled_start_time,
          scheduledJob.cron_expression,
          scheduledJob.days_of_week,
          scheduledJob.day_of_month,
          scheduledJob.recurrence_end_date,
          now
        );

        // Update scheduled job
        jobsToUpdate.push({
          id: scheduledJob.id,
          updates: {
            last_execution_time: now.toISOString(),
            last_execution_job_id: createdJob.id,
            execution_count: (scheduledJob.execution_count || 0) + 1,
            success_count: (scheduledJob.success_count || 0) + 1,
            next_execution_time: nextExecTime,
            status: nextExecTime ? 'active' : 'completed'
          }
        });
      }
    }

    // Batch update all modified jobs
    for (const jobUpdate of jobsToUpdate) {
      await base44.asServiceRole.entities.ScheduledQuantumJob.update(
        jobUpdate.id,
        jobUpdate.updates
      );
    }

    return Response.json({
      jobsExecuted: executedJobs.length,
      details: executedJobs,
      timestamp: now.toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateNextExecution(
  scheduleType,
  scheduledStartTime,
  cronExpression,
  daysOfWeek,
  dayOfMonth,
  recurrenceEndDate,
  currentTime
) {
  const now = new Date(currentTime);

  // Check if recurrence has ended
  if (recurrenceEndDate && new Date(recurrenceEndDate) < now) {
    return null;
  }

  let nextTime = new Date(now);
  nextTime.setSeconds(0);
  nextTime.setMilliseconds(0);

  switch (scheduleType) {
    case 'one_time':
      return null; // One-time jobs don't recur

    case 'daily':
      const startTime = new Date(scheduledStartTime);
      nextTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      nextTime.setDate(nextTime.getDate() + 1);
      return nextTime.toISOString();

    case 'weekly':
      const startWeekly = new Date(scheduledStartTime);
      const targetDays = daysOfWeek || [startWeekly.getDay()];
      
      let found = false;
      for (let i = 0; i < 7; i++) {
        nextTime.setDate(nextTime.getDate() + 1);
        if (targetDays.includes(nextTime.getDay())) {
          nextTime.setHours(startWeekly.getHours(), startWeekly.getMinutes(), 0, 0);
          found = true;
          break;
        }
      }
      return found ? nextTime.toISOString() : null;

    case 'monthly':
      const startMonthly = new Date(scheduledStartTime);
      const targetDay = dayOfMonth || startMonthly.getDate();
      
      nextTime.setMonth(nextTime.getMonth() + 1);
      nextTime.setDate(Math.min(targetDay, new Date(nextTime.getFullYear(), nextTime.getMonth() + 1, 0).getDate()));
      nextTime.setHours(startMonthly.getHours(), startMonthly.getMinutes(), 0, 0);
      
      return nextTime.toISOString();

    case 'custom_cron':
      // Simple cron parser for basic patterns
      // Format: minute hour day_of_month month day_of_week
      if (!cronExpression) return null;
      
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) return null;

      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setMinutes(0);
      nextTime.setSeconds(0);
      
      // For simplicity, just advance by 1 day
      // A full cron parser would be more complex
      return nextTime.toISOString();

    default:
      return null;
  }
}