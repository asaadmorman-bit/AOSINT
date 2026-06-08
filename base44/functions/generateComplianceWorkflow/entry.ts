import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate compliance and strategy workflows using Claude
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      workflow_type,
      objective,
      compliance_framework,
      organization_context,
    } = body;

    if (!workflow_type || !objective) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build Claude prompt for workflow generation
    let claudePrompt = `Generate a detailed ${workflow_type.replace(/_/g, " ")} workflow for the following objective:\n\n"${objective}"\n\n`;

    if (compliance_framework) {
      claudePrompt += `Ensure compliance with ${compliance_framework.toUpperCase()} framework.\n`;
    }

    if (organization_context) {
      claudePrompt += `Organization context: ${organization_context}\n`;
    }

    claudePrompt += `
Provide the response as a structured workflow with:
1. Step-by-step actions
2. Responsible roles for each step
3. Risk mitigation strategies
4. Resource requirements
5. Estimated timeline
6. Success metrics

Format as JSON with clear sections.`;

    // Call Claude
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: claudePrompt,
      add_context_from_internet: compliance_framework !== undefined,
      response_json_schema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                step_name: { type: "string" },
                description: { type: "string" },
                responsible_role: { type: "string" },
                dependencies: { type: "array", items: { type: "number" } },
              },
            },
          },
          risk_mitigation: { type: "array", items: { type: "string" } },
          resources: { type: "array", items: { type: "string" } },
          timeline_days: { type: "number" },
        },
      },
    });

    if (!response) {
      return Response.json({ error: "Failed to generate workflow" }, { status: 500 });
    }

    // Create workflow record
    const workflow = await base44.asServiceRole.entities.AgentWorkflow.create({
      workflow_name: `${objective.substring(0, 50)}...`,
      workflow_type,
      objective,
      generated_steps: response.steps || [],
      compliance_framework: compliance_framework || null,
      risk_mitigation: response.risk_mitigation || [],
      resource_requirements: response.resources || [],
      timeline_days: response.timeline_days || 30,
      created_by: user.email,
      status: "draft",
      created_at: new Date().toISOString(),
    });

    // Log creation
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "workflow_generated",
      resource_type: "workflow",
      resource_id: workflow.id,
      details: `Generated ${workflow_type} workflow`,
      severity: "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      workflow_id: workflow.id,
      workflow_name: workflow.workflow_name,
      steps_count: response.steps?.length || 0,
      timeline_days: response.timeline_days || 30,
      created_at: workflow.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error("Workflow generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});