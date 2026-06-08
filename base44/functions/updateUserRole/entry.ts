import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { target_email, role, subscription_tier } = await req.json();

        if (!target_email) {
            return Response.json({ error: 'target_email is required' }, { status: 400 });
        }

        // Find user by email
        const users = await base44.asServiceRole.entities.User.filter({ email: target_email });

        if (!users || users.length === 0) {
            return Response.json({ error: `User with email ${target_email} not found` }, { status: 404 });
        }

        const targetUser = users[0];
        const updateData = {};
        if (role) updateData.role = role;
        if (subscription_tier) updateData.subscription_tier = subscription_tier;

        await base44.asServiceRole.entities.User.update(targetUser.id, updateData);

        return Response.json({ 
            success: true, 
            message: `Updated user ${target_email}`,
            updated: updateData
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});