import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { server_id, threat_id, threat_type, attributes } = await req.json();

    if (!server_id || !threat_id || !threat_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the threat data
    const threat = await base44.asServiceRole.entities[threat_type === 'osint' ? 'OsintAlert' : 'LEAIntelligence'].filter(
      { id: threat_id },
      null,
      1
    );

    if (threat.length === 0) {
      return Response.json({ error: 'Threat not found' }, { status: 404 });
    }

    const threatData = threat[0];

    // Get server
    const servers = await base44.asServiceRole.entities.DiscordThreatServer.filter(
      { id: server_id },
      null,
      1
    );

    if (servers.length === 0) {
      return Response.json({ error: 'Server not found' }, { status: 404 });
    }

    const server = servers[0];

    // Determine target channels based on threat attributes
    const targetChannels = determineTargetChannels(threatData, attributes, server.server_type);

    // Get all channels for this server
    const serverChannels = await base44.asServiceRole.entities.DiscordThreatChannel.filter(
      { server_id },
      null,
      100
    );

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const routed = [];

    // Route threat to appropriate channels
    for (const targetChannelName of targetChannels) {
      const channel = serverChannels.find(ch => ch.channel_name.includes(targetChannelName));

      if (!channel) {
        continue;
      }

      // Format and post message
      const embed = formatThreatEmbed(threatData, threat_type);
      const msgRes = await fetch(
        `https://discord.com/api/v10/channels/${channel.discord_channel_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [embed] })
        }
      );

      if (msgRes.ok) {
        const message = await msgRes.json();
        
        // Log message
        await base44.asServiceRole.entities.DiscordToastMessage.create({
          server_id: server.id,
          channel_id: channel.id,
          discord_message_id: message.id,
          threat_id: threat_id,
          threat_type: threat_type,
          threat_title: threatData.title || threatData.name || 'Unknown',
          severity: threatData.severity || threatData.threat_level || 'medium',
          posted_at: new Date().toISOString()
        });

        routed.push(channel.channel_name);
      }
    }

    return Response.json({
      success: true,
      threat_id,
      channels_routed: routed.length,
      channels: routed,
      message: `Threat routed to ${routed.length} channels`
    });
  } catch (error) {
    console.error('Error organizing threat:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function determineTargetChannels(threat, attributes, serverType) {
  const channels = [];

  // Route to threat actor channels
  if (threat.threat_actors || threat.attributed_actor) {
    channels.push('threat-actors');
    channels.push('actor-activity');
  }

  // Route to sector channels
  if (threat.sectors || threat.affected_sectors) {
    channels.push('sector-trends');
  }

  // Route to vulnerability channels
  if (threat.type === 'vulnerability' || threat.vulnerability_cve) {
    channels.push('vulnerabilities');
    channels.push('regional-vulns');
  }

  // Route to campaign channels
  if (threat.campaign || threat.campaign_name) {
    channels.push('campaigns');
  }

  // Route to alerts for critical
  if (threat.severity === 'critical' || threat.threat_level === 'critical') {
    channels.push('alerts');
    channels.push('critical-alerts');
  }

  // Default to general
  if (channels.length === 0) {
    channels.push('general');
  }

  return [...new Set(channels)]; // Remove duplicates
}

function formatThreatEmbed(threat, threatType) {
  const severityColors = {
    critical: 15158332,
    high: 15105570,
    medium: 15844367,
    low: 3447003
  };

  const severity = threat.severity || threat.threat_level || 'medium';
  const color = severityColors[severity] || severityColors.medium;

  return {
    title: threat.title || threat.name || 'Threat Intelligence',
    description: (threat.description || threat.intel_type || '')?.substring(0, 400),
    color: color,
    fields: [
      {
        name: 'Type',
        value: threatType,
        inline: true
      },
      {
        name: 'Severity',
        value: severity.toUpperCase(),
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'ASOSINT Threat Intelligence'
    }
  };
}