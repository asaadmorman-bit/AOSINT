import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Syncs threat intelligence data to Discord #intel-feed channel
 * Fetches recent threats and posts them as formatted Discord embeds
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { channel_name = 'intel-feed', server_id, limit = 10 } = body;

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Fetch recent threat data
    const [osintAlerts, indicators, threatActors, campaigns] = await Promise.all([
      base44.entities.OsintAlert.list('-triggered_at', limit).catch(() => []),
      base44.entities.ThreatIndicator.list('-created_date', limit).catch(() => []),
      base44.entities.ThreatActor.list('-last_active', 5).catch(() => []),
      base44.entities.Campaign.list('-last_activity', 5).catch(() => []),
    ]);

    // Find Discord channel by name
    let channelId = null;
    
    // If server_id provided, search within that server
    if (server_id) {
      try {
        const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${server_id}/channels`, {
          headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (channelsRes.ok) {
          const channels = await channelsRes.json();
          const found = channels.find(ch => ch.name === channel_name && ch.type === 0);
          if (found) channelId = found.id;
        }
      } catch (e) {
        return Response.json({ error: 'Failed to fetch Discord channels' }, { status: 500 });
      }
    }

    if (!channelId) {
      return Response.json({ error: `Discord channel #${channel_name} not found` }, { status: 404 });
    }

    // Build Discord embeds
    const embeds = [];

    // OSINT Alerts embed
    if (osintAlerts.length > 0) {
      embeds.push({
        title: '🚨 Recent OSINT Alerts',
        color: 15158332, // Red
        fields: osintAlerts.slice(0, 3).map(a => ({
          name: a.title,
          value: `**Severity:** ${a.severity.toUpperCase()}\n**Type:** ${a.alert_type}\n**Confidence:** ${a.confidence_score}%`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Threat Indicators embed
    if (indicators.length > 0) {
      embeds.push({
        title: '🔍 Top Threat Indicators',
        color: 16776960, // Yellow
        fields: indicators.slice(0, 3).map(i => ({
          name: `${i.indicator_type.toUpperCase()}: ${i.value.substring(0, 40)}`,
          value: `**Severity:** ${i.severity}\n**Confidence:** ${i.confidence}%\n**Status:** ${i.status}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Threat Actors embed
    if (threatActors.length > 0) {
      embeds.push({
        title: '👾 Active Threat Actors',
        color: 16711680, // Dark Red
        fields: threatActors.slice(0, 3).map(a => ({
          name: a.name + (a.aliases?.length ? ` (${a.aliases[0]})` : ''),
          value: `**Type:** ${a.actor_type}\n**Country:** ${a.attributed_country}\n**Convergence:** ${a.convergence_score || 'N/A'}%`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Campaigns embed
    if (campaigns.length > 0) {
      embeds.push({
        title: '📊 Active Campaigns',
        color: 65280, // Green
        fields: campaigns.slice(0, 3).map(c => ({
          name: c.name,
          value: `**Type:** ${c.campaign_type}\n**Status:** ${c.status}\n**Targets:** ${(c.target_sectors || []).slice(0, 2).join(', ') || 'N/A'}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Send embeds to Discord in chunks (max 10 embeds per message)
    let sentCount = 0;
    const embedChunks = [];
    for (let i = 0; i < embeds.length; i += 10) {
      embedChunks.push(embeds.slice(i, i + 10));
    }

    for (const chunk of embedChunks) {
      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            embeds: chunk,
            content: chunk.length > 0 ? '**🔒 ASOSINT Threat Intelligence Sync**' : undefined,
          }),
        });

        if (res.ok) {
          sentCount++;
        } else {
          const error = await res.text();
          console.error('Discord API error:', error);
        }
      } catch (e) {
        console.error('Error sending to Discord:', e.message);
      }
    }

    // Rate limit: add a small delay between chunks
    await new Promise(resolve => setTimeout(resolve, 500));

    return Response.json({
      success: true,
      channel: `#${channel_name}`,
      messages_sent: sentCount,
      summary: {
        osint_alerts: osintAlerts.length,
        indicators: indicators.length,
        threat_actors: threatActors.length,
        campaigns: campaigns.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});