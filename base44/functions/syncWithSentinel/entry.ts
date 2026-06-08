import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync with Izulu Sentinel
 * Sends security assessments, route recommendations, and threat data
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      sentinel_config_id,
      protection_team_id,
      assessment_data,
      route_data,
      threat_level,
      client_location,
    } = body;

    if (!sentinel_config_id) {
      return Response.json({ error: "Missing sentinel_config_id" }, { status: 400 });
    }

    // Get Sentinel configuration
    const configs = await base44.asServiceRole.entities.IzuluSentinelConfig.filter({
      id: sentinel_config_id,
    });

    if (!configs.length) {
      return Response.json({ error: "Sentinel configuration not found" }, { status: 404 });
    }

    const config = configs[0];

    if (!config.is_enabled) {
      return Response.json({ error: "Sentinel integration disabled" }, { status: 403 });
    }

    // Prepare payload for Sentinel API
    const sentinelPayload = {
      organization_id: config.organization_id,
      team_id: protection_team_id,
      timestamp: new Date().toISOString(),
      data: {
        assessment: assessment_data,
        route_recommendations: route_data,
        threat_level,
        location: client_location,
        geopolitical_context: await fetchGeopoliticalContext(client_location),
        environmental_alerts: await fetchEnvironmentalAlerts(client_location),
      },
    };

    // Simulate API call to Izulu Sentinel
    // In production, use actual API credentials from key management
    const sentinelResponse = await sendToSentinel(config.api_endpoint, sentinelPayload);

    // Update sync timestamp
    await base44.asServiceRole.entities.IzuluSentinelConfig.update(config.id, {
      last_sync: new Date().toISOString(),
      status: sentinelResponse.success ? "connected" : "error",
    });

    // Create notification for team
    if (sentinelResponse.success) {
      await base44.functions.invoke('createSecurityNotification', {
        notification_type: 'sentinel_update',
        recipient_email: user.email,
        title: 'Izulu Sentinel Sync Completed',
        message: `Security assessment and route data synced with Izulu Sentinel for team ${protection_team_id}`,
        severity: 'info',
        resource_type: 'sentinel',
        resource_id: sentinel_config_id,
        in_app_only: true,
      });
    }

    return Response.json({
      success: sentinelResponse.success,
      message: sentinelResponse.message,
      synced_at: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Sentinel sync error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchGeopoliticalContext(location) {
  // Simulate geopolitical risk assessment
  return {
    region: location?.country || "Unknown",
    risk_level: "medium",
    current_incidents: ["Minor civil unrest reported"],
    travel_advisories: "Level 1: Exercise Normal Precautions",
  };
}

async function fetchEnvironmentalAlerts(location) {
  // Simulate environmental/weather alerts
  return {
    weather: "Clear skies",
    temperature: "72°F",
    alerts: [],
    visibility: "10 miles",
  };
}

async function sendToSentinel(endpoint, payload) {
  try {
    // In production, use actual Sentinel API
    // For now, simulate successful sync
    return {
      success: true,
      message: "Data synced successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}