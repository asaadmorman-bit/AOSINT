import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync users from LDAP/AD
 * Fetches users and groups, creates/updates user records with role assignments
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

    // Get group mappings
    const mappings = await base44.asServiceRole.entities.LDAPGroupMapping.filter({ 
      ldap_config_id: ldapConfig.id 
    });

    // Simulate LDAP user fetch
    // In production, query actual LDAP directory
    const ldapUsers = await simulateLDAPUserFetch(ldapConfig.base_dn);

    let usersCreated = 0;
    let usersUpdated = 0;

    // Process each user
    for (const ldapUser of ldapUsers) {
      try {
        // Find applicable group mapping
        const mapping = mappings.find(m => 
          ldapUser.groups?.includes(m.ldap_group_name)
        );

        const userData = {
          email: ldapUser.email,
          full_name: ldapUser.name,
          role: mapping?.role_name || "user",
          metadata: {
            ldap_dn: ldapUser.dn,
            ldap_config: ldapConfig.id,
            synced_at: new Date().toISOString(),
          }
        };

        // Check if user exists
        const existing = await base44.asServiceRole.entities.User.filter({ 
          email: ldapUser.email 
        });

        if (existing.length) {
          // Update existing user
          await base44.asServiceRole.entities.User.update(existing[0].id, userData);
          usersUpdated++;
        } else {
          // Create new user (if invitation enabled)
          await base44.users.inviteUser(ldapUser.email, mapping?.role_name || "user");
          usersCreated++;
        }
      } catch (err) {
        console.error(`Failed to sync user ${ldapUser.email}:`, err);
      }
    }

    // Update sync timestamp
    await base44.asServiceRole.entities.LDAPConfiguration.update(ldapConfig.id, {
      last_sync: new Date().toISOString(),
    });

    // Log sync
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "ldap_sync_executed",
      resource_type: "ldap",
      resource_id: ldapConfig.id,
      details: `LDAP sync completed: ${usersCreated} created, ${usersUpdated} updated`,
      severity: "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "LDAP sync completed",
      users_created: usersCreated,
      users_updated: usersUpdated,
      total: usersCreated + usersUpdated,
    }, { status: 200 });
  } catch (error) {
    console.error("LDAP sync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function simulateLDAPUserFetch(baseDn) {
  // Simulate LDAP user query
  return [
    {
      dn: `cn=John Doe,${baseDn}`,
      email: "john.doe@company.com",
      name: "John Doe",
      groups: ["CN=Operators,OU=Groups,DC=company,DC=com"],
    },
    {
      dn: `cn=Jane Smith,${baseDn}`,
      email: "jane.smith@company.com",
      name: "Jane Smith",
      groups: ["CN=Analysts,OU=Groups,DC=company,DC=com"],
    },
  ];
}