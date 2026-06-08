import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Deal Approval Workflow
 * Internal: SOINT team approves or rejects registered deals
 * Creates tenant if approved
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { deal_id, approved = true, rejection_reason } = body;

    // Fetch deal
    const deal = await base44.asServiceRole.entities.Deal.filter({
      id: deal_id
    }).then(r => r[0]);

    if (!deal) {
      return Response.json({ error: "Deal not found" }, { status: 404 });
    }

    if (approved) {
      // Approve deal
      await base44.asServiceRole.entities.Deal.update(deal.id, {
        status: "approved",
        approval_date: new Date().toISOString(),
        approved_by: user.email,
      });

      // Provision tenant for customer
      const tenantResult = await base44.functions.invoke("createTenant", {
        name: deal.customer_name,
        slug: deal.customer_name.toLowerCase().replace(/\s+/g, "-"),
        tier: deal.tier_required,
        owner_email: deal.partner_contact_email,
      });

      // Link tenant to deal
      await base44.asServiceRole.entities.Deal.update(deal.id, {
        customer_tenant_id: tenantResult.data.tenant_id,
      });

      // Update partner tenant count
      const partner = await base44.asServiceRole.entities.Partner.filter({
        id: deal.partner_id
      }).then(r => r[0]);

      if (partner) {
        await base44.asServiceRole.entities.Partner.update(partner.id, {
          active_tenant_count: (partner.active_tenant_count || 0) + 1,
        });
      }

      // Log activity
      await base44.asServiceRole.entities.PartnerActivity.create({
        partner_id: deal.partner_id,
        activity_type: "deal_approved",
        actor_email: user.email,
        resource_type: "Deal",
        resource_id: deal.id,
        details: {
          deal_id: deal.deal_id,
          tenant_id: tenantResult.data.tenant_id,
        },
        occurred_at: new Date().toISOString(),
      });

      return Response.json({
        deal_id: deal.deal_id,
        status: "approved",
        tenant_id: tenantResult.data.tenant_id,
        message: "Deal approved and tenant provisioned",
      }, { status: 200 });
    } else {
      // Reject deal
      await base44.asServiceRole.entities.Deal.update(deal.id, {
        status: "closed_lost",
        approval_date: new Date().toISOString(),
        approved_by: user.email,
        notes: rejection_reason || "Rejected by SOINT",
      });

      return Response.json({
        deal_id: deal.deal_id,
        status: "rejected",
        reason: rejection_reason,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Deal approval error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});