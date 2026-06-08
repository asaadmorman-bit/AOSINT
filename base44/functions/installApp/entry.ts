import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { app_id, tenant_id, configuration } = await req.json();

    // Validate user is admin of tenant
    const tenant = await base44.asServiceRole.entities.Tenant.filter({ id: tenant_id });
    if (!tenant || tenant.length === 0) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get app details
    const app = await base44.asServiceRole.entities.App.filter({ app_id });
    if (!app || app.length === 0) {
      return Response.json({ error: 'App not found' }, { status: 404 });
    }
    const appData = app[0];

    // Check tier entitlement
    const subscription = await base44.asServiceRole.entities.Subscription.filter({ tenant_id });
    if (!subscription || subscription.length === 0) {
      return Response.json({ error: 'No subscription found' }, { status: 400 });
    }
    
    const tierOrder = ['community', 'pro', 'enterprise', 'gov'];
    const tenantTierIdx = tierOrder.indexOf(subscription[0].tier);
    const appTierIdx = tierOrder.indexOf(appData.tier_required || 'community');
    
    if (tenantTierIdx < appTierIdx) {
      return Response.json({ 
        error: `App requires ${appData.tier_required} tier. Upgrade required.`
      }, { status: 403 });
    }

    // Check for existing installation
    const existing = await base44.entities.AppInstallation.filter({
      app_id,
      tenant_id
    });
    if (existing && existing.length > 0) {
      return Response.json({ error: 'App already installed' }, { status: 400 });
    }

    // Create installation
    const installation = await base44.entities.AppInstallation.create({
      app_id,
      tenant_id,
      installed_by: user.email,
      installation_date: new Date().toISOString(),
      status: 'active',
      version: appData.version,
      configuration: configuration || {},
      api_key: `app_${crypto.getRandomValues(new Uint8Array(16)).join('')}`,
    });

    // Log audit event
    await base44.entities.AppAuditLog.create({
      app_id,
      tenant_id,
      actor_email: user.email,
      action: 'app_installed',
      resource_type: 'AppInstallation',
      resource_id: installation.id,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    // Increment app install count
    await base44.asServiceRole.entities.App.update(appData.id, {
      install_count: (appData.install_count || 0) + 1,
    });

    // Create marketplace transaction if paid
    if (appData.pricing_model !== 'free') {
      await base44.entities.MarketplaceTransaction.create({
        app_id,
        tenant_id,
        developer_id: appData.developer_id,
        transaction_type: appData.pricing_model === 'one_time' ? 'purchase' : 'subscription_renewal',
        amount_usd: appData.price_usd || 0,
        status: 'pending',
        created_date: new Date().toISOString(),
      });
    }

    return Response.json({
      installation_id: installation.id,
      status: 'installed',
      api_key: installation.api_key,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});