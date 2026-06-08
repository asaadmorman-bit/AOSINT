import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investigationId } = await req.json();
    const investigation = await base44.entities.OsintInvestigation.get(investigationId);

    if (!investigation) {
      return Response.json({ error: 'Investigation not found' }, { status: 404 });
    }

    const analysisPrompt = `You are an expert threat intelligence analyst. Analyze these OSINT investigation findings in detail:

Investigation Title: ${investigation.title}
Query: ${investigation.query}
Type: ${investigation.investigation_type}

Current Findings:
${investigation.findings_summary || 'No findings yet'}

Analyst Notes:
${investigation.analyst_notes || 'None'}

Provide a comprehensive analysis including:
1. KEY INSIGHT PATTERNS - What patterns or themes emerge from the data?
2. THREAT ASSESSMENT - What does this activity suggest about the threat landscape?
3. ATTRIBUTION INDICATORS - Any indicators suggesting specific actors or groups?
4. OPERATIONAL SECURITY (OPSEC) - What security measures is the target employing?
5. INTELLIGENCE GAPS - What critical information is missing?
6. TREND ANALYSIS - Is this activity increasing, decreasing, or evolving?
7. SECTOR IMPACT - How does this affect specific industry sectors?

Be specific, reference the findings, and provide confidence levels for assessments.`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      add_context_from_internet: true,
    });

    await base44.entities.OsintInvestigation.update(investigationId, {
      analyst_notes: analysis
    });

    return Response.json({ 
      success: true, 
      analysis,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});