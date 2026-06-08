import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ipToInt(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function expandCIDR(cidr) {
  const [base, prefix] = cidr.trim().split('/');
  const bits = parseInt(prefix, 10);
  if (isNaN(bits) || bits < 16 || bits > 32) return [];
  const baseInt = ipToInt(base) & (~((1 << (32 - bits)) - 1) >>> 0);
  const count = Math.min(1 << (32 - bits), 256); // cap at 256 IPs per range
  const ips = [];
  for (let i = 1; i < count - 1; i++) ips.push(intToIp((baseInt + i) >>> 0));
  return ips;
}

// Simulate an Nmap-style banner grab / port probe using HTTP HEAD + fetch timeouts
async function probeHost(ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`http://${ip}`, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    const server = res.headers.get('server') || '';
    const powered = res.headers.get('x-powered-by') || '';
    return { alive: true, http_status: res.status, server_banner: server, powered_by: powered };
  } catch {
    clearTimeout(timer);
    // Try HTTPS
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 2000);
    try {
      const r2 = await fetch(`https://${ip}`, { method: 'HEAD', signal: ctrl2.signal });
      clearTimeout(t2);
      return { alive: true, http_status: r2.status, server_banner: r2.headers.get('server') || '', tls: true };
    } catch {
      clearTimeout(t2);
      return { alive: false };
    }
  }
}

// Enrich IP via AbuseIPDB
async function enrichAbuseIPDB(ip, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
      headers: { Key: apiKey, Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      abuse_confidence: json.data?.abuseConfidenceScore ?? 0,
      is_tor: json.data?.isTor ?? false,
      usage_type: json.data?.usageType || 'Unknown',
      isp: json.data?.isp || '',
      country: json.data?.countryCode || '',
      total_reports: json.data?.totalReports ?? 0,
    };
  } catch { return null; }
}

// Map host findings to Asset schema fields
function classifyAsset(probe, abuse) {
  const banner = (probe.server_banner || '').toLowerCase();
  let asset_type = 'server';
  let os_platform = 'Unknown';
  let criticality = 'medium';
  let tags = [];

  if (banner.includes('apache') || banner.includes('nginx') || banner.includes('iis')) {
    asset_type = 'application'; tags.push('web-server');
    os_platform = banner.includes('ubuntu') ? 'Ubuntu Linux' : banner.includes('win') ? 'Windows' : 'Linux';
  } else if (banner.includes('ssh')) {
    asset_type = 'server'; tags.push('ssh');
  } else if (banner.includes('router') || banner.includes('cisco') || banner.includes('juniper')) {
    asset_type = 'network_device'; tags.push('network'); criticality = 'high';
  } else if (banner.includes('camera') || banner.includes('hikvision') || banner.includes('dahua')) {
    asset_type = 'iot_device'; tags.push('camera', 'iot'); criticality = 'high';
  } else if (probe.tls) {
    tags.push('tls');
  }

  if (abuse) {
    if (abuse.abuse_confidence > 50) { tags.push('known-malicious'); criticality = 'critical'; }
    else if (abuse.abuse_confidence > 20) { tags.push('suspicious'); criticality = 'high'; }
    if (abuse.is_tor) tags.push('tor-exit');
    if (abuse.isp) tags.push(abuse.isp.toLowerCase().replace(/\s+/g, '-').slice(0, 20));
  }

  return { asset_type, os_platform, criticality, tags };
}

// Initial risk score (0-100)
function calcInitialRiskScore(probe, abuse, classification) {
  let score = 10; // base

  if (abuse) {
    score += Math.min(abuse.abuse_confidence, 40);
    if (abuse.is_tor) score += 15;
    if (abuse.total_reports > 10) score += 10;
  }

  const critScores = { critical: 25, high: 15, medium: 8, low: 3 };
  score += critScores[classification.criticality] || 8;

  if (classification.tags.includes('known-malicious')) score += 20;
  if (classification.tags.includes('camera') || classification.tags.includes('iot')) score += 10;

  return Math.min(Math.round(score), 100);
}

// Find matching ThreatFeed IDs for this asset
function mapThreatFeeds(allFeeds, classification, abuse) {
  const matched = [];
  for (const feed of allFeeds) {
    const ft = feed.feed_type || '';
    const tags = classification.tags;
    if (ft === 'vulnerability' && tags.some(t => ['web-server','ssh','tls'].includes(t))) matched.push(feed.id);
    if (ft === 'ics_ot' && tags.some(t => ['iot','camera','network'].includes(t))) matched.push(feed.id);
    if (ft === 'cyber' && abuse?.abuse_confidence > 20) matched.push(feed.id);
    if (ft === 'compliance') matched.push(feed.id);
  }
  return [...new Set(matched)].slice(0, 5);
}

// ─── Cloud range resolvers (simplified — real impl would call cloud APIs) ────

const CLOUD_RANGES = {
  aws: ['52.0.0.0/11', '54.64.0.0/11', '3.0.0.0/9'],
  azure: ['13.64.0.0/11', '20.0.0.0/8', '40.64.0.0/10'],
  gcp: ['34.0.0.0/9', '35.184.0.0/13', '104.154.0.0/15'],
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      scan_targets = [],     // array of CIDR strings e.g. ["192.168.1.0/24"] or cloud keys ["aws","gcp"]
      dry_run = false,
      max_hosts = 50,        // safety cap
      skip_probe = false,    // skip live probing (for offline/CI use)
    } = body;

    if (!scan_targets.length) {
      return Response.json({ error: 'scan_targets is required (array of CIDRs or cloud provider names)' }, { status: 400 });
    }

    const abuseApiKey = Deno.env.get('ABUSEIPDB_API_KEY');

    // Resolve IPs to scan
    const ipQueue = [];
    for (const target of scan_targets) {
      const cloudRanges = CLOUD_RANGES[target.toLowerCase()];
      if (cloudRanges) {
        for (const cidr of cloudRanges) ipQueue.push(...expandCIDR(cidr).slice(0, 10));
      } else if (target.includes('/')) {
        ipQueue.push(...expandCIDR(target));
      } else {
        // Single IP
        ipQueue.push(target.trim());
      }
    }

    const targets = [...new Set(ipQueue)].slice(0, max_hosts);
    console.log(`[AssetDiscovery] Scanning ${targets.length} hosts from ${scan_targets.join(', ')}`);

    // Load existing assets + threat feeds
    const [existingAssets, allFeeds] = await Promise.all([
      base44.asServiceRole.entities.Asset.list('', 500),
      base44.asServiceRole.entities.ThreatFeed.list('', 100),
    ]);
    const existingIPs = new Set(existingAssets.map(a => a.ip_address).filter(Boolean));

    const results = { discovered: 0, skipped_existing: 0, errors: 0, assets: [] };

    // Probe in batches of 10
    const batchSize = 10;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);

      await Promise.all(batch.map(async (ip) => {
        try {
          if (existingIPs.has(ip)) { results.skipped_existing++; return; }

          let probe = { alive: true };
          if (!skip_probe) probe = await probeHost(ip);
          if (!probe.alive) return; // skip dead hosts

          const abuse = await enrichAbuseIPDB(ip, abuseApiKey);
          const classification = classifyAsset(probe, abuse);
          const risk_score = calcInitialRiskScore(probe, abuse, classification);
          const feedIds = mapThreatFeeds(allFeeds, classification, abuse);

          const assetData = {
            name: `${classification.asset_type.replace(/_/g, '-')}-${ip}`,
            asset_type: classification.asset_type,
            domain: 'digital',
            criticality: classification.criticality,
            ip_address: ip,
            os_platform: classification.os_platform,
            risk_score,
            compliance_status: 'unknown',
            tags: [
              ...classification.tags,
              'auto-discovered',
              ...scan_targets.map(t => `scan:${t}`),
            ],
            notes: [
              `Auto-discovered via ASOSINT Asset Discovery`,
              probe.server_banner ? `Banner: ${probe.server_banner}` : '',
              abuse ? `AbuseIPDB confidence: ${abuse.abuse_confidence}% · Country: ${abuse.country} · ISP: ${abuse.isp}` : '',
              feedIds.length ? `Mapped to ${feedIds.length} threat feed(s)` : '',
            ].filter(Boolean).join('\n'),
            last_assessment: new Date().toISOString(),
          };

          const summary = { ip, risk_score, classification: classification.asset_type, criticality: classification.criticality, tags: classification.tags, mapped_feeds: feedIds.length };

          if (!dry_run) {
            const created = await base44.asServiceRole.entities.Asset.create(assetData);
            summary.asset_id = created.id;

            // Tag matching ThreatFeeds with this asset
            for (const feedId of feedIds) {
              const feed = allFeeds.find(f => f.id === feedId);
              if (feed) {
                const existing = feed.org_scope ? feed.org_scope.split(',') : [];
                if (!existing.includes(ip)) {
                  await base44.asServiceRole.entities.ThreatFeed.update(feedId, {
                    org_scope: [...existing, ip].join(','),
                  });
                }
              }
            }
          }

          results.assets.push(summary);
          results.discovered++;
        } catch (e) {
          console.error(`[AssetDiscovery] Error scanning ${ip}:`, e.message);
          results.errors++;
        }
      }));
    }

    console.log(`[AssetDiscovery] Done — discovered: ${results.discovered}, skipped: ${results.skipped_existing}, errors: ${results.errors}`);

    return Response.json({
      success: true,
      dry_run,
      scan_targets,
      total_probed: targets.length,
      ...results,
    });

  } catch (error) {
    console.error('[AssetDiscovery] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});