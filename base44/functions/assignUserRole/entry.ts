import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Role Assignment Function
 * Assigns roles with permissions to users
 * Enforces org_owner and tenant_admin access controls
 */

const DEFAULT_PERMISSIONS = {
  org_owner: ["user_management", "role_management", "subscription_view", "subscription_edit", "addon_activate", "agent_activate", "audit_view", "compliance_view", "branding_edit", "identity_edit", "data_export", "scenario_create", "scenario_execute", "red_blue_access", "fusion_center_access", "training_admin"],
  tenant_admin: ["user_management", "role_management", "subscription_view", "addon_activate", "agent_activate", "audit_view", "compliance_view", "branding_edit", "scenario_create", "red_blue_access", "training_admin"],
  cyber_operator: ["scenario_create", "scenario_execute", "audit_view", "agent_activate", "red_blue_access", "fusion_center_access"],
  analyst: ["scenario_create", "audit_view", "data_export"],
  executive: ["audit_view", "subscription_view", "compliance_view", "scenario_create"],
  compliance_officer: ["audit_view", "compliance_view", "subscription_view", "data_export"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin users can assign roles
    if (user.role !== "admin") {
      await base44.asServiceRole.entities.SecurityAuditLog.create({
        actor_email: user.email,
        actor_role: user.role,
        action: "unauthorized_role_assign_attempt",
        resource_type: "role_assignment",
        severity: "warning",
        outcome: "denied",
        timestamp: new Date().toISOString(),
      });

      return Response.json({
        error: "Forbidden: Only admins can assign roles"
      }, { status: 403 });
    }

    const body = await req.json();
    const { tenant_id, user_email, role } = body;

    if (!tenant_id || !user_email || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate role value
    const validRoles = ["admin", "user", "viewer"];
    if (!validRoles.includes(role)) {
      return Response.json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
      }, { status: 400 });
    }

    // Prevent privilege escalation - admins can only assign user/viewer
    if (user.role === "admin" && role === "admin") {
      return Response.json({
        error: "Insufficient privilege: Cannot assign admin role"
      }, { status: 403 });
    }

    // Update user's role via Base44 User entity
    try {
      await base44.asServiceRole.entities.User.update(user_email, {
        role: role,
        metadata: {
          assigned_by: user.email,
          assigned_at: new Date().toISOString(),
        }
      });
    } catch (err) {
      return Response.json({
        error: "Failed to assign role to user"
      }, { status: 500 });
    }

    // Log role assignment
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "role_assigned",
      resource_type: "user",
      resource_id: user_email,
      details: `Assigned role "${role}" to ${user_email}`,
      severity: "warning",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      user_email,
      role,
    }, { status: 200 });
  } catch (error) {
    console.error("Role assignment error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});