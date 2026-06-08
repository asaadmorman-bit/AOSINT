import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SEVERITY_COLORS = {
  critical: "#ff1744",
  high: "#ff6d00",
  medium: "#ffd600",
  low: "#00b0ff",
  informational: "#546e7a",
};

const DOMAIN_COLORS = {
  cyber: "#00e5ff",
  geopolitical: "#ff1744",
  influence: "#d500f9",
  hybrid: "#ff9100",
  physical: "#ff5252",
  supply_chain: "#00e676",
  insider_threat: "#ffab40",
};

const MAP_TILES = {
  tactical: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© CartoDB",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
  },
  night: {
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution: "© CartoDB",
  },
};

function TileLayerSwitcher({ mapStyle }) {
  const tile = MAP_TILES[mapStyle] || MAP_TILES.tactical;
  return <TileLayer url={tile.url} attribution={tile.attribution} />;
}

// FlyTo controller — listens for flyTarget changes
function FlyToController({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTarget) return;
    map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 6, { duration: 2.5, easeLinearity: 0.3 });
  }, [flyTarget]);
  return null;
}

function getPulseRadius(severity) {
  return { critical: 16, high: 12, medium: 9, low: 7, informational: 5 }[severity] || 7;
}

// Generate arc lines between critical events
function generateArcs(events) {
  const critical = events.filter(e => e.severity === "critical" || e.severity === "high").slice(0, 14);
  const arcs = [];
  for (let i = 0; i < critical.length - 1; i += 2) {
    if (critical[i + 1]) {
      arcs.push({
        id: `arc-${i}`,
        from: [critical[i].lat, critical[i].lng],
        to: [critical[i + 1].lat, critical[i + 1].lng],
        color: DOMAIN_COLORS[critical[i].domain] || "#ff1744",
        severity: critical[i].severity,
      });
    }
  }
  return arcs;
}

function buildArcPoints(from, to, steps = 24) {
  const pts = [];
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dist = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2));
  const arcHeight = dist * 0.35;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from[0] * (1 - t) * (1 - t) + (midLat + arcHeight) * 2 * t * (1 - t) + to[0] * t * t;
    const lng = from[1] * (1 - t) * (1 - t) + midLng * 2 * t * (1 - t) + to[1] * t * t;
    pts.push([lat, lng]);
  }
  return pts;
}

// Animated "pulse dot" that travels along an arc
function AnimatedArcPulse({ arc, tick }) {
  const pts = buildArcPoints(arc.from, arc.to, 24);
  const idx = tick % pts.length;
  const pos = pts[idx];
  return (
    <CircleMarker
      center={pos}
      radius={3}
      pathOptions={{
        color: arc.color,
        fillColor: arc.color,
        fillOpacity: 0.9,
        weight: 0,
        opacity: 1,
      }}
    />
  );
}

// Satellite track — circular orbit approximation
function SatelliteTrack({ sat, tick }) {
  const orbitPts = [];
  for (let i = 0; i <= 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    const lat = sat.baseLat + Math.sin(angle + sat.phase) * sat.radiusLat;
    const lng = sat.baseLng + Math.cos(angle + sat.phase) * sat.radiusLng;
    orbitPts.push([lat, lng]);
  }
  // Current position along orbit
  const posIdx = tick % 72;
  const currentPos = orbitPts[posIdx];

  return (
    <>
      <Polyline
        positions={orbitPts}
        pathOptions={{ color: "#00e5ff", weight: 0.5, opacity: 0.12, dashArray: "2 6" }}
      />
      <CircleMarker
        center={currentPos}
        radius={4}
        pathOptions={{ color: "#00e5ff", fillColor: "#00e5ff", fillOpacity: 1, weight: 1, opacity: 0.9 }}
      >
        <Tooltip className="threat-tooltip" direction="top" offset={[0, -6]}>
          <span className="font-mono text-[10px]">{sat.name}</span>
        </Tooltip>
      </CircleMarker>
    </>
  );
}

// Simulated satellite orbits (ISS-style inclinations)
const SATELLITES = [
  { name: "ISS", baseLat: 0, baseLng: 0, radiusLat: 51, radiusLng: 180, phase: 0 },
  { name: "SAR-RECON-1", baseLat: 5, baseLng: 20, radiusLat: 55, radiusLng: 160, phase: 1.2 },
  { name: "SIGINT-7", baseLat: -3, baseLng: -40, radiusLat: 45, radiusLng: 170, phase: 2.4 },
  { name: "EO-SAT-KH", baseLat: 8, baseLng: 60, radiusLat: 48, radiusLng: 155, phase: 0.7 },
];

// Notable real-world flight routes for visualization (great circle paths between real cities/bases)
const FLIGHT_ROUTES = [
  // Military / Recon routes
  { id: "f1", callsign: "RAGE11", type: "RC-135W", category: "military", color: "#ff4757",
    waypoints: [[51.5, -0.4], [54.0, 5.0], [57.0, 15.0], [60.0, 22.0], [58.5, 28.0]], speed: 0.4 },
  { id: "f2", callsign: "SHARK02", type: "P-8 Poseidon", category: "military", color: "#ff6b35",
    waypoints: [[36.5, -5.5], [38.0, 10.0], [37.5, 20.0], [36.0, 30.0], [35.0, 35.5]], speed: 0.35 },
  { id: "f3", callsign: "UAVGH000", type: "RQ-4 Global Hawk", category: "military", color: "#ffa502",
    waypoints: [[36.0, 14.0], [38.0, 25.0], [40.0, 35.0], [42.0, 42.0], [44.0, 48.0]], speed: 0.25 },
  // Commercial / Civil
  { id: "f4", callsign: "UAE001", type: "B777", category: "civil", color: "#00d4ff",
    waypoints: [[25.2, 55.4], [30.0, 65.0], [35.0, 72.0], [42.0, 78.0], [51.5, 0.5]], speed: 0.55 },
  { id: "f5", callsign: "BAW177", type: "A380", category: "civil", color: "#00b4d8",
    waypoints: [[51.5, -0.4], [45.0, -20.0], [35.0, -40.0], [20.0, -55.0], [1.3, -16.6]], speed: 0.5 },
  { id: "f6", callsign: "SIA321", type: "A350", category: "civil", color: "#0096c7",
    waypoints: [[1.3, 103.9], [15.0, 105.0], [28.0, 107.0], [37.5, 127.0], [35.7, 139.7]], speed: 0.52 },
  // VIP / Government
  { id: "f7", callsign: "SAM001", type: "VC-25A", category: "vip", color: "#a855f7",
    waypoints: [[38.9, -77.0], [45.0, -50.0], [52.0, -20.0], [51.5, -0.4]], speed: 0.6 },
  { id: "f8", callsign: "TOPAZ11", type: "E-3 Sentry", category: "military", color: "#ff4757",
    waypoints: [[50.0, 8.0], [52.0, 15.0], [54.0, 20.0], [55.5, 25.0], [54.0, 30.0]], speed: 0.3 },
];

// Interpolate position along waypoints based on progress 0..1
function interpolateRoute(waypoints, progress) {
  if (!waypoints || waypoints.length < 2) return waypoints?.[0] || [0, 0];
  const totalSegments = waypoints.length - 1;
  const segProgress = progress * totalSegments;
  const segIdx = Math.min(Math.floor(segProgress), totalSegments - 1);
  const segT = segProgress - segIdx;
  const from = waypoints[segIdx];
  const to = waypoints[segIdx + 1];
  return [
    from[0] + (to[0] - from[0]) * segT,
    from[1] + (to[1] - from[1]) * segT,
  ];
}

// Compute heading angle between two points
function computeHeading(from, to) {
  const dLng = (to[1] - from[1]) * (Math.PI / 180);
  const lat1 = from[0] * (Math.PI / 180);
  const lat2 = to[0] * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Aircraft marker using a rotated plane icon
function AircraftMarker({ route, progress }) {
  const pos = interpolateRoute(route.waypoints, progress);
  const nextProgress = Math.min(progress + 0.01, 1);
  const nextPos = interpolateRoute(route.waypoints, nextProgress);
  const heading = computeHeading(pos, nextPos);

  const catColors = { military: "#ff4757", civil: "#00d4ff", vip: "#a855f7" };
  const col = catColors[route.category] || "#00d4ff";

  const planeIcon = L.divIcon({
    html: `<div style="transform:rotate(${heading}deg);font-size:14px;line-height:1;filter:drop-shadow(0 0 4px ${col})">✈</div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  // Trail: last N points behind current position
  const trailPoints = [];
  for (let i = 0; i <= 20; i++) {
    const tp = Math.max(0, progress - (i * 0.012));
    trailPoints.push(interpolateRoute(route.waypoints, tp));
  }

  return (
    <>
      {/* Trail fade */}
      <Polyline
        positions={trailPoints}
        pathOptions={{ color: col, weight: 1.5, opacity: 0.35, dashArray: "3 4" }}
      />
      {/* Full planned route (faint) */}
      <Polyline
        positions={route.waypoints}
        pathOptions={{ color: col, weight: 0.5, opacity: 0.1 }}
      />
      {/* Aircraft icon */}
      <Marker position={pos} icon={planeIcon}>
        <Tooltip className="threat-tooltip" direction="top" offset={[0, -10]}>
          <div className="font-mono">
            <div className="font-bold text-xs" style={{ color: col }}>{route.callsign}</div>
            <div className="text-[10px] text-gray-400">{route.type}</div>
            <div className="text-[9px] text-gray-500">HDG {Math.round(heading)}° · {route.category.toUpperCase()}</div>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
}

export default function SituationalMap({ events, mapStyle, onEventClick, selectedEvent, layers, flyTarget, liveEvents }) {
  const [tick, setTick] = useState(0);
  const [arcOffset, setArcOffset] = useState(0);
  // Aircraft progress: map of route.id -> 0..1 (looping)
  const [flightProgress, setFlightProgress] = useState(() =>
    Object.fromEntries(FLIGHT_ROUTES.map((r, i) => [r.id, (i * 0.13) % 1]))
  );

  // Main animation tick — 200ms for smooth movement
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => (t + 1) % 360);
      setArcOffset(a => (a + 1) % 24);
      setFlightProgress(prev => {
        const next = {};
        FLIGHT_ROUTES.forEach(r => {
          next[r.id] = (prev[r.id] + r.speed * 0.002) % 1;
        });
        return next;
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  const allEvents = [...events, ...(liveEvents || [])];
  const color = (ev) => DOMAIN_COLORS[ev.domain] || SEVERITY_COLORS[ev.severity] || "#aaa";
  const arcs = generateArcs(allEvents);
  const pulseScale = 1 + Math.sin((tick / 5)) * 0.2;

  return (
    <div className="w-full h-full relative">
      <style>{`
        .leaflet-container { background: #020509 !important; }
        .leaflet-tile { filter: brightness(0.75) contrast(1.2) saturate(0.7); }
        .threat-tooltip {
          background: rgba(2,5,9,0.97) !important;
          border: 1px solid rgba(0,229,255,0.25) !important;
          color: #e2e8f0 !important;
          font-size: 11px !important;
          padding: 6px 10px !important;
          border-radius: 3px !important;
          font-family: monospace !important;
          box-shadow: 0 0 12px rgba(0,229,255,0.15) !important;
        }
        .leaflet-tooltip-top:before { border-top-color: rgba(0,229,255,0.25) !important; }
        .leaflet-control-zoom { display: none; }
        .leaflet-attribution-flag { display: none; }
        .leaflet-control-attribution { display: none; }
      `}</style>

      <MapContainer
        center={[20, 15]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        style={{ width: "100%", height: "100%", background: "#020509" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
      >
        <TileLayerSwitcher mapStyle={mapStyle} />
        <FlyToController flyTarget={flyTarget} />

        {/* ── Satellite orbits ── */}
        {layers?.satellites !== false && SATELLITES.map(sat => (
          <SatelliteTrack key={sat.name} sat={sat} tick={tick} />
        ))}

        {/* ── Aircraft flight paths ── */}
        {layers?.flights !== false && FLIGHT_ROUTES.map(route => (
          <AircraftMarker
            key={route.id}
            route={route}
            progress={flightProgress[route.id] || 0}
          />
        ))}

        {/* ── Arc lines — threat trajectories ── */}
        {layers?.arcs !== false && arcs.map((arc, idx) => (
          <React.Fragment key={arc.id}>
            <Polyline
              positions={buildArcPoints(arc.from, arc.to)}
              pathOptions={{
                color: arc.color,
                weight: arc.severity === "critical" ? 1.5 : 1,
                opacity: 0.3,
                dashArray: arc.severity === "critical" ? "4 4" : "2 8",
              }}
            />
            {/* Animated pulse dot traveling along arc */}
            <AnimatedArcPulse
              arc={arc}
              tick={(tick + idx * 7) % 24}
            />
          </React.Fragment>
        ))}

        {/* ── Live open-source intel events (highlighted differently) ── */}
        {(liveEvents || []).map(ev => (
          <CircleMarker
            key={`live-${ev.id}`}
            center={[ev.lat, ev.lng]}
            radius={getPulseRadius(ev.severity) + 2}
            pathOptions={{
              color: "#00ff88",
              fillColor: color(ev),
              fillOpacity: 0.7,
              weight: 1.5,
              opacity: 0.9,
              dashArray: "3 2",
            }}
            eventHandlers={{ click: () => onEventClick(ev) }}
          >
            <Tooltip className="threat-tooltip" direction="top" offset={[0, -10]}>
              <div className="font-mono">
                <div className="font-bold text-xs mb-1 text-[#00ff88]">● LIVE: {ev.title}</div>
                <div className="flex gap-2 text-[10px]">
                  <span style={{ color: DOMAIN_COLORS[ev.domain] || "#00e5ff" }} className="uppercase font-bold">{ev.domain}</span>
                  <span className="text-gray-500">·</span>
                  <span style={{ color: SEVERITY_COLORS[ev.severity] }} className="uppercase">{ev.severity}</span>
                </div>
                {ev.source && <div className="text-gray-600 text-[9px] mt-0.5">SRC: {ev.source}</div>}
                <div className="text-gray-500 text-[9px] mt-0.5">
                  {ev.lat?.toFixed(2)}° {ev.lng?.toFixed(2)}°
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* ── Internal DB events ── */}
        {allEvents.filter(ev => !ev._isLive).map(ev => {
          const isSelected = selectedEvent?.id === ev.id;
          const r = getPulseRadius(ev.severity);
          const c = color(ev);
          const isCritical = ev.severity === "critical";

          return (
            <React.Fragment key={ev.id}>
              {isCritical && (
                <CircleMarker
                  center={[ev.lat, ev.lng]}
                  radius={r * pulseScale + 10}
                  pathOptions={{ color: c, fillColor: "transparent", fillOpacity: 0, weight: 0.5, opacity: 0.15 }}
                />
              )}
              <CircleMarker
                center={[ev.lat, ev.lng]}
                radius={r + 7}
                pathOptions={{ color: c, fillColor: c, fillOpacity: 0.06, weight: 0.8, opacity: 0.25 }}
              />
              <CircleMarker
                center={[ev.lat, ev.lng]}
                radius={isSelected ? r + 4 : r}
                pathOptions={{
                  color: isSelected ? "#ffffff" : c,
                  fillColor: c,
                  fillOpacity: isSelected ? 1 : 0.85,
                  weight: isSelected ? 2.5 : 1.5,
                  opacity: 1,
                }}
                eventHandlers={{ click: () => onEventClick(ev) }}
              >
                <Tooltip className="threat-tooltip" direction="top" offset={[0, -10]}>
                  <div className="font-mono">
                    <div className="font-bold text-xs mb-1 text-white">{ev.title}</div>
                    <div className="flex gap-2 text-[10px]">
                      <span style={{ color: c }} className="uppercase font-bold">{ev.domain}</span>
                      <span className="text-gray-500">·</span>
                      <span style={{ color: SEVERITY_COLORS[ev.severity] }} className="uppercase">{ev.severity}</span>
                    </div>
                    <div className="text-gray-500 text-[9px] mt-0.5">
                      {ev.lat?.toFixed(2)}° {ev.lng?.toFixed(2)}°
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* ── Corner HUD brackets ── */}
      <div className="absolute inset-0 pointer-events-none z-[999]">
        <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-[#00e5ff]/30" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-[#00e5ff]/30" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-[#00e5ff]/30" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-[#00e5ff]/30" />

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#00e5ff]" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#00e5ff]" />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#00e5ff]/40 tracking-widest">
          GRID · WGS84 · MERCATOR · 4D
        </div>
      </div>
    </div>
  );
}