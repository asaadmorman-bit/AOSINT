import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe2, Filter, RefreshCw, AlertTriangle, Shield, Zap,
  Info, ExternalLink, X, Activity, Loader2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

// --- Static geo approximations for common country codes / regions ---
const COUNTRY_COORDS = {
  US: [37.09, -95.71], RU: [61.52, 105.32], CN: [35.86, 104.19], DE: [51.16, 10.45],
  GB: [55.37, -3.43], FR: [46.22, 2.21], BR: [14.23, -51.92], IN: [20.59, 78.96],
  JP: [36.20, 138.25], KR: [35.90, 127.76], AU: [-25.27, 133.77], CA: [56.13, -106.34],
  NL: [52.13, 5.29], UA: [48.37, 31.16], IR: [32.42, 53.68], KP: [40.33, 127.51],
  NG: [9.08, 8.67], ZA: [-30.55, 22.93], MX: [23.63, -102.55], AR: [-38.41, -63.61],
  TR: [38.96, 35.24], SA: [23.88, 45.07], PK: [30.37, 69.34], ID: [-0.78, 113.92],
  PH: [12.87, 121.77], TH: [15.87, 100.99], VN: [14.05, 108.27], SG: [1.35, 103.82],
  MY: [4.21, 101.97], EG: [26.82, 30.80], IL: [31.04, 34.85], IT: [41.87, 12.56],
  ES: [40.46, -3.74], PL: [51.91, 19.14], SE: [60.12, 18.64], NO: [60.47, 8.46],
  CH: [46.81, 8.22], AT: [47.51, 14.55], BE: [50.50, 4.46], CZ: [49.81, 15.47],
  RO: [45.94, 24.96], HU: [47.16, 19.50], BG: [42.73, 25.48], HR: [45.10, 15.20],
  DEFAULT: [20, 0],
};

function getCoords(indicator) {
  if (indicator.geo_lat && indicator.geo_lon) return [+indicator.geo_lat, +indicator.geo_lon];
  const country = indicator.tags?.find(t => t.length === 2)?.toUpperCase();
  if (country && COUNTRY_COORDS[country]) return COUNTRY_COORDS[country];
  // Jitter DEFAULT so overlapping points spread
  return [COUNTRY_COORDS.DEFAULT[0] + (Math.random() - 0.5) * 60, COUNTRY_COORDS.DEFAULT[1] + (Math.random() - 0.5) * 120];
}

const SEV_COLOR = { critical: "#ff4757", high: "#ff6b35", medium: "#ffa502", low: "#2ed573", informational: "#6b7280" };
const SEV_RADIUS = { critical: 12, high: 9, medium: 7, low: 5, informational: 4 };

const TYPE_OPTIONS = ["all", "ip_address", "domain", "hash", "url", "cve", "actor", "campaign"];
const SEV_OPTIONS = ["all", "critical", "high", "medium", "low", "informational"];
const REGION_OPTIONS = [
  { label: "All Regions", bounds: null },
  { label: "North America", bounds: [[15, -170], [75, -50]] },
  { label: "Europe", bounds: [[35, -25], [72, 45]] },
  { label: "Asia Pacific", bounds: [[-10, 60], [60, 180]] },
  { label: "Middle East", bounds: [[10, 30], [45, 65]] },
  { label: "Africa", bounds: [[-40, -20], [40, 55]] },
  { label: "Latin America", bounds: [[-60, -120], [20, -30]] },
];

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { animate: true, duration: 1 });
    else map.setView([20, 0], 2, { animate: true });
  }, [bounds]);
  return null;
}

function MarkerDetail({ indicator, onClose, navigate }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 bg-[#0d1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-xs font-bold text-white uppercase tracking-wide">{indicator.indicator_type} Indicator</span>
        <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <code className="text-sm text-[#00d4ff] font-mono break-all block">{indicator.value}</code>
          <p className="text-xs text-gray-500 mt-1">{indicator.title}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ color: SEV_COLOR[indicator.severity] || "#6b7280", background: `${SEV_COLOR[indicator.severity] || "#6b7280"}20` }}>
            {indicator.severity}
          </span>
          <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full font-medium">{indicator.status}</span>
          {indicator.threat_category && (
            <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded-full font-medium">{indicator.threat_category}</span>
          )}
        </div>
        {indicator.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {indicator.tags.slice(0, 6).map(t => (
              <span key={t} className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-mono">{t}</span>
            ))}
          </div>
        )}
        {indicator.notes && <p className="text-[11px] text-gray-400 leading-relaxed">{indicator.notes}</p>}
        <div className="flex gap-2 pt-1">
          {indicator.feed_name && (
            <span className="text-[9px] text-gray-600">Source: {indicator.feed_name}</span>
          )}
        </div>
        <div className="text-[9px] text-gray-600">
          First seen: {indicator.first_seen ? new Date(indicator.first_seen).toLocaleDateString() : new Date(indicator.created_date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default function ThreatIndicatorMap() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [region, setRegion] = useState(REGION_OPTIONS[0]);
  const [selected, setSelected] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const { data: indicators = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["threat_indicators_map"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 300),
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    return indicators.filter(ind => {
      if (typeFilter !== "all" && ind.indicator_type !== typeFilter) return false;
      if (sevFilter !== "all" && ind.severity !== sevFilter) return false;
      return true;
    });
  }, [indicators, typeFilter, sevFilter]);

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
    filtered.forEach(i => { if (c[i.severity] !== undefined) c[i.severity]++; });
    return c;
  }, [filtered]);

  // Memoize coords to avoid jitter on re-render
  const plotData = useMemo(() =>
    filtered.map(ind => ({ ...ind, _coords: getCoords(ind) })),
    [filtered]
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#00d4ff]" /> Global Threat Indicator Map
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 animate-pulse">LIVE</span>
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Plotting {filtered.length} of {indicators.length} indicators · updated {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="text-gray-500 hover:text-[#00d4ff] transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setShowFilters(!showFilters)} className="h-7 text-xs bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 gap-1">
            <Filter className="w-3 h-3" /> Filters
          </Button>
        </div>
      </div>

      {/* Severity summary chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(counts).map(([sev, count]) => count > 0 && (
          <button
            key={sev}
            onClick={() => setSevFilter(sevFilter === sev ? "all" : sev)}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all"
            style={{
              color: SEV_COLOR[sev],
              borderColor: sevFilter === sev ? SEV_COLOR[sev] : `${SEV_COLOR[sev]}30`,
              background: sevFilter === sev ? `${SEV_COLOR[sev]}20` : `${SEV_COLOR[sev]}08`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEV_COLOR[sev] }} />
            {sev} ({count})
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-3 flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Type</p>
            <div className="flex flex-wrap gap-1">
              {TYPE_OPTIONS.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${typeFilter === t ? "bg-[#00d4ff]/20 border-[#00d4ff]/40 text-[#00d4ff]" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>
                  {t === "all" ? "All" : t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Region</p>
            <div className="flex flex-wrap gap-1">
              {REGION_OPTIONS.map(r => (
                <button key={r.label} onClick={() => setRegion(r)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${region.label === r.label ? "bg-[#a855f7]/20 border-[#a855f7]/40 text-[#a855f7]" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-white/5" style={{ height: "500px" }}>
        {isLoading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-[#0a0e1a]/80">
            <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
          </div>
        )}

        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ width: "100%", height: "100%", background: "#0a0e1a" }}
          zoomControl={true}
          scrollWheelZoom={true}
          minZoom={1}
          maxZoom={10}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />
          <FitBounds bounds={region.bounds} />

          {plotData.map(ind => (
            <CircleMarker
              key={ind.id}
              center={ind._coords}
              radius={SEV_RADIUS[ind.severity] || 6}
              pathOptions={{
                color: SEV_COLOR[ind.severity] || "#6b7280",
                fillColor: SEV_COLOR[ind.severity] || "#6b7280",
                fillOpacity: 0.7,
                weight: 1.5,
                opacity: 0.9,
              }}
              eventHandlers={{ click: () => setSelected(ind) }}
            >
              <Popup className="threat-popup">
                <div className="bg-[#0d1220] p-2 rounded text-xs space-y-1 min-w-[160px]">
                  <p className="font-bold text-white">{ind.indicator_type?.toUpperCase()}</p>
                  <code className="text-[#00d4ff] break-all text-[10px]">{ind.value}</code>
                  <p className="text-gray-400 text-[10px]">{ind.title}</p>
                  <span className="text-[9px] font-bold" style={{ color: SEV_COLOR[ind.severity] }}>{ind.severity?.toUpperCase()}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Detail overlay */}
        {selected && (
          <MarkerDetail indicator={selected} onClose={() => setSelected(null)} navigate={navigate} />
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[999] bg-[#0d1220]/90 border border-white/10 rounded-xl px-3 py-2 space-y-1">
          <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Severity</p>
          {Object.entries(SEV_COLOR).map(([sev, color]) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-gray-400 capitalize">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table summary below map */}
      {filtered.length > 0 && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5">
            <p className="text-xs font-bold text-gray-300">Recent Indicators ({Math.min(filtered.length, 20)} shown)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase text-gray-500">
                  <th className="text-left px-4 py-2">Value</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Severity</th>
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-left px-4 py-2">Seen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map(ind => (
                  <tr key={ind.id} onClick={() => setSelected(ind)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <td className="px-4 py-2">
                      <code className="text-[#00d4ff] font-mono text-[10px] truncate block max-w-[200px]">{ind.value}</code>
                      <span className="text-[9px] text-gray-500 truncate block">{ind.title}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">{ind.indicator_type}</td>
                    <td className="px-4 py-2">
                      <span className="text-[9px] font-bold" style={{ color: SEV_COLOR[ind.severity] || "#6b7280" }}>
                        {ind.severity?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500">{ind.threat_category || "—"}</td>
                    <td className="px-4 py-2 text-gray-600 text-[10px]">{new Date(ind.created_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}