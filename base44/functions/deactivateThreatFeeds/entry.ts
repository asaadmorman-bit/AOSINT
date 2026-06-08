import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feedIds = [
      '69a0ccdd354c808de47ffcbd',
      '69a0ccdd354c808de47ffcbf',
      '69a0ccdd354c808de47ffcbe',
      '69a0ccdd354c808de47ffcbc'
    ];

    const updatePromises = feedIds.map(id =>
      base44.asServiceRole.entities.ThreatFeed.update(id, { status: 'inactive' })
    );

    await Promise.all(updatePromises);

    return Response.json({
      success: true,
      message: `Set ${feedIds.length} ThreatFeed records to inactive`,
      feedIds: feedIds
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});