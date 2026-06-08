import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function detectType(indicator) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const hash = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;
  const url = /^https?:\/\//i;
  if (ipv4.test(indicator.trim())) return 'ip';
  if (hash.test(indicator.trim())) return 'hash';
  if (url.test(indicator.trim())) return 'url';
  return 'domain';
}

async function scanVirusTotal(indicator, type) {
  const apiKey = Deno.env.get("VIRUSTOTAL_API_KEY");
  if (!apiKey) return null;
  let endpoint;
  if (type === 'ip') endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(indicator)}`;
  else if (type === 'hash') endpoint = `https://www.virustotal.com/api/v3/files/${indicator}`;
  else if (type === 'url') {
    const id = btoa(indicator).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    endpoint = `https://www.virustotal.com/api/v3/urls/${id}`;
  } else {
    endpoint = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(indicator)}`;
  }
  const res = await fetch(endpoint, { headers: { 'x-apikey': apiKey } });
  if (!res.ok) return null;
  const json = await res.json();
  const stats = json?.data?.attributes?.last_analysis_stats || {};
  const malicious = stats.malicious || 0;
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return {
    source: 'VirusTotal',
    title: `VirusTotal: ${malicious}/${total} engines flagged`,
    description: `Malicious: ${stats.malicious || 0}, Suspicious: ${stats.suspicious || 0}, Harmless: ${stats.harmless || 0}, Undetected: ${stats.undetected || 0}`,
    severity: malicious > 10 ? 'critical' : malicious > 5 ? 'high' : malicious > 0 ? 'medium' : 'low',
    raw: { malicious, suspicious: stats.suspicious || 0, harmless: stats.harmless || 0, total },
    link: `https://www.virustotal.com/gui/${type === 'hash' ? 'file' : type === 'ip' ? 'ip-address' : type === 'url' ? 'url' : 'domain'}/${indicator}`
  };
}

async function scanOTX(indicator, type) {
  const apiKey = Deno.env.get("ALIENVAULT_OTX_API_KEY");
  if (!apiKey) return null;
  const typeMap = { ip: 'IPv4', domain: 'domain', url: 'url', hash: 'file' };
  const otxType = typeMap[type] || 'domain';
  const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/${otxType}/${encodeURIComponent(indicator)}/general`, {
    headers: { 'X-OTX-API-KEY': apiKey }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const pulseCount = json?.pulse_info?.count || 0;
  const pulses = (json?.pulse_info?.pulses || []).slice(0, 3).map(p => p.name).join(', ');
  return {
    source: 'AlienVault OTX',
    title: `OTX: ${pulseCount} threat pulse${pulseCount !== 1 ? 's' : ''} found`,
    description: pulseCount > 0 ? `Referenced in: ${pulses || 'threat intelligence pulses'}` : 'No threat pulses found for this indicator.',
    severity: pulseCount > 10 ? 'critical' : pulseCount > 3 ? 'high' : pulseCount > 0 ? 'medium' : 'low',
    raw: { pulse_count: pulseCount, validation: json?.validation || [], reputation: json?.reputation },
    link: `https://otx.alienvault.com/indicator/${otxType}/${encodeURIComponent(indicator)}`
  };
}

async function scanAbuseIPDB(indicator) {
  const apiKey = Deno.env.get("ABUSEIPDB_API_KEY");
  if (!apiKey) return null;
  const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(indicator)}&maxAgeInDays=90&verbose`, {
    headers: { 'Key': apiKey, 'Accept': 'application/json' }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const data = json?.data || {};
  const score = data.abuseConfidenceScore || 0;
  return {
    source: 'AbuseIPDB',
    title: `AbuseIPDB: ${score}% abuse confidence score`,
    description: `Total reports: ${data.totalReports || 0} | Country: ${data.countryCode || 'N/A'} | ISP: ${data.isp || 'N/A'} | Domain: ${data.domain || 'N/A'}`,
    severity: score > 80 ? 'critical' : score > 50 ? 'high' : score > 20 ? 'medium' : 'low',
    raw: { abuseConfidenceScore: score, totalReports: data.totalReports, countryCode: data.countryCode, isp: data.isp, usageType: data.usageType },
    link: `https://www.abuseipdb.com/check/${indicator}`
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { indicator } = await req.json();
    if (!indicator?.trim()) return Response.json({ error: 'No indicator provided' }, { status: 400 });

    const type = detectType(indicator.trim());

    // Run applicable scans in parallel
    const promises = [
      scanVirusTotal(indicator.trim(), type),
      scanOTX(indicator.trim(), type),
    ];
    if (type === 'ip') promises.push(scanAbuseIPDB(indicator.trim()));

    const scanResults = await Promise.allSettled(promises);
    const results = scanResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    return Response.json({ indicator: indicator.trim(), type, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});