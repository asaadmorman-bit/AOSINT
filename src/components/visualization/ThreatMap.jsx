import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Country coordinates for threat origins/targets
const COUNTRY_COORDS = {
  'Russia': [61.5240, 105.3188],
  'North Korea': [40.3399, 127.5101],
  'China': [35.8617, 104.1954],
  'United States': [37.0902, -95.7129],
  'Iran': [32.4279, 53.6880],
  'India': [20.5937, 78.9629],
  'United Kingdom': [55.3781, -3.4360],
  'Israel': [31.0461, 34.8516],
  'Germany': [51.1657, 10.4515],
  'Japan': [36.2048, 138.2529],
  'South Korea': [35.9078, 127.7669],
  'Unknown': [20, 0],
};

export default function ThreatMap({ threatActors = [], campaigns = [] }) {
  // Build markers from threat actors
  const actorMarkers = threatActors
    .filter(a => a.attributed_country && COUNTRY_COORDS[a.attributed_country])
    .map(a => ({
      id: a.id,
      name: a.name,
      country: a.attributed_country,
      coords: COUNTRY_COORDS[a.attributed_country],
      type: 'actor',
      data: a,
      severity: a.convergence_score > 75 ? 'critical' : a.convergence_score > 50 ? 'high' : 'medium',
    }));

  // Build target markers from campaigns
  const targetMarkers = campaigns
    .flatMap(c => (c.target_regions || []).map(region => ({
      id: c.id,
      name: c.name,
      country: region,
      coords: COUNTRY_COORDS[region],
      type: 'target',
      data: c,
      severity: c.campaign_type === 'espionage' ? 'critical' : 'high',
    })))
    .filter(m => m.coords);

  const severityColors = {
    critical: '#ff4757',
    high: '#ffa502',
    medium: '#ffc107',
    low: '#2ed573',
  };

  const severitySizes = {
    critical: 20,
    high: 15,
    medium: 10,
    low: 8,
  };

  return (
    <div className="w-full h-screen rounded-lg overflow-hidden border border-white/5">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="bg-[#0a0e1a]"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        {/* Threat Actor Origins */}
        {actorMarkers.map(marker => (
          <CircleMarker
            key={`${marker.type}-${marker.id}`}
            center={marker.coords}
            radius={severitySizes[marker.severity]}
            fillColor={severityColors[marker.severity]}
            fillOpacity={0.7}
            color={severityColors[marker.severity]}
            weight={2}
            opacity={0.8}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs">
                <strong>{marker.name}</strong>
                <br />
                {marker.country}
                <br />
                <span className="text-gray-400">{marker.type === 'actor' ? 'Origin' : 'Target'}</span>
              </div>
            </Tooltip>
            <Popup>
              <div className="text-xs space-y-1 p-2">
                <strong>{marker.name}</strong>
                <p className="text-gray-600">{marker.country}</p>
                {marker.type === 'actor' && marker.data.actor_type && (
                  <p className="text-gray-600">Type: {marker.data.actor_type}</p>
                )}
                {marker.type === 'actor' && marker.data.convergence_score && (
                  <p className="text-gray-600">Convergence: {marker.data.convergence_score}%</p>
                )}
                {marker.type === 'target' && marker.data.campaign_type && (
                  <p className="text-gray-600">Campaign: {marker.data.campaign_type}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Target locations */}
        {targetMarkers.map((marker, idx) => (
          <CircleMarker
            key={`target-${idx}`}
            center={marker.coords}
            radius={severitySizes[marker.severity]}
            fillColor={severityColors[marker.severity]}
            fillOpacity={0.3}
            color={severityColors[marker.severity]}
            weight={1}
            opacity={0.5}
            dashArray="5, 5"
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs">
                <strong>{marker.name}</strong>
                <br />
                {marker.country} (Target)
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#0d1220]/90 border border-white/10 rounded-lg p-3 text-xs space-y-1 z-40">
        <p className="font-bold text-gray-300 mb-2">Legend</p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Threat Actor Origin (Critical)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span>Threat Actor Origin (High)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-orange-500" style={{opacity: 0.3}}></div>
          <span>Campaign Target</span>
        </div>
      </div>
    </div>
  );
}