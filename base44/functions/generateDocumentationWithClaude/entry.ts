import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate instruction manuals and use cases using Claude AI
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
      doc_type,
      subject_area,
      prompt_text,
      include_examples = true,
      include_best_practices = true,
    } = body;

    if (!doc_type || !subject_area || !prompt_text) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build Claude prompt
    let claudePrompt = `Generate a comprehensive ${doc_type} about "${subject_area}" based on the following request:\n\n${prompt_text}\n\n`;

    if (include_examples) {
      claudePrompt += "Include practical examples where applicable.\n";
    }

    if (include_best_practices) {
      claudePrompt += "Include best practices and recommendations.\n";
    }

    claudePrompt += "Format the response in clear markdown with headings, bullet points, and code blocks where relevant.";

    // Call Claude via Base44 LLM integration
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: claudePrompt,
      add_context_from_internet: subject_area.includes("threat") || subject_area.includes("security"),
    });

    if (!response.success) {
      return Response.json({ error: "Failed to generate documentation" }, { status: 500 });
    }

    const generatedContent = response.message;

    // Create documentation record
    const docTitle = `${subject_area} - ${doc_type.replace(/_/g, " ")}`;
    const documentation = await base44.asServiceRole.entities.GeneratedDocumentation.create({
      doc_title: docTitle,
      doc_type,
      subject_area,
      generated_content: generatedContent,
      prompt_used: prompt_text,
      model_used: "claude",
      generated_by: user.email,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Log creation
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "documentation_generated",
      resource_type: "documentation",
      resource_id: documentation.id,
      details: `Generated ${doc_type} on ${subject_area}`,
      severity: "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      documentation_id: documentation.id,
      doc_title: docTitle,
      content_preview: generatedContent.substring(0, 500) + "...",
      created_at: documentation.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error("Documentation generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});