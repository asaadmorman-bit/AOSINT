import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active government/multi-agency feed channels with auto-push enabled
    const feedChannels = await base44.entities.FeedChannel.filter({
      category: "gov",
      is_active: true,
      auto_push_enabled: true
    });

    if (!feedChannels || feedChannels.length === 0) {
      return Response.json({ message: 'No active multi-agency feeds found' }, { status: 200 });
    }

    // Get Discord servers to push to
    const discordServers = await base44.asServiceRole.entities.DiscordThreatServer.filter({
      is_active: true
    });

    if (!discordServers || discordServers.length === 0) {
      return Response.json({ message: 'No active Discord servers configured' }, { status: 200 });
    }

    const results = [];

    // For each feed channel, fetch recent messages and push to Discord
    for (const channel of feedChannels) {
      const messages = await base44.entities.FeedMessage.filter({
        channel_slug: channel.slug
      }, '-created_date', 50);

      if (!messages || messages.length === 0) continue;

      // Filter by severity
      const filteredMessages = messages.filter(msg => 
        !channel.push_severity_filter || 
        channel.push_severity_filter.length === 0 ||
        channel.push_severity_filter.includes(msg.severity)
      );

      for (const server of discordServers) {
        for (const message of filteredMessages) {
          // Create Discord message embed
          const embed = {
            title: `[${channel.name}] ${message.content.substring(0, 100)}`,
            description: message.content.substring(0, 2000),
            color: getSeverityColor(message.severity),
            fields: [
              { name: 'Channel', value: channel.name, inline: true },
              { name: 'Severity', value: message.severity?.toUpperCase() || 'INFO', inline: true },
              { name: 'Type', value: message.message_type || 'message', inline: true }
            ],
            timestamp: new Date().toISOString()
          };

          // Create sync record
          await base44.asServiceRole.entities.DiscordToastMessage.create({
            server_id: server.id,
            channel_id: server.primary_channel_id,
            threat_type: 'government_intel',
            threat_title: channel.name,
            severity: message.severity || 'info',
            dashboard_synced: false
          });

          results.push({
            feed: channel.slug,
            server: server.id,
            messageCount: 1,
            severity: message.severity
          });
        }
      }
    }

    return Response.json({
      success: true,
      feedChannelsActivated: feedChannels.length,
      serversConnected: discordServers.length,
      messagesProcessed: results.length,
      details: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getSeverityColor(severity) {
  const colors = {
    'critical': 16711680, // Red
    'high': 16740352, // Dark Red
    'medium': 16776960, // Yellow
    'low': 65280, // Green
    'info': 3447003 // Blue
  };
  return colors[severity] || 3447003;
}