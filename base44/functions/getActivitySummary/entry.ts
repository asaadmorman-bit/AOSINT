import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Hub-Ready Activity Summary
 * Returns app-context-aware metrics for PHD Hub ecosystem identity recognition.
 * Query param: ?app=asosint | cyberdojosensai (defaults to asosint)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const appContext = (url.searchParams.get('app') || 'asosint').toLowerCase();

    let summary = {};

    if (appContext === 'asosint') {
      // Count active investigations
      const investigations = await base44.asServiceRole.entities.OsintInvestigation.filter({ status: 'active' });
      const incidentCases = await base44.asServiceRole.entities.IncidentCase.filter({ status: 'in_progress' });

      summary = {
        app: 'asosint',
        metric: 'active_investigations',
        count: (investigations?.length || 0) + (incidentCases?.length || 0),
        breakdown: {
          osint_investigations: investigations?.length || 0,
          incident_cases: incidentCases?.length || 0,
        },
        hub_identity: {
          user_email: user.email,
          user_role: user.role,
          recognized: true,
        }
      };
    } else if (appContext === 'cyberdojosensai') {
      // Count total active users (admin-level insight)
      if (user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required for CyberDojoSensai metrics' }, { status: 403 });
      }

      const allUsers = await base44.asServiceRole.entities.User.list();
      const activeUsers = allUsers.filter(u => u.status !== 'inactive' && u.status !== 'suspended');

      summary = {
        app: 'cyberdojosensai',
        metric: 'total_active_users',
        count: activeUsers.length,
        breakdown: {
          total_users: allUsers.length,
          active_users: activeUsers.length,
          admin_users: allUsers.filter(u => u.role === 'admin').length,
        },
        hub_identity: {
          user_email: user.email,
          user_role: user.role,
          recognized: true,
        }
      };
    } else {
      return Response.json({ error: `Unknown app context: ${appContext}. Use 'asosint' or 'cyberdojosensai'.` }, { status: 400 });
    }

    return Response.json(summary);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});