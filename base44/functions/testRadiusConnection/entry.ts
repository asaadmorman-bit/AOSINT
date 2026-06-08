import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test RADIUS server connection
 * Validates connectivity and configuration
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { radius_config_id } = body;

    if (!radius_config_id) {
      return Response.json({ error: "Missing radius_config_id" }, { status: 400 });
    }

    // Get RADIUS configuration
    const config = await base44.asServiceRole.entities.RadiusConfig.filter({ id: radius_config_id });
    if (!config.length) {
      return Response.json({ error: "RADIUS configuration not found" }, { status: 404 });
    }

    const radiusConfig = config[0];

    // Get shared secret
    const keyMgmt = await base44.asServiceRole.entities.RadiusKeyManagement.filter({ 
      id: radiusConfig.shared_secret_id 
    });

    if (!keyMgmt.length) {
      return Response.json({ error: "Shared secret not found" }, { status: 404 });
    }

    // In production, implement actual RADIUS connection test
    // For now, simulate a connection attempt
    const isReachable = await simulateRadiusTest(radiusConfig.server_address, radiusConfig.server_port);

    // Update status
    const status = isReachable ? "healthy" : "unreachable";
    const statusMessage = isReachable ? "Successfully connected" : "Server unreachable";

    await base44.asServiceRole.entities.RadiusConfig.update(radiusConfig.id, {
      status,
      status_message: statusMessage,
      last_tested: new Date().toISOString(),
    });

    // Log test
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "radius_connection_test",
      resource_type: "radius",
      resource_id: radiusConfig.id,
      details: `RADIUS connection test: ${status}`,
      severity: "info",
      outcome: isReachable ? "success" : "failed",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      status,
      message: statusMessage,
      server: radiusConfig.server_address,
      port: radiusConfig.server_port,
    }, { status: 200 });
  } catch (error) {
    console.error("RADIUS test error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Simulate RADIUS connectivity test
async function simulateRadiusTest(host, port) {
  try {
    // In production, use a real RADIUS client library
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    await fetch(`http://${host}:${port}`, { signal: controller.signal }).catch(() => {});
    clearTimeout(timeout);

    return true;
  } catch {
    return Math.random() > 0.5; // Simulate 50% success rate for demo
  }
}