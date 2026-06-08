import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let { domains, assets } = await req.json().catch(() => ({}));

    // Fetch user's scan configuration or use provided values
    let scanConfig;
    try {
      const configs = await base44.entities.OsintEntity.filter({
        created_by: user.email,
        entity_type: 'company_asset'
      }, '-created_date', 1);
      if (configs.length > 0) {
        scanConfig = configs[0];
        domains = domains || scanConfig.domains || [];
        assets = assets || scanConfig.asset_names || [];
      }
    } catch (e) {
      // Config not found, use provided values
    }

    // Fallback to user's company/organization info
    if (!domains || domains.length === 0) {
      const userOrg = user.organization || user.company_name;
      if (userOrg) {
        domains = [userOrg.toLowerCase().replace(/\s+/g, '')];
        assets = user.asset_names || [];
      }
    }

    if (!domains || domains.length === 0) {
      return Response.json({ error: 'No domains or assets configured for scanning' }, { status: 400 });
    }

    // Quick dark web mention search using LLM with internet context
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Check dark web sources for mentions of: ${domains.join(', ')}. List any found mentions with source, type (leak/forum/breach), and confidence.`,
      add_context_from_internet: true
    });

    // Parse findings from response
    const hasMentions = result.toLowerCase().includes('found') || result.toLowerCase().includes('mention');
    const severity = result.toLowerCase().includes('critical') ? 'critical' : 
                     result.toLowerCase().includes('high') ? 'high' : 'medium';

    // Create report scoped to user's organization
    if (hasMentions) {
      await base44.entities.IntelligenceReport.create({
        title: `Dark Web Scan: ${domains.join(', ')} - ${new Date().toLocaleDateString()}`,
        report_type: 'situational_awareness',
        classification_level: 'sensitive',
        full_report: result,
        key_findings: [result.substring(0, 500)],
        intel_layers: { osint: result.substring(0, 500) },
        confidence: severity === 'critical' ? 85 : 70,
        time_sensitivity: severity === 'critical' ? 'immediate' : 'hours',
      });
    }

    return Response.json({
      success: true,
      message: 'Dark web scan completed',
      scanned_domains: domains,
      scanned_assets: assets,
      mentions_found: hasMentions,
      severity: severity,
      summary: result.substring(0, 500),
      user_org: user.organization || user.company_name
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});