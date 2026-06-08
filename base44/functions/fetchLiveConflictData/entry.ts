import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Single unified call to reduce API load and avoid rate limiting
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Eye of Shauntze — a real-time global situational awareness intelligence system. As of ${new Date().toISOString().slice(0,10)}, provide a comprehensive intelligence picture across ALL domains:

**PHYSICAL DOMAIN (Armed Conflicts & Military):**
Ukraine-Russia front lines, Gaza/Israel operations, Sudan civil war, Myanmar, Sahel (Mali/Burkina/Niger), Yemen Houthis, Somalia Al-Shabaab, DRC, Taiwan Strait, Korean Peninsula, any active combat zones.

**GEOPOLITICAL DOMAIN (Diplomatic Crises & Tensions):**
China-Taiwan tensions, North Korea nuclear/missile, Iran nuclear + proxies, US-China strategic competition, Russia-NATO, South China Sea disputes, India-Pakistan/China borders, Venezuela/Haiti crises, election instability, coup attempts.

**HYBRID DOMAIN (Economic Warfare & Supply Chain):**
Active sanctions enforcement, trade war escalations, supply chain chokepoints under threat (Suez, Panama, Hormuz, Malacca), commodity shocks (energy/food), currency crises, critical infrastructure attacks (undersea cables, energy grids, ports).

**PHYSICAL DOMAIN (Disasters & Humanitarian):**
Major earthquakes, floods, wildfires, active hurricanes/typhoons, famine crises, refugee/displacement events, disease outbreaks, water scarcity conflicts.

**CYBER DOMAIN (Cyber Operations & Info Warfare):**
APT campaigns, ransomware on critical infrastructure, state-sponsored operations (Russia/China/Iran/DPRK), election interference, deepfake/disinformation campaigns, zero-day exploitation in the wild.

For EACH event provide: exact lat/lng coordinates, title, detailed description, domain classification, severity (critical/high/medium/low), region, parties/actors involved, current status, key facts, and any attribution. Aim for 20-30 high-value events total across all domains.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                domain: { type: "string" },
                severity: { type: "string" },
                lat: { type: "number" },
                lng: { type: "number" },
                region: { type: "string" },
                source: { type: "string" },
              }
            }
          }
        }
      }
    });

    // Normalize events
    const allEvents = (result?.events || [])
      .filter(e => e.lat && e.lng && Math.abs(e.lat) <= 90 && Math.abs(e.lng) <= 180)
      .map(e => ({
        ...e,
        _layer: e.domain || 'hybrid',
        domain: e.domain || 'hybrid'
      }));

    // Determine global threat level from highest severity mix
    const critCount = allEvents.filter(e => e.severity === 'critical').length;
    const highCount = allEvents.filter(e => e.severity === 'high').length;
    let global_threat_level = 'MODERATE';
    if (critCount >= 5) global_threat_level = 'CRITICAL';
    else if (critCount >= 2) global_threat_level = 'HIGH';
    else if (critCount >= 1 || highCount >= 5) global_threat_level = 'ELEVATED';
    else if (highCount >= 2) global_threat_level = 'MODERATE';
    else global_threat_level = 'LOW';

    return Response.json({
      success: true,
      events: allEvents,
      global_threat_level,
      event_count: allEvents.length,
      layers: {
        physical: allEvents.filter(e => e.domain === 'physical').length,
        geopolitical: allEvents.filter(e => e.domain === 'geopolitical').length,
        hybrid: allEvents.filter(e => e.domain === 'hybrid').length,
        cyber: allEvents.filter(e => e.domain === 'cyber').length,
        influence: allEvents.filter(e => e.domain === 'influence').length,
      },
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});