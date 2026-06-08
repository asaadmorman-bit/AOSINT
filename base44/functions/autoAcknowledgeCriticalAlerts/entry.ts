import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (service role) or admin user calls
    let user = null;
    try { user = await base44.auth.me(); } catch (_) { /* scheduled context */ }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();

    // Find all critical new alerts
    const criticalAlerts = await base44.asServiceRole.entities.OsintAlert.filter({
      severity: 'critical',
      status: 'new'
    }, '-triggered_at', 100);

    if (criticalAlerts.length === 0) {
      return Response.json({ message: 'No critical new alerts to acknowledge', count: 0 });
    }

    // Auto-acknowledge each one
    const updates = [];
    for (const alert of criticalAlerts) {
      updates.push(
        base44.asServiceRole.entities.OsintAlert.update(alert.id, {
          status: 'acknowledged',
          acknowledged_by: 'ASOSINT AI — Auto-Acknowledged',
          acknowledged_at: now.toISOString()
        })
      );
    }
    await Promise.all(updates);

    // Create confirmation alert
    await base44.asServiceRole.entities.OsintAlert.create({
      alert_type: 'new_indicator',
      title: `${criticalAlerts.length} Critical Alerts Auto-Acknowledged`,
      description: `ASOSINT hourly automation auto-acknowledged ${criticalAlerts.length} critical OsintAlerts. IDs: ${criticalAlerts.map(a => a.id).join(', ')}`,
      severity: 'low',
      status: 'acknowledged',
      acknowledged_by: 'ASOSINT AI — Auto-System',
      acknowledged_at: now.toISOString(),
      triggered_at: now.toISOString(),
      tags: ['auto-ack', 'hourly-sweep'],
      delivery_channels: ['command_staff', 'soc_watch']
    });

    return Response.json({
      success: true,
      acknowledged_count: criticalAlerts.length,
      timestamp: now.toISOString(),
      alert_ids: criticalAlerts.map(a => a.id)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});