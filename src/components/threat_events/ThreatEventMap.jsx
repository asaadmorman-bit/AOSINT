import React, { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SEVERITY_COLORS = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#00d4ff",
  low: "#2ed573",
  informational: "#6b7280",
};

export default function ThreatEventMap({ events = [] }) {
  const plotted = useMemo(
    () => events.filter(e => e.location_data?.lat && e.location_data?.lng),
    [events]
  );

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: 280 }}>
      {/* Dark overlay label */}
      <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1.5 bg-[#0d1220]/80 border border-white/10 rounded px-2 py-1 text-[10px] text-gray-400 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
        GLOBAL THREAT MAP · {plotted.length} events plotted
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[#0d1220]/80 border border-white/10 rounded px-2 py-1.5 pointer-events-none">
        {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1.5 text-[9px] text-gray-400">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </div>
        ))}
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: "100%", height: "100%", minHeight: 280, background: "#0a0e1a" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {plotted.map((event) => {
          const color = SEVERITY_COLORS[event.severity] ?? "#6b7280";
          const radius = Math.max(4, Math.min(14, (event.threat_score / 100) * 14));
          return (
            <CircleMarker
              key={event.id}
              center={[event.location_data.lat, event.location_data.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.75,
                color: color,
                weight: 1.5,
                opacity: 0.9,
              }}
            >
              <Tooltip>
                <div className="text-xs">
                  <strong>{event.title}</strong><br />
                  Score: {event.threat_score} | {event.severity?.toUpperCase()}<br />
                  {event.location_data.city && `${event.location_data.city}, `}{event.location_data.country}<br />
                  Source: {event.source_tool}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {plotted.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
          <p className="text-xs text-gray-600">No geolocated events to plot</p>
        </div>
      )}
    </div>
  );
}