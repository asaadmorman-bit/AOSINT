import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entityName, filters = {}, limit = 50, sort = '-created_date' } = await req.json();

    if (!entityName) {
      return Response.json({ error: 'entityName required' }, { status: 400 });
    }

    // Apply user-scoped filtering automatically
    const userScopedFilters = { ...filters };
    
    // Only admins can see all records; regular users see only their own
    if (user.role !== 'admin') {
      userScopedFilters.created_by = user.email;
    }

    // Fetch with RLS-enforced filters
    const entity = base44.entities[entityName];
    if (!entity) {
      return Response.json({ error: `Unknown entity: ${entityName}` }, { status: 400 });
    }

    const records = await entity.filter(userScopedFilters, sort, limit);

    return Response.json({
      success: true,
      entity: entityName,
      count: records.length,
      user_role: user.role,
      records: records
    });

  } catch (error) {
    console.error('Secure list error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});