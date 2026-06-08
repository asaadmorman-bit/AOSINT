import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark the account as deleted in user data
    await base44.auth.updateMe({
      account_deleted: true,
      deleted_at: new Date().toISOString(),
      deletion_reason: 'user_requested'
    });

    return Response.json({
      success: true,
      message: 'Account marked for deletion. Data will be purged within 30 days.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});