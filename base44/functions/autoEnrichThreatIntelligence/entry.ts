import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled/automated enrichment function that continuously pulls from external feeds
 * and updates ThreatIndicator, ThreatActor, and Campaign records with fresh data.
 * 
 * Runs periodically to keep threat data fresh without manual intervention.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow both admin-triggered and scheduled (no strict auth required for scheduled)
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAdmin = true;
    } catch (_) {}

    const vt_key = Deno.env.get('VIRUSTOTAL_API_KEY');
    const abuseipdb_key = Deno.env.get('ABUSEIPDB_API_KEY');
    const otx_key = Deno.env.get('ALIENVAULT_OTX_API_KEY');

    if (!vt_key || !abuseipdb_key || !otx_key) {
      return Response.json({ error: 'Missing threat intelligence API keys' }, { status: 500 });
    }

    // Fetch recent indicators lacking enrichment
    const indicators = await base44.asServiceRole.entities.ThreatIndicator.list('-created_date', 20);
    const actorsToEnrich = await base44.asServiceRole.entities.ThreatActor.list('-last_active', 10);

    let enrichedCount = 0;
    let failedCount = 0;

    // Enrich indicators
    for (const ind of indicators) {
      try {
        if (ind.indicator_type === 'ip_address' || ind.indicator_type === 'domain') {
          // Call master enrichment function
          const enrichRes = await base44.asServiceRole.functions.invoke('enrichThreatIntelligenceFeeds', {
            indicator_id: ind.id,
            indicator_type: ind.indicator_type,
            indicator_value: ind.value,
          });

          if (enrichRes?.data?.success) {
            enrichedCount += enrichRes.data.enriched;
            failedCount += enrichRes.data.failed;
          }
        }
      } catch (e) {
        failedCount++;
      }
    }

    // Pull new pulses from AlienVault OTX and create indicators
    try {
      const otxPulses = await fetchLatestOTXPulses(otx_key);
      for (const pulse of otxPulses.slice(0, 5)) {
        // Check if we already have this
        const existing = await base44.asServiceRole.entities.ThreatIndicator.filter({
          tags: pulse.id,
        }).catch(() => []);

        if (existing.length === 0) {
          // Create new indicators from pulse
          for (const indicator of pulse.indicators.slice(0, 3)) {
            await base44.asServiceRole.entities.ThreatIndicator.create({
              title: `OTX Pulse: ${pulse.name}`,
              indicator_type: indicator.type,
              value: indicator.indicator,
              threat_category: 'cyber',
              severity: pulse.tlp === 'white' ? 'low' : pulse.tlp === 'green' ? 'medium' : 'high',
              confidence: 75,
              feed_name: 'AlienVault OTX',
              tags: [pulse.id, 'otx', pulse.tlp],
              status: 'active',
              notes: pulse.description,
            });
          }
        }
      }
    } catch (e) {}

    return Response.json({
      success: true,
      enriched: enrichedCount,
      failed: failedCount,
      new_otx_indicators: 'processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchLatestOTXPulses(apiKey) {
  try {
    const res = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
      headers: { 'X-OTX-API-KEY': apiKey },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.results || [];
  } catch {
    return [];
  }
}