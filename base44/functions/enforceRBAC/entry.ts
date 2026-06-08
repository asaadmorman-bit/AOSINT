import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * RBAC Enforcement Middleware
 * Validates user permissions for sensitive operations
 * Logs all access attempts for audit trail
 */

const PERMISSION_MATRIX = {
  user_management: ["admin"],
  role_management: ["admin"],
  security_settings: ["admin"],
  audit_logs: ["admin"],
  subscription_edit: ["admin"],
  compliance_edit: ["admin"],
  data_export: ["admin", "user"],
  scenario_create: ["admin", "user"],
  read_osint: ["admin", "user", "viewer"],
};

const RATE_LIMIT = {
  attempts: 10,
  window: 300000, // 5 minutes
};

const loginAttempts = new Map();

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, resource, user_id } = body;

    if (!action) {
      return Response.json({ error: "Missing action" }, { status: 400 });
    }

    // Rate limiting
    const key = `${user.email}:${action}`;
    const now = Date.now();
    const attempts = loginAttempts.get(key) || [];
    const recentAttempts = attempts.filter(t => now - t < RATE_LIMIT.window);

    if (recentAttempts.length >= RATE_LIMIT.attempts) {
      await base44.asServiceRole.entities.SecurityAuditLog.create({
        actor_email: user.email,
        actor_role: user.role,
        action: "rate_limit_exceeded",
        resource_type: resource || "unknown",
        resource_id: user_id || "unknown",
        details: `Rate limit exceeded for action: ${action}`,
        severity: "warning",
        outcome: "blocked",
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    recentAttempts.push(now);
    loginAttempts.set(key, recentAttempts);

    // Check permissions
    const requiredRole = PERMISSION_MATRIX[action];
    if (!requiredRole) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const isAuthorized = requiredRole.includes(user.role);

    // Log audit event
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: action,
      resource_type: resource || "unknown",
      resource_id: user_id || "unknown",
      details: `Action check: ${action} by ${user.role}`,
      severity: isAuthorized ? "info" : "warning",
      outcome: isAuthorized ? "success" : "denied",
      timestamp: new Date().toISOString(),
    });

    if (!isAuthorized) {
      return Response.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    return Response.json({
      allowed: true,
      user_role: user.role,
      action: action,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("RBAC check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});