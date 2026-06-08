import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { feed_id } = body;

    // Get feed config
    const feeds = feed_id
      ? [await base44.entities.ThreatFeed.get(feed_id)]
      : await base44.entities.ThreatFeed.filter({ status: 'active' });

    const results = [];

    for (const feed of feeds) {
      if (!feed?.source_url) continue;

      try {
        let iocs = [];

        // AlienVault OTX
        if (feed.name?.includes('AlienVault OTX') && Deno.env.get('ALIENVAULT_OTX_API_KEY')) {
          const res = await fetch(`https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20`, {
            headers: { 'X-OTX-API-KEY': Deno.env.get('ALIENVAULT_OTX_API_KEY') }
          });
          const data = await res.json();
          for (const pulse of (data.results || []).slice(0, 5)) {
            for (const indicator of (pulse.indicators || []).slice(0, 10)) {
              iocs.push({
                title: `${pulse.name} - ${indicator.indicator}`,
                indicator_type: mapOTXType(indicator.type),
                value: indicator.indicator,
                threat_category: 'cyber',
                severity: 'medium',
                confidence: 70,
                feed_id: feed.id,
                feed_name: feed.name,
                tags: pulse.tags || [],
                status: 'active',
              });
            }
          }
        }

        // Abuse.ch URLhaus
        else if (feed.name?.includes('URLhaus')) {
          const res = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/', { method: 'POST', body: '' });
          const data = await res.json();
          for (const url of (data.urls || []).slice(0, 15)) {
            iocs.push({
              title: `URLhaus - ${url.url}`,
              indicator_type: 'url',
              value: url.url,
              threat_category: 'cyber',
              severity: url.threat === 'malware_download' ? 'high' : 'medium',
              confidence: 80,
              feed_id: feed.id,
              feed_name: feed.name,
              tags: ['malware', 'urlhaus'],
              status: 'active',
            });
          }
        }

        // CISA KEV
        else if (feed.name?.includes('CISA KEV')) {
          const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
          const data = await res.json();
          for (const vuln of (data.vulnerabilities || []).slice(0, 20)) {
            iocs.push({
              title: `KEV: ${vuln.vulnerabilityName}`,
              indicator_type: 'cve',
              value: vuln.cveID,
              threat_category: 'cyber',
              severity: 'high',
              confidence: 95,
              feed_id: feed.id,
              feed_name: feed.name,
              tags: ['kev', 'cisa', 'exploit', vuln.product?.toLowerCase() || ''].filter(Boolean),
              notes: `${vuln.shortDescription} | Patch by: ${vuln.dueDate}`,
              status: 'active',
            });
          }
        }

        // NVD CVE
        else if (feed.name?.includes('NVD CVE')) {
          const res = await fetch('https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=15&startIndex=0');
          const data = await res.json();
          for (const item of (data.vulnerabilities || []).slice(0, 15)) {
            const cve = item.cve;
            const cvssScore = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore;
            const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
            iocs.push({
              title: `NVD: ${cve.id}`,
              indicator_type: 'cve',
              value: cve.id,
              threat_category: 'cyber',
              severity: cvssScore >= 9 ? 'critical' : cvssScore >= 7 ? 'high' : cvssScore >= 4 ? 'medium' : 'low',
              confidence: 90,
              feed_id: feed.id,
              feed_name: feed.name,
              tags: ['nvd', 'cve'],
              notes: desc.slice(0, 300),
              status: 'active',
            });
          }
        }

        // Generic / other feeds — create a summary indicator
        else {
          iocs.push({
            title: `Feed sync: ${feed.name}`,
            indicator_type: 'url',
            value: feed.source_url,
            threat_category: mapFeedTypeToCategory(feed.feed_type),
            severity: 'informational',
            confidence: 50,
            feed_id: feed.id,
            feed_name: feed.name,
            tags: [feed.feed_type],
            notes: `Automated sync from ${feed.name}`,
            status: 'active',
          });
        }

        // Bulk create IOCs, skip duplicates by checking value
        let created = 0;
        for (const ioc of iocs) {
          const existing = await base44.asServiceRole.entities.ThreatIndicator.filter({ value: ioc.value });
          if (existing.length === 0) {
            await base44.asServiceRole.entities.ThreatIndicator.create({
              ...ioc,
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            });
            created++;
          }
        }

        // Update feed last_sync
        await base44.asServiceRole.entities.ThreatFeed.update(feed.id, {
          last_sync: new Date().toISOString(),
          indicators_count: (feed.indicators_count || 0) + created,
        });

        results.push({ feed: feed.name, iocs_found: iocs.length, created });

        // Fire alert if high-severity IOCs found
        const highSeverity = iocs.filter(i => i.severity === 'critical' || i.severity === 'high');
        if (highSeverity.length > 0) {
          await base44.asServiceRole.entities.OsintAlert.create({
            alert_type: 'new_indicator',
            title: `${highSeverity.length} high-severity IOCs ingested from ${feed.name}`,
            description: `Feed ingestion produced ${highSeverity.length} critical/high indicators. Review ThreatIndicators for details.`,
            severity: 'high',
            status: 'new',
            source_agent: 'feed_ingestion',
            triggered_at: new Date().toISOString(),
            tags: [feed.feed_type, 'auto-ingested'],
          });
        }

      } catch (feedErr) {
        results.push({ feed: feed.name, error: feedErr.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapOTXType(type) {
  const map = { IPv4: 'ip_address', IPv6: 'ip_address', domain: 'domain', hostname: 'domain', URL: 'url', FileHash_MD5: 'hash', FileHash_SHA1: 'hash', FileHash_SHA256: 'hash', email: 'email', CVE: 'cve' };
  return map[type] || 'ttps';
}

function mapFeedTypeToCategory(feedType) {
  const map = { cyber: 'cyber', crime: 'crime', geopolitical: 'geopolitical', supply_chain: 'supply_chain', influence: 'influence', insider_threat: 'insider_threat' };
  return map[feedType] || 'cyber';
}