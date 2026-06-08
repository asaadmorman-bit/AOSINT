import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investigationId, actorName } = await req.json();
    const investigation = await base44.entities.OsintInvestigation.get(investigationId);

    if (!investigation) {
      return Response.json({ error: 'Investigation not found' }, { status: 404 });
    }

    const profilePrompt = `Based on this OSINT investigation, create a detailed threat actor profile:

Investigation: ${investigation.title}
Query: ${investigation.query}
Findings: ${investigation.findings_summary || 'No findings'}
Analysis: ${investigation.analyst_notes || 'No analysis'}

Generate a comprehensive threat actor profile in this JSON format:
{
  "name": "${actorName || 'Unknown Actor'}",
  "aliases": ["alias1", "alias2"],
  "actor_type": "nation_state|criminal|hacktivist|insider|hybrid|unknown",
  "attributed_country": "country",
  "target_sectors": ["finance", "healthcare", "government"],
  "target_regions": ["North America", "Europe"],
  "shared_infrastructure": ["ip_or_domain_1", "ip_or_domain_2"],
  "shared_ttps": ["T1234", "T5678"],
  "associated_campaigns": ["campaign_name"],
  "narrative_alignment": "description of their apparent motivations/narrative",
  "first_observed": "2024-01-01T00:00:00Z",
  "status": "active|dormant|dissolved|unknown",
  "confidence": 75,
  "mitre_groups": ["APT28", "Fancy Bear"],
  "notes": "comprehensive profile notes"
}

Base the analysis on:
1. Observed TTPs and tools
2. Target selection patterns
3. Infrastructure patterns
4. Operational tempo
5. Any identified aliases or group names
6. Geopolitical context

Provide confidence levels and note any assumptions.`;

    const profileData = await base44.integrations.Core.InvokeLLM({
      prompt: profilePrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
          actor_type: { type: "string" },
          attributed_country: { type: "string" },
          target_sectors: { type: "array", items: { type: "string" } },
          target_regions: { type: "array", items: { type: "string" } },
          shared_infrastructure: { type: "array", items: { type: "string" } },
          shared_ttps: { type: "array", items: { type: "string" } },
          associated_campaigns: { type: "array", items: { type: "string" } },
          narrative_alignment: { type: "string" },
          first_observed: { type: "string" },
          status: { type: "string" },
          confidence: { type: "number" },
          mitre_groups: { type: "array", items: { type: "string" } },
          notes: { type: "string" }
        }
      }
    });

    // Create ThreatActor record
    const createdActor = await base44.entities.ThreatActor.create(profileData);

    return Response.json({ 
      success: true,
      actorProfile: profileData,
      createdActorId: createdActor.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});