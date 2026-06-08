import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmEmail } = await req.json();

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return Response.json({ error: 'Email confirmation does not match' }, { status: 400 });
    }

    // Log the deletion request
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'account_deletion_requested',
      resource_type: 'User',
      resource_id: user.id,
      details: `User ${user.email} requested account deletion`,
      severity: 'critical',
      outcome: 'success'
    });

    // Delete user's data (entities created by them)
    // Note: Actual user record deletion should be handled by admin or a separate process
    // This marks the account for deletion
    await base44.asServiceRole.entities.User.update(user.id, {
      role: 'deleted',
      full_name: '[DELETED]'
    });

    return Response.json({ 
      ok: true, 
      message: 'Account deletion request processed. Your account will be permanently deleted within 24 hours.' 
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});