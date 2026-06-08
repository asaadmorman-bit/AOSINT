import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Audit Event Logger Function
 * Logs all significant events for compliance and governance
 * Called by other functions to maintain audit trail
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
      action, resource_type, resource_id, details,
      tenant_id, severity = "info", outcome = "success"
    } = body;

    if (!action || !resource_type || !tenant_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log audit event
    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action,
      resource_type,
      resource_id,
      details,
      tenant_id,
      severity,
      outcome,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    return Response.json({
      audit_id: auditLog.id,
      logged: true,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Audit event logging error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});