import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threat_data, threat_type, target_organization } = await req.json();

    if (!threat_data || !threat_type || !target_organization) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find organization sub-server
    const orgServers = await base44.entities.DiscordThreatServer.filter({
      organization_name: target_organization
    }, null, 10);

    if (orgServers.length === 0) {
      return Response.json({
        success: false,
        message: `No Discord server found for organization: ${target_organization}`
      });
    }

    const orgServer = orgServers[0];

    // Determine which channel by severity
    const severity = threat_data.severity || threat_data.threat_level || 'medium';
    const channelType = getChannelBySeverity(severity);

    const channels = await base44.entities.DiscordThreatChannel.filter({
      server_id: orgServer.id,
      channel_type: channelType
    }, null, 1);

    if (channels.length === 0) {
      return Response.json({
        success: false,
        message: `No severity channel found for ${severity} in ${target_organization} server`
      });
    }

    const targetChannel = channels[0];
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');

    // Post to Discord
    const message = formatOrgThreatMessage(threat_data, threat_type, target_organization);
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${targetChannel.discord_channel_id}/messages`,
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
      throw new Error(`Failed to post to Discord: ${discordRes.statusText}`);
    }

    const postedMessage = await discordRes.json();

    // Log the message
    await base44.entities.DiscordToastMessage.create({
      server_id: orgServer.id,
      channel_id: targetChannel.id,
      discord_message_id: postedMessage.id,
      threat_id: threat_data.id,
      threat_type: threat_type,
      threat_title: threat_data.title || threat_data.name || 'Unknown Threat',
      severity: severity,
      posted_at: new Date().toISOString(),
      tags: ['org_routed']
    });

    return Response.json({
      success: true,
      organization: target_organization,
      channel: targetChannel.channel_name,
      severity: severity,
      discord_message_id: postedMessage.id,
      message: `Threat routed to ${target_organization} org server`
    });
  } catch (error) {
    console.error('Error routing threat to org server:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getChannelBySeverity(severity) {
  const severityMap = {
    critical: 'custom',
    high: 'custom',
    medium: 'custom',
    low: 'custom'
  };
  return severityMap[severity] || 'custom';
}

function formatOrgThreatMessage(threat, threatType, organization) {
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
    description: threat.description?.substring(0, 500) || 'Threat detected relevant to your organization',
    color: color,
    fields: [
      {
        name: 'Organization',
        value: organization,
        inline: true
      },
      {
        name: 'Severity',
        value: severity.toUpperCase(),
        inline: true
      },
      {
        name: 'Type',
        value: threatType.replace(/_/g, ' '),
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Routed from ASOSINT Platform'
    }
  };

  if (threat.affected_organizations || threat.target) {
    embed.fields.push({
      name: 'Affected',
      value: threat.affected_organizations || threat.target,
      inline: false
    });
  }

  return embed;
}