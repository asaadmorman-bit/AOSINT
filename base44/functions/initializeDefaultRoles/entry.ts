import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Define default roles and permissions
    const defaultRoles = [
      {
        role: 'admin',
        description: 'Full access to all features',
        can_view_alerts: true,
        can_view_indicators: true,
        can_view_threats: true,
        can_view_all_severity: true,
        can_configure_channels: true,
        can_manage_alert_rules: true,
        can_export_data: true,
        can_push_data: true,
        can_manage_users: true,
        can_register_commands: true,
      },
      {
        role: 'manager',
        description: 'Can manage channels, rules, and export data',
        can_view_alerts: true,
        can_view_indicators: true,
        can_view_threats: true,
        can_view_all_severity: true,
        can_configure_channels: true,
        can_manage_alert_rules: true,
        can_export_data: true,
        can_push_data: false,
        can_manage_users: false,
        can_register_commands: false,
      },
      {
        role: 'analyst',
        description: 'Can view all threat intelligence data',
        can_view_alerts: true,
        can_view_indicators: true,
        can_view_threats: true,
        can_view_all_severity: true,
        can_configure_channels: false,
        can_manage_alert_rules: false,
        can_export_data: false,
        can_push_data: false,
        can_manage_users: false,
        can_register_commands: false,
      },
      {
        role: 'viewer',
        description: 'Can view threat intelligence data (tier restricted)',
        can_view_alerts: true,
        can_view_indicators: true,
        can_view_threats: true,
        can_view_all_severity: false,
        can_configure_channels: false,
        can_manage_alert_rules: false,
        can_export_data: false,
        can_push_data: false,
        can_manage_users: false,
        can_register_commands: false,
      },
    ];

    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const roleConfig of defaultRoles) {
      try {
        const existing = await base44.entities.RolePermission.list()
          .then(items => items.find(r => r.role === roleConfig.role));

        if (existing) {
          results.skipped++;
        } else {
          await base44.entities.RolePermission.create(roleConfig);
          results.created++;
        }
      } catch (error) {
        results.errors.push(`Failed to create role ${roleConfig.role}: ${error.message}`);
      }
    }

    return Response.json({
      success: true,
      message: 'Default roles initialized',
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});