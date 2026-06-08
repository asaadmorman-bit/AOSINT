import React, { useState, useEffect } from "react";
import { MapPin, Navigation, AlertTriangle, RefreshCw, Shield, Zap } from "lucide-react";

const ROUTES = [
  { id: "A", label: "Route Alpha — Primary", risk: "low", distance: "2.4 mi", eta: "8 min", status: "CLEAR", color: "#2ed573", waypoints: ["Start: HQ Lobby", "Via: K St NW (avoid 16th)", "Checkpoint: Union Station P3", "End: Safe House Delta"] },
  { id: "B", label: "Route Bravo — Alternate", risk: "medium", distance: "3.1 mi", eta: "11 min", status: "MONITOR", color: "#ffa502", waypoints: ["Start: HQ Side Exit", "Via: Massachusetts Ave", "Checkpoint: Capitol Hill Garage", "End: Safe House Echo"] },
  { id: "C", label: "Route Charlie — Emergency", risk: "low", distance: "1.8 mi", eta: "6 min", status: "STANDBY", color: "#00d4ff", waypoints: ["Start: HQ Roof Exit", "Via: I-395 Tunnel", "Checkpoint: Pentagon Metro", "End: Safe House Foxtrot"] },
  { id: "D", label: "Route Delta — Exfil", risk: "high", distance: "4.7 mi", eta: "16 min", status: "COMPROMISED", color: "#ff4757", waypoints: ["Start: HQ Loading Dock", "Via: 14th St Bridge", "Warning: IOC detected at waypoint 2", "Status: AVOID"] },
];

const INCIDENTS = [
  { lat: 38.907, lng: -77.036, label: "IOC Cluster", sev: "critical" },
  { lat: 38.895, lng: -77.008, label: "Heavy Police Activity", sev: "high" },
  { lat: 38.912, lng: -77.021, label: "Crowd Surge", sev: "medium" },
  { lat: 38.901, lng: -77.045, label: "Traffic Block", sev: "medium" },
];

export default function EvasionMap() {
  const [selected, setSelected] = useState("A");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => { setLastRefresh(new Date()); setRefreshing(false); }, 1200);
  };

  const route = ROUTES.find(r => r.id === selected);
  const riskColor = { low: "#2ed573", medium: "#ffa502", high: "#ff4757" };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#2ed573]" /> Escape & Evasion Route Planner
          </h2>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5">Threat-weighted · Live traffic · IOC-avoidance active</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Route list */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Available Routes</p>
          {ROUTES.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected === r.id ? "border-opacity-50 bg-opacity-10" : "border-white/5 bg-[#0d1220] hover:border-white/10"}`}
              style={selected === r.id ? { borderColor: `${r.color}50`, backgroundColor: `${r.color}08` } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white">{r.label}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: r.color, backgroundColor: `${r.color}15`, border: `1px solid ${r.color}25` }}>{r.status}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-600 font-mono">
                <span>{r.distance}</span>
                <span>·</span>
                <span>{r.eta}</span>
                <span>·</span>
                <span style={{color: riskColor[r.risk]}}>Risk: {r.risk.toUpperCase()}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Map area */}
        <div className="lg:col-span-2 rounded-2xl border border-[#2ed573]/15 bg-[#0a0f1e] overflow-hidden relative" style={{ minHeight: 380 }}>
          {/* HUD corners */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#2ed573]/50 rounded-tl-sm z-10" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#2ed573]/50 rounded-tr-sm z-10" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#2ed573]/50 rounded-bl-sm z-10" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#2ed573]/50 rounded-br-sm z-10" />

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage: 'linear-gradient(rgba(46,213,115,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(46,213,115,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px'}} />

          {/* Map placeholder with incident dots */}
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <Navigation className="w-12 h-12 text-[#2ed573]/15" />
            <p className="text-[10px] font-mono text-[#2ed573]/40 tracking-widest">TACTICAL MAP · WASHINGTON DC METRO</p>
          </div>

          {/* Incident markers (simulated positions) */}
          {INCIDENTS.map((inc, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${20 + i * 18}%`, top: `${25 + (i % 2) * 30}%` }}
            >
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: inc.sev === "critical" ? "#ff4757" : inc.sev === "high" ? "#ffa502" : "#00d4ff" }} />
              <span className="text-[8px] font-mono text-gray-600 whitespace-nowrap">{inc.label}</span>
            </div>
          ))}

          {/* Active route badge */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#0d1220]/90 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: route.color }} />
            <span className="text-[10px] font-mono text-gray-300">Active: {route.label}</span>
          </div>

          {/* Status */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="bg-[#0d1220]/80 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-mono text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Selected route details */}
      <div className="rounded-xl border border-white/5 bg-[#0d1220] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" style={{color: route.color}} /> {route.label}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span>{route.distance}</span><span>·</span><span>{route.eta}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {route.waypoints.map((wp, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black" style={{ borderColor: `${route.color}40`, color: route.color }}>
                {i + 1}
              </div>
              <p className="text-xs text-gray-400 leading-snug">{wp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}