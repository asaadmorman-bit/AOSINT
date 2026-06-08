import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { server_id, dashboard_id, sync_type = 'automatic', threat_filters = {} } = await req.json();

    if (!server_id || !dashboard_id) {
      return Response.json({ error: 'Missing server_id or dashboard_id' }, { status: 400 });
    }

    // Verify server exists
    const server = await base44.entities.DiscordThreatServer.get(server_id);
    if (!server) {
      return Response.json({ error: 'Server not found' }, { status: 404 });
    }

    // Create dashboard sync record
    const syncRecord = await base44.entities.DiscordDashboardSync.create({
      server_id: server_id,
      dashboard_id: dashboard_id,
      sync_type: sync_type,
      threat_filters: threat_filters,
      is_active: true
    });

    // Add dashboard to server's list if not already there
    const dashboards = server.dashboard_ids || [];
    if (!dashboards.includes(dashboard_id)) {
      dashboards.push(dashboard_id);
      await base44.entities.DiscordThreatServer.update(server_id, {
        dashboard_ids: dashboards
      });
    }

    // Trigger initial sync if automatic
    let threatsCount = 0;
    if (sync_type === 'automatic') {
      const channels = await base44.entities.DiscordThreatChannel.filter(
        { server_id: server_id },
        '-last_update',
        100
      );

      // Filter by severity if specified
      let filteredChannels = channels;
      if (threat_filters.severity_levels && threat_filters.severity_levels.length > 0) {
        filteredChannels = channels.filter(ch =>
          threat_filters.severity_levels.includes(ch.severity_level)
        );
      }

      threatsCount = filteredChannels.length;

      // Update sync record with initial count
      await base44.entities.DiscordDashboardSync.update(syncRecord.id, {
        threat_count_synced: threatsCount,
        last_synced: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      sync_id: syncRecord.id,
      server_name: server.name,
      dashboard_id: dashboard_id,
      sync_type: sync_type,
      threats_synced: threatsCount,
      message: `Dashboard sync created for server '${server.name}'`
    });
  } catch (error) {
    console.error('Error creating dashboard sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});