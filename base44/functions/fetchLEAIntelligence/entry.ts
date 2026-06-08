import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use LLM to fetch and parse law enforcement intelligence
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a comprehensive law enforcement intelligence analyst. Research and compile current threat intelligence from FBI, ATF, DHS, and state/local law enforcement reports on:

1. OUTLAW MOTORCYCLE GANGS (OMGs) - Include Big Four (Hells Angels, Bandidos, Outlaws, Mongols) and all known regional chapters with their official law enforcement designations and tags
2. TERRORIST ORGANIZATIONS - Domestic and international designated groups
3. HATE GROUPS - Including KKK, white supremacist, and other extremist organizations (SPLC/ADL tracked)
4. POLITICAL ACTORS & ORGANIZATIONS - Extremist political groups and movements tracked by law enforcement
5. SOCIAL DISRUPTOR GROUPS - Organized disruptive movements

For EACH organization, provide:
- Official name, known aliases, and chapters
- LAW ENFORCEMENT TAGS: Official designations from FBI, ATF, DHS (e.g., "RICO Target", "Tier-1 Organized Crime", "Terrorist Designation")
- Threat level (low/medium/high/critical)
- Geographic level (local/state/federal/international) and specific focus areas
- Recent documented incidents or activities (last 6 months)
- Known leadership structure
- Estimated membership
- Enforcement status (active_investigation/under_surveillance/known_threat/disrupted/inactive)
- Relevant to ongoing missions (true/false)
- OMGs: Include club colors, chapters, territory claims, known disputes

Format as JSON array of intelligence objects for law enforcement briefing.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          intelligence_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                intel_type: { type: "string" },
                geographic_level: { type: "string" },
                source_agency: { type: "string" },
                entity_name: { type: "string" },
                law_enforcement_tags: { type: "array", items: { type: "string" } },
                aliases: { type: "array", items: { type: "string" } },
                threat_level: { type: "string" },
                description: { type: "string" },
                known_activities: { type: "array", items: { type: "string" } },
                geographic_focus: { type: "array", items: { type: "string" } },
                estimated_membership: { type: "number" },
                enforcement_status: { type: "string" },
                mission_related: { type: "boolean" },
                fbi_designation: { type: "string" },
                operator_notes: { type: "string" }
              }
            }
          }
        }
      }
    });

    const intelItems = llmResponse.intelligence_items || [];

    // Store in database
    const storedIntel = [];
    for (const item of intelItems) {
      try {
        const record = await base44.entities.LEAIntelligence.create({
          title: item.title,
          intel_type: item.intel_type,
          geographic_level: item.geographic_level || 'federal',
          source_agency: item.source_agency || 'fbi',
          entity_name: item.entity_name,
          law_enforcement_tags: item.law_enforcement_tags || [],
          aliases: item.aliases || [],
          threat_level: item.threat_level || 'medium',
          description: item.description,
          known_activities: item.known_activities || [],
          geographic_focus: item.geographic_focus || [],
          estimated_membership: item.estimated_membership,
          enforcement_status: item.enforcement_status || 'known_threat',
          mission_related: item.mission_related || false,
          fbi_designation: item.fbi_designation,
          operator_notes: item.operator_notes,
          last_updated: new Date().toISOString(),
          tags: ['law_enforcement', 'operator_intel', 'current']
        });
        storedIntel.push(record);
      } catch (error) {
        console.error('Error storing intel item:', error);
      }
    }

    return Response.json({
      status: 'success',
      intel_count: storedIntel.length,
      last_updated: new Date().toISOString(),
      summary: `Fetched ${storedIntel.length} law enforcement intelligence items (OMGs, terrorists, social disruptors)`
    });
  } catch (error) {
    console.error('LEA intelligence fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});