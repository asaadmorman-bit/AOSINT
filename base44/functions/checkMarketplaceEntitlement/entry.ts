import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { app_id, tenant_id } = await req.json();

    // Get app
    const apps = await base44.asServiceRole.entities.App.filter({ app_id });
    if (!apps || apps.length === 0) {
      return Response.json({ error: 'App not found' }, { status: 404 });
    }
    const app = apps[0];

    // Get tenant subscription
    const subs = await base44.asServiceRole.entities.Subscription.filter({ id: tenant_id });
    if (!subs || subs.length === 0) {
      return Response.json({ error: 'Subscription not found' }, { status: 404 });
    }
    const sub = subs[0];

    // Check tier
    const tierOrder = ['community', 'pro', 'enterprise', 'gov'];
    const tenantTierIdx = tierOrder.indexOf(sub.tier);
    const appTierIdx = tierOrder.indexOf(app.tier_required || 'community');
    
    if (tenantTierIdx < appTierIdx) {
      return Response.json({
        entitled: false,
        reason: 'insufficient_tier',
        required_tier: app.tier_required,
        current_tier: sub.tier,
      });
    }

    // Check installation
    const installations = await base44.entities.AppInstallation.filter({
      app_id,
      tenant_id,
      status: 'active',
    });

    if (!installations || installations.length === 0) {
      return Response.json({
        entitled: false,
        reason: 'not_installed',
      });
    }

    const install = installations[0];

    // Check usage limits
    const tierOrder2 = ['community', 'pro', 'enterprise', 'gov'];
    if (app.usage_limit && install.current_usage) {
      if (app.usage_limit.api_calls_per_month && 
          install.current_usage.api_calls_this_month >= app.usage_limit.api_calls_per_month) {
        return Response.json({
          entitled: false,
          reason: 'usage_limit_exceeded',
          usage_type: 'api_calls',
        });
      }
    }

    // Check billing status
    if (install.billing_status === 'past_due' || install.billing_status === 'cancelled') {
      return Response.json({
        entitled: false,
        reason: `billing_${install.billing_status}`,
      });
    }

    return Response.json({
      entitled: true,
      app_id,
      tenant_id,
      installed_version: install.version,
      usage: install.current_usage,
      entitlement_status: install.entitlement_status,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});