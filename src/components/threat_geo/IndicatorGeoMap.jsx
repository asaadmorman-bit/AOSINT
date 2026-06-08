import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SEVERITY_COLORS = {
  critical: "#ff1744",
  high:     "#ff6d00",
  medium:   "#ffd600",
  low:      "#00b0ff",
  informational: "#546e7a",
};

const TYPE_COLORS = {
  ip_address: "#00e5ff",
  domain:     "#d500f9",
  hash:       "#ff9100",
  cve:        "#ff1744",
  actor:      "#f50057",
  url:        "#00e676",
  email:      "#ffab40",
};

// Deterministic geo from ID
function pseudoGeo(id, seed = 1) {
  if (!id) return null;
  let h = seed * 1000;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return {
    lat: parseFloat((((Math.abs(h) % 160) - 80) + (seed * 3.7 % 4)).toFixed(3)),
    lng: parseFloat((((Math.abs(h * 7) % 340) - 170) + (seed * 5.1 % 4)).toFixed(3)),
  };
}

export default function IndicatorGeoMap({ indicators, selectedId, onSelect }) {
  return (
    <div className="w-full h-full relative">
      <style>{`
        .geo-tooltip {
          background: rgba(10,14,26,0.97) !important;
          border: 1px solid rgba(0,229,255,0.2) !important;
          color: #e2e8f0 !important;
          font-size: 11px !important;
          border-radius: 4px !important;
          font-family: monospace !important;
        }
        .leaflet-tooltip-top:before { border-top-color: rgba(0,229,255,0.2) !important; }
        .leaflet-control-zoom, .leaflet-control-attribution { display: none !important; }
        .geo-tile { filter: brightness(0.7) contrast(1.2) saturate(0.5); }
      `}</style>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        style={{ width: "100%", height: "100%", background: "#0a0e1a" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          className="geo-tile"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {indicators.map(ind => {
          const pos = pseudoGeo(ind.id);
          if (!pos) return null;
          const c = SEVERITY_COLORS[ind.severity] || "#546e7a";
          const tc = TYPE_COLORS[ind.indicator_type] || "#aaa";
          const isSelected = ind.id === selectedId;
          return (
            <React.Fragment key={ind.id}>
              {isSelected && (
                <CircleMarker center={[pos.lat, pos.lng]} radius={18}
                  pathOptions={{ color: "#fff", fillColor: "transparent", fillOpacity: 0, weight: 1.5, opacity: 0.5 }} />
              )}
              <CircleMarker center={[pos.lat, pos.lng]} radius={isSelected ? 10 : 7}
                pathOptions={{ color: c, fillColor: tc, fillOpacity: 0.8, weight: 1.5, opacity: 1 }}
                eventHandlers={{ click: () => onSelect(ind) }}
              >
                <Tooltip className="geo-tooltip" direction="top" offset={[0, -8]}>
                  <div>
                    <div className="font-bold text-white text-xs mb-0.5 truncate max-w-[200px]">{ind.title}</div>
                    <div className="flex gap-2 text-[10px]">
                      <span style={{ color: tc }}>{ind.indicator_type?.replace("_", " ")}</span>
                      <span style={{ color: c }} className="uppercase font-bold">{ind.severity}</span>
                    </div>
                    <div className="text-gray-500 text-[9px] mt-0.5">{pos.lat}° {pos.lng}°</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none bg-[#0a0e1a]/90 border border-white/8 rounded px-2.5 py-2">
        <div className="text-[8px] text-gray-600 font-mono tracking-widest mb-1.5 uppercase">Severity</div>
        {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: v }} />
            <span className="text-[9px] font-mono text-gray-500 uppercase">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}