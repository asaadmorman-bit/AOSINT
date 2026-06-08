import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent OSINT alerts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const alerts = await base44.asServiceRole.entities.OsintAlert.list('-created_date', 100);

    if (!alerts || alerts.length === 0) {
      return Response.json({
        success: true,
        message: 'No alerts to summarize'
      });
    }

    // Get Discord servers
    const servers = await base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 50);

    if (!servers || servers.length === 0) {
      return Response.json({
        success: true,
        message: 'No Discord servers configured'
      });
    }

    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!discordBotToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Group alerts by severity
    const summary = summarizeAlerts(alerts);

    // Push summaries to servers
    const pushResults = [];
    for (const server of servers) {
      const result = await pushSummaryToServer(
        discordBotToken,
        server.discord_server_id,
        summary,
        alerts.length
      );
      pushResults.push({
        server_id: server.id,
        success: result.success
      });
    }

    return Response.json({
      success: true,
      total_alerts: alerts.length,
      summary,
      pushed_to_servers: pushResults.length
    });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});

function summarizeAlerts(alerts) {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    by_type: {},
    by_actor: {},
    by_sector: {}
  };

  for (const alert of alerts) {
    const severity = (alert.severity || 'info').toLowerCase();
    summary[severity]++;

    // Count by type
    if (alert.alert_type) {
      summary.by_type[alert.alert_type] = (summary.by_type[alert.alert_type] || 0) + 1;
    }

    // Count by threat actor
    if (alert.threat_actor_name) {
      const actor = alert.threat_actor_name;
      summary.by_actor[actor] = (summary.by_actor[actor] || 0) + 1;
    }

    // Count by sector
    if (alert.target_sector) {
      const sector = alert.target_sector;
      summary.by_sector[sector] = (summary.by_sector[sector] || 0) + 1;
    }
  }

  return summary;
}

async function pushSummaryToServer(botToken, serverId, summary, totalAlerts) {
  try {
    // Find a summary or alerts channel
    const channelsResp = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    if (!channelsResp.ok) {
      return { success: false, error: 'Failed to fetch channels' };
    }

    const channels = await channelsResp.json();
    let targetChannel = null;

    // Look for summary or alerts channel
    for (const channel of channels) {
      if (channel.type !== 0) continue;
      if (channel.name.includes('summary') || 
          (channel.name.includes('alerts') && channel.name.includes('general'))) {
        targetChannel = channel;
        break;
      }
    }

    // Fallback to first text channel
    if (!targetChannel) {
      targetChannel = channels.find(c => c.type === 0);
    }

    if (!targetChannel) {
      return { success: false, error: 'No suitable channel found' };
    }

    const embed = {
      title: '📊 OSINT Alert Summary (Last Hour)',
      color: 0x0066FF,
      fields: [
        {
          name: 'Total Alerts',
          value: totalAlerts.toString(),
          inline: true
        },
        {
          name: '🔴 Critical',
          value: summary.critical.toString(),
          inline: true
        },
        {
          name: '🟠 High',
          value: summary.high.toString(),
          inline: true
        },
        {
          name: '🟡 Medium',
          value: summary.medium.toString(),
          inline: true
        },
        {
          name: '🔵 Low',
          value: summary.low.toString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Add top threat actors
    const topActors = Object.entries(summary.by_actor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topActors.length > 0) {
      embed.fields.push({
        name: 'Top Threat Actors',
        value: topActors.map(([actor, count]) => `${actor} (${count})`).join('\n'),
        inline: false
      });
    }

    // Add top sectors
    const topSectors = Object.entries(summary.by_sector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topSectors.length > 0) {
      embed.fields.push({
        name: 'Most Targeted Sectors',
        value: topSectors.map(([sector, count]) => `${sector} (${count})`).join('\n'),
        inline: false
      });
    }

    const msgResp = await fetch(
      `https://discord.com/api/v10/channels/${targetChannel.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
      }
    );

    return {
      success: msgResp.ok,
      channel_id: targetChannel.id
    };
  } catch (error) {
    console.error('Error pushing summary:', error);
    return { success: false, error: error.message };
  }
}