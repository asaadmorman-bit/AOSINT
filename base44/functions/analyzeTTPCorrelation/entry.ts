import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all threat actors, campaigns, and indicators
    const [threatActors, campaigns, indicators] = await Promise.all([
      base44.entities.ThreatActor.list(),
      base44.entities.Campaign.list(),
      base44.entities.ThreatIndicator.list(),
    ]);

    // Build comprehensive TTP data for analysis
    const ttpData = {
      threat_actors: threatActors.map((a) => ({
        name: a.name,
        aliases: a.aliases || [],
        tactics: a.tactics || [],
        tools_used: a.tools_used || [],
        estimated_capability: a.estimated_capability,
        target_sectors: a.target_sectors || [],
      })),
      campaigns: campaigns.map((c) => ({
        name: c.name,
        actor: c.actor_name,
        ttps: c.ttps || [],
        target_sectors: c.target_sectors || [],
      })),
      indicators: indicators.map((i) => ({
        type: i.indicator_type,
        mitre_tactics: i.mitre_tactics || [],
        related_actors: i.related_actors || [],
      })),
    };

    // Use InvokeLLM to analyze TTPs deeply
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cybersecurity threat intelligence analyst. Analyze the following threat actor TTP (Tactics, Techniques, and Procedures) data comprehensively:

${JSON.stringify(ttpData, null, 2)}

Provide a detailed analysis in JSON format with the following structure:
{
  "ttp_correlations": [
    {
      "tactic": "string",
      "actors": ["actor names using this tactic"],
      "frequency": "number 0-100 indicating how common",
      "variants": ["technique variants observed"]
    }
  ],
  "emerging_ttps": [
    {
      "tactic": "string",
      "technique": "string",
      "risk_level": "low/medium/high/critical",
      "description": "why this is emerging",
      "actors_employing": ["actor names"]
    }
  ],
  "defensive_measures": [
    {
      "against_tactic": "string",
      "measure": "string",
      "priority": "critical/high/medium/low",
      "mitigates": ["list of techniques"],
      "implementation": "brief guidance"
    }
  ],
  "iocs_to_monitor": [
    {
      "type": "ip/domain/hash/email",
      "indicator": "string or pattern",
      "associated_actors": ["actor names"],
      "risk_level": "critical/high/medium/low"
    }
  ],
  "actor_profiles": [
    {
      "actor_name": "string",
      "primary_tactics": ["tactics"],
      "preferred_tools": ["tools"],
      "target_profile": "string describing typical targets",
      "capability_level": "low/medium/high/advanced",
      "operational_security": "description of OPSEC practices",
      "attribution_confidence": "0-100"
    }
  ],
  "campaign_summaries": [
    {
      "campaign_name": "string",
      "lead_actor": "string",
      "ttp_chain": ["ordered sequence of TTPs used"],
      "kill_chain_stage": "reconnaissance/weaponization/delivery/exploitation/installation/command_control/actions",
      "estimated_duration": "string",
      "success_indicators": ["signs of successful compromise"]
    }
  ],
  "cross_campaign_patterns": [
    {
      "pattern": "string describing the pattern",
      "campaigns": ["campaign names"],
      "likelihood": "0-100",
      "strategic_implication": "what this means"
    }
  ]
}`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          ttp_correlations: { type: "array" },
          emerging_ttps: { type: "array" },
          defensive_measures: { type: "array" },
          iocs_to_monitor: { type: "array" },
          actor_profiles: { type: "array" },
          campaign_summaries: { type: "array" },
          cross_campaign_patterns: { type: "array" },
        },
      },
    });

    return Response.json({
      success: true,
      analysis: analysis,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});