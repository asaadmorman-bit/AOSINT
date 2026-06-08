import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Handle entity automation payload
    const alert_data = payload.data || payload;
    const alert_id = payload.event?.entity_id || payload.id;

    if (!alert_id || !alert_data) {
      return Response.json({ error: 'No alert data found' }, { status: 400 });
    }

    // Get Discord servers
    const servers = await base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 50);

    if (!servers || servers.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No Discord servers configured',
        alert_id
      });
    }

    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!discordBotToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Determine routing based on alert properties
    const routingKey = determineRoutingKey(alert_data);
    
    const pushResults = [];

    for (const server of servers) {
      // Find matching channels in this server
      const matchingChannels = await findMatchingChannels(
        discordBotToken,
        server.discord_server_id,
        routingKey,
        alert_data
      );

      // Push alert to each matching channel
      for (const channel of matchingChannels) {
        const message = formatAlertMessage(alert_data);
        const pushResult = await pushToChannel(
          discordBotToken,
          channel.id,
          message
        );
        pushResults.push({
          server_id: server.id,
          channel_id: channel.id,
          success: pushResult.success
        });
      }
    }

    return Response.json({
      success: true,
      alert_id,
      pushed_to_channels: pushResults.length,
      results: pushResults
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

function determineRoutingKey(alertData) {
  const keys = [];
  
  if (alertData.severity) {
    keys.push(`severity-${alertData.severity.toLowerCase()}`);
  }
  
  if (alertData.alert_type) {
    keys.push(alertData.alert_type.toLowerCase());
  }
  
  // Add threat actor if present
  if (alertData.threat_actor_name) {
    keys.push(`actor-${alertData.threat_actor_name.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  // Add sector if present
  if (alertData.target_sector) {
    keys.push(`sector-${alertData.target_sector.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  // Add region if present
  if (alertData.target_region) {
    keys.push(`region-${alertData.target_region.toLowerCase().replace(/\s+/g, '-')}`);
  }

  return keys;
}

async function findMatchingChannels(botToken, serverId, routingKeys, alertData) {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    if (!response.ok) {
      console.error('Failed to fetch channels:', response.status);
      return [];
    }

    const channels = await response.json();
    const matching = [];

    for (const channel of channels) {
      if (channel.type !== 0) continue; // Only text channels
      
      const channelName = channel.name.toLowerCase();
      
      // Match by routing keys
      for (const key of routingKeys) {
        if (channelName.includes(key)) {
          matching.push(channel);
          break;
        }
      }
      
      // Fallback to general alert channels
      if (matching.length === 0 && 
          (channelName.includes('alerts') || channelName.includes('intelligence'))) {
        matching.push(channel);
      }
    }

    return [...new Map(matching.map(c => [c.id, c])).values()]; // Deduplicate
  } catch (error) {
    console.error('Error finding channels:', error);
    return [];
  }
}

// Source attribution map by alert/indicator type
const SOURCE_ATTRIBUTION = {
  credential_leak:      { name: 'HaveIBeenPwned / ASOSINT Breach Monitor', url: 'https://haveibeenpwned.com/' },
  domain_compromise:    { name: 'CISA KEV / ASOSINT Domain Intel', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
  ip_reputation:        { name: 'AbuseIPDB / AlienVault OTX', url: 'https://www.abuseipdb.com/' },
  threat_actor_mention: { name: 'MITRE ATT&CK / ASOSINT TI', url: 'https://attack.mitre.org/groups/' },
  correlation_cluster:  { name: 'ASOSINT Correlation Engine', url: 'https://www.cisa.gov/' },
  repeated_breach:      { name: 'ASOSINT Breach Tracker', url: 'https://haveibeenpwned.com/' },
  suspicious_activity:  { name: 'ASOSINT Behavioral Analytics', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories' },
  new_indicator:        { name: 'AlienVault OTX / MISP Community', url: 'https://otx.alienvault.com/' },
  vulnerability:        { name: 'NIST NVD / CISA KEV', url: 'https://nvd.nist.gov/vuln/search' },
  threat_actor:         { name: 'MITRE ATT&CK / ASOSINT TI', url: 'https://attack.mitre.org/groups/' },
  osint_alert:          { name: 'ASOSINT OSINT Monitor', url: 'https://otx.alienvault.com/' },
  vendor_advisory:      { name: 'Vendor / CISA Advisories', url: 'https://www.cisa.gov/news-events/cybersecurity-advisories' },
  threat_indicator:     { name: 'AlienVault OTX / ASOSINT TI', url: 'https://otx.alienvault.com/' },
};

const SEVERITY_EMOJI = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: '🔵', informational: '🔵' };
const SEVERITY_COLORS = { critical: 0xFF4757, high: 0xFF6B35, medium: 0xFFCC00, low: 0x2ED573, info: 0x00D4FF, informational: 0x00D4FF };

function formatAlertMessage(alertData) {
  const severity = (alertData.severity || 'medium').toLowerCase();
  const alertType = alertData.alert_type || alertData.indicator_type || 'osint_alert';
  const source = SOURCE_ATTRIBUTION[alertType] || { name: 'ASOSINT Intelligence Platform', url: 'https://www.cisa.gov/' };
  const sevEmoji = SEVERITY_EMOJI[severity] || '⚠️';

  // Full description — no truncation except Discord's 4096 limit
  const description = alertData.description
    ? (alertData.description.length > 4000 ? alertData.description.slice(0, 3997) + '...' : alertData.description)
    : `Threat intelligence alert from ASOSINT monitoring. Type: **${alertType.replace(/_/g, ' ').toUpperCase()}**. Review immediately.`;

  // Recommended actions as numbered list
  const actionsText = alertData.recommended_actions?.length
    ? alertData.recommended_actions.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join('\n')
    : null;

  // Tags
  const tagsText = alertData.tags?.length
    ? alertData.tags.slice(0, 8).join(' · ')
    : null;

  // Evidence / source URL
  const evidenceUrl = alertData.evidence_url || alertData.source_url || source.url;

  const embed = {
    title: `${sevEmoji} ${(alertData.title || alertData.alert_type || 'OSINT Alert').slice(0, 250)}`,
    description,
    url: evidenceUrl,
    color: SEVERITY_COLORS[severity] || 0x808080,
    author: {
      name: source.name,
      url: source.url,
    },
    fields: [
      { name: '⚠️ Severity', value: severity.toUpperCase(), inline: true },
      { name: '🔍 Type', value: alertType.replace(/_/g, ' ').toUpperCase(), inline: true },
      { name: '📊 Status', value: (alertData.status || 'new').toUpperCase(), inline: true },
      ...(alertData.threat_actor_name ? [{ name: '👾 Threat Actor', value: alertData.threat_actor_name, inline: true }] : []),
      ...(alertData.target_sector ? [{ name: '🏭 Target Sector', value: alertData.target_sector, inline: true }] : []),
      ...(alertData.target_region ? [{ name: '🌍 Target Region', value: alertData.target_region, inline: true }] : []),
      ...(alertData.confidence_score != null ? [{ name: '🎯 Confidence', value: `${Math.round((alertData.confidence_score <= 1 ? alertData.confidence_score * 100 : alertData.confidence_score))}%`, inline: true }] : []),
      ...(alertData.indicator_value ? [{ name: '🔎 Indicator', value: `\`${alertData.indicator_value}\``, inline: false }] : []),
      ...(tagsText ? [{ name: '🏷️ Tags', value: tagsText, inline: false }] : []),
      ...(actionsText ? [{ name: '✅ Recommended Actions', value: actionsText, inline: false }] : []),
      {
        name: '🔗 Sources & References',
        value: [
          `[${source.name}](${source.url})`,
          `[CISA Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)`,
          `[MITRE ATT&CK](https://attack.mitre.org/)`,
          `[AlienVault OTX](https://otx.alienvault.com/)`,
          ...(evidenceUrl !== source.url ? [`[Evidence Link](${evidenceUrl})`] : []),
        ].join(' · '),
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: `ASOSINT Intelligence Platform · Source: ${source.name} · Powered by Emerging Defense Solutions` },
  };

  const isCritical = severity === 'critical' || severity === 'high';
  return {
    content: isCritical ? `🚨 **${severity.toUpperCase()} ALERT** — Immediate review required` : undefined,
    embeds: [embed],
    allowed_mentions: { parse: [] },
  };
}

async function pushToChannel(botToken, channelId, message) {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      }
    );

    return {
      success: response.ok,
      status: response.status
    };
  } catch (error) {
    console.error('Error pushing to channel:', error);
    return { success: false, error: error.message };
  }
}