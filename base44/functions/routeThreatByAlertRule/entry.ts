import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threat_id, threat_type } = await req.json();

    if (!threat_id || !threat_type) {
      return Response.json({ error: 'Missing threat_id or threat_type' }, { status: 400 });
    }

    // Fetch the threat
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

    // Get all enabled alert rules
    const rules = await base44.asServiceRole.entities.AlertRule.filter(
      { enabled: true, rule_type: 'discord_alert' },
      null,
      100
    );

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const routedChannels = [];

    // Check each rule and route if threat matches
    for (const rule of rules) {
      const filters = JSON.parse(rule.filters || '{}');

      if (matchesThreat(threat, filters)) {
        // Send alert to target channel
        const embed = formatThreatEmbed(threat, threat_type);
        const discordRes = await fetch(
          `https://discord.com/api/v10/channels/${rule.target_channel_id}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: `⚠️ Alert triggered by rule: **${rule.name}**`,
              embeds: [embed]
            })
          }
        );

        if (discordRes.ok) {
          routedChannels.push({
            rule_name: rule.name,
            channel_id: rule.target_channel_id
          });
        }
      }
    }

    return Response.json({
      success: true,
      threat_id,
      rules_matched: routedChannels.length,
      routed_channels: routedChannels,
      message: `Threat routed to ${routedChannels.length} Discord channels based on alert rules`
    });
  } catch (error) {
    console.error('Error routing threat:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function matchesThreat(threat, filters) {
  // Check threat actors
  if (filters.threat_actors?.length > 0) {
    const hasMatchingActor = (threat.threat_actors || []).some(actor =>
      filters.threat_actors.includes(actor)
    );
    if (!hasMatchingActor) return false;
  }

  // Check sectors
  if (filters.sectors?.length > 0) {
    const hasMatchingSector = (threat.sectors || []).some(sector =>
      filters.sectors.includes(sector)
    );
    if (!hasMatchingSector) return false;
  }

  // Check severity
  if (filters.severities?.length > 0) {
    const threatSeverity = threat.severity || threat.threat_level || 'medium';
    if (!filters.severities.includes(threatSeverity)) return false;
  }

  // Check geographic
  if (filters.geographic?.length > 0) {
    const hasMatchingGeo = (threat.geographic_focus || threat.targets || []).some(geo =>
      filters.geographic.includes(geo)
    );
    if (!hasMatchingGeo) return false;
  }

  return true;
}

function formatThreatEmbed(threat, threatType) {
  const severityColors = {
    critical: 15158332,
    high: 15105570,
    medium: 15844367,
    low: 3447003
  };

  const severity = threat.severity || threat.threat_level || 'medium';

  return {
    title: threat.title || threat.name || 'Threat Alert',
    description: (threat.description || threat.summary || '')?.substring(0, 300),
    color: severityColors[severity],
    fields: [
      { name: 'Type', value: threatType === 'osint' ? 'OSINT' : 'LEA Intelligence', inline: true },
      { name: 'Severity', value: severity.toUpperCase(), inline: true }
    ],
    timestamp: new Date().toISOString()
  };
}