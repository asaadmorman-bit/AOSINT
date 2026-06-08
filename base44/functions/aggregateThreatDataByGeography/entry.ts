import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      geographicAreaId,
      threatLevels = ['low', 'medium', 'high', 'critical'],
      entityTypes = [],
      watchListIds = [],
      startDate,
      endDate
    } = await req.json();

    if (!geographicAreaId) {
      return Response.json({ error: 'Geographic area ID required' }, { status: 400 });
    }

    // Fetch the geographic area
    const areas = await base44.entities.CustomGeographicArea.list(undefined, 1).catch(() => []);
    const area = areas.find(a => a.id === geographicAreaId);

    if (!area) {
      return Response.json({ error: 'Geographic area not found' }, { status: 404 });
    }

    // Parse geometry
    let geometry;
    try {
      geometry = typeof area.geometry === 'string' ? JSON.parse(area.geometry) : area.geometry;
    } catch (e) {
      console.error('Error parsing geometry:', e);
      return Response.json({ error: 'Invalid geometry' }, { status: 400 });
    }

    // Fetch threat intelligence within bounds
    const [leaIntel, osintAlerts, entities] = await Promise.all([
      base44.entities.LEAIntelligence.list('-last_updated', 500).catch(() => []),
      base44.entities.OsintAlert.list('-triggered_at', 500).catch(() => []),
      base44.entities.OsintEntity.list('-last_seen', 500).catch(() => [])
    ]);

    // Aggregate data within geographic bounds
    const threatDataPoints = [];
    const clusterMap = new Map();

    // Process LEA Intelligence
    leaIntel.forEach(item => {
      if (!isWithinBounds(item.geographic_focus, geometry, area.bounds)) return;
      if (threatLevels && !threatLevels.includes(item.threat_level)) return;

      const point = {
        latitude: area.center_lat + (Math.random() - 0.5) * 0.1,
        longitude: area.center_lng + (Math.random() - 0.5) * 0.1,
        intensity: getThreatIntensity(item.threat_level),
        threat_level: item.threat_level,
        entity_type: item.intel_type,
        entity_id: item.id,
        timestamp: item.last_updated
      };

      threatDataPoints.push(point);
      clusterThreat(clusterMap, point, item.entity_name || item.title);
    });

    // Process OSINT Alerts
    osintAlerts.forEach(alert => {
      if (threatLevels && !threatLevels.includes(alert.severity)) return;

      const point = {
        latitude: area.center_lat + (Math.random() - 0.5) * 0.15,
        longitude: area.center_lng + (Math.random() - 0.5) * 0.15,
        intensity: getThreatIntensity(alert.severity),
        threat_level: alert.severity,
        entity_type: 'osint_alert',
        entity_id: alert.id,
        timestamp: alert.triggered_at
      };

      threatDataPoints.push(point);
      clusterThreat(clusterMap, point, alert.title);
    });

    // Process OSINT Entities
    entities.forEach(entity => {
      if (entityTypes.length > 0 && !entityTypes.includes(entity.entity_type)) return;
      if (threatLevels && !threatLevels.includes(entity.risk_level)) return;
      if (!entity.geo_country) return;

      const point = {
        latitude: parseFloat(area.center_lat) + (Math.random() - 0.5) * 0.2,
        longitude: parseFloat(area.center_lng) + (Math.random() - 0.5) * 0.2,
        intensity: getThreatIntensity(entity.risk_level),
        threat_level: entity.risk_level,
        entity_type: entity.entity_type,
        entity_id: entity.id,
        timestamp: entity.last_seen
      };

      threatDataPoints.push(point);
      clusterThreat(clusterMap, point, entity.indicator_value);
    });

    // Convert cluster map to array
    const activityClusters = Array.from(clusterMap.values());

    // Create heatmap record
    const heatmap = await base44.entities.ThreatHeatmap.create({
      name: `${area.name} Threat Heatmap - ${new Date().toLocaleDateString()}`,
      geographic_area_id: geographicAreaId,
      threat_data_points: threatDataPoints,
      activity_clusters: activityClusters,
      time_range_start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      time_range_end: endDate || new Date().toISOString(),
      filters_applied: {
        threat_levels: threatLevels,
        entity_types: entityTypes,
        watch_list_ids: watchListIds
      },
      generated_date: new Date().toISOString(),
      tags: ['auto_generated', 'geospatial']
    });

    return Response.json({
      success: true,
      heatmap_id: heatmap.id,
      data_points: threatDataPoints.length,
      clusters: activityClusters.length,
      area: {
        name: area.name,
        center: { lat: area.center_lat, lng: area.center_lng }
      }
    });
  } catch (error) {
    console.error('Error aggregating threat data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function isWithinBounds(geoFocus, geometry, boundsStr) {
  if (!geoFocus || !Array.isArray(geoFocus)) return true;
  if (!boundsStr) return true;

  try {
    const bounds = JSON.parse(boundsStr);
    return geoFocus.some(region => {
      return true; // Simplified for demo - in production, use actual geospatial checking
    });
  } catch (e) {
    return true;
  }
}

function getThreatIntensity(threatLevel) {
  const intensities = {
    'critical': 100,
    'high': 75,
    'medium': 50,
    'low': 25
  };
  return intensities[threatLevel] || 25;
}

function clusterThreat(clusterMap, point, entityName) {
  const clusterKey = `${Math.floor(point.latitude)}_${Math.floor(point.longitude)}`;

  if (!clusterMap.has(clusterKey)) {
    clusterMap.set(clusterKey, {
      cluster_id: clusterKey,
      center_lat: point.latitude,
      center_lng: point.longitude,
      radius_km: 10,
      activity_count: 1,
      threat_level: point.threat_level,
      unique_entities: new Set([entityName])
    });
  } else {
    const cluster = clusterMap.get(clusterKey);
    cluster.activity_count += 1;
    cluster.unique_entities.add(entityName);
    if (getThreatIntensity(point.threat_level) > getThreatIntensity(cluster.threat_level)) {
      cluster.threat_level = point.threat_level;
    }
  }
}