import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const severityColors = { critical: 16711680, high: 16744448, medium: 16776960, low: 32768, informational: 3447003 };

// Category keyword sets — used to auto-route items that have no explicit category mapping
const CATEGORY_KEYWORDS = {
  enterprise:              ['enterprise', 'corporate', 'business', 'supply_chain', 'vendor'],
  government:              ['government', 'gov', 'federal', 'nation_state', 'geopolitical', 'state_sponsored'],
  public_information:      ['public', 'osint', 'open_source', 'community', 'news'],
  critical_infrastructure: ['critical_infrastructure', 'ics', 'scada', 'energy', 'utilities', 'infrastructure'],
  financial:               ['financial', 'banking', 'fraud', 'crypto', 'ransomware', 'wire_fraud'],
  healthcare:              ['healthcare', 'hospital', 'medical', 'pharma', 'health'],
  law_enforcement:         ['law_enforcement', 'lea', 'police', 'interpol', 'fbi', 'cisa'],
  general:                 [],
};

// Derive the best-matching category from tags/keywords on an item
function deriveCategory(item) {
  const haystack = [
    ...(item.tags || []),
    item.alert_type || '',
    item.indicator_type || '',
    item.actor_type || '',
    item.threat_category || '',
    item.narrative_alignment || '',
  ].join(' ').toLowerCase();

  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'general') continue;
    if (kws.some(kw => haystack.includes(kw))) return cat;
  }
  return 'general';
}

async function getGuildChannels(guildId, botToken) {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) return [];
  const all = await res.json();
  return all.filter(c => c.type === 0);
}

async function ensureChannel(guildId, channelName, botToken) {
  const channels = await getGuildChannels(guildId, botToken);
  const normalizedName = channelName.toLowerCase().replace(/\s+/g, '-');
  const existing = channels.find(c => c.name.toLowerCase() === normalizedName);
  if (existing) return existing.id;

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: normalizedName, type: 0, topic: `ASOSINT — ${channelName}` }),
  });
  if (!res.ok) return null;
  const ch = await res.json();
  return ch.id;
}

async function findFallbackChannel(guildId, botToken) {
  const channels = await getGuildChannels(guildId, botToken);
  for (const kw of ['alerts', 'intelligence', 'threat', 'general']) {
    const found = channels.find(c => c.name.toLowerCase().includes(kw));
    if (found) return found.id;
  }
  return channels[0]?.id || null;
}

async function postEmbed(channelId, embed, botToken) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (res.status === 429) {
    const data = await res.json();
    await sleep(Math.ceil((data.retry_after || 1) * 1000) + 300);
    const retry = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!retry.ok) return null;
    return (await retry.json()).id;
  }
  if (!res.ok) return null;
  return (await res.json()).id;
}

// Create a public thread off a message for related discussions
async function createThread(channelId, messageId, threadName, botToken) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/threads`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: threadName.slice(0, 100), auto_archive_duration: 1440 }),
  });
  return res.ok;
}

// Build alert embed
function buildAlertEmbed(alert) {
  return {
    title: `🚨 ${(alert.title || 'OSINT Alert').slice(0, 256)}`,
    description: (alert.description || '').slice(0, 1000),
    color: severityColors[alert.severity] || 9807270,
    fields: [
      { name: 'Severity', value: (alert.severity || 'UNKNOWN').toUpperCase(), inline: true },
      { name: 'Type', value: (alert.alert_type || 'Unknown').replace(/_/g, ' '), inline: true },
      { name: 'Status', value: alert.status || 'new', inline: true },
      ...(alert.confidence_score ? [{ name: 'Confidence', value: `${Math.round(alert.confidence_score)}%`, inline: true }] : []),
      ...(alert.tags?.length ? [{ name: 'Tags', value: alert.tags.slice(0, 5).join(', ') }] : []),
      ...(alert.recommended_actions?.length ? [{ name: '⚡ Actions', value: alert.recommended_actions.slice(0, 3).join('\n') }] : []),
    ],
    footer: { text: 'ASOSINT Threat Intelligence' },
    timestamp: new Date(alert.triggered_at || alert.created_date).toISOString(),
  };
}

// Build indicator embed
function buildIndicatorEmbed(ioc) {
  return {
    title: `📊 IOC: ${(ioc.indicator_type || 'Indicator').replace(/_/g, ' ')}`,
    description: (ioc.title || ioc.value || 'New IOC').slice(0, 500),
    color: severityColors[ioc.severity] || 3447003,
    fields: [
      { name: 'Value', value: (ioc.value || 'N/A').slice(0, 100), inline: false },
      { name: 'Type', value: (ioc.indicator_type || 'Unknown').replace(/_/g, ' '), inline: true },
      { name: 'Severity', value: ioc.severity || 'low', inline: true },
      { name: 'Confidence', value: `${ioc.confidence || 0}%`, inline: true },
      { name: 'Source', value: ioc.feed_name || 'Unknown', inline: true },
      ...(ioc.tags?.length ? [{ name: 'Tags', value: ioc.tags.slice(0, 5).join(', ') }] : []),
      ...(ioc.notes ? [{ name: 'Context', value: ioc.notes.slice(0, 300) }] : []),
    ],
    footer: { text: 'ASOSINT IOC Feed' },
    timestamp: new Date(ioc.created_date).toISOString(),
  };
}

// Build threat actor embed
function buildActorEmbed(actor) {
  return {
    title: `👁️ Threat Actor: ${actor.name}`,
    description: (actor.notes || `${actor.actor_type} threat actor — Status: ${actor.status}`).slice(0, 800),
    color: actor.status === 'active' ? 16711680 : 9807270,
    fields: [
      { name: 'Type', value: (actor.actor_type || 'Unknown').replace(/_/g, ' '), inline: true },
      { name: 'Status', value: actor.status || 'Unknown', inline: true },
      { name: 'Origin', value: actor.attributed_country || 'Unknown', inline: true },
      ...(actor.aliases?.length ? [{ name: 'Also Known As', value: actor.aliases.slice(0, 4).join(', ') }] : []),
      ...(actor.target_sectors?.length ? [{ name: 'Target Sectors', value: actor.target_sectors.slice(0, 5).join(', ') }] : []),
      ...(actor.target_regions?.length ? [{ name: 'Target Regions', value: actor.target_regions.slice(0, 4).join(', ') }] : []),
      ...(actor.confidence ? [{ name: 'Confidence', value: `${actor.confidence}%`, inline: true }] : []),
    ],
    footer: { text: 'ASOSINT Actor Intelligence' },
    timestamp: new Date(actor.created_date).toISOString(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'Discord bot token not configured' }, { status: 400 });

    const [alerts, indicators, threats, servers, allMappings] = await Promise.all([
      base44.asServiceRole.entities.OsintAlert.list('-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.ThreatIndicator.list('-created_date', 20).catch(() => []),
      base44.asServiceRole.entities.ThreatActor.list('-created_date', 10).catch(() => []),
      base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 50).catch(() => []),
      base44.asServiceRole.entities.DiscordChannelMapping.list('-created_date', 200).catch(() => []),
    ]);

    if (!servers || servers.length === 0) {
      return Response.json({ success: false, error: 'No Discord servers configured' }, { status: 400 });
    }

    const results = { pushed_alerts: 0, pushed_indicators: 0, pushed_threats: 0, channels_created: 0, threads_created: 0, errors: [] };

    for (const server of servers) {
      if (!server.is_active) continue;
      const serverMappings = allMappings.filter(m => m.server_id === server.id && m.is_active !== false);
      await sleep(500);

      // Helper: resolve channel id for a data type + optional category
      // Priority: exact (dataType + category) → dataType-only general → fallback
      const resolveChannel = async (dataType, category = 'general') => {
        // 1. Try exact category match
        let mapping = serverMappings.find(m => m.data_type === dataType && m.category === category);
        // 2. Fall back to general mapping for this data type
        if (!mapping) mapping = serverMappings.find(m => m.data_type === dataType && (!m.category || m.category === 'general'));
        // 3. Any mapping for data type
        if (!mapping) mapping = serverMappings.find(m => m.data_type === dataType);

        if (mapping) {
          if (mapping.channel_id) {
            return { channelId: mapping.channel_id, threading: mapping.enable_threading, severityFilter: mapping.severity_filter || [], tagFilter: mapping.tag_filter || [] };
          }
          if (mapping.auto_create !== false) {
            const id = await ensureChannel(server.discord_server_id, mapping.channel_name, botToken);
            if (id) {
              await base44.asServiceRole.entities.DiscordChannelMapping.update(mapping.id, { channel_id: id });
              results.channels_created++;
              return { channelId: id, threading: mapping.enable_threading, severityFilter: mapping.severity_filter || [], tagFilter: mapping.tag_filter || [] };
            }
          }
        }
        // No mapping: fallback keyword search
        const fallbackId = await findFallbackChannel(server.discord_server_id, botToken);
        return { channelId: fallbackId, threading: false, severityFilter: [], tagFilter: [] };
      };

      const passesFilters = (item, config) => {
        if (config.severityFilter.length && !config.severityFilter.includes(item.severity)) return false;
        if (config.tagFilter.length) {
          const itemTags = item.tags || [];
          if (!config.tagFilter.some(t => itemTags.includes(t))) return false;
        }
        return true;
      };

      const pushItem = async (channelId, embed, threading, threadLabel, config) => {
        const msgId = await postEmbed(channelId, embed, botToken);
        if (msgId && threading && threadLabel) {
          const ok = await createThread(channelId, msgId, threadLabel.slice(0, 100), botToken);
          if (ok) results.threads_created++;
          await sleep(500);
        }
        return !!msgId;
      };

      // --- ALERTS (routed by category) ---
      for (const alert of alerts.slice(0, 8)) {
        const cat = deriveCategory(alert);
        const cfg = await resolveChannel('alerts', cat);
        if (!cfg.channelId) { results.errors.push(`No alert channel for server: ${server.name}, category: ${cat}`); continue; }
        if (!passesFilters(alert, cfg)) continue;
        const ok = await pushItem(cfg.channelId, buildAlertEmbed(alert), cfg.threading, `🔍 ${alert.title || 'Alert'}`, cfg);
        if (ok) results.pushed_alerts++;
        await sleep(800);
      }

      // --- INDICATORS (routed by category) ---
      for (const ioc of indicators.slice(0, 8)) {
        const cat = deriveCategory(ioc);
        const cfg = await resolveChannel('indicators', cat);
        if (!cfg.channelId) { results.errors.push(`No indicator channel for server: ${server.name}, category: ${cat}`); continue; }
        if (!passesFilters(ioc, cfg)) continue;
        const ok = await pushItem(cfg.channelId, buildIndicatorEmbed(ioc), cfg.threading, `🔗 ${ioc.title || ioc.value || 'IOC'}`, cfg);
        if (ok) results.pushed_indicators++;
        await sleep(800);
      }

      // --- THREAT ACTORS (routed by category) ---
      for (const actor of threats.slice(0, 5)) {
        const cat = deriveCategory(actor);
        const cfg = await resolveChannel('threat_actors', cat);
        if (!cfg.channelId) { results.errors.push(`No actor channel for server: ${server.name}, category: ${cat}`); continue; }
        const ok = await pushItem(cfg.channelId, buildActorEmbed(actor), cfg.threading, `🕵️ ${actor.name} — Intelligence Thread`, cfg);
        if (ok) results.pushed_threats++;
        await sleep(800);
      }
    }

    return Response.json({
      success: true,
      message: 'Threat data pushed to Discord channels',
      results,
      data_summary: {
        alerts_found: alerts.length,
        indicators_found: indicators.length,
        threats_found: threats.length,
        discord_servers: servers.length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});