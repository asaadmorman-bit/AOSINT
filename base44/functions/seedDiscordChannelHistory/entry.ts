import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const severityColors = {
  critical: 16711680,
  high: 16744448,
  medium: 16776960,
  low: 32768,
  informational: 3447003,
};

// 90-day seeding data — variety of threat content per category
const SEED_CONTENT = {
  alerts: [
    { title: "APT-41 Spear-Phishing Campaign Targeting Defense Contractors", severity: "critical", description: "A sophisticated spear-phishing campaign attributed to APT-41 is actively targeting defense contractors across NATO member states. Over 340 executives have received tailored lures referencing classified procurement documents.", tags: ["apt-41", "spear-phishing", "defense", "nato"], daysAgo: 88 },
    { title: "Mass Credential Dump — 4.2M Healthcare Worker Logins Exposed", severity: "critical", description: "A threat actor known as 'MedReaper' has published 4.2 million healthcare worker credentials on BreachForums. Data includes hospital VPN credentials, EMR login pairs, and 2FA backup codes.", tags: ["healthcare", "credential-dump", "breach"], daysAgo: 81 },
    { title: "Zero-Day in Cisco IOS XE Actively Exploited in the Wild", severity: "critical", description: "CVE-2025-20198 is being actively exploited by nation-state actors to gain root access on Cisco IOS XE devices. Thousands of routers in critical infrastructure are believed to be compromised.", tags: ["cisco", "zero-day", "cve", "infrastructure"], daysAgo: 74 },
    { title: "LockBit 4.0 Ransomware Targets European Energy Sector", severity: "high", description: "LockBit 4.0 affiliates have claimed responsibility for attacks against three European energy providers. Ransom demands range from €2M to €8M with 72-hour payment windows.", tags: ["lockbit", "ransomware", "energy", "europe"], daysAgo: 70 },
    { title: "Iranian APT Group Deploys New Wiper Malware — 'SandStorm'", severity: "critical", description: "A destructive wiper malware dubbed SandStorm has been deployed by an Iranian APT group against Israeli financial institutions. The malware targets MBR and shadow copies.", tags: ["iran", "wiper", "financial", "apt"], daysAgo: 65 },
    { title: "Supply Chain Attack via Compromised NPM Package", severity: "high", description: "A widely-used NPM package with 2.1M weekly downloads was found to contain a backdoor injected via a compromised maintainer account. Affected versions: 3.4.1–3.4.9.", tags: ["supply-chain", "npm", "backdoor", "developer"], daysAgo: 60 },
    { title: "North Korean Lazarus Group Targeting Crypto Exchanges", severity: "high", description: "Lazarus Group has resumed targeting cryptocurrency exchanges with a new social engineering campaign posing as blockchain job recruiters. Three exchanges confirmed initial compromise.", tags: ["lazarus", "crypto", "north-korea", "social-engineering"], daysAgo: 55 },
    { title: "New Phishing Kit Bypasses MFA — Targets Microsoft 365", severity: "high", description: "A new phishing-as-a-service kit dubbed 'QuickPhish' uses adversary-in-the-middle techniques to steal Microsoft 365 session tokens, effectively bypassing MFA.", tags: ["phishing", "mfa-bypass", "microsoft-365", "aitm"], daysAgo: 50 },
    { title: "Chinese APT Exploiting Pulse Secure VPN — Government Targets", severity: "critical", description: "CISA and FBI jointly attribute exploitation of Pulse Secure VPN vulnerabilities to Chinese state-sponsored actors targeting US government agencies and defense industrial base.", tags: ["china", "vpn", "government", "cisa"], daysAgo: 44 },
    { title: "Russian FSB-Linked Group Deploys Custom RAT in Ukraine", severity: "high", description: "Gamaredon APT, linked to Russian FSB, has deployed a new custom remote access trojan targeting Ukrainian government ministries. C2 infrastructure spans 17 countries.", tags: ["russia", "fsb", "gamaredon", "ukraine", "rat"], daysAgo: 38 },
    { title: "DarkSide Affiliate Resurfaces With New Infrastructure", severity: "medium", description: "A DarkSide affiliate believed to have gone dark after Colonial Pipeline has resurfaced with new infrastructure and a rebranded ransomware payload targeting logistics companies.", tags: ["darkside", "ransomware", "logistics"], daysAgo: 32 },
    { title: "Critical SAP NetWeaver Vulnerability — Unauthenticated RCE", severity: "critical", description: "SAP has issued an emergency patch for CVE-2025-31324, an unauthenticated remote code execution vulnerability in SAP NetWeaver affecting thousands of enterprise installations.", tags: ["sap", "rce", "enterprise", "cve"], daysAgo: 25 },
    { title: "Water Sector OT Systems Targeted in Multi-State Attack", severity: "high", description: "Water treatment facilities across four US states have reported unauthorized access to operational technology systems. CISA has issued emergency directive ED-25-03.", tags: ["water", "ot", "critical-infrastructure", "cisa"], daysAgo: 18 },
    { title: "New Malvertising Campaign Delivers Infostealer via Google Ads", severity: "medium", description: "A large-scale malvertising campaign is abusing Google Ads to deliver Rhadamanthys infostealer to users searching for popular software downloads.", tags: ["malvertising", "infostealer", "google-ads"], daysAgo: 12 },
    { title: "Telecom Giant Confirms Data Breach — 8M Customer Records", severity: "critical", description: "A major US telecom provider has confirmed a breach exposing 8 million customer records including SSNs, account PINs, and call detail records. Breach attributed to insider threat.", tags: ["telecom", "breach", "insider-threat", "pii"], daysAgo: 6 },
  ],
  indicators: [
    { title: "Malicious IP Block — Lazarus Group C2 Infrastructure", value: "185.220.101.0/24", indicator_type: "ip_address", severity: "critical", tags: ["lazarus", "c2", "north-korea"], daysAgo: 87 },
    { title: "APT-29 Phishing Domain — Cozy Bear Campaign", value: "microsoft-secure-portal.ru", indicator_type: "domain", severity: "high", tags: ["apt-29", "phishing", "russia"], daysAgo: 82 },
    { title: "LockBit 4.0 Ransomware SHA-256 Hash", value: "a3f4b8c2d9e1f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", indicator_type: "hash", severity: "critical", tags: ["lockbit", "ransomware"], daysAgo: 75 },
    { title: "SandStorm Wiper C2 Domain", value: "update-srv.tehran-cloud.net", indicator_type: "domain", severity: "critical", tags: ["iran", "wiper", "c2"], daysAgo: 68 },
    { title: "Cobalt Strike Beacon — TeamTNT", value: "94.102.61.204", indicator_type: "ip_address", severity: "high", tags: ["cobalt-strike", "teamtnt", "c2"], daysAgo: 63 },
    { title: "Log4Shell Exploit Delivery URL", value: "http://exploit.dark-cdn.cc/log4j/payload.jar", indicator_type: "url", severity: "critical", tags: ["log4shell", "exploit", "java"], daysAgo: 58 },
    { title: "QuickPhish AiTM Kit — Phishing Page Hash", value: "b9e2c5a1f4d7e0b3c6a9f2e5d8b1a4c7f0e3b6a9", indicator_type: "hash", severity: "high", tags: ["phishing", "mfa-bypass", "aitm"], daysAgo: 52 },
    { title: "Emotet Botnet C2 — Active Node", value: "176.111.174.26", indicator_type: "ip_address", severity: "high", tags: ["emotet", "botnet", "c2"], daysAgo: 45 },
    { title: "CVE-2025-20198 — Cisco IOS XE", value: "CVE-2025-20198", indicator_type: "cve", severity: "critical", tags: ["cisco", "zero-day", "rce"], daysAgo: 40 },
    { title: "Gamaredon RAT Delivery Domain", value: "docs-update.ukr-portal.info", indicator_type: "domain", severity: "high", tags: ["gamaredon", "russia", "rat"], daysAgo: 35 },
    { title: "Infostealer Exfil Endpoint", value: "https://collect.rhadastore.cc/upload", indicator_type: "url", severity: "medium", tags: ["infostealer", "rhadamanthys", "exfil"], daysAgo: 28 },
    { title: "Cryptojacking Script Hash — Mining Malware", value: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0", indicator_type: "hash", severity: "medium", tags: ["cryptojacking", "mining"], daysAgo: 22 },
    { title: "DarkComet RAT C2 Server", value: "91.218.114.9", indicator_type: "ip_address", severity: "high", tags: ["darkcomet", "rat", "c2"], daysAgo: 15 },
    { title: "CVE-2025-31324 — SAP NetWeaver RCE", value: "CVE-2025-31324", indicator_type: "cve", severity: "critical", tags: ["sap", "rce", "enterprise"], daysAgo: 10 },
    { title: "RedLine Stealer C2 Domain — Active Campaign", value: "redline-panel.cc", indicator_type: "domain", severity: "high", tags: ["redline", "infostealer", "c2"], daysAgo: 4 },
  ],
  threat_actors: [
    { title: "APT-41 (Double Dragon) — Activity Update", name: "APT-41 (Double Dragon)", actor_type: "nation_state", origin: "China", status: "active", description: "APT-41 continues dual espionage and financially-motivated operations. Recent campaigns target defense contractors, healthcare, and gaming sectors. New toolset detected: ScatterBee v3.", tags: ["china", "espionage", "financial"], daysAgo: 85 },
    { title: "Lazarus Group — Crypto Theft Campaign", name: "Lazarus Group", actor_type: "nation_state", origin: "North Korea", status: "active", description: "Lazarus Group has stolen an estimated $1.4B in cryptocurrency YTD through job recruitment scams and exchange compromises. Now operating through 12 known front companies.", tags: ["north-korea", "crypto", "apt"], daysAgo: 78 },
    { title: "REvil (Sodinokibi) — Possible Resurgence", name: "REvil / Sodinokibi", actor_type: "criminal", origin: "Russia", status: "active", description: "Intelligence suggests REvil may be resurfacing under a new brand. Infrastructure similarities with previous REvil operations identified. Three new ransomware victims reported.", tags: ["revil", "ransomware", "russia"], daysAgo: 72 },
    { title: "Sandworm — Power Grid Targeting Observed", name: "Sandworm (GRU Unit 74455)", actor_type: "nation_state", origin: "Russia", status: "active", description: "GRU-linked Sandworm has been observed conducting reconnaissance against European power grid SCADA systems. New custom malware 'CaddyWiper 2.0' attributed to the group.", tags: ["russia", "gru", "ics", "scada", "sandworm"], daysAgo: 65 },
    { title: "Scattered Spider — New Social Engineering Tactics", name: "Scattered Spider", actor_type: "criminal", origin: "Unknown", status: "active", description: "Scattered Spider has adopted new SIM-swap and help-desk social engineering techniques targeting cloud service providers. Three Fortune 100 companies compromised in Q1.", tags: ["scattered-spider", "social-engineering", "cloud"], daysAgo: 58 },
    { title: "Charming Kitten — Iranian APT Escalates Operations", name: "Charming Kitten (APT-35)", actor_type: "nation_state", origin: "Iran", status: "active", description: "APT-35 has dramatically escalated operations against US and Israeli researchers, journalists, and nuclear scientists. New spear-phishing infrastructure spans 24 countries.", tags: ["iran", "apt-35", "espionage"], daysAgo: 50 },
    { title: "BlackCat/ALPHV — Healthcare Sector Focus", name: "BlackCat / ALPHV", actor_type: "criminal", origin: "Russia", status: "active", description: "BlackCat ransomware group has shifted focus to healthcare targets following law enforcement disruption. New triple-extortion model includes threats against patient data disclosure.", tags: ["blackcat", "ransomware", "healthcare"], daysAgo: 42 },
    { title: "Volt Typhoon — Pre-Positioning in US Critical Infrastructure", name: "Volt Typhoon", actor_type: "nation_state", origin: "China", status: "active", description: "FBI and CISA confirm Volt Typhoon has pre-positioned access in US water, power, and communications infrastructure. The campaign uses living-off-the-land techniques to avoid detection.", tags: ["china", "critical-infrastructure", "volt-typhoon", "lolbas"], daysAgo: 35 },
    { title: "Kimsuky — South Korean Government Targeting", name: "Kimsuky", actor_type: "nation_state", origin: "North Korea", status: "active", description: "North Korean Kimsuky group is conducting targeted attacks against South Korean government officials and think tanks with a new Android spyware variant 'SurveyBear'.", tags: ["north-korea", "kimsuky", "spyware", "government"], daysAgo: 28 },
    { title: "FIN7 — New PoS Malware Variant", name: "FIN7 / Carbanak", actor_type: "criminal", origin: "Russia", status: "active", description: "FIN7 has been observed deploying a new point-of-sale malware variant targeting US retail chains. Estimated financial impact exceeds $45M across 14 victims.", tags: ["fin7", "pos", "retail", "financial-crime"], daysAgo: 20 },
    { title: "HAFNIUM — Exchange Server Campaign Returns", name: "HAFNIUM (China)", actor_type: "nation_state", origin: "China", status: "active", description: "HAFNIUM has resumed targeting on-premises Microsoft Exchange servers through a new exploit chain. Defense and legal sectors are primary targets.", tags: ["hafnium", "china", "exchange", "exploit"], daysAgo: 12 },
    { title: "Clop — MOVEit Successor Campaign", name: "Clop (TA505)", actor_type: "criminal", origin: "Russia", status: "active", description: "Clop ransomware group has launched a new mass-exploitation campaign targeting an enterprise file transfer solution, claiming 200+ victims globally within 2 weeks.", tags: ["clop", "ransomware", "mass-exploitation"], daysAgo: 5 },
  ],
};

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
  const normalized = channelName.toLowerCase().replace(/\s+/g, '-');
  const existing = channels.find(c => c.name.toLowerCase() === normalized);
  if (existing) return existing.id;

  // Try to create the channel
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: normalized, type: 0, topic: `ASOSINT — ${channelName}` }),
  });
  if (res.ok) return (await res.json()).id;

  // Creation failed — fall back to any existing writable channel
  if (channels.length > 0) return channels[0].id;
  return null;
}

async function postEmbed(channelId, embed, botToken) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (res.status === 429) {
    const data = await res.json();
    await sleep(Math.ceil((data.retry_after || 2) * 1000) + 500);
    const retry = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return retry.ok;
  }
  return res.ok;
}

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildAlertEmbed(item) {
  return {
    title: `🚨 ${item.title.slice(0, 256)}`,
    description: item.description.slice(0, 1000),
    color: severityColors[item.severity] || 9807270,
    fields: [
      { name: 'Severity', value: item.severity.toUpperCase(), inline: true },
      { name: 'Type', value: 'Threat Alert', inline: true },
      ...(item.tags?.length ? [{ name: 'Tags', value: item.tags.join(', ') }] : []),
    ],
    footer: { text: 'ASOSINT Threat Intelligence' },
    timestamp: daysAgoISO(item.daysAgo),
  };
}

function buildIndicatorEmbed(item) {
  return {
    title: `📊 IOC: ${item.title.slice(0, 256)}`,
    description: `**Value:** \`${item.value}\``,
    color: severityColors[item.severity] || 3447003,
    fields: [
      { name: 'Type', value: (item.indicator_type || 'unknown').replace(/_/g, ' '), inline: true },
      { name: 'Severity', value: item.severity.toUpperCase(), inline: true },
      ...(item.tags?.length ? [{ name: 'Tags', value: item.tags.join(', ') }] : []),
    ],
    footer: { text: 'ASOSINT IOC Feed' },
    timestamp: daysAgoISO(item.daysAgo),
  };
}

function buildActorEmbed(item) {
  return {
    title: `👁️ Threat Actor: ${item.name}`,
    description: item.description.slice(0, 800),
    color: 16711680,
    fields: [
      { name: 'Type', value: (item.actor_type || 'unknown').replace(/_/g, ' '), inline: true },
      { name: 'Origin', value: item.origin || 'Unknown', inline: true },
      { name: 'Status', value: item.status || 'active', inline: true },
      ...(item.tags?.length ? [{ name: 'Tags', value: item.tags.join(', ') }] : []),
    ],
    footer: { text: 'ASOSINT Actor Intelligence' },
    timestamp: daysAgoISO(item.daysAgo),
  };
}

// Channel configurations to seed
const CHANNEL_CONFIGS = [
  { name: 'threat-alerts', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-enterprise', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-gov', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-public', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-infra', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-financial', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-healthcare', type: 'alerts', dataType: 'alerts' },
  { name: 'threat-alerts-lea', type: 'alerts', dataType: 'alerts' },
  { name: 'ioc-indicators', type: 'indicators', dataType: 'indicators' },
  { name: 'ioc-indicators-enterprise', type: 'indicators', dataType: 'indicators' },
  { name: 'ioc-indicators-gov', type: 'indicators', dataType: 'indicators' },
  { name: 'ioc-indicators-financial', type: 'indicators', dataType: 'indicators' },
  { name: 'ioc-indicators-infra', type: 'indicators', dataType: 'indicators' },
  { name: 'threat-actors', type: 'threat_actors', dataType: 'threat_actors' },
  { name: 'threat-actors-gov', type: 'threat_actors', dataType: 'threat_actors' },
  { name: 'threat-actors-enterprise', type: 'threat_actors', dataType: 'threat_actors' },
  { name: 'gov-intel-feed', type: 'alerts', dataType: 'alerts' },
  { name: 'intelligence-feed', type: 'alerts', dataType: 'alerts' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'Discord bot token not configured' }, { status: 400 });

    const servers = await base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 10).catch(() => []);
    if (!servers?.length) return Response.json({ error: 'No Discord servers configured' }, { status: 400 });

    const results = { channels_seeded: 0, messages_posted: 0, errors: [] };

    for (const server of servers) {
      if (!server.is_active) continue;
      const guildId = server.discord_server_id;

      for (const cfg of CHANNEL_CONFIGS) {
        const channelId = await ensureChannel(guildId, cfg.name, botToken);
        if (!channelId) {
          results.errors.push(`Could not create/find #${cfg.name} in ${server.name}`);
          continue;
        }

        const items = SEED_CONTENT[cfg.dataType] || [];
        // Post 3-5 items per channel spread over 90 days
        const subset = items.sort(() => Math.random() - 0.5).slice(0, 5);

        let posted = 0;
        for (const item of subset) {
          let embed;
          if (cfg.dataType === 'alerts') embed = buildAlertEmbed(item);
          else if (cfg.dataType === 'indicators') embed = buildIndicatorEmbed(item);
          else embed = buildActorEmbed(item);

          const ok = await postEmbed(channelId, embed, botToken);
          if (ok) posted++;
          await sleep(600);
        }

        if (posted > 0) {
          results.channels_seeded++;
          results.messages_posted += posted;
        }
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${results.channels_seeded} channels with ${results.messages_posted} messages across 90 days`,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});