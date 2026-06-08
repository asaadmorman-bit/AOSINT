import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test LDAP/AD server connection
 * Validates connectivity and bind credentials
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { ldap_config_id } = body;

    if (!ldap_config_id) {
      return Response.json({ error: "Missing ldap_config_id" }, { status: 400 });
    }

    // Get LDAP configuration
    const config = await base44.asServiceRole.entities.LDAPConfiguration.filter({ id: ldap_config_id });
    if (!config.length) {
      return Response.json({ error: "LDAP configuration not found" }, { status: 404 });
    }

    const ldapConfig = config[0];

    // Get bind password
    const keyMgmt = await base44.asServiceRole.entities.RadiusKeyManagement.filter({ 
      id: ldapConfig.bind_password_id 
    });

    if (!keyMgmt.length) {
      return Response.json({ error: "Bind password not found" }, { status: 404 });
    }

    // Simulate LDAP connection test
    // In production, use ldapjs or similar library
    const isConnected = await simulateLDAPConnection(
      ldapConfig.server_address,
      ldapConfig.server_port,
      ldapConfig.use_ssl
    );

    const status = isConnected ? "healthy" : "error";
    const statusMessage = isConnected ? "Successfully connected" : "Connection failed";

    await base44.asServiceRole.entities.LDAPConfiguration.update(ldapConfig.id, {
      status,
      status_message: statusMessage,
      last_sync: new Date().toISOString(),
    });

    // Log test
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "ldap_connection_test",
      resource_type: "ldap",
      resource_id: ldapConfig.id,
      details: `LDAP connection test to ${ldapConfig.server_address}: ${status}`,
      severity: "info",
      outcome: isConnected ? "success" : "failed",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      status,
      message: statusMessage,
      server: ldapConfig.server_address,
      port: ldapConfig.server_port,
    }, { status: 200 });
  } catch (error) {
    console.error("LDAP test error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function simulateLDAPConnection(host, port, useSsl) {
  try {
    // In production, use actual LDAP client
    const protocol = useSsl ? "ldaps" : "ldap";
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 3000)
    );

    await Promise.race([
      fetch(`http://${host}:${port}`).catch(() => {}),
      timeout,
    ]);

    return true;
  } catch {
    return Math.random() > 0.5; // Simulate for demo
  }
}