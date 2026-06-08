import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, server_id, threat_type } = await req.json();

    if (!query) {
      return Response.json({ error: 'query required' }, { status: 400 });
    }

    const queryLower = query.toLowerCase();

    // Search OSINT alerts
    const osintAlerts = await base44.asServiceRole.entities.OsintAlert.filter({}, null, 100);
    const matchedOsint = osintAlerts.filter(alert =>
      alert.title?.toLowerCase().includes(queryLower) ||
      alert.description?.toLowerCase().includes(queryLower) ||
      alert.threat_actors?.some(ta => ta.toLowerCase().includes(queryLower))
    );

    // Search LEA intelligence
    const leaIntel = await base44.asServiceRole.entities.LEAIntelligence.filter({}, null, 100);
    const matchedLea = leaIntel.filter(intel =>
      intel.title?.toLowerCase().includes(queryLower) ||
      intel.description?.toLowerCase().includes(queryLower) ||
      intel.aliases?.some(a => a.toLowerCase().includes(queryLower))
    );

    // Search threat actors
    const threatActors = await base44.asServiceRole.entities.ThreatActor.filter({}, null, 100);
    const matchedActors = threatActors.filter(actor =>
      actor.name?.toLowerCase().includes(queryLower) ||
      actor.aliases?.some(a => a.toLowerCase().includes(queryLower))
    );

    // Get discord messages that reference these threats
    const discordMessages = await base44.asServiceRole.entities.DiscordToastMessage.filter(
      server_id ? { server_id } : {},
      '-posted_at',
      50
    );

    const relatedMessages = discordMessages.filter(msg =>
      matchedOsint.some(o => o.id === msg.threat_id) ||
      matchedLea.some(l => l.id === msg.threat_id) ||
      matchedActors.some(a => a.id === msg.threat_id)
    );

    // Correlate results
    const correlations = await correlateThreats(
      base44,
      [...matchedOsint, ...matchedLea],
      matchedActors
    );

    return Response.json({
      success: true,
      query,
      results: {
        osint_alerts: matchedOsint.length,
        lea_intelligence: matchedLea.length,
        threat_actors: matchedActors.length,
        discord_messages: relatedMessages.length
      },
      osint_matches: matchedOsint.slice(0, 10),
      lea_matches: matchedLea.slice(0, 10),
      actor_matches: matchedActors.slice(0, 10),
      discord_references: relatedMessages.slice(0, 10),
      correlations: correlations.slice(0, 10)
    });
  } catch (error) {
    console.error('Error searching threats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function correlateThreats(base44, threats, actors) {
  const correlations = [];

  for (const threat of threats) {
    for (const actor of actors) {
      // Simple correlation based on threat actor references
      if (threat.threat_actors?.includes(actor.name) || threat.attributed_actor === actor.name) {
        correlations.push({
          threat_id: threat.id,
          threat_title: threat.title || threat.name,
          actor_id: actor.id,
          actor_name: actor.name,
          correlation_type: 'actor_attribution',
          confidence: 0.95
        });
      }
    }
  }

  // Create correlation records
  for (const corr of correlations) {
    try {
      await base44.asServiceRole.entities.CorrelationAnalysis.create({
        siem_alert_id: corr.threat_id,
        correlation_type: corr.correlation_type,
        confidence_score: corr.confidence * 100
      });
    } catch (e) {
      console.error('Error creating correlation:', e);
    }
  }

  return correlations;
}