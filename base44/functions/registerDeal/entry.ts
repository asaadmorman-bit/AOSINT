import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Deal Registration
 * Partners register customer opportunities
 * Enforces tier gating (Silver+ only)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      partner_id, opportunity_name, customer_name, customer_industry,
      customer_size, deal_type, tier_required, estimated_arr_usd,
      expected_close_date, co_sell_partner_id
    } = body;

    if (!partner_id || !opportunity_name || !customer_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch partner
    const partner = await base44.asServiceRole.entities.Partner.filter({
      id: partner_id
    }).then(r => r[0]);

    if (!partner) {
      return Response.json({ error: "Partner not found" }, { status: 404 });
    }

    // Check tier gating (Silver+)
    const TIER_ORDER = ["registered", "silver", "gold", "elite", "gov"];
    const canRegisterDeal = TIER_ORDER.indexOf(partner.tier) >= TIER_ORDER.indexOf("silver");

    if (!canRegisterDeal) {
      return Response.json({
        error: "Deal registration requires Silver tier or higher",
        required_tier: "silver",
        current_tier: partner.tier,
      }, { status: 403 });
    }

    // Generate deal ID
    const dealId = `DEAL-${partner_id.substring(0, 4)}-${Date.now().toString(36).toUpperCase()}`;

    // Create Deal
    const deal = await base44.asServiceRole.entities.Deal.create({
      partner_id,
      deal_id: dealId,
      opportunity_name,
      customer_name,
      customer_industry,
      customer_size,
      deal_type,
      tier_required,
      estimated_arr_usd,
      expected_close_date,
      status: "qualified",
      partner_contact_email: partner.primary_contact_email,
      deal_registration_date: new Date().toISOString(),
      co_sell_partner_id: co_sell_partner_id || null,
    });

    // Log activity
    await base44.asServiceRole.entities.PartnerActivity.create({
      partner_id,
      activity_type: "deal_registered",
      actor_email: user.email,
      resource_type: "Deal",
      resource_id: deal.id,
      details: {
        deal_id: dealId,
        customer: customer_name,
        arr: estimated_arr_usd,
      },
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      deal_id: dealId,
      partner_deal_id: deal.id,
      status: "qualified",
      message: "Deal registered. Awaiting SOINT approval.",
    }, { status: 201 });
  } catch (error) {
    console.error("Deal registration error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});