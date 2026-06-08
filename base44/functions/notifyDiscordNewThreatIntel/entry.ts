import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends Discord notification when new threat intel is created
 * Triggered by entity automations on create events
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const { event, data } = body;
    
    if (!event || !data) {
      return Response.json({ error: 'Missing event or data' }, { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Get the channel ID - use intel-feeds for threat intel, osint-feed for OSINT
    let channelId = null;
    let channelName = 'intel-feeds';
    
    // Determine channel based on entity type
    if (event.entity_name === 'OsintAlert' || event.entity_name === 'OsintEntity') {
      channelName = 'osint-feed';
    } else if (event.entity_name === 'ThreatIndicator' || event.entity_name === 'Campaign') {
      channelName = 'intel-feed';
    }

    // Try to find channel from FeedChannel entity
    try {
      const channels = await base44.entities.FeedChannel.filter({ slug: channelName });
      if (channels.length > 0) {
        const discordChannelData = channels[0].discord_channel_id;
        if (discordChannelData) channelId = discordChannelData;
      }
    } catch (e) {
      console.error('Failed to fetch channel from DB:', e.message);
    }

    // If no channel found in DB, try to find it by name
    if (!channelId) {
      try {
        // Get bot's guilds to search for channel
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (guildsRes.ok) {
          const guilds = await guildsRes.json();
          
          for (const guild of guilds.slice(0, 1)) {
            const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
              headers: { 'Authorization': `Bot ${botToken}` },
            });

            if (channelsRes.ok) {
              const channels = await channelsRes.json();
              const found = channels.find(ch => ch.name === channelName && ch.type === 0);
              if (found) {
                channelId = found.id;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to find Discord channel:', e.message);
      }
    }

    if (!channelId) {
      return Response.json({ 
        success: false,
        warning: `Discord channel #${channelName} not configured. Create it to enable notifications.`
      });
    }

    // Build embed based on entity type
    let embed = null;

    if (event.entity_name === 'OsintAlert') {
      embed = {
        title: '🚨 New OSINT Alert',
        color: 15158332,
        fields: [
          { name: 'Title', value: data.title || 'N/A', inline: false },
          { name: 'Type', value: data.alert_type || 'N/A', inline: true },
          { name: 'Severity', value: (data.severity || 'medium').toUpperCase(), inline: true },
          { name: 'Confidence', value: `${data.confidence_score || 0}%`, inline: true },
          { name: 'Status', value: data.status || 'new', inline: true },
          { name: 'Description', value: data.description ? data.description.substring(0, 200) : 'N/A', inline: false },
        ],
        timestamp: new Date().toISOString(),
      };
    } else if (event.entity_name === 'ThreatIndicator') {
      embed = {
        title: '🔍 New Threat Indicator',
        color: 16776960,
        fields: [
          { name: 'Title', value: data.title || 'N/A', inline: false },
          { name: 'Type', value: data.indicator_type || 'N/A', inline: true },
          { name: 'Value', value: data.value ? data.value.substring(0, 60) : 'N/A', inline: true },
          { name: 'Severity', value: (data.severity || 'medium').toUpperCase(), inline: true },
          { name: 'Confidence', value: `${data.confidence || 0}%`, inline: true },
          { name: 'Status', value: data.status || 'active', inline: true },
          { name: 'Feed', value: data.feed_name || 'Unknown', inline: true },
        ],
        timestamp: new Date().toISOString(),
      };
    } else if (event.entity_name === 'Campaign') {
      embed = {
        title: '📊 New Campaign',
        color: 65280,
        fields: [
          { name: 'Name', value: data.name || 'N/A', inline: false },
          { name: 'Type', value: data.campaign_type || 'N/A', inline: true },
          { name: 'Status', value: data.status || 'active', inline: true },
          { name: 'Targets', value: data.target_sectors ? data.target_sectors.slice(0, 2).join(', ') : 'N/A', inline: true },
          { name: 'Regions', value: data.target_regions ? data.target_regions.slice(0, 2).join(', ') : 'N/A', inline: true },
          { name: 'Description', value: data.description ? data.description.substring(0, 200) : 'N/A', inline: false },
        ],
        timestamp: new Date().toISOString(),
      };
    } else if (event.entity_name === 'ThreatActor') {
      embed = {
        title: '👾 New Threat Actor',
        color: 16711680,
        fields: [
          { name: 'Name', value: data.name || 'N/A', inline: false },
          { name: 'Type', value: data.actor_type || 'N/A', inline: true },
          { name: 'Country', value: data.attributed_country || 'N/A', inline: true },
          { name: 'Status', value: data.status || 'active', inline: true },
          { name: 'Target Sectors', value: data.target_sectors ? data.target_sectors.slice(0, 2).join(', ') : 'N/A', inline: true },
          { name: 'Convergence', value: data.convergence_score ? `${data.convergence_score}%` : 'N/A', inline: true },
        ],
        timestamp: new Date().toISOString(),
      };
    }

    if (!embed) {
      return Response.json({ 
        success: false,
        warning: `Unsupported entity type: ${event.entity_name}`
      });
    }

    // Send to Discord
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
          content: '**🔒 New Threat Intelligence**',
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Discord API error:', error);
        return Response.json({ 
          success: false,
          error: `Discord API error: ${res.status}`
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        channel: `#${channelName}`,
        entity: event.entity_name,
        entity_id: event.entity_id,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return Response.json({ 
        success: false,
        error: e.message 
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});