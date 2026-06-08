import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threat_id, threat_type, severity, channel_id, server_id } = await req.json();

    if (!threat_id || !threat_type || !channel_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch threat details
    const threatEntity = threat_type === 'osint' ? 'OsintAlert' : 'LEAIntelligence';
    const threats = await base44.asServiceRole.entities[threatEntity].filter(
      { id: threat_id },
      null,
      1
    );

    if (threats.length === 0) {
      return Response.json({ error: 'Threat not found' }, { status: 404 });
    }

    const threat = threats[0];
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Format alert embed
    const embed = formatThreatAlertEmbed(threat, threat_type, severity);

    // Send to Discord channel
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `🚨 **THREAT ALERT** - ${severity.toUpperCase()}`,
          embeds: [embed],
          components: [{
            type: 1,
            components: [
              {
                type: 2,
                label: 'Enrich Threat',
                style: 1,
                custom_id: `enrich_${threat_id}`
              },
              {
                type: 2,
                label: 'Search Related',
                style: 1,
                custom_id: `search_${threat_id}`
              }
            ]
          }]
        })
      }
    );

    if (!discordRes.ok) {
      throw new Error(`Discord API error: ${discordRes.statusText}`);
    }

    const message = await discordRes.json();

    // Log the alert
    if (server_id) {
      await base44.asServiceRole.entities.DiscordToastMessage.create({
        server_id,
        channel_id,
        discord_message_id: message.id,
        threat_id,
        threat_type,
        threat_title: threat.title || threat.name || 'Unknown Threat',
        severity: severity || 'medium',
        posted_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      message_id: message.id,
      threat_title: threat.title || threat.name,
      severity
    });
  } catch (error) {
    console.error('Error sending threat alert:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatThreatAlertEmbed(threat, threatType, severity) {
  const severityColors = {
    critical: 15158332,
    high: 15105570,
    medium: 15844367,
    low: 3447003
  };

  const severityEmojis = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  const color = severityColors[severity] || severityColors.medium;
  const emoji = severityEmojis[severity] || '⚠️';

  const fields = [
    {
      name: 'Type',
      value: threatType === 'osint' ? 'OSINT Alert' : 'LEA Intelligence',
      inline: true
    },
    {
      name: 'Severity',
      value: `${emoji} ${(severity || 'unknown').toUpperCase()}`,
      inline: true
    }
  ];

  if (threat.threat_actors && threat.threat_actors.length > 0) {
    fields.push({
      name: 'Threat Actors',
      value: threat.threat_actors.slice(0, 3).join(', '),
      inline: true
    });
  }

  if (threat.sectors && threat.sectors.length > 0) {
    fields.push({
      name: 'Sectors',
      value: threat.sectors.slice(0, 3).join(', '),
      inline: true
    });
  }

  return {
    title: threat.title || threat.name || 'Threat Alert',
    description: (threat.description || threat.summary || '')?.substring(0, 300),
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'ASOSINT Real-time Threat Alert'
    }
  };
}