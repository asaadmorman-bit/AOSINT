import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This can be called from automation (no user context required)
    const threats = await base44.asServiceRole.entities.OsintAlert.filter(
      { severity_level: { $in: ['high', 'critical'] } },
      '-created_date',
      30
    );

    const leaIntel = await base44.asServiceRole.entities.LEAIntelligence.filter(
      { threat_level: { $in: ['high', 'critical'] } },
      '-last_updated',
      30
    );

    const servers = await base44.asServiceRole.entities.DiscordThreatServer.filter(
      { is_active: true },
      null,
      100
    );

    let syncCount = 0;

    for (const server of servers) {
      // Push OSINT alerts
      for (const threat of threats) {
        try {
          await base44.asServiceRole.functions.invoke('pushThreatToDiscord', {
            server_id: server.id,
            threat_data: {
              id: threat.id,
              title: threat.title,
              description: threat.description,
              severity: threat.severity_level,
              entity_type: threat.entity_type
            },
            threat_type: 'osint_alert'
          });
          syncCount++;
        } catch (e) {
          console.error(`Failed to push threat to ${server.name}:`, e);
        }
      }

      // Push LEA intelligence
      for (const intel of leaIntel) {
        try {
          await base44.asServiceRole.functions.invoke('pushThreatToDiscord', {
            server_id: server.id,
            threat_data: {
              id: intel.id,
              title: intel.title,
              description: intel.description,
              severity: intel.threat_level,
              entity_name: intel.entity_name
            },
            threat_type: 'lea_intelligence'
          });
          syncCount++;
        } catch (e) {
          console.error(`Failed to push LEA intel to ${server.name}:`, e);
        }
      }
    }

    return Response.json({
      success: true,
      servers_synced: servers.length,
      threats_pushed: syncCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in threat intel sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});