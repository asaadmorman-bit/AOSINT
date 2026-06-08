import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Dynamically calculates a risk score (0–100) for one or all assets based on:
 *   - Asset criticality (base weight)
 *   - Open critical / high vulnerability count
 *   - Threat intel matches (actively exploited CVEs on the asset)
 *   - Compliance status penalty
 *
 * Payload (all optional):
 *   asset_ids  – array of specific asset IDs to score (default: all)
 *
 * Updates Asset.risk_score in place and returns per-asset results.
 */

const CRITICALITY_BASE = { critical: 40, high: 30, medium: 18, low: 8 };
const COMPLIANCE_PENALTY = { non_compliant: 10, partial: 5, unknown: 3, compliant: 0 };

function computeRiskScore({ criticality, criticalVulns, highVulns, activelyExploitedCount, complianceStatus }) {
  let score = CRITICALITY_BASE[criticality] ?? 18;

  // Vulnerabilities — cap contribution to avoid runaway scores
  score += Math.min(criticalVulns * 8, 32);   // up to +32 for critical vulns
  score += Math.min(highVulns * 4, 16);        // up to +16 for high vulns

  // Threat intel: actively exploited findings on this asset
  score += Math.min(activelyExploitedCount * 6, 12);

  // Compliance penalty
  score += COMPLIANCE_PENALTY[complianceStatus] ?? 3;

  return Math.min(100, Math.round(score));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Support both authenticated user calls and scheduled/service calls
    try {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    } catch (_) {
      // Scheduler / service-role invocation — allow
    }

    const body = await req.json().catch(() => ({}));
    const { asset_ids = [] } = body;

    // Fetch target assets
    let assets;
    if (asset_ids.length > 0) {
      assets = (await Promise.all(
        asset_ids.map(id => base44.asServiceRole.entities.Asset.filter({ id }).catch(() => []))
      )).flat().filter(Boolean);
    } else {
      assets = await base44.asServiceRole.entities.Asset.list('', 500).catch(() => []);
    }

    if (!assets.length) {
      return Response.json({ status: 'skipped', reason: 'No assets found' });
    }

    // Fetch all open vulnerability findings for these assets in one shot
    const openFindings = await base44.asServiceRole.entities.VulnerabilityFinding
      .filter({ status: 'open' }, '', 1000)
      .catch(() => []);

    // Group findings by asset_id
    const findingsByAsset = {};
    openFindings.forEach(f => {
      if (!findingsByAsset[f.asset_id]) findingsByAsset[f.asset_id] = [];
      findingsByAsset[f.asset_id].push(f);
    });

    // Score each asset and persist
    const results = [];
    await Promise.all(assets.map(async (asset) => {
      const findings = findingsByAsset[asset.id] || [];
      const criticalVulns = findings.filter(f => f.severity === 'critical').length;
      const highVulns = findings.filter(f => f.severity === 'high').length;
      const activelyExploitedCount = findings.filter(f => f.actively_exploited || f.threat_intel_match).length;

      const risk_score = computeRiskScore({
        criticality: asset.criticality,
        criticalVulns,
        highVulns,
        activelyExploitedCount,
        complianceStatus: asset.compliance_status,
      });

      await base44.asServiceRole.entities.Asset.update(asset.id, {
        risk_score,
        vulnerabilities_count: findings.length,
        last_assessment: new Date().toISOString(),
      }).catch(() => null);

      results.push({
        asset_id: asset.id,
        asset_name: asset.name,
        criticality: asset.criticality,
        risk_score,
        critical_vulns: criticalVulns,
        high_vulns: highVulns,
        actively_exploited: activelyExploitedCount,
        open_findings: findings.length,
      });
    }));

    results.sort((a, b) => b.risk_score - a.risk_score);

    return Response.json({
      status: 'completed',
      assets_scored: results.length,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});