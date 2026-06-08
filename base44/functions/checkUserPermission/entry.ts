import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permission } = await req.json();

    if (!permission) {
      return Response.json({ error: 'Permission not specified' }, { status: 400 });
    }

    // Fetch role permissions for user's role
    const rolePerms = await base44.entities.RolePermission.list()
      .then(perms => perms.find(p => p.role === user.role))
      .catch(() => null);

    if (!rolePerms) {
      return Response.json({ allowed: false, reason: 'Role not found' }, { status: 200 });
    }

    const permissionKey = `can_${permission}`;
    const allowed = rolePerms[permissionKey] === true;

    return Response.json({
      allowed,
      user_role: user.role,
      permission: permission,
      reason: !allowed ? `Role '${user.role}' does not have permission: ${permission}` : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});