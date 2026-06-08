import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * POST /api/ingest-telemetry
 * Unified webhook ingest gateway for ThreatEvent standardization.
 * Accepts raw JSON from OSINT tools, SIEM, physical sensors, EDR, etc.
 * Normalizes into the ThreatEvent schema and saves to the database.
 *
 * Authentication: Validates X-ASOSINT-Key header matches ASOSINT_PhD secret.
 */

const SEVERITY_THRESHOLDS = [
  { min: 85, label: 'critical' },
  { min: 65, label: 'high' },
  { min: 40, label: 'medium' },
  { min: 15, label: 'low' },
  { min: 0,  label: 'informational' },
];

function scoreToDomain(score, raw) {
  const text = JSON.stringify(raw).toLowerCase();
  if (text.includes('physical') || text.includes('access') || text.includes('camera') || text.includes('sensor')) return 'physical';
  if (text.includes('influence') || text.includes('disinfo') || text.includes('narrative')) return 'influence';
  if (text.includes('geopolit') || text.includes('nation-state')) return 'geopolitical';
  return 'cyber';
}

function normalizeSeverity(score) {
  return SEVERITY_THRESHOLDS.find(t => score >= t.min)?.label ?? 'informational';
}

function normalizeSourceTool(raw) {
  const KNOWN = ['osint', 'shodan', 'virustotal', 'alienvault', 'siem', 'physical_sensor', 'ip_camera', 'access_control', 'netflow', 'edr'];
  const lower = (raw || '').toLowerCase().replace(/[^a-z_]/g, '_');
  return KNOWN.includes(lower) ? lower : 'custom_webhook';
}

function extractLocationData(payload) {
  // Attempt to find geo data in common vendor payload shapes
  const geo = payload.geo ?? payload.location ?? payload.location_data ?? payload.geolocation ?? {};
  return {
    lat: geo.lat ?? geo.latitude ?? null,
    lng: geo.lng ?? geo.lon ?? geo.longitude ?? null,
    city: geo.city ?? payload.city ?? null,
    country: geo.country ?? payload.country_code ?? payload.country ?? null,
    region: geo.region ?? geo.state ?? null,
    ip_address: payload.ip ?? payload.src_ip ?? payload.source_ip ?? geo.ip ?? null,
  };
}

function extractIndicators(payload) {
  const iocs = [];
  if (payload.ip || payload.src_ip) iocs.push({ type: 'ip', value: payload.ip || payload.src_ip });
  if (payload.domain) iocs.push({ type: 'domain', value: payload.domain });
  if (payload.hash || payload.file_hash) iocs.push({ type: 'hash', value: payload.hash || payload.file_hash });
  if (payload.url) iocs.push({ type: 'url', value: payload.url });
  if (payload.email) iocs.push({ type: 'email', value: payload.email });
  if (payload.cve) iocs.push({ type: 'cve', value: payload.cve });
  if (Array.isArray(payload.indicators)) {
    payload.indicators.forEach(i => {
      if (i.type && i.value) iocs.push(i);
    });
  }
  return iocs;
}

function deriveScore(payload) {
  // Accept explicit score in various field names
  const raw = payload.threat_score ?? payload.score ?? payload.risk_score ?? payload.severity_score ?? null;
  if (raw !== null) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) return Math.max(1, Math.min(100, parsed));
  }
  // Fallback: map severity string to score
  const sev = (payload.severity ?? payload.alert_level ?? '').toLowerCase();
  const map = { critical: 90, high: 70, medium: 45, low: 20, info: 10, informational: 10 };
  return map[sev] ?? 50;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
  }

  // Validate shared secret for webhook sources (skip if called via SDK with user token)
  const apiKey = req.headers.get('X-ASOSINT-Key') || req.headers.get('x-asosint-key');
  const expectedKey = Deno.env.get('ASOSINT_PhD');
  const isWebhookAuth = apiKey && expectedKey && apiKey === expectedKey;

  // Initialize SDK for user-token auth path
  const base44 = createClientFromRequest(req);

  if (!isWebhookAuth) {
    // Fall back to checking authenticated user session
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized: provide X-ASOSINT-Key header or valid session' }, { status: 401 });
    }
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400, headers: CORS_HEADERS });
  }

  // Support single event or batch array
  const events = Array.isArray(body) ? body : [body];
  if (events.length === 0) {
    return Response.json({ error: 'Empty payload' }, { status: 400, headers: CORS_HEADERS });
  }
  if (events.length > 100) {
    return Response.json({ error: 'Batch limit is 100 events per request' }, { status: 400, headers: CORS_HEADERS });
  }

  const now = new Date().toISOString();
  const saved = [];
  const errors = [];

  for (const payload of events) {
    try {
      const threatScore = deriveScore(payload);
      const sourceTool = normalizeSourceTool(payload.source_tool ?? payload.source ?? payload.tool ?? '');
      const locationData = extractLocationData(payload);
      const indicators = extractIndicators(payload);
      const severity = normalizeSeverity(threatScore);
      const domain = scoreToDomain(threatScore, payload);

      const eventRecord = {
        event_id: payload.event_id ?? payload.id ?? crypto.randomUUID(),
        timestamp: payload.timestamp ?? payload.occurred_at ?? payload.event_time ?? now,
        ingested_at: now,
        source_tool: sourceTool,
        source_raw: payload.source ?? payload.source_tool ?? payload.tool ?? 'unknown',
        threat_score: threatScore,
        severity,
        status: 'new',
        domain,
        title: payload.title ?? payload.alert_title ?? payload.name ?? payload.message ?? `${sourceTool.toUpperCase()} Alert`,
        description: payload.description ?? payload.details ?? payload.body ?? '',
        location_data: locationData,
        indicators,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        mitre_tactics: Array.isArray(payload.mitre_tactics) ? payload.mitre_tactics : [],
        raw_payload: JSON.stringify(payload),
      };

      const created = await base44.asServiceRole.entities.ThreatEvent.create(eventRecord);
      saved.push({ id: created.id, event_id: eventRecord.event_id, threat_score: threatScore, severity });

      // ── Escalation sequence: score ≥ 80 ──────────────────────────────────
      if (threatScore >= 80) {
        const escalationPayload = {
          event_id: eventRecord.event_id,
          title: eventRecord.title,
          threat_score: threatScore,
          severity,
          domain,
          source_tool: sourceTool,
          location_data: locationData,
          indicators,
          timestamp: eventRecord.timestamp,
          ingested_at: now,
          database_id: created.id,
          escalation_reason: `Threat score ${threatScore} meets or exceeds escalation threshold (80)`,
        };

        // Fire-and-forget fan-out to all sentinel nodes — never blocks ingest
        const sharedKey = Deno.env.get('ASOSINT_PhD') ?? '';
        const nodes = [
          { envKey: 'IZULU_API_URL',        fallback: 'https://izulusentinel.com',          path: '/api/receive-escalation' },
          { envKey: 'OUTPOST_ZERO_API_URL',  fallback: 'https://outpost-zero.eds-360.com',   path: '/api/receive-escalation' },
          { envKey: 'ACHE_COMPLIANCE_API_URL', fallback: 'https://ache-compliance.eds-360.com', path: '/api/receive-escalation' },
        ];
        for (const node of nodes) {
          const base = (Deno.env.get(node.envKey) ?? node.fallback).replace(/\/$/, '');
          fetch(`${base}${node.path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-ASOSINT-Key': sharedKey },
            body: JSON.stringify(escalationPayload),
          }).catch(() => {});
        }
      }
    } catch (err) {
      errors.push({ payload_index: events.indexOf(payload), error: err.message });
    }
  }

  return Response.json({
    status: errors.length === 0 ? 'ok' : 'partial',
    ingested: saved.length,
    failed: errors.length,
    events: saved,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now,
  }, { status: errors.length === events.length ? 500 : 200, headers: CORS_HEADERS });
});