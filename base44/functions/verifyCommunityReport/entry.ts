import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Support both direct invocation (report_id) and entity automation payload (event.entity_id)
  const body = await req.json();
  const report_id = body.report_id || body.event?.entity_id || body.data?.id;
  if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

  const report = await base44.asServiceRole.entities.CommunityReport.get(report_id);
  if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });

  const prompt = `You are a cybersecurity intelligence analyst performing credibility verification on a community-submitted report.

Report Type: ${report.report_type}
Title: ${report.title}
Description: ${report.description}
Severity: ${report.severity}
${report.cve_id ? `CVE ID: ${report.cve_id}` : ""}
${report.indicator_value ? `Indicator: ${report.indicator_type} = ${report.indicator_value}` : ""}
${report.affected_systems ? `Affected Systems: ${report.affected_systems}` : ""}
${report.source_reference ? `Source Reference: ${report.source_reference}` : ""}
${report.evidence_url ? `Evidence URL: ${report.evidence_url}` : ""}

Evaluate this report for:
1. Technical credibility and specificity
2. Whether the CVE/indicator/claim can be corroborated with known threat intelligence
3. Completeness of information provided
4. Signs of fabrication, spam, or low-quality submission
5. Recommended action

Provide a credibility score from 0-100 and a recommended verification status.`;

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        credibility_score: { type: "number" },
        verification_recommendation: {
          type: "string",
          enum: ["verified", "under_review", "rejected", "duplicate"]
        },
        summary: { type: "string" },
        corroboration_found: { type: "boolean" },
        corroboration_details: { type: "string" },
        flags: { type: "array", items: { type: "string" } },
        suggested_tags: { type: "array", items: { type: "string" } }
      }
    }
  });

  // Auto-update report with AI assessment
  await base44.asServiceRole.entities.CommunityReport.update(report_id, {
    verification_score: result.credibility_score,
    verification_notes: result.summary,
    tags: result.suggested_tags || [],
    verification_status: result.corroboration_found && result.credibility_score >= 60
      ? "under_review"
      : result.credibility_score < 20
      ? "rejected"
      : "under_review"
  });

  return Response.json(result);
});