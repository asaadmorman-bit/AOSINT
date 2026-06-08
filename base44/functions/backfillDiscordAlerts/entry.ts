import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backfills last 30 days of ASOSINT intel to Discord channels
 * One-time function to sync historical data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = {
      osint_alerts: 0,
      threat_indicators: 0,
      threat_actors: 0,
      campaigns: 0,
      total_posted: 0,
      failed: 0,
    };

    const severityColor = {
      critical: 16711680,
      high: 15158332,
      medium: 16776960,
      low: 3394815,
    };

    // Helper to get Discord channel ID
    const getChannelId = async (channelName) => {
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
              if (found) return found.id;
            }
          }
        }
      } catch (e) {
        console.error(`Failed to find channel ${channelName}:`, e.message);
      }
      return null;
    };

    // Helper to post message
    const postToDiscord = async (channelId, embed, ping = false) => {
      if (!channelId) return false;

      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: ping ? '@here 🚨' : undefined,
            embeds: [embed],
            allowed_mentions: { parse: ['roles'] },
          }),
        });

        return res.ok;
      } catch (e) {
        console.error('Discord post failed:', e.message);
        return false;
      }
    };

    // Backfill OSINT Alerts
    try {
      const osintAlerts = await base44.entities.OsintAlert.filter({});
      const filtered = osintAlerts.filter(a => new Date(a.created_date) >= thirtyDaysAgo);

      const channelMap = {
        critical: await getChannelId('critical-alerts'),
        high: await getChannelId('high-priority-alerts'),
        other: await getChannelId('osint-feed'),
      };

      for (const alert of filtered) {
        const channelKey = alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'other';
        const channelId = channelMap[channelKey];

        const embed = {
          title: `🎯 ${alert.title}`,
          color: severityColor[alert.severity] || 16776960,
          description: alert.description?.substring(0, 300) || 'OSINT Alert',
          fields: [
            { name: 'Type', value: (alert.alert_type || 'unknown').replace(/_/g, ' ').toUpperCase(), inline: true },
            { name: 'Severity', value: (alert.severity || 'medium').toUpperCase(), inline: true },
            { name: 'Status', value: (alert.status || 'new').toUpperCase(), inline: true },
          ],
          timestamp: alert.created_date,
          footer: { text: 'ASOSINT Backfill' },
        };

        if (await postToDiscord(channelId, embed, alert.severity === 'critical' || alert.severity === 'high')) {
          stats.osint_alerts++;
          stats.total_posted++;
        } else {
          stats.failed++;
        }
      }
    } catch (e) {
      console.error('OSINT Alerts backfill failed:', e.message);
    }

    // Backfill Threat Indicators
    try {
      const indicators = await base44.entities.ThreatIndicator.filter({});
      const filtered = indicators.filter(i => new Date(i.created_date) >= thirtyDaysAgo);

      const channelId = await getChannelId('threat-indicators');

      for (const indicator of filtered) {
        const embed = {
          title: `📊 ${indicator.title}`,
          color: severityColor[indicator.severity] || 16776960,
          description: `**${indicator.value}**`,
          fields: [
            { name: 'Type', value: (indicator.indicator_type || 'unknown').toUpperCase(), inline: true },
            { name: 'Severity', value: (indicator.severity || 'medium').toUpperCase(), inline: true },
            { name: 'Category', value: (indicator.threat_category || 'unknown').toUpperCase(), inline: true },
          ],
          timestamp: indicator.created_date,
          footer: { text: 'ASOSINT Backfill' },
        };

        if (await postToDiscord(channelId, embed)) {
          stats.threat_indicators++;
          stats.total_posted++;
        } else {
          stats.failed++;
        }
      }
    } catch (e) {
      console.error('Threat Indicators backfill failed:', e.message);
    }

    // Backfill Threat Actors
    try {
      const actors = await base44.entities.ThreatActor.filter({});
      const filtered = actors.filter(a => new Date(a.created_date) >= thirtyDaysAgo);

      const channelId = await getChannelId('apt-watch');

      for (const actor of filtered) {
        const embed = {
          title: `👾 ${actor.name}`,
          color: 12632256,
          description: actor.notes?.substring(0, 300) || 'New threat actor',
          fields: [
            { name: 'Type', value: (actor.actor_type || 'unknown').toUpperCase(), inline: true },
            { name: 'Country', value: actor.attributed_country || 'Unknown', inline: true },
            { name: 'Status', value: (actor.status || 'unknown').toUpperCase(), inline: true },
          ],
          timestamp: actor.created_date,
          footer: { text: 'ASOSINT Backfill' },
        };

        if (await postToDiscord(channelId, embed)) {
          stats.threat_actors++;
          stats.total_posted++;
        } else {
          stats.failed++;
        }
      }
    } catch (e) {
      console.error('Threat Actors backfill failed:', e.message);
    }

    // Backfill Campaigns
    try {
      const campaigns = await base44.entities.Campaign.filter({});
      const filtered = campaigns.filter(c => new Date(c.created_date) >= thirtyDaysAgo);

      const channelId = await getChannelId('campaigns');

      for (const campaign of filtered) {
        const embed = {
          title: `🎪 ${campaign.name}`,
          color: 9021271,
          description: campaign.description?.substring(0, 300) || 'Campaign',
          fields: [
            { name: 'Type', value: (campaign.campaign_type || 'unknown').toUpperCase(), inline: true },
            { name: 'Status', value: (campaign.status || 'unknown').toUpperCase(), inline: true },
          ],
          timestamp: campaign.created_date,
          footer: { text: 'ASOSINT Backfill' },
        };

        if (await postToDiscord(channelId, embed)) {
          stats.campaigns++;
          stats.total_posted++;
        } else {
          stats.failed++;
        }
      }
    } catch (e) {
      console.error('Campaigns backfill failed:', e.message);
    }

    return Response.json({
      success: true,
      message: `Backfill complete: ${stats.total_posted} alerts synced to Discord (last 30 days)`,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});