import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VT_API_KEY = Deno.env.get("VIRUSTOTAL_API_KEY");
const ABUSE_API_KEY = Deno.env.get("ABUSEIPDB_API_KEY");

const PRIORITY_ORDER = ["hash", "domain", "url", "ip_address"];
const BATCH_SIZE = 4;
const VT_DELAY_MS = 15000; // 15s between VT calls

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichWithVirusTotal(indicator) {
  const { indicator_type, value } = indicator;
  let endpoint = "";

  if (indicator_type === "hash") {
    endpoint = `https://www.virustotal.com/api/v3/files/${encodeURIComponent(value)}`;
  } else if (indicator_type === "domain") {
    endpoint = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(value)}`;
  } else if (indicator_type === "url") {
    const encoded = btoa(value).replace(/=/g, "");
    endpoint = `https://www.virustotal.com/api/v3/urls/${encoded}`;
  } else {
    return null;
  }

  const res = await fetch(endpoint, {
    headers: { "x-apikey": VT_API_KEY },
  });

  if (!res.ok) return { error: `VT HTTP ${res.status}`, status_code: res.status };
  return await res.json();
}

async function enrichWithAbuseIPDB(ip) {
  const res = await fetch(
    `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose`,
    {
      headers: {
        "Key": ABUSE_API_KEY,
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) return { error: `AbuseIPDB HTTP ${res.status}`, status_code: res.status };
  return await res.json();
}

function deriveSeverity(enrichmentData, indicator_type) {
  try {
    if (indicator_type === "ip_address") {
      const score = enrichmentData?.data?.abuseConfidenceScore ?? 0;
      if (score >= 80) return "critical";
      if (score >= 50) return "high";
      if (score >= 20) return "medium";
      return "low";
    }
    // VirusTotal
    const stats = enrichmentData?.data?.attributes?.last_analysis_stats;
    if (!stats) return null;
    const malicious = (stats.malicious || 0) + (stats.suspicious || 0);
    if (malicious >= 20) return "critical";
    if (malicious >= 10) return "high";
    if (malicious >= 3) return "medium";
    if (malicious >= 1) return "low";
    return "informational";
  } catch {
    return null;
  }
}

async function logAudit(base44, action, entity_id, details) {
  await base44.asServiceRole.entities.AgentAuditLog.create({
    action,
    entity_type: "ThreatIndicator",
    entity_id,
    details: typeof details === "string" ? details : JSON.stringify(details),
    performed_by: "ASOSINT Enrichment Agent",
    performed_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json().catch(() => ({}));
  const batchSize = body.batch_size || BATCH_SIZE;
  const dryRun = body.dry_run || false;

  // Fetch active indicators in priority order
  const allIndicators = [];
  for (const itype of PRIORITY_ORDER) {
    try {
      const results = await base44.asServiceRole.entities.ThreatIndicator.filter(
        { status: "active", indicator_type: itype },
        "-created_date",
        100
      );
      if (Array.isArray(results)) allIndicators.push(...results);
    } catch (e) {
      console.error(`Failed to fetch indicators for type ${itype}:`, e.message);
    }
  }

  const batch = allIndicators.slice(0, batchSize);

  if (batch.length === 0) {
    return Response.json({ message: "No active indicators to enrich.", processed: 0 });
  }

  const results = [];

  for (const indicator of batch) {
    if (!indicator || !indicator.id) continue;
    // SDK returns flat objects - fields are directly on the indicator
    const id = indicator.id;
    const indicator_type = indicator.indicator_type;
    const value = indicator.value;

    if (!indicator_type || !value) continue;

    if (dryRun) {
      results.push({ id, value, indicator_type, dry_run: true });
      continue;
    }

    let enrichmentData = null;
    let enrichTag = null;
    let apiError = null;

    try {
      if (indicator_type === "ip_address") {
        enrichmentData = await enrichWithAbuseIPDB(value);
        enrichTag = "abuseipdb_enriched";
      } else {
        enrichmentData = await enrichWithVirusTotal({ indicator_type, value });
        enrichTag = "vt_enriched";
        await sleep(VT_DELAY_MS);
      }
    } catch (err) {
      apiError = err.message;
      await logAudit(base44, "ENRICHMENT_ERROR", id, { value, indicator_type, error: apiError });
      results.push({ id, value, indicator_type, error: apiError });
      continue;
    }

    if (enrichmentData?.error) {
      await logAudit(base44, "ENRICHMENT_API_ERROR", id, { value, indicator_type, ...enrichmentData });
      results.push({ id, value, indicator_type, api_error: enrichmentData.error });
      continue;
    }

    const newSeverity = deriveSeverity(enrichmentData, indicator_type);
    const existingTags = indicator.tags || [];
    const updatedTags = Array.from(new Set([...existingTags, enrichTag]));

    const updatePayload = {
      status: "enriched",
      enrichment_data: JSON.stringify(enrichmentData),
      tags: updatedTags,
      last_seen: new Date().toISOString(),
    };

    const severityRank = { informational: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const currentRank = severityRank[indicator.severity] ?? 0;
    const newRank = severityRank[newSeverity] ?? 0;
    if (newSeverity && newRank > currentRank) {
      updatePayload.severity = newSeverity;
    }

    await base44.asServiceRole.entities.ThreatIndicator.update(id, updatePayload);

    await logAudit(base44, "ENRICHMENT_SUCCESS", id, {
      value,
      indicator_type,
      source: enrichTag,
      severity_before: indicator.severity,
      severity_after: updatePayload.severity || indicator.severity,
      tags_added: [enrichTag],
    });

    results.push({
      id,
      value,
      indicator_type,
      source: enrichTag,
      severity_before: indicator.severity,
      severity_after: updatePayload.severity || indicator.severity,
      success: true,
    });
  }

  return Response.json({
    message: `Enrichment batch complete. Processed ${results.length} indicator(s).`,
    processed: results.length,
    results,
    remaining_estimate: Math.max(0, allIndicators.length - batchSize),
  });
});