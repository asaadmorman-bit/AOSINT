import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, threat_data, threat_type } = await req.json();

    if (!message_id || !threat_data || !threat_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get all active dashboard subscriptions
    const subscriptions = await base44.entities.DashboardFeedSubscription.filter({
      is_enabled: true
    }, '-created_at', 100);

    const syncedDashboards = [];
    let skippedCount = 0;

    for (const subscription of subscriptions) {
      // Check if threat matches subscription filters
      if (shouldIngestThreat(threat_data, subscription)) {
        // Check daily limit
        const dailyCount = await getTodaysSyncCount(base44, subscription.dashboard_id);
        if (dailyCount < (subscription.max_threats_per_day || 100)) {
          syncedDashboards.push(subscription.dashboard_id);
        } else {
          skippedCount++;
        }
      }
    }

    // Update message record
    if (syncedDashboards.length > 0) {
      const messageRecord = await base44.entities.DiscordToastMessage.filter({
        discord_message_id: message_id
      }, null, 1);

      if (messageRecord.length > 0) {
        await base44.entities.DiscordToastMessage.update(messageRecord[0].id, {
          dashboard_synced: true,
          synced_dashboards: syncedDashboards
        });
      }
    }

    return Response.json({
      success: true,
      message_id: message_id,
      dashboards_synced: syncedDashboards.length,
      dashboards_skipped_limit: skippedCount,
      synced_to: syncedDashboards
    });
  } catch (error) {
    console.error('Error syncing Discord to dashboards:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function shouldIngestThreat(threat, subscription) {
  // Check feed type
  if (subscription.feed_type !== 'all') {
    const feedTypeMap = {
      osint_alerts: ['osint_alert'],
      threat_actors: ['threat_actor', 'lea_intelligence'],
      lea_intelligence: ['lea_intelligence'],
      vulnerabilities: ['vulnerability'],
      campaigns: ['campaign']
    };

    if (!feedTypeMap[subscription.feed_type]?.includes(threat.type)) {
      return false;
    }
  }

  // Check severity filter
  if (subscription.severity_filter && subscription.severity_filter.length > 0) {
    const severity = threat.severity || threat.threat_level || 'medium';
    if (!subscription.severity_filter.includes(severity)) {
      return false;
    }
  }

  // Check threat type filter
  if (subscription.threat_type_filter && subscription.threat_type_filter.length > 0) {
    if (!subscription.threat_type_filter.includes(threat.type)) {
      return false;
    }
  }

  // Check organization filter
  if (subscription.organization_filter && subscription.organization_filter.length > 0) {
    const org = threat.organization || threat.lead_company || '';
    if (!subscription.organization_filter.some(o => org.includes(o))) {
      return false;
    }
  }

  // Check geographic filter
  if (subscription.geographic_filter && subscription.geographic_filter.length > 0) {
    const geo = threat.geographic_focus || threat.location || '';
    if (!subscription.geographic_filter.some(g => geo.includes(g))) {
      return false;
    }
  }

  return true;
}

async function getTodaysSyncCount(base44, dashboardId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const messages = await base44.entities.DiscordToastMessage.filter({
    synced_dashboards: { $in: [dashboardId] }
  }, '-posted_at', 100);

  return messages.filter(m => {
    const postedDate = new Date(m.posted_at);
    postedDate.setHours(0, 0, 0, 0);
    return postedDate.getTime() === today.getTime();
  }).length;
}