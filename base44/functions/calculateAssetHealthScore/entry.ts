import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assetId } = await req.json();
    if (!assetId) {
      return Response.json({ error: 'assetId required' }, { status: 400 });
    }

    // Fetch the asset to verify access
    const assets = await base44.entities.Asset.filter({ id: assetId }, '-created_date', 1);
    if (assets.length === 0) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const asset = assets[0];
    if (asset.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch associated vulnerabilities
    const vulnerabilities = await base44.entities.VulnerabilityFinding.filter({
      affected_asset: asset.name || assetId
    }, '-created_date', 100);

    // Fetch associated intelligence reports
    const intelReports = await base44.entities.IntelligenceReport.filter({
      scanned_assets: asset.name || assetId
    }, '-created_date', 100);

    // Severity weights (points to deduct)
    const vulnWeights = {
      critical: 30,
      high: 15,
      medium: 5,
      low: 2
    };

    const intelWeights = {
      critical: 20,
      high: 10,
      medium: 3,
      low: 1
    };

    // Calculate score (start at 100, deduct for issues)
    let score = 100;

    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      const severity = vuln.severity?.toLowerCase() || 'medium';
      score -= vulnWeights[severity] || 0;
    });

    // Deduct points for intelligence reports
    intelReports.forEach(report => {
      const severity = report.severity?.toLowerCase() || 'medium';
      score -= intelWeights[severity] || 0;
    });

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine health status
    let status = 'excellent';
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'fair';
    else if (score >= 40) status = 'poor';
    else status = 'critical';

    return Response.json({
      success: true,
      assetId: assetId,
      assetName: asset.name,
      healthScore: score,
      status: status,
      vulnerabilityCount: vulnerabilities.length,
      criticalVulns: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'critical').length,
      highVulns: vulnerabilities.filter(v => v.severity?.toLowerCase() === 'high').length,
      intelReportCount: intelReports.length,
      criticalReports: intelReports.filter(r => r.severity?.toLowerCase() === 'critical').length,
      breakdown: {
        vulnerabilities: vulnerabilities.length,
        intelligenceReports: intelReports.length,
        totalThreats: vulnerabilities.length + intelReports.length
      }
    });

  } catch (error) {
    console.error('Health score calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});