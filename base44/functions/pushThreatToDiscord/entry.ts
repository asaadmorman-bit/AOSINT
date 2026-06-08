import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { server_id, threat_data, threat_type } = await req.json();

    if (!server_id || !threat_data || !threat_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get server details
    const server = await base44.entities.DiscordThreatServer.get(server_id);
    if (!server) {
      return Response.json({ error: 'Server not found' }, { status: 404 });
    }

    // Determine which channel to post to
    let targetChannelId = null;
    const channels = await base44.entities.DiscordThreatChannel.filter({
      server_id: server_id,
      channel_type: getThreatChannelType(threat_type)
    });

    if (channels.length > 0) {
      targetChannelId = channels[0].discord_channel_id;
    } else {
      // Fall back to overview channel
      const overviewChannels = await base44.entities.DiscordThreatChannel.filter({
        server_id: server_id,
        channel_type: 'custom'
      });
      if (overviewChannels.length > 0) {
        targetChannelId = overviewChannels[0].discord_channel_id;
      }
    }

    if (!targetChannelId) {
      return Response.json({ error: 'No suitable channel found' }, { status: 400 });
    }

    // Get Discord token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');

    // Format message
    const message = formatThreatMessage(threat_data, threat_type);

    // Post to Discord
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${targetChannelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [message] })
      }
    );

    if (!discordRes.ok) {
      const error = await discordRes.text();
      console.error('Discord API error:', error);
      throw new Error(`Failed to post to Discord: ${discordRes.statusText}`);
    }

    const postedMessage = await discordRes.json();

    // Log the message
    const logEntry = await base44.entities.DiscordToastMessage.create({
      server_id: server_id,
      channel_id: channels[0]?.id || null,
      discord_message_id: postedMessage.id,
      threat_id: threat_data.id,
      threat_type: threat_type,
      threat_title: threat_data.title || threat_data.name || 'Unknown Threat',
      severity: threat_data.severity || threat_data.threat_level || 'medium',
      posted_at: new Date().toISOString(),
      tags: ['auto_posted']
    });

    return Response.json({
      success: true,
      discord_message_id: postedMessage.id,
      server_name: server.name,
      message: `Threat posted to Discord server '${server.name}'`
    });
  } catch (error) {
    console.error('Error pushing threat to Discord:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getThreatChannelType(threatType) {
  const typeMap = {
    osint_alert: 'incident',
    threat_actor: 'threat_actor',
    lea_intelligence: 'threat_actor',
    vulnerability: 'vulnerability',
    campaign: 'campaign',
    malware: 'malware_family'
  };
  return typeMap[threatType] || 'custom';
}

function formatThreatMessage(threat, threatType) {
  const severityColors = {
    critical: 15158332,
    high: 15105570,
    medium: 15844367,
    low: 3447003
  };

  const severity = threat.severity || threat.threat_level || 'medium';
  const color = severityColors[severity] || severityColors.medium;

  const embed = {
    title: threat.title || threat.name || 'Threat Intelligence Update',
    description: threat.description?.substring(0, 500) || 'New threat detected',
    color: color,
    fields: [
      {
        name: 'Type',
        value: threatType.replace(/_/g, ' '),
        inline: true
      },
      {
        name: 'Severity',
        value: severity.toUpperCase(),
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };

  if (threat.threat_level || threat.threat_severity) {
    embed.fields.push({
      name: 'Threat Level',
      value: threat.threat_level || threat.threat_severity,
      inline: true
    });
  }

  if (threat.organization || threat.lead_company) {
    embed.fields.push({
      name: 'Target',
      value: threat.organization || threat.lead_company,
      inline: true
    });
  }

  return embed;
}