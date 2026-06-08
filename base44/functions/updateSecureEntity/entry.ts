import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { entityName, entityId, data } = await req.json();

    if (!entityName || !entityId || !data) {
      return Response.json({ error: 'entityName, entityId, and data required' }, { status: 400 });
    }

    const entity = base44.entities[entityName];
    if (!entity) {
      return Response.json({ error: `Unknown entity: ${entityName}` }, { status: 400 });
    }

    // Fetch the record to check RLS
    const records = await entity.filter({ id: entityId }, '-created_date', 1);
    if (records.length === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const record = records[0];

    // Enforce RLS: only creator or admin can update
    if (record.created_by !== user.email && user.role !== 'admin') {
      return Response.json(
        { error: 'Access denied: you can only update your own records' },
        { status: 403 }
      );
    }

    // Update with RLS enforcement
    const updated = await entity.update(entityId, data);

    return Response.json({
      success: true,
      message: 'Record updated successfully',
      record: updated
    });

  } catch (error) {
    console.error('Secure update error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});