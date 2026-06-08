import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Routes ASOSINT alerts to organized Discord channels by type/severity
 * Triggered when OsintAlert, ThreatIndicator, or ThreatActor is created
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

    // Determine channel based on entity type and severity
    let channelName = '';
    
    if (event.entity_name === 'OsintAlert') {
      if (data.severity === 'critical') {
        channelName = 'critical-alerts';
      } else if (data.severity === 'high') {
        channelName = 'high-priority-alerts';
      } else {
        channelName = 'osint-feed';
      }
    } else if (event.entity_name === 'ThreatIndicator') {
      channelName = 'threat-indicators';
    } else if (event.entity_name === 'ThreatActor') {
      channelName = 'apt-watch';
    } else if (event.entity_name === 'Campaign') {
      channelName = 'campaigns';
    } else {
      channelName = 'general-alerts';
    }

    let channelId = null;

    // Find channel from Discord
    try {
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

    if (!channelId) {
      return Response.json({
        success: false,
        warning: `Discord channel #${channelName} not found`,
      });
    }

    // Severity color mapping
    const severityColor = {
      critical: 16711680, // Dark Red
      high: 15158332,     // Red
      medium: 16776960,   // Yellow
      low: 3394815,       // Light Blue
    }[data.severity || 'medium'] || 16776960;

    // Build embed based on entity type
    let embed;
    
    if (event.entity_name === 'OsintAlert') {
      embed = {
        title: `🎯 ${data.title}`,
        color: severityColor,
        description: data.description?.substring(0, 300) || 'OSINT Alert',
        fields: [
          { name: 'Type', value: (data.alert_type || 'unknown').replace(/_/g, ' ').toUpperCase(), inline: true },
          { name: 'Severity', value: (data.severity || 'medium').toUpperCase(), inline: true },
          { name: 'Confidence', value: data.confidence_score ? `${data.confidence_score}%` : 'N/A', inline: true },
          { name: 'Tags', value: data.tags?.length ? data.tags.slice(0, 3).join(', ') : 'N/A', inline: false },
        ],
      };
    } else if (event.entity_name === 'ThreatIndicator') {
      embed = {
        title: `📊 ${data.title}`,
        color: severityColor,
        description: `**${data.value}**`,
        fields: [
          { name: 'Type', value: (data.indicator_type || 'unknown').toUpperCase(), inline: true },
          { name: 'Severity', value: (data.severity || 'medium').toUpperCase(), inline: true },
          { name: 'Confidence', value: data.confidence ? `${data.confidence}%` : 'N/A', inline: true },
          { name: 'Category', value: (data.threat_category || 'unknown').toUpperCase(), inline: true },
          { name: 'Feed', value: data.feed_name || 'Unknown', inline: true },
        ],
      };
    } else if (event.entity_name === 'ThreatActor') {
      embed = {
        title: `👾 ${data.name}`,
        color: severityColor,
        description: data.notes?.substring(0, 300) || 'New threat actor',
        fields: [
          { name: 'Type', value: (data.actor_type || 'unknown').toUpperCase(), inline: true },
          { name: 'Country', value: data.attributed_country || 'Unknown', inline: true },
          { name: 'Status', value: (data.status || 'unknown').toUpperCase(), inline: true },
          { name: 'Target Sectors', value: data.target_sectors?.length ? data.target_sectors.slice(0, 2).join(', ') : 'N/A', inline: false },
        ],
      };
    } else if (event.entity_name === 'Campaign') {
      embed = {
        title: `🎪 ${data.name}`,
        color: severityColor,
        description: data.description?.substring(0, 300) || 'Campaign',
        fields: [
          { name: 'Type', value: (data.campaign_type || 'unknown').toUpperCase(), inline: true },
          { name: 'Status', value: (data.status || 'unknown').toUpperCase(), inline: true },
          { name: 'Target Sectors', value: data.target_sectors?.length ? data.target_sectors.slice(0, 2).join(', ') : 'N/A', inline: false },
        ],
      };
    } else {
      embed = {
        title: `⚡ Alert`,
        color: severityColor,
        description: JSON.stringify(data).substring(0, 300),
      };
    }

    embed.timestamp = new Date().toISOString();
    embed.footer = { text: 'ASOSINT Channel Router' };

    // Send to Discord
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: (data.severity === 'critical' || data.severity === 'high') ? '@here 🚨' : undefined,
          embeds: [embed],
          allowed_mentions: { parse: ['roles'] },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Discord API error:', error);
        return Response.json({
          success: false,
          error: `Discord API error: ${res.status}`,
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        channel: `#${channelName}`,
        entity_type: event.entity_name,
        severity: data.severity,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return Response.json({
        success: false,
        error: e.message,
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});