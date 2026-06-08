import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Map, { Source, Layer, Popup, NavigationControl, ScaleControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { base44 } from "@/api/base44Client";

// ─── Layer styles ────────────────────────────────────────────────────────────

const SEVERITY_EXPR = [
  "match", ["get", "severity"],
  "critical", "#ff4757",
  "high",     "#ffa502",
  "medium",   "#00d4ff",
  "low",      "#2ed573",
  /* default */ "#6b7280"
];

// Static alert points (Shodan, IOC hits, etc.)
const alertPointLayer = {
  id: "alert-points",
  type: "circle",
  filter: ["==", ["get", "layer_type"], "alert"],
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["get", "threat_score"],
      0, 5, 50, 10, 100, 18
    ],
    "circle-color": SEVERITY_EXPR,
    "circle-opacity": 0.85,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "#ffffff",
    "circle-stroke-opacity": 0.3,
  }
};

const alertPointGlowLayer = {
  id: "alert-points-glow",
  type: "circle",
  filter: ["all",
    ["==", ["get", "layer_type"], "alert"],
    ["in", ["get", "severity"], ["literal", ["critical", "high"]]]
  ],
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["get", "threat_score"],
      0, 14, 100, 30
    ],
    "circle-color": SEVERITY_EXPR,
    "circle-opacity": 0.18,
    "circle-stroke-width": 0,
  }
};

// Escalated alerts (score ≥ 80) — distinct pulsing red ring
const escalatedPulseLayer = {
  id: "escalated-pulse",
  type: "circle",
  filter: ["all",
    ["==", ["get", "layer_type"], "alert"],
    [">=", ["get", "threat_score"], 80]
  ],
  paint: {
    "circle-radius": 28,
    "circle-color": "#ff4757",
    "circle-opacity": 0.22,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "#ff4757",
    "circle-stroke-opacity": 0.5,
  }
};

// EP asset tracking (live coords)
const epTrackLayer = {
  id: "ep-tracks",
  type: "circle",
  filter: ["==", ["get", "layer_type"], "ep_asset"],
  paint: {
    "circle-radius": 9,
    "circle-color": "#a855f7",
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
    "circle-opacity": 0.95,
  }
};

const epPulseLayer = {
  id: "ep-tracks-pulse",
  type: "circle",
  filter: ["==", ["get", "layer_type"], "ep_asset"],
  paint: {
    "circle-radius": 20,
    "circle-color": "#a855f7",
    "circle-opacity": 0.12,
    "circle-stroke-width": 0,
  }
};

// Geofence polygons (social chatter zones, restricted areas)
const geofenceFillLayer = {
  id: "geofence-fill",
  type: "fill",
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: {
    "fill-color": [
      "match", ["get", "threat_level"],
      "critical", "#ff4757",
      "high",     "#ffa502",
      "medium",   "#00d4ff",
      /* default */ "#a855f7"
    ],
    "fill-opacity": 0.12,
  }
};

const geofenceLineLayer = {
  id: "geofence-outline",
  type: "line",
  filter: ["==", ["geometry-type"], "Polygon"],
  paint: {
    "line-color": [
      "match", ["get", "threat_level"],
      "critical", "#ff4757",
      "high",     "#ffa502",
      "medium",   "#00d4ff",
      /* default */ "#a855f7"
    ],
    "line-width": 1.5,
    "line-dasharray": [3, 2],
    "line-opacity": 0.7,
  }
};

// ─── GeoJSON builders ─────────────────────────────────────────────────────────

function buildPointsGeoJSON(events) {
  return {
    type: "FeatureCollection",
    features: events
      .filter(e => e.location_data?.lat && e.location_data?.lng)
      .map(e => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e.location_data.lng, e.location_data.lat],
        },
        properties: {
          id: e.id,
          layer_type: e.domain === "physical" && e.source_tool === "access_control" ? "ep_asset" : "alert",
          title: e.title,
          description: e.description || "",
          severity: e.severity,
          threat_score: e.threat_score ?? 50,
          source_tool: e.source_tool,
          status: e.status,
          domain: e.domain,
          city: e.location_data.city || "",
          country: e.location_data.country || "",
          ip_address: e.location_data.ip_address || "",
          timestamp: e.timestamp,
        },
      })),
  };
}

function buildGeofencesGeoJSON(geofences = []) {
  return {
    type: "FeatureCollection",
    features: geofences.map(g => ({
      type: "Feature",
      geometry: g.geometry,
      properties: {
        id: g.id,
        label: g.label,
        threat_level: g.threat_level || "medium",
        source: g.source || "unknown",
        description: g.description || "",
      },
    })),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThreatMapboxGL({
  events = [],
  geofences = [],
  onFeatureSelect,
}) {
  const mapRef = useRef(null);
  const [mapboxToken, setMapboxToken] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.8,
    pitch: 20,
    bearing: 0,
  });

  useEffect(() => {
    base44.functions.invoke("getMapboxToken", {})
      .then(res => setMapboxToken(res.data?.token))
      .catch(() => {});
  }, []);

  const pointsGeoJSON = useMemo(() => buildPointsGeoJSON(events), [events]);
  const geofencesGeoJSON = useMemo(() => buildGeofencesGeoJSON(geofences), [geofences]);

  const handleMapClick = useCallback((e) => {
    const features = e.features || [];
    if (!features.length) {
      setPopupInfo(null);
      return;
    }
    const f = features[0];
    const props = f.properties;
    const coords = f.geometry.coordinates;
    const lngLat = Array.isArray(coords[0]) ? coords[0][0] : coords;

    const info = {
      longitude: lngLat[0],
      latitude: lngLat[1],
      ...props,
    };
    setPopupInfo(info);
    if (onFeatureSelect) onFeatureSelect(info);
  }, [onFeatureSelect]);

  const handleLayerHover = useCallback((e) => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = e.features?.length ? "pointer" : "";
  }, []);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0e1a] text-gray-600 text-sm">
        <span className="animate-pulse">Loading map…</span>
      </div>
    );
  }

  const alertCount = pointsGeoJSON.features.filter(f => f.properties.layer_type === "alert").length;
  const epCount = pointsGeoJSON.features.filter(f => f.properties.layer_type === "ep_asset").length;
  const geofenceCount = geofencesGeoJSON.features.length;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 340 }}>
      {/* HUD overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-[#0a0e1a]/85 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">ASOSINT · Tactical Threat Map</span>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff]" /> {alertCount} Alerts
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#a855f7]" /> {epCount} EP Assets
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-[#ffa502] opacity-60" /> {geofenceCount} Geofences
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-10 bg-[#0a0e1a]/85 border border-white/10 rounded-lg px-3 py-2 pointer-events-none backdrop-blur-sm">
        {[
          ["#ff4757", "Critical"],
          ["#ffa502", "High"],
          ["#00d4ff", "Medium"],
          ["#2ed573", "Low"],
          ["#a855f7", "EP Asset"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2 text-[9px] text-gray-400 py-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%", minHeight: 340 }}
        interactiveLayerIds={["alert-points", "ep-tracks", "geofence-fill"]}
        onClick={handleMapClick}
        onMouseMove={handleLayerHover}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass style={{ marginTop: 8, marginRight: 8 }} />
        <ScaleControl position="bottom-right" />

        {/* Geofence polygons */}
        <Source id="geofences" type="geojson" data={geofencesGeoJSON}>
          <Layer {...geofenceFillLayer} />
          <Layer {...geofenceLineLayer} />
        </Source>

        {/* Alert points + EP tracks */}
        <Source id="threat-points" type="geojson" data={pointsGeoJSON}>
          <Layer {...escalatedPulseLayer} />
          <Layer {...alertPointGlowLayer} />
          <Layer {...alertPointLayer} />
          <Layer {...epPulseLayer} />
          <Layer {...epTrackLayer} />
        </Source>

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton
            closeOnClick={false}
            style={{ maxWidth: 280 }}
            className="mapbox-threat-popup"
          >
            <div
              style={{
                background: "#0d1220",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "12px 14px",
                fontFamily: "inherit",
                minWidth: 220,
              }}
            >
              {/* Score badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: popupInfo.severity === "critical" ? "#ff4757"
                    : popupInfo.severity === "high" ? "#ffa502"
                    : popupInfo.severity === "medium" ? "#00d4ff"
                    : popupInfo.severity === "low" ? "#2ed573"
                    : popupInfo.layer_type === "ep_asset" ? "#a855f7"
                    : "#6b7280",
                }}>
                  {popupInfo.layer_type === "ep_asset" ? "EP" : popupInfo.threat_score}
                </span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{popupInfo.title}</div>
                  <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {popupInfo.layer_type === "ep_asset" ? "Protected Asset" : (popupInfo.severity || "").toUpperCase()}
                    {popupInfo.source_tool ? ` · ${popupInfo.source_tool.replace(/_/g, " ")}` : ""}
                  </div>
                </div>
              </div>
              {popupInfo.description && (
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6, lineHeight: 1.5 }}>
                  {popupInfo.description.slice(0, 120)}{popupInfo.description.length > 120 ? "…" : ""}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {popupInfo.city && (
                  <span style={{ fontSize: 9, background: "rgba(255,255,255,0.05)", color: "#6b7280", borderRadius: 4, padding: "2px 6px" }}>
                    📍 {popupInfo.city}{popupInfo.country ? `, ${popupInfo.country}` : ""}
                  </span>
                )}
                {popupInfo.ip_address && (
                  <span style={{ fontSize: 9, background: "rgba(255,255,255,0.05)", color: "#6b7280", borderRadius: 4, padding: "2px 6px" }}>
                    🌐 {popupInfo.ip_address}
                  </span>
                )}
                {popupInfo.domain && (
                  <span style={{ fontSize: 9, background: "rgba(0,212,255,0.08)", color: "#00d4ff", borderRadius: 4, padding: "2px 6px" }}>
                    {popupInfo.domain}
                  </span>
                )}
              </div>
              {onFeatureSelect && (
                <button
                  onClick={() => onFeatureSelect(popupInfo)}
                  style={{
                    marginTop: 10, width: "100%", fontSize: 10, fontWeight: 700,
                    background: "rgba(0,212,255,0.1)", color: "#00d4ff",
                    border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6,
                    padding: "5px 0", cursor: "pointer",
                  }}
                >
                  View Full Details →
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}