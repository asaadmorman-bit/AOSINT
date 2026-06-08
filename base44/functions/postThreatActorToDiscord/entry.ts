import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Posts new threat actors to Discord #apt-watch channel
 * Triggered when ThreatActor is created
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

    const channelName = 'apt-watch';
    let channelId = null;

    // Try to find channel from database
    try {
      const channels = await base44.entities.FeedChannel.filter({ slug: 'apt-watch' });
      if (channels.length > 0 && channels[0].discord_channel_id) {
        channelId = channels[0].discord_channel_id;
      }
    } catch (e) {
      console.error('Failed to fetch channel from DB:', e.message);
    }

    // If no channel in DB, search Discord servers
    if (!channelId) {
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
    }

    if (!channelId) {
      return Response.json({ 
        success: false,
        warning: `Discord channel #${channelName} not configured. Create it to enable notifications.`
      });
    }

    // Build threat actor embed
    const severityColor = {
      critical: 16711680, // Dark Red
      high: 15158332,     // Red
      medium: 16776960,   // Yellow
      low: 3394815,       // Light Blue
    }[data.severity || 'medium'] || 16776960;

    const embed = {
      title: `👾 ${data.name}`,
      color: severityColor,
      description: data.notes ? data.notes.substring(0, 300) : 'New threat actor profile',
      fields: [
        { name: 'Type', value: (data.actor_type || 'unknown').replace(/_/g, ' ').toUpperCase(), inline: true },
        { name: 'Country', value: data.attributed_country || 'Unknown', inline: true },
        { name: 'Status', value: (data.status || 'unknown').toUpperCase(), inline: true },
        { name: 'Target Sectors', value: data.target_sectors && data.target_sectors.length ? data.target_sectors.slice(0, 3).join(', ') : 'N/A', inline: false },
        { name: 'Target Regions', value: data.target_regions && data.target_regions.length ? data.target_regions.slice(0, 3).join(', ') : 'N/A', inline: false },
        { name: 'Aliases', value: data.aliases && data.aliases.length ? data.aliases.slice(0, 3).join(', ') : 'N/A', inline: false },
        { name: 'Convergence Score', value: data.convergence_score ? `${data.convergence_score}%` : 'N/A', inline: true },
        { name: 'Confidence', value: data.confidence ? `${data.confidence}%` : 'N/A', inline: true },
        { name: 'MITRE Groups', value: data.mitre_groups && data.mitre_groups.length ? data.mitre_groups.slice(0, 2).join(', ') : 'N/A', inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'ASOSINT Threat Actor Watch' },
    };

    // Send to Discord
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '**🔒 New Threat Actor Profile**',
          embeds: [embed],
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
        actor: data.name,
        type: data.actor_type,
        country: data.attributed_country,
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