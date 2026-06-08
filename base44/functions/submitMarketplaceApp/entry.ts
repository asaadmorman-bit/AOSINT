import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { app_id, name, description, category, pricing_model, price_usd, permissions_required } = payload;

    // Get or create developer profile
    let developer = await base44.entities.Developer.filter({ user_email: user.email });
    if (!developer || developer.length === 0) {
      developer = await base44.entities.Developer.create({
        user_email: user.email,
        display_name: user.full_name,
        status: 'pending',
        verified: false,
      });
      return Response.json({ 
        error: 'Developer profile requires verification. Admin approval pending.'
      }, { status: 400 });
    }
    const devId = developer[0].id;

    if (developer[0].status !== 'active') {
      return Response.json({ 
        error: `Developer account status: ${developer[0].status}`
      }, { status: 403 });
    }

    // Check app doesn't exist
    const existing = await base44.entities.App.filter({ app_id });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'App ID already exists' }, { status: 400 });
    }

    // Create app submission
    const app = await base44.entities.App.create({
      app_id,
      name,
      description,
      category,
      developer_id: devId,
      developer_name: developer[0].display_name,
      version: '1.0.0',
      status: 'submitted',
      pricing_model,
      price_usd: price_usd || 0,
      permissions_required: permissions_required || [],
      submission_date: new Date().toISOString(),
      tier_required: 'community',
      security_review_status: 'pending',
      ...payload,
    });

    // Log submission
    await base44.entities.AppAuditLog.create({
      app_id,
      actor_email: user.email,
      action: 'app_submitted',
      resource_type: 'App',
      resource_id: app.id,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      app_id: app.app_id,
      status: 'submitted',
      message: 'App submitted for review. Expect response within 5 business days.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});