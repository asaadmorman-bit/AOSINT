import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Subscription Upgrade/Downgrade Function
 * Handles tier changes with proration and audit logging.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id, new_tier, billing_cycle = "monthly" } = body;

    if (!tenant_id || !new_tier) {
      return Response.json({ error: "Missing tenant_id or new_tier" }, { status: 400 });
    }

    // Fetch subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ tenant_id });
    const subscription = subs[0];

    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 });
    }

    const oldTier = subscription.tier;

    // Only admins can upgrade
    if (user.role !== "admin" && user.email !== subscription.owner_email) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent community → pro downgrades without warning
    const tierOrder = ["community", "pro", "enterprise", "gov"];
    if (tierOrder.indexOf(new_tier) < tierOrder.indexOf(oldTier)) {
      // Downgrade - could disable features
      return Response.json({
        warning: "This is a downgrade. Some features may be disabled.",
        old_tier: oldTier,
        new_tier,
        requires_confirmation: true,
      }, { status: 200 });
    }

    // Calculate new pricing
    const tierPrices = {
      community: { monthly: 0, annual: 0 },
      pro: { monthly: 99, annual: 990 },
      enterprise: { monthly: 499, annual: 4990 },
      gov: { monthly: null, annual: null },
    };

    const newPrice = tierPrices[new_tier][billing_cycle];
    const oldPrice = tierPrices[oldTier][billing_cycle];

    // Calculate proration for current month
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / 86400000));
    const daysInPeriod = 30;
    const prorationPercent = daysRemaining / daysInPeriod;
    const prorationCredit = oldPrice ? (oldPrice * prorationPercent) : 0;
    const prorationCharge = newPrice ? (newPrice * prorationPercent) : 0;

    // Update subscription
    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
      tier: new_tier,
      billing_cycle,
      monthly_price_usd: newPrice,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (billing_cycle === "annual" ? 365 : 30) * 86400000).toISOString(),
    });

    // Log upgrade/downgrade
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: tierOrder.indexOf(new_tier) > tierOrder.indexOf(oldTier) ? "subscription_upgrade" : "subscription_downgrade",
      resource_type: "subscription",
      resource_id: subscription.id,
      details: `${oldTier} → ${new_tier}, proration: credit $${prorationCredit.toFixed(2)}, charge $${prorationCharge.toFixed(2)}`,
      tenant_id,
      severity: "info",
      outcome: "success",
    });

    return Response.json({
      success: true,
      old_tier: oldTier,
      new_tier,
      old_price: oldPrice,
      new_price: newPrice,
      proration_credit: prorationCredit,
      proration_charge: prorationCharge,
      new_period_start: new Date().toISOString(),
      new_period_end: new Date(Date.now() + (billing_cycle === "annual" ? 365 : 30) * 86400000).toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Upgrade error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});