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

    const correlationPrompt = `Extract and correlate all threat indicators from this OSINT investigation:

Investigation: ${investigation.title}
Findings: ${investigation.findings_summary || 'No findings'}

Identify and correlate:
1. IP ADDRESSES - List all IPs with context and relationships
2. DOMAINS - All domains with DNS/registrar context and relationships
3. EMAIL ADDRESSES - All emails with associated accounts or organizations
4. USERNAMES - Social media/platform usernames with connections
5. FILE HASHES - Any MD5/SHA1/SHA256 hashes mentioned
6. URLS - Specific URLs indicating command & control, phishing, etc.

For each indicator, determine:
- Confidence level (high/medium/low)
- Relationships to other indicators
- Historical context if available
- Risk classification (benign/suspicious/malicious)

Return as structured JSON:
{
  "indicators": [
    {
      "type": "ip|domain|email|username|hash|url",
      "value": "...",
      "confidence": "high|medium|low",
      "relationships": ["related_indicator_1", "related_indicator_2"],
      "risk": "benign|suspicious|malicious",
      "context": "why this matters"
    }
  ],
  "correlationPatterns": ["pattern1", "pattern2"],
  "threatCluster": "description of the threat cluster"
}`;

    const correlationData = await base44.integrations.Core.InvokeLLM({
      prompt: correlationPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          indicators: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                value: { type: "string" },
                confidence: { type: "string" },
                relationships: { type: "array", items: { type: "string" } },
                risk: { type: "string" },
                context: { type: "string" }
              }
            }
          },
          correlationPatterns: { type: "array", items: { type: "string" } },
          threatCluster: { type: "string" }
        }
      }
    });

    return Response.json({ 
      success: true, 
      correlationData,
      indicatorCount: correlationData.indicators?.length || 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});