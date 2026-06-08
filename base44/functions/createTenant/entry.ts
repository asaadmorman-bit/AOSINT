import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Tenant Creation Function
 * Creates new tenant with:
 * - Tenant record
 * - Subscription (tier assignment)
 * - TenantConfiguration (default settings)
 * - Initial admin role
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, tier = "community", owner_email, seat_count = 1 } = body;

    if (!name || !slug || !owner_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create tenant
    const tenant = await base44.asServiceRole.entities.Tenant.create({
      name,
      slug,
      tier,
      owner_email,
      seat_count,
      max_assets: tier === "community" ? 25 : tier === "pro" ? 100 : tier === "enterprise" ? 500 : 1000,
      status: "active",
    });

    // Create subscription
    const TIER_PRICING = {
      community: { monthly: 0, annual: 0 },
      pro: { monthly: 99, annual: 990 },
      enterprise: { monthly: 499, annual: 4990 },
      gov: { monthly: null, annual: null },
    };

    const pricing = TIER_PRICING[tier] || TIER_PRICING.community;
    const subscription = await base44.asServiceRole.entities.Subscription.create({
      tenant_id: tenant.id,
      tenant_name: name,
      owner_email,
      tier,
      status: "active",
      billing_cycle: "monthly",
      seat_count,
      max_seats: tier === "community" ? 1 : tier === "pro" ? 5 : tier === "enterprise" ? 25 : "unlimited",
      monthly_price_usd: pricing.monthly,
      annual_price_usd: pricing.annual,
      total_mrr_usd: pricing.monthly || 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });

    // Create tenant configuration
    const config = await base44.asServiceRole.entities.TenantConfiguration.create({
      tenant_id: tenant.id,
      branding: {
        primary_color: "#00d4ff",
        secondary_color: "#a855f7",
        app_name: name,
      },
      identity_provider: {
        type: "saml",
        sso_enabled: tier === "enterprise" || tier === "gov",
        mfa_required: tier === "gov",
      },
      security_policies: {
        password_min_length: 12,
        password_require_special: true,
        session_timeout_minutes: 60,
      },
      data_retention: {
        audit_log_days: tier === "gov" ? 365 : 90,
        gdpr_compliant: true,
      },
      regional_deployment: "us-east",
    });

    // Assign org owner role to creator
    const roleAssignment = await base44.asServiceRole.entities.RoleAssignment.create({
      tenant_id: tenant.id,
      user_email: owner_email,
      role: "org_owner",
      permissions: [
        "user_management", "role_management", "subscription_view", "subscription_edit",
        "addon_activate", "agent_activate", "audit_view", "compliance_view",
        "branding_edit", "identity_edit", "data_export", "scenario_create",
        "scenario_execute", "red_blue_access", "fusion_center_access", "training_admin"
      ],
      assigned_by: user.email,
      assigned_at: new Date().toISOString(),
      is_active: true,
    });

    // Log tenant creation
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "tenant_created",
      resource_type: "tenant",
      resource_id: tenant.id,
      details: `Created tenant "${name}" (${tier}) for ${owner_email}`,
      tenant_id: tenant.id,
      severity: "info",
      outcome: "success",
    });

    return Response.json({
      tenant_id: tenant.id,
      tenant_name: name,
      tier,
      subscription_id: subscription.id,
      config_id: config.id,
      role_id: roleAssignment.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Tenant creation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});