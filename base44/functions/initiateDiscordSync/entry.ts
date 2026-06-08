import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active Discord servers
    const servers = await base44.entities.DiscordThreatServer.filter({
      is_active: true
    }, '-last_threat_update', 100);

    if (servers.length === 0) {
      return Response.json({
        success: true,
        message: 'No active Discord servers to sync',
        threats_pushed: 0
      });
    }

    let totalThreatsPushed = 0;
    const syncResults = [];

    // Get recent threats from all sources
    const recentThreats = await base44.entities.OsintAlert.filter(
      {},
      '-created_date',
      50
    );

    for (const server of servers) {
      for (const threat of recentThreats) {
        try {
          // Push threat to Discord
          const pushResponse = await base44.functions.invoke('pushThreatToDiscord', {
            server_id: server.id,
            threat_data: {
              id: threat.id,
              title: threat.title,
              description: threat.description,
              severity: threat.severity_level,
              type: threat.entity_type
            },
            threat_type: 'osint_alert'
          });

          if (pushResponse.data.success) {
            totalThreatsPushed++;
            
            // Sync to dashboards
            await base44.functions.invoke('syncDiscordToDefaultDashboards', {
              message_id: pushResponse.data.discord_message_id,
              threat_data: {
                id: threat.id,
                title: threat.title,
                severity: threat.severity_level,
                type: 'osint_alert'
              },
              threat_type: 'osint_alert'
            });
          }
        } catch (e) {
          console.error(`Error pushing threat ${threat.id} to server ${server.id}:`, e);
        }
      }

      // Update server last threat update
      await base44.entities.DiscordThreatServer.update(server.id, {
        last_threat_update: new Date().toISOString()
      });

      syncResults.push({
        server_name: server.name,
        threats_synced: recentThreats.length
      });
    }

    return Response.json({
      success: true,
      message: 'Discord sync initiated',
      servers_synced: servers.length,
      threats_pushed: totalThreatsPushed,
      sync_results: syncResults
    });
  } catch (error) {
    console.error('Error initiating Discord sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});