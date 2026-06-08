import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Gather data concurrently
    const [executions, tasks, feedbacks, corrections, existingPlaybooks] = await Promise.all([
      base44.asServiceRole.entities.PlaybookExecution.list('-start_time', 50),
      base44.asServiceRole.entities.AgentTask.list('-created_date', 100),
      base44.asServiceRole.entities.AgentFeedback.filter({ feedback_type: 'positive' }),
      base44.asServiceRole.entities.ActionCorrection.list('-created_date', 50),
      base44.asServiceRole.entities.Playbook.list('', 50),
    ]);

    const successfulExecutions = executions.filter(e => e.success === true);
    const failedExecutions = executions.filter(e => e.success === false);
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const highRatedFeedback = feedbacks.filter(f => (f.rating || 0) >= 4);

    // Build pattern summary for the LLM
    const patternSummary = {
      total_executions: executions.length,
      successful_executions: successfulExecutions.length,
      failed_executions: failedExecutions.length,
      avg_tasks_per_execution: successfulExecutions.length > 0
        ? Math.round(successfulExecutions.reduce((s, e) => s + (e.tasks_executed || 0), 0) / successfulExecutions.length)
        : 0,
      common_step_sequences: extractStepSequences(successfulExecutions),
      frequent_task_types: frequentTaskTypes(completedTasks),
      feedback_patterns: summarizeFeedback(highRatedFeedback),
      correction_patterns: summarizeCorrections(corrections),
      existing_playbook_names: existingPlaybooks.map(p => p.playbook_name),
      successful_playbook_stats: successfulExecutions.map(e => ({
        playbook_id: e.playbook_id,
        tasks_executed: e.tasks_executed,
        duration: e.total_duration_seconds,
        iocs_processed: e.iocs_processed,
        step_count: (e.step_executions || []).length,
      })),
    };

    const prompt = `You are a senior threat intelligence analyst and security orchestration expert. 
Analyze the following OSINT/threat hunting platform usage patterns and generate actionable playbook suggestions.

PLATFORM USAGE PATTERNS:
${JSON.stringify(patternSummary, null, 2)}

EXISTING PLAYBOOKS:
${existingPlaybooks.map(p => `- ${p.playbook_name} (type: ${p.playbook_type}, success_rate: ${p.success_rate || 'unknown'}%, steps: ${(p.workflow_steps || []).length})`).join('\n')}

Based on these patterns, generate 3-5 concrete suggestions. For each suggestion:
1. Identify a specific pattern or gap in current workflows
2. Provide evidence from the data
3. Give a complete, actionable recommendation

For new playbook suggestions, include complete workflow_steps in this exact format:
[{"step_id":"step_0","step_name":"...","step_type":"agent_task|data_enrichment|decision_gate|notification","task_objective":"...","timeout_seconds":300,"retry_count":0,"failure_action":"abort|continue|skip_branch"}]

For trigger condition suggestions, use JSON like:
{"type":"threshold|finding_type|severity","min_findings":3}

Focus on: recurring successful step sequences, tasks with high completion rates, feedback-driven improvements, and gaps where automation could reduce manual work.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                suggestion_type: { type: 'string' },
                title: { type: 'string' },
                rationale: { type: 'string' },
                evidence: { type: 'array', items: { type: 'string' } },
                confidence_score: { type: 'number' },
                impact_estimate: { type: 'string' },
                target_playbook_name: { type: 'string' },
                suggested_playbook_definition: { type: 'string' },
                suggested_workflow_steps: { type: 'string' },
                suggested_trigger_conditions: { type: 'string' },
                pattern_source: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              }
            }
          },
          analysis_summary: { type: 'string' },
          top_patterns_detected: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    // Persist suggestions to the database
    const createdSuggestions = [];
    for (const s of (aiResponse.suggestions || [])) {
      const matchedPlaybook = existingPlaybooks.find(p =>
        p.playbook_name === s.target_playbook_name
      );
      const suggestion = await base44.asServiceRole.entities.PlaybookSuggestion.create({
        suggestion_type: s.suggestion_type || 'new_playbook',
        target_playbook_id: matchedPlaybook?.id || null,
        target_playbook_name: s.target_playbook_name || null,
        title: s.title,
        rationale: s.rationale,
        evidence: s.evidence || [],
        confidence_score: s.confidence_score || 70,
        impact_estimate: s.impact_estimate || 'medium',
        suggested_playbook_definition: s.suggested_playbook_definition || null,
        suggested_workflow_steps: s.suggested_workflow_steps || null,
        suggested_trigger_conditions: s.suggested_trigger_conditions || null,
        pattern_source: s.pattern_source || 'combined',
        source_execution_ids: successfulExecutions.slice(0, 5).map(e => e.id),
        status: 'pending',
        generated_at: new Date().toISOString(),
        tags: s.tags || [],
      });
      createdSuggestions.push(suggestion);
    }

    return Response.json({
      suggestions_generated: createdSuggestions.length,
      analysis_summary: aiResponse.analysis_summary,
      top_patterns_detected: aiResponse.top_patterns_detected || [],
      suggestion_ids: createdSuggestions.map(s => s.id),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractStepSequences(executions) {
  const sequences = {};
  for (const exec of executions) {
    const steps = (exec.step_executions || [])
      .filter(s => s.status === 'completed')
      .map(s => s.step_name);
    if (steps.length > 1) {
      const key = steps.join(' → ');
      sequences[key] = (sequences[key] || 0) + 1;
    }
  }
  return Object.entries(sequences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([seq, count]) => ({ sequence: seq, count }));
}

function frequentTaskTypes(tasks) {
  const counts = {};
  for (const t of tasks) {
    counts[t.task_type] = (counts[t.task_type] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

function summarizeFeedback(feedbacks) {
  const categories = {};
  for (const f of feedbacks) {
    const cat = f.feedback_category || 'general';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  return { total: feedbacks.length, by_category: categories };
}

function summarizeCorrections(corrections) {
  const types = {};
  for (const c of corrections) {
    types[c.correction_type] = (types[c.correction_type] || 0) + 1;
  }
  return {
    total: corrections.length,
    by_type: types,
    common_root_causes: corrections
      .map(c => c.root_cause)
      .filter(Boolean)
      .slice(0, 5),
  };
}