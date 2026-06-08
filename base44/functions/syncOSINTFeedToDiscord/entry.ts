import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Syncs OSINT intelligence data to Discord #osint-feed channel
 * Fetches recent OSINT alerts, entities, investigations and leak intelligence
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { channel_name = 'osint-feed', server_id, limit = 10 } = body;

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Fetch recent OSINT data
    const [osintAlerts, osintEntities, investigations, leakIntel] = await Promise.all([
      base44.entities.OsintAlert.list('-triggered_at', limit).catch(() => []),
      base44.entities.OsintEntity.list('-created_date', limit).catch(() => []),
      base44.entities.OsintInvestigation.list('-created_date', 5).catch(() => []),
      base44.entities.LeakIntelligence.list('-created_date', 5).catch(() => []),
    ]);

    // Find Discord channel by name
    let channelId = null;
    
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
        title: '🚨 OSINT Alerts',
        color: 15158332, // Red
        fields: osintAlerts.slice(0, 3).map(a => ({
          name: a.title,
          value: `**Type:** ${a.alert_type}\n**Severity:** ${a.severity.toUpperCase()}\n**Status:** ${a.status}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // OSINT Entities embed
    if (osintEntities.length > 0) {
      embeds.push({
        title: '🔍 OSINT Entities',
        color: 16776960, // Yellow
        fields: osintEntities.slice(0, 3).map(e => ({
          name: e.name || 'Unknown Entity',
          value: `**Type:** ${e.entity_type || 'N/A'}\n**Risk:** ${e.risk_score ? e.risk_score + '%' : 'N/A'}\n**Source:** ${e.source || 'N/A'}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Investigations embed
    if (investigations.length > 0) {
      embeds.push({
        title: '📋 Investigations',
        color: 3394815, // Light Blue
        fields: investigations.slice(0, 3).map(i => ({
          name: i.investigation_name || 'Unnamed Investigation',
          value: `**Status:** ${i.status || 'N/A'}\n**Scope:** ${i.scope || 'N/A'}\n**Lead:** ${i.lead_analyst || 'Unassigned'}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Leak Intelligence embed
    if (leakIntel.length > 0) {
      embeds.push({
        title: '💧 Leaked Intelligence',
        color: 16711680, // Dark Red
        fields: leakIntel.slice(0, 3).map(l => ({
          name: l.breach_name || 'Unknown Breach',
          value: `**Records:** ${l.records_count || 'Unknown'}\n**Date:** ${l.breach_date ? new Date(l.breach_date).toLocaleDateString() : 'N/A'}\n**Impact:** ${l.impact_level || 'N/A'}`,
          inline: false,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Send embeds to Discord in chunks
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
            content: chunk.length > 0 ? '**🕵️ ASOSINT OSINT Feed Sync**' : undefined,
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

    await new Promise(resolve => setTimeout(resolve, 500));

    return Response.json({
      success: true,
      channel: `#${channel_name}`,
      messages_sent: sentCount,
      summary: {
        osint_alerts: osintAlerts.length,
        osint_entities: osintEntities.length,
        investigations: investigations.length,
        leak_intelligence: leakIntel.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});