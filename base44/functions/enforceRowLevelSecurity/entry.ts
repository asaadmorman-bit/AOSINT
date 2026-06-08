import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entityName, action, entityId, record } = await req.json();

    // Define RLS policies per entity
    const rlsPolicies = {
      IntelligenceReport: {
        read: (record, user) => record.created_by === user.email || user.role === 'admin',
        create: (record, user) => record.created_by === user.email || user.role === 'admin',
        update: (record, user) => record.created_by === user.email || user.role === 'admin',
        delete: (record, user) => user.role === 'admin'
      },
      VulnerabilityFinding: {
        read: (record, user) => record.created_by === user.email || user.role === 'admin',
        create: (record, user) => record.created_by === user.email || user.role === 'admin',
        update: (record, user) => record.created_by === user.email || user.role === 'admin',
        delete: (record, user) => user.role === 'admin'
      },
      OsintAlert: {
        read: (record, user) => record.created_by === user.email || user.role === 'admin',
        create: (record, user) => record.created_by === user.email || user.role === 'admin',
        update: (record, user) => record.created_by === user.email || user.role === 'admin',
        delete: (record, user) => user.role === 'admin'
      },
      OsintEntity: {
        read: (record, user) => record.created_by === user.email || user.role === 'admin',
        create: (record, user) => true,
        update: (record, user) => record.created_by === user.email || user.role === 'admin',
        delete: (record, user) => record.created_by === user.email || user.role === 'admin'
      },
      User: {
        read: (record, user) => record.id === user.id || user.role === 'admin',
        create: (record, user) => user.role === 'admin',
        update: (record, user) => record.id === user.id || user.role === 'admin',
        delete: (record, user) => user.role === 'admin'
      }
    };

    const policy = rlsPolicies[entityName];
    if (!policy) {
      return Response.json({ error: `No RLS policy for ${entityName}` }, { status: 400 });
    }

    const actionPolicy = policy[action];
    if (!actionPolicy) {
      return Response.json({ error: `No policy for action ${action}` }, { status: 400 });
    }

    const isAllowed = actionPolicy(record, user);

    if (!isAllowed) {
      return Response.json(
        { error: 'Access denied: insufficient permissions for this record' },
        { status: 403 }
      );
    }

    return Response.json({ allowed: true, user: user.email });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});