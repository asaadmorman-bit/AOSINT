import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Syncs OSINT alerts to Discord #osint-alerts channel
 * Triggered when OsintAlert is created
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const { event, data } = body;
    
    if (!event || !data) {
      return Response.json({ error: 'Missing event or data' }, { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const channelName = 'osint-alerts';
    let channelId = null;

    // Try to find channel from database
    try {
      const channels = await base44.entities.FeedChannel.filter({ slug: 'osint-alerts' });
      if (channels.length > 0 && channels[0].discord_channel_id) {
        channelId = channels[0].discord_channel_id;
      }
    } catch (e) {
      console.error('Failed to fetch channel from DB:', e.message);
    }

    // If no channel in DB, search Discord servers
    if (!channelId) {
      try {
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (guildsRes.ok) {
          const guilds = await guildsRes.json();
          
          for (const guild of guilds.slice(0, 1)) {
            const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
              headers: { 'Authorization': `Bot ${botToken}` },
            });

            if (channelsRes.ok) {
              const channels = await channelsRes.json();
              const found = channels.find(ch => ch.name === channelName && ch.type === 0);
              if (found) {
                channelId = found.id;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to find Discord channel:', e.message);
      }
    }

    if (!channelId) {
      return Response.json({ 
        success: false,
        warning: `Discord channel #${channelName} not configured.`
      });
    }

    // Severity color mapping
    const severityColor = {
      critical: 16711680, // Dark Red
      high: 15158332,     // Red
      medium: 16776960,   // Yellow
      low: 3394815,       // Light Blue
    }[data.severity || 'medium'] || 16776960;

    const alertTypeEmoji = {
      credential_leak: '🔐',
      domain_compromise: '🌐',
      ip_reputation: '📍',
      threat_actor_mention: '👾',
      correlation_cluster: '🔗',
      repeated_breach: '🔄',
      suspicious_activity: '⚠️',
      new_indicator: '🎯',
    }[data.alert_type] || '⚡';

    // Source attribution — map alert_type to known gov/intel sources
    const sourceAttribution = {
      credential_leak: { name: 'ASOSINT OSINT Monitor', url: 'https://haveibeenpwned.com/' },
      domain_compromise: { name: 'ASOSINT Domain Intelligence', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
      ip_reputation: { name: 'AbuseIPDB / AlienVault OTX', url: 'https://otx.alienvault.com/' },
      threat_actor_mention: { name: 'MITRE ATT&CK / ASOSINT TI', url: 'https://attack.mitre.org/' },
      correlation_cluster: { name: 'ASOSINT Correlation Engine', url: 'https://www.cisa.gov/' },
      repeated_breach: { name: 'ASOSINT Breach Tracker', url: 'https://haveibeenpwned.com/' },
      suspicious_activity: { name: 'ASOSINT Behavioral Analytics', url: 'https://www.cisa.gov/' },
      new_indicator: { name: 'AlienVault OTX / MISP', url: 'https://otx.alienvault.com/' },
    };
    const source = sourceAttribution[data.alert_type] || { name: 'ASOSINT Intelligence Platform', url: 'https://www.cisa.gov/' };

    // Full description — don't truncate
    const fullDescription = data.description
      ? (data.description.length > 4000 ? data.description.slice(0, 3997) + '...' : data.description)
      : `**${(data.alert_type || 'OSINT Alert').replace(/_/g, ' ').toUpperCase()}** detected by ASOSINT monitoring systems.`;

    // Build recommended actions as numbered list
    const actionsText = data.recommended_actions && data.recommended_actions.length
      ? data.recommended_actions.slice(0, 5).map((a, i) => `${i + 1}. ${a}`).join('\n')
      : null;

    // Build OSINT alert embed
    const embed = {
      title: `${alertTypeEmoji} ${data.title}`,
      color: severityColor,
      url: data.evidence_url || source.url,
      description: fullDescription,
      author: {
        name: source.name,
        url: source.url,
      },
      fields: [
        { name: '🚨 Alert Type', value: (data.alert_type || 'unknown').replace(/_/g, ' ').toUpperCase(), inline: true },
        { name: '⚠️ Severity', value: (data.severity || 'medium').toUpperCase(), inline: true },
        { name: '📊 Status', value: (data.status || 'new').toUpperCase(), inline: true },
        { name: '🎯 Confidence', value: data.confidence_score ? `${data.confidence_score}%` : 'N/A', inline: true },
        ...(data.tags && data.tags.length ? [{ name: '🏷️ Tags', value: data.tags.slice(0, 5).join(' · '), inline: true }] : []),
        ...(data.entity_id ? [{ name: '🔗 Entity Ref', value: `ID: \`${data.entity_id}\``, inline: true }] : []),
        ...(actionsText ? [{ name: '✅ Recommended Actions', value: actionsText, inline: false }] : []),
        { name: '🔗 Learn More', value: `[View Source](${source.url}) · [ASOSINT Platform](https://www.asosint.com/) · [CISA Alerts](https://www.cisa.gov/news-events/cybersecurity-advisories)`, inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `ASOSINT Alert Monitor · Source: ${source.name} · Powered by Emerging Defense Solutions` },
    };

    if (data.recommended_actions && data.recommended_actions.length) {
      // Already included above
    }

    // Send to Discord
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.severity === 'critical' || data.severity === 'high' ? '@here 🚨' : undefined,
          embeds: [embed],
          allowed_mentions: { parse: ['roles'] },
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Discord API error:', error);
        return Response.json({ 
          success: false,
          error: `Discord API error: ${res.status}`
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        channel: `#${channelName}`,
        alert_type: data.alert_type,
        severity: data.severity,
        title: data.title,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return Response.json({ 
        success: false,
        error: e.message 
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});