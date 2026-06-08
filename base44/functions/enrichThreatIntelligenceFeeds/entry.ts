import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Master enrichment function that pulls threat intelligence from:
 * - VirusTotal: file/URL/domain reputation
 * - AbuseIPDB: IP abuse reports and reputation scores
 * - AlienVault OTX: open threat exchange pulses and indicators
 * 
 * Enriches existing ThreatIndicator records and updates with external data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { indicator_id, indicator_type, indicator_value, limit = 10 } = body;

    const vt_key = Deno.env.get('VIRUSTOTAL_API_KEY');
    const abuseipdb_key = Deno.env.get('ABUSEIPDB_API_KEY');
    const otx_key = Deno.env.get('ALIENVAULT_OTX_API_KEY');

    if (!vt_key || !abuseipdb_key || !otx_key) {
      return Response.json({ error: 'Missing threat intelligence API keys' }, { status: 500 });
    }

    let indicators = [];
    
    // If specific indicator provided, enrich just that one
    if (indicator_id) {
      const ind = await base44.entities.ThreatIndicator.filter({ id: indicator_id });
      indicators = ind;
    } else {
      // Otherwise, get recent indicators that lack enrichment
      const allIndicators = await base44.entities.ThreatIndicator.list('-created_date', limit);
      indicators = allIndicators;
    }

    const enriched = [];
    const failed = [];

    for (const ind of indicators) {
      try {
        const enrichmentData = {};
        let newConfidence = ind.confidence || 50;

        // Enrich based on indicator type
        if (['ip_address', 'domain'].includes(ind.indicator_type)) {
          // AbuseIPDB for IPs
          if (ind.indicator_type === 'ip_address') {
            const abuseRes = await enrichFromAbuseIPDB(ind.value, abuseipdb_key);
            if (abuseRes.success) {
              enrichmentData.abuseipdb = abuseRes.data;
              newConfidence = Math.min(100, newConfidence + (abuseRes.data.abuseConfidenceScore || 0) / 5);
            }
          }

          // VirusTotal for domains/IPs
          const vtRes = await enrichFromVirusTotal(ind.value, ind.indicator_type, vt_key);
          if (vtRes.success) {
            enrichmentData.virustotal = vtRes.data;
            const vtDetections = vtRes.data.last_analysis_stats?.malicious || 0;
            if (vtDetections > 0) {
              newConfidence = Math.min(100, newConfidence + (vtDetections * 5));
            }
          }
        }

        // AlienVault OTX for all types
        const otxRes = await enrichFromOTX(ind.value, otx_key);
        if (otxRes.success) {
          enrichmentData.alienvault_otx = otxRes.data;
          if (otxRes.data.pulse_count > 0) {
            newConfidence = Math.min(100, newConfidence + Math.min(20, otxRes.data.pulse_count * 2));
          }
        }

        // Update indicator with enrichment data
        const updated = await base44.entities.ThreatIndicator.update(ind.id, {
          enrichment_data: JSON.stringify(enrichmentData),
          confidence: Math.round(newConfidence),
        });

        enriched.push({
          id: ind.id,
          value: ind.value,
          new_confidence: Math.round(newConfidence),
          enrichment_sources: Object.keys(enrichmentData),
        });
      } catch (error) {
        failed.push({
          id: ind.id,
          value: ind.value,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      enriched: enriched.length,
      failed: failed.length,
      results: {
        enriched,
        failed,
        sources: {
          virustotal: vt_key ? 'enabled' : 'disabled',
          abuseipdb: abuseipdb_key ? 'enabled' : 'disabled',
          alienvault_otx: otx_key ? 'enabled' : 'disabled',
        },
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enrichFromVirusTotal(value, type, apiKey) {
  try {
    let endpoint = '';
    if (type === 'ip_address') {
      endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${value}`;
    } else if (type === 'domain') {
      endpoint = `https://www.virustotal.com/api/v3/domains/${value}`;
    } else if (type === 'hash') {
      endpoint = `https://www.virustotal.com/api/v3/files/${value}`;
    } else if (type === 'url') {
      // URL requires encoding
      const encoded = btoa(value).replace(/=/g, '');
      endpoint = `https://www.virustotal.com/api/v3/urls/${encoded}`;
    } else {
      return { success: false, data: null };
    }

    const res = await fetch(endpoint, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      return { success: false, data: null };
    }

    if (!res.ok) {
      return { success: false, data: null };
    }

    const json = await res.json();
    const data = json.data || json;

    return {
      success: true,
      data: {
        last_analysis_stats: data.attributes?.last_analysis_stats || {},
        last_analysis_date: data.attributes?.last_analysis_date,
        reputation: data.attributes?.reputation || 0,
        categories: data.attributes?.categories || {},
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function enrichFromAbuseIPDB(ip, apiKey) {
  try {
    const res = await fetch('https://api.abuseipdb.com/api/v2/check', {
      method: 'POST',
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        ipAddress: ip,
        maxAgeInDays: 90,
      }).toString(),
    });

    if (!res.ok) {
      return { success: false, data: null };
    }

    const json = await res.json();
    const ipData = json.data || {};

    return {
      success: true,
      data: {
        abuseConfidenceScore: ipData.abuseConfidenceScore || 0,
        totalReports: ipData.totalReports || 0,
        usageType: ipData.usageType,
        isp: ipData.isp,
        domain: ipData.domain,
        countryCode: ipData.countryCode,
        isWhitelisted: ipData.isWhitelisted || false,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function enrichFromOTX(value, apiKey) {
  try {
    let endpoint = '';

    // Determine indicator type and build endpoint
    if (value.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      endpoint = `https://otx.alienvault.com/api/v1/indicators/IPv4/${value}/general`;
    } else if (value.match(/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/)) {
      endpoint = `https://otx.alienvault.com/api/v1/indicators/file/${value}/general`;
    } else if (value.match(/^https?:\/\//)) {
      endpoint = `https://otx.alienvault.com/api/v1/indicators/url/${encodeURIComponent(value)}/general`;
    } else {
      endpoint = `https://otx.alienvault.com/api/v1/indicators/domain/${value}/general`;
    }

    const res = await fetch(endpoint, {
      headers: { 'X-OTX-API-KEY': apiKey },
    });

    if (res.status === 404) {
      return { success: false, data: { pulse_count: 0 } };
    }

    if (!res.ok) {
      return { success: false, data: null };
    }

    const json = await res.json();

    return {
      success: true,
      data: {
        pulse_count: json.pulse_info?.count || 0,
        indicator: json.indicator,
        type: json.type,
        validation: json.validation || [],
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}