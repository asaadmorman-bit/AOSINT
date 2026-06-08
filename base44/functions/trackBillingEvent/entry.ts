import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Billing Event Tracking Function
 * Records usage events for billing, analytics, and compliance.
 * Handles:
 * - Feed ingestion
 * - Storage writes
 * - Agent compute
 * - Scenario runs
 * - Graph queries
 * - API calls
 * - Seat additions
 * - Add-on activations
 */

const EVENT_PRICING = {
  feed_ingestion: { unit: "MB", cost_per_unit: 0.01 }, // $0.01 per MB
  storage_write: { unit: "GB", cost_per_unit: 0.05 },
  scenario_run: { unit: "run", cost_per_unit: 5 },
  agent_compute: { unit: "hour", cost_per_unit: 10 },
  graph_query: { unit: "query", cost_per_unit: 0.1 },
  dashboard_view: { unit: "view", cost_per_unit: 0 },
  mobile_sync: { unit: "sync", cost_per_unit: 0.5 },
  field_upload: { unit: "upload", cost_per_unit: 1 },
  training_completion: { unit: "course", cost_per_unit: 0 },
  compliance_upload: { unit: "upload", cost_per_unit: 0 },
  red_blue_exercise: { unit: "exercise", cost_per_unit: 0 },
  briefing_export: { unit: "export", cost_per_unit: 2 },
  api_call: { unit: "call", cost_per_unit: 0.001 },
  seat_added: { unit: "seat", cost_per_unit: 0 },
  addon_activated: { unit: "addon", cost_per_unit: 0 },
};

const TIER_INCLUDED_EVENTS = {
  community: ["dashboard_view", "training_completion"],
  pro: ["dashboard_view", "training_completion", "api_call"],
  enterprise: ["dashboard_view", "training_completion", "api_call"],
  gov: ["all"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id, event_type, module, quantity = 1, metadata } = body;

    if (!tenant_id || !event_type || !module) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ tenant_id });
    const subscription = subs[0];

    if (!subscription) {
      return Response.json({ error: "Subscription not found" }, { status: 404 });
    }

    const tier = subscription.tier || "community";
    const pricing = EVENT_PRICING[event_type] || { unit: "unit", cost_per_unit: 0 };

    // Check if event is billable for this tier
    const includedEvents = TIER_INCLUDED_EVENTS[tier] || [];
    let billable = !includedEvents.includes(event_type);
    if (includedEvents.includes("all")) billable = false;

    // Calculate cost
    let cost_usd = 0;
    if (billable && pricing.cost_per_unit > 0) {
      cost_usd = (quantity || 1) * pricing.cost_per_unit;
    }

    // Create usage event
    const event = await base44.asServiceRole.entities.UsageEvent.create({
      tenant_id,
      user_email: user.email,
      tier,
      event_type,
      module,
      quantity,
      unit: pricing.unit,
      cost_usd,
      metadata,
      occurred_at: new Date().toISOString(),
      billable,
    });

    // Log to audit
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "billing_event",
      resource_type: "usage_event",
      resource_id: event.id,
      details: `${event_type} in ${module}: ${quantity} ${pricing.unit}, cost $${cost_usd.toFixed(2)}`,
      tenant_id,
      severity: "info",
      outcome: "success",
    });

    return Response.json({
      success: true,
      event_id: event.id,
      cost_usd,
      billable,
      tier,
    }, { status: 201 });
  } catch (error) {
    console.error("Billing event tracking error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});