import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Invoice Generation Function
 * Generates monthly/annual invoices based on:
 * - Subscription tier costs
 * - Add-on costs
 * - Seat-based costs
 * - Usage-based costs
 * - Tax (if applicable)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { tenant_id, period_start, period_end } = body;

    if (!tenant_id || !period_start || !period_end) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ tenant_id });
    const subscription = subs[0];

    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Fetch add-ons
    const addons = await base44.asServiceRole.entities.AddonSubscription.filter({
      tenant_id,
      status: "active",
    });

    // Fetch usage events in period
    const periodStart = new Date(period_start).getTime();
    const periodEnd = new Date(period_end).getTime();

    const usageEvents = await base44.asServiceRole.entities.UsageEvent.filter({
      tenant_id,
      billable: true,
    });

    const periodUsage = usageEvents.filter(e => {
      const t = new Date(e.occurred_at).getTime();
      return t >= periodStart && t <= periodEnd;
    });

    // Calculate line items
    const lineItems = [];
    let subtotal = 0;

    // Subscription tier
    const tierCost = subscription.monthly_price_usd || 0;
    if (tierCost > 0) {
      const item = {
        description: `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Subscription`,
        quantity: 1,
        unit_price: tierCost,
        total: tierCost,
      };
      lineItems.push(item);
      subtotal += item.total;
    }

    // Add-ons
    addons.forEach(addon => {
      const item = {
        description: addon.addon_name,
        quantity: 1,
        unit_price: addon.price_monthly_usd || 0,
        total: addon.price_monthly_usd || 0,
      };
      lineItems.push(item);
      subtotal += item.total;
    });

    // Seat-based costs
    if (subscription.seat_cost_usd > 0) {
      const seats = (subscription.seat_count || 1) - 1; // First seat included
      if (seats > 0) {
        const item = {
          description: `Team Seats (${seats} @ $${subscription.seat_cost_usd}/each)`,
          quantity: seats,
          unit_price: subscription.seat_cost_usd,
          total: seats * subscription.seat_cost_usd,
        };
        lineItems.push(item);
        subtotal += item.total;
      }
    }

    // Usage-based costs
    const usageCost = periodUsage.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
    if (usageCost > 0) {
      lineItems.push({
        description: "Usage-Based Charges (overage)",
        quantity: 1,
        unit_price: usageCost,
        total: usageCost,
      });
      subtotal += usageCost;
    }

    // Tax (simplified: 8% for now)
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + tax;

    // Generate invoice
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      tenant_id,
      tenant_name: subscription.tenant_name,
      invoice_number: `INV-${Date.now()}`,
      status: "draft",
      period_start,
      period_end,
      subtotal_usd: subtotal,
      tax_usd: tax,
      total_usd: total,
      line_items: lineItems,
      tier: subscription.tier,
      due_date: new Date(new Date(period_end).getTime() + 30 * 86400000).toISOString(),
    });

    // Log invoice generation
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "invoice_generated",
      resource_type: "invoice",
      resource_id: invoice.id,
      details: `Invoice for ${subscription.tenant_name}: $${total}`,
      tenant_id,
      severity: "info",
      outcome: "success",
    });

    return Response.json({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_usd: total,
      line_items: lineItems,
      status: "draft",
    }, { status: 201 });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});