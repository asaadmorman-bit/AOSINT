import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { threat_data, threat_type, user_tier } = await req.json();

    if (!threat_data || !threat_type || !user_tier) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate user has access to threat based on tier
    if (!canAccessThreatByTier(threat_data, threat_type, user_tier)) {
      return Response.json({
        success: false,
        message: `Your ${user_tier} tier does not include access to ${threat_type} threats`
      });
    }

    // Find tier server
    const tierServers = await base44.asServiceRole.entities.DiscordThreatServer.filter({
      organization_id: `tier_${user_tier}`
    }, null, 1);

    if (tierServers.length === 0) {
      return Response.json({
        success: false,
        message: `No Discord server found for ${user_tier} tier`
      });
    }

    const tierServer = tierServers[0];

    // Determine channel by threat type
    const channelType = getChannelByThreatType(threat_type);
    const channels = await base44.asServiceRole.entities.DiscordThreatChannel.filter({
      server_id: tierServer.id,
      channel_type: channelType
    }, null, 1);

    if (channels.length === 0) {
      return Response.json({
        success: false,
        message: `No suitable channel found in ${user_tier} tier server`
      });
    }

    const targetChannel = channels[0];
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');

    // Format and post message
    const message = formatTierThreatMessage(threat_data, threat_type, user_tier);
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

    // Log message
    await base44.asServiceRole.entities.DiscordToastMessage.create({
      server_id: tierServer.id,
      channel_id: targetChannel.id,
      discord_message_id: postedMessage.id,
      threat_id: threat_data.id,
      threat_type: threat_type,
      threat_title: threat_data.title || threat_data.name || 'Unknown Threat',
      severity: threat_data.severity || threat_data.threat_level || 'medium',
      posted_at: new Date().toISOString(),
      tags: ['tier_routed', user_tier]
    });

    return Response.json({
      success: true,
      tier: user_tier,
      channel: targetChannel.channel_name,
      discord_message_id: postedMessage.id
    });
  } catch (error) {
    console.error('Error routing threat to tier server:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function canAccessThreatByTier(threat, threatType, tier) {
  const tierAccess = {
    community: ['threat_actors', 'public_vulns'],
    pro: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware', 'osint_alert'],
    enterprise: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware', 'incidents', 'lea_intel', 'osint_alert', 'lea_intelligence'],
    gov: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware', 'incidents', 'lea_intel', 'crit_infra', 'osint_alert', 'lea_intelligence']
  };

  return tierAccess[tier]?.includes(threatType) || false;
}

function getChannelByThreatType(threatType) {
  const channelMap = {
    threat_actor: 'threat-actors',
    osint_alert: 'critical-alerts',
    lea_intelligence: 'lea-intel',
    vulnerability: 'vulnerabilities',
    campaign: 'campaigns',
    malware: 'malware',
    incident: 'incidents',
    crit_infra: 'critical-infrastructure'
  };
  return channelMap[threatType] || 'critical-alerts';
}

function formatTierThreatMessage(threat, threatType, tier) {
  const severityColors = {
    critical: 15158332,
    high: 15105570,
    medium: 15844367,
    low: 3447003
  };

  const severity = threat.severity || threat.threat_level || 'medium';
  const color = severityColors[severity] || severityColors.medium;

  const embed = {
    title: threat.title || threat.name || 'Threat Intelligence',
    description: threat.description?.substring(0, 500) || 'Threat intel for your subscription tier',
    color: color,
    fields: [
      {
        name: 'Tier',
        value: tier.toUpperCase(),
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
      text: 'ASOSINT Tier-Specific Intel'
    }
  };

  return embed;
}