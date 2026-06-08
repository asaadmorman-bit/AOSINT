// v1
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Fetches live data from gov/allied intel sources (CISA KEV, NVD CVEs, FBI IC3, NCSC, ENISA)
 * and pushes rich embeds to Discord channels with full descriptions, clickable links, and source attribution.
 * Can be called manually or via scheduled automation.
 */

const GOV_SOURCES = [
  {
    id: 'cisa_kev',
    name: 'CISA KEV',
    full: 'CISA Known Exploited Vulnerabilities',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    api: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    color: 0xFF4757, // red - critical
    emoji: '🛡️',
    channel_keywords: ['cisa', 'kev', 'vulnerabilities', 'exploited', 'intel', 'gov-intel', 'alerts'],
  },
  {
    id: 'nvd_cves',
    name: 'NIST NVD',
    full: 'National Vulnerability Database — Recent Critical CVEs',
    url: 'https://nvd.nist.gov/vuln/search',
    api: 'https://services.nvd.nist.gov/rest/json/cves/2.0?cvssV3Severity=CRITICAL&resultsPerPage=5&startIndex=0',
    color: 0xFF6B35,
    emoji: '🔴',
    channel_keywords: ['nvd', 'cve', 'vulnerabilities', 'intel', 'gov-intel', 'alerts'],
  },
  {
    id: 'ncsc_uk',
    name: 'NCSC UK',
    full: 'UK National Cyber Security Centre — Latest Guidance',
    url: 'https://www.ncsc.gov.uk/news/all',
    api: 'https://www.ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml',
    color: 0x003087, // UK blue
    emoji: '🇬🇧',
    channel_keywords: ['ncsc', 'uk', 'five-eyes', 'allied', 'intel', 'gov-intel', 'alerts'],
    rss: true,
  },
];

async function fetchCisaKev() {
  const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
  if (!res.ok) throw new Error(`CISA KEV fetch failed: ${res.status}`);
  const json = await res.json();
  const vulns = (json.vulnerabilities || []).slice(0, 5);
  return vulns.map(v => ({
    title: `🛡️ CISA KEV: ${v.cveID} — ${v.vendorProject} ${v.product}`,
    description: `**${v.vulnerabilityName}**\n\n${v.shortDescription}\n\n**Required Action:** ${v.requiredAction || 'Apply vendor patch immediately.'}`,
    url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog`,
    source_name: 'CISA Known Exploited Vulnerabilities',
    source_url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    severity: 'critical',
    color: 0xFF4757,
    fields: [
      { name: '🆔 CVE ID', value: `[${v.cveID}](https://nvd.nist.gov/vuln/detail/${v.cveID})`, inline: true },
      { name: '🏭 Vendor / Product', value: `${v.vendorProject} — ${v.product}`, inline: true },
      { name: '📅 Date Added', value: v.dateAdded || 'N/A', inline: true },
      { name: '⚠️ Due Date', value: v.dueDate || 'ASAP', inline: true },
      { name: '🔗 Full Catalog', value: '[CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)', inline: false },
    ],
    footer: '🛡️ Source: CISA (Cybersecurity & Infrastructure Security Agency) · cisa.gov',
  }));
}

async function fetchNvdCritical() {
  const res = await fetch(
    'https://services.nvd.nist.gov/rest/json/cves/2.0?cvssV3Severity=CRITICAL&resultsPerPage=5',
    { headers: { 'Accept': 'application/json' } }
  );
  if (!res.ok) throw new Error(`NVD fetch failed: ${res.status}`);
  const json = await res.json();
  const items = (json.vulnerabilities || []).slice(0, 5);
  return items.map(item => {
    const cve = item.cve;
    const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description available.';
    const cvssScore = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore
      || cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore
      || 'N/A';
    const cvssVector = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.vectorString || '';
    const refs = (cve.references || []).slice(0, 3).map(r => `[${r.source || 'Reference'}](${r.url})`).join('\n') || 'N/A';
    const published = cve.published ? new Date(cve.published).toLocaleDateString() : 'N/A';

    return {
      title: `🔴 CRITICAL CVE: ${cve.id}`,
      description: desc.length > 500 ? desc.slice(0, 497) + '...' : desc,
      url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      source_name: 'NIST National Vulnerability Database',
      source_url: 'https://nvd.nist.gov/',
      severity: 'critical',
      color: 0xFF6B35,
      fields: [
        { name: '🆔 CVE ID', value: `[${cve.id}](https://nvd.nist.gov/vuln/detail/${cve.id})`, inline: true },
        { name: '📊 CVSS Score', value: `**${cvssScore}/10** CRITICAL`, inline: true },
        { name: '📅 Published', value: published, inline: true },
        { name: '🔢 CVSS Vector', value: cvssVector || 'N/A', inline: false },
        { name: '🔗 References', value: refs, inline: false },
      ],
      footer: '🔴 Source: NIST National Vulnerability Database (NVD) · nvd.nist.gov',
    };
  });
}

async function fetchAlienVaultOTX() {
  const apiKey = Deno.env.get('ALIENVAULT_OTX_API_KEY');
  if (!apiKey) return [];

  const res = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=5', {
    headers: { 'X-OTX-API-KEY': apiKey }
  });
  if (!res.ok) return [];
  const json = await res.json();
  const pulses = (json.results || []).slice(0, 5);

  return pulses.map(p => {
    const tags = (p.tags || []).slice(0, 5).join(', ') || 'N/A';
    const iocs = (p.indicators || []).slice(0, 5).map(i => `\`${i.indicator}\` (${i.type})`).join('\n') || 'N/A';
    const refs = (p.references || []).slice(0, 3).map(r => r.startsWith('http') ? `[Link](${r})` : r).join('\n') || 'N/A';

    return {
      title: `🎯 OTX Intel Pulse: ${p.name}`,
      description: (p.description || 'Community threat intelligence pulse from AlienVault OTX.').slice(0, 500),
      url: `https://otx.alienvault.com/pulse/${p.id}`,
      source_name: 'AlienVault Open Threat Exchange (OTX)',
      source_url: `https://otx.alienvault.com/pulse/${p.id}`,
      severity: 'high',
      color: 0xFFA502,
      fields: [
        { name: '👤 Author', value: p.author_name || 'Community', inline: true },
        { name: '🏷️ Tags', value: tags, inline: true },
        { name: '📊 IOC Count', value: String(p.indicators_count || 0), inline: true },
        { name: '🔍 Sample IOCs', value: iocs, inline: false },
        { name: '🔗 References', value: refs, inline: false },
        { name: '📄 Full Pulse', value: `[View on OTX](https://otx.alienvault.com/pulse/${p.id})`, inline: false },
      ],
      footer: '🌐 Source: AlienVault Open Threat Exchange (OTX) · otx.alienvault.com',
    };
  });
}

async function sendDiscordEmbed(botToken, channelId, alert) {
  const embed = {
    title: alert.title.slice(0, 256),
    description: alert.description,
    url: alert.url,
    color: alert.color,
    fields: alert.fields || [],
    footer: { text: alert.footer },
    timestamp: new Date().toISOString(),
    author: {
      name: alert.source_name,
      url: alert.source_url,
    },
  };

  const isCritical = alert.severity === 'critical';
  const body = {
    content: isCritical ? '🚨 **CRITICAL INTEL ALERT** — Review immediately' : undefined,
    embeds: [embed],
    allowed_mentions: isCritical ? { parse: [] } : undefined,
  };

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return { ok: res.ok, status: res.status };
}

async function resolveDiscordChannel(botToken, serverId, keywords) {
  const res = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
    headers: { 'Authorization': `Bot ${botToken}` }
  });
  if (!res.ok) return null;
  const channels = await res.json();
  const textChannels = channels.filter(c => c.type === 0);

  // Try to match by keyword priority
  for (const kw of keywords) {
    const match = textChannels.find(c => c.name.toLowerCase().includes(kw.toLowerCase()));
    if (match) return match.id;
  }
  // Fallback: any channel with 'intel', 'alert', 'threat', or 'general'
  const fallback = textChannels.find(c =>
    ['intel', 'alert', 'threat', 'general', 'announcements'].some(f => c.name.toLowerCase().includes(f))
  );
  return fallback?.id || textChannels[0]?.id || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow both user-triggered and scheduled (service role) calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (_) {
      // scheduled call — proceed
      isAdmin = true;
    }

    const body = await req.json().catch(() => ({}));
    const { sources = ['cisa_kev', 'nvd_critical', 'otx'], discord_server_id, dry_run = false } = body;

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'DISCORD_BOT_TOKEN not configured' }, { status: 500 });

    // Resolve Discord servers
    let serverIds = [];
    if (discord_server_id) {
      serverIds = [discord_server_id];
    } else {
      const servers = await base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 20);
      serverIds = (servers || []).filter(s => s.is_active && s.discord_server_id).map(s => s.discord_server_id);
    }

    if (!serverIds.length) {
      return Response.json({ success: false, warning: 'No Discord servers configured. Add a server in Discord Server Management.' });
    }

    // Fetch intel from selected sources
    const allAlerts = [];
    const fetchErrors = [];

    if (sources.includes('cisa_kev')) {
      try {
        const items = await fetchCisaKev();
        allAlerts.push(...items);
      } catch (e) {
        fetchErrors.push(`CISA KEV: ${e.message}`);
      }
    }

    if (sources.includes('nvd_critical')) {
      try {
        const items = await fetchNvdCritical();
        allAlerts.push(...items);
      } catch (e) {
        fetchErrors.push(`NVD: ${e.message}`);
      }
    }

    if (sources.includes('otx')) {
      try {
        const items = await fetchAlienVaultOTX();
        allAlerts.push(...items);
      } catch (e) {
        fetchErrors.push(`OTX: ${e.message}`);
      }
    }

    if (dry_run) {
      return Response.json({ success: true, dry_run: true, alert_count: allAlerts.length, alerts: allAlerts, fetch_errors: fetchErrors });
    }

    if (!allAlerts.length) {
      return Response.json({ success: false, warning: 'No alerts fetched from gov sources.', fetch_errors: fetchErrors });
    }

    // Push to each Discord server
    const pushResults = [];
    for (const serverId of serverIds) {
      for (const alert of allAlerts) {
        // Find best channel for this alert type
        const source = GOV_SOURCES.find(s => alert.footer?.toLowerCase().includes(s.id.replace('_', ' '))) || GOV_SOURCES[0];
        const channelId = await resolveDiscordChannel(botToken, serverId, source.channel_keywords);

        if (!channelId) {
          pushResults.push({ server: serverId, alert: alert.title, status: 'no_channel' });
          continue;
        }

        const result = await sendDiscordEmbed(botToken, channelId, alert);
        pushResults.push({
          server: serverId,
          channel: channelId,
          alert: alert.title.slice(0, 60),
          status: result.ok ? 'sent' : 'failed',
          http_status: result.status,
        });

        // Small delay to avoid Discord rate limits
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Save alerts as ThreatIndicators for platform-side visibility
    for (const alert of allAlerts.slice(0, 10)) {
      try {
        await base44.asServiceRole.entities.ThreatIndicator.create({
          title: alert.title.replace(/[🛡️🔴🎯⚠️🇬🇧]/g, '').trim().slice(0, 200),
          indicator_type: 'cve',
          value: alert.title.slice(0, 100),
          severity: alert.severity,
          status: 'active',
          feed_name: alert.source_name,
          notes: alert.description?.slice(0, 500),
          confidence: 90,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          tags: ['gov-intel', 'auto-ingested'],
        });
      } catch (_) { /* non-critical */ }
    }

    const sent = pushResults.filter(r => r.status === 'sent').length;
    const failed = pushResults.filter(r => r.status === 'failed').length;

    return Response.json({
      success: true,
      alerts_fetched: allAlerts.length,
      sent_to_discord: sent,
      failed,
      servers: serverIds.length,
      fetch_errors: fetchErrors,
      results: pushResults,
    });

  } catch (error) {
    console.error('pushGovIntelToDiscord error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});