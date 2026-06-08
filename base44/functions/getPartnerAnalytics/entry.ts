import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Partner Analytics
 * Provides dashboard data for partner portal
 * Aggregates deals, revenue, commissions, usage
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const partner_id = url.searchParams.get("partner_id");

    if (!partner_id) {
      return Response.json({ error: "partner_id required" }, { status: 400 });
    }

    // Fetch partner
    const partner = await base44.asServiceRole.entities.Partner.filter({
      id: partner_id
    }).then(r => r[0]);

    if (!partner) {
      return Response.json({ error: "Partner not found" }, { status: 404 });
    }

    // Fetch deals
    const deals = await base44.asServiceRole.entities.Deal.filter({
      partner_id
    });

    const closedWonDeals = deals.filter(d => d.status === "closed_won");
    const pipelineDeals = deals.filter(d => d.status === "in_progress" || d.status === "approved");

    // Calculate metrics
    const totalDeals = deals.length;
    const closedWonCount = closedWonDeals.length;
    const pipelineCount = pipelineDeals.length;
    const pipelineValue = pipelineDeals.reduce((sum, d) => sum + (d.estimated_arr_usd || 0), 0);
    const closedWonRevenue = closedWonDeals.reduce((sum, d) => sum + (d.actual_arr_usd || 0), 0);

    // Fetch commissions
    const commissions = await base44.asServiceRole.entities.PartnerCommission.filter({
      partner_id
    });

    const totalCommissions = commissions
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + (c.commission_amount_usd || 0), 0);

    const accruedCommissions = commissions
      .filter(c => c.status === "accrued")
      .reduce((sum, c) => sum + (c.commission_amount_usd || 0), 0);

    // Fetch certifications
    const certifications = await base44.asServiceRole.entities.PartnerCertification.filter({
      partner_id
    });

    const certsByType = {};
    certifications.forEach(c => {
      if (!certsByType[c.certification_type]) certsByType[c.certification_type] = { passed: 0, total: 0 };
      certsByType[c.certification_type].total++;
      if (c.status === "passed") certsByType[c.certification_type].passed++;
    });

    // Fetch activities (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const recentActivities = await base44.asServiceRole.entities.PartnerActivity.filter({
      partner_id
    });

    const activitySummary = {};
    recentActivities.forEach(a => {
      if (new Date(a.occurred_at) > new Date(thirtyDaysAgo)) {
        activitySummary[a.activity_type] = (activitySummary[a.activity_type] || 0) + 1;
      }
    });

    return Response.json({
      partner: {
        id: partner.id,
        name: partner.company_name,
        tier: partner.tier,
        type: partner.partner_type,
      },
      deals: {
        total: totalDeals,
        closed_won: closedWonCount,
        in_pipeline: pipelineCount,
        pipeline_value_usd: pipelineValue,
        closed_won_revenue_usd: closedWonRevenue,
      },
      commissions: {
        total_paid_usd: totalCommissions,
        accrued_usd: accruedCommissions,
        ytd_total: partner.ytd_commissions_usd || 0,
      },
      tenants: {
        active_count: partner.active_tenant_count || 0,
      },
      certifications: certsByType,
      recent_activity_30d: activitySummary,
      last_updated: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Partner analytics error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});