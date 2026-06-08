import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import TacticalGlobe from "@/components/sa/TacticalGlobe";
import GlassesFeedPanel from "@/components/sa/GlassesFeedPanel";
import IntelLayersPanel from "@/components/sa/IntelLayersPanel";
import DisplayModeShader from "@/components/gsa/DisplayModeShader";
import {
  Shield, Eye, Thermometer, Monitor, FlipHorizontal, Crosshair,
  Satellite, Radio, Globe2, AlertTriangle, Target, Zap,
  Activity, Wifi, WifiOff, RefreshCw, ChevronRight, ChevronDown
} from "lucide-react";

/* ── constants ─────────────────────────────────────────────── */
const DISPLAY_MODES = [
  { key: "normal", label: "NORM", icon: Monitor,      color: "#00ff41" },
  { key: "nvg",    label: "NVG",  icon: Eye,          color: "#00ff88" },
  { key: "flir",   label: "FLIR", icon: Thermometer,  color: "#ff6600" },
  { key: "crt",    label: "CRT",  icon: FlipHorizontal,color: "#00e5ff" },
  { key: "god",    label: "GOD",  icon: Crosshair,    color: "#ff1744" },
];

const MISSIONS = [
  { id: "M-001", name: "OPERATION NIGHTFALL", region: "Eastern Europe", status: "ACTIVE",  priority: "P1" },
  { id: "M-002", name: "SHADOW PROTOCOL",     region: "Middle East",    status: "ACTIVE",  priority: "P1" },
  { id: "M-003", name: "BLUE HORIZON",        region: "Pacific Rim",    status: "STANDBY", priority: "P2" },
];

const ENTITIES = [
  { name: "SUBJECT ALPHA",  alias: "Ghost",   loc: "New York",  tag: "HIGH VALUE",   tagColor: "#ff4757" },
  { name: "CONTACT BRAVO",  alias: "Shadow",  loc: "London",    tag: "SURVEILLANCE", tagColor: "#ffa502" },
  { name: "TARGET CHARLIE", alias: "Falcon",  loc: "Paris",     tag: "ACTIVE",       tagColor: "#00ff41" },
  { name: "ASSET DELTA",    alias: "Phoenix", loc: "Tokyo",     tag: "MONITORED",    tagColor: "#00d4ff" },
  { name: "UNKNOWN ECHO",   alias: "???",     loc: "Dubai",     tag: "UNKNOWN",      tagColor: "#4a5568" },
];

const GEOFENCES = [
  { name: "ZONE ALPHA",   loc: "NYC Metro · 50km",       breaches: 3  },
  { name: "ZONE BRAVO",   loc: "Persian Gulf · 200km",   breaches: 9  },
  { name: "ZONE CHARLIE", loc: "South China Sea · 500km",breaches: 14 },
  { name: "ZONE DELTA",   loc: "Eastern Europe · 300km", breaches: 2  },
];

const ASSETS = [
  { id: "SENTINEL-1", model: "DJI Matrice 350 RTK", range: "20km", status: "READY" },
  { id: "SHADOW-1",   model: "Skydio X2D",          range: "7km",  status: "READY" },
  { id: "PHANTOM-1",  model: "Autel EVO II Pro",     range: "9km",  status: "DEPLOY" },
  { id: "REAPER-1",   model: "MQ-9 Reaper (sim)",    range: "1800km",status: "ACTIVE" },
];

/* ── sub-components ─────────────────────────────────────────── */
function Cell({ label, value, color, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 border-r last:border-r-0"
      style={{ borderColor: "rgba(0,255,65,0.1)" }}>
      <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[8px] tracking-wider text-center mt-0.5" style={{ color: "rgba(0,255,65,0.4)" }}>{label}</span>
      {sub && <span className="text-[7px] mt-0.5" style={{ color: "rgba(0,255,65,0.25)" }}>{sub}</span>}
    </div>
  );
}

function Panel({ children, title, icon: Icon, right, color = "#00ff41", accent }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="rounded-lg overflow-hidden" style={{
      background: "#040d04",
      border: `1px solid ${accent || "rgba(0,255,65,0.1)"}`,
    }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "rgba(0,255,65,0.1)" }}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: color }} />}
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {right && <span className="text-[9px] font-bold" style={{ color: "#ffa502" }}>{right}</span>}
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} style={{ color: "rgba(0,255,65,0.3)" }} />
        </div>
      </button>
      {!collapsed && <div className="p-3 space-y-1.5">{children}</div>}
    </div>
  );
}

function Row({ left, sub, tag, tagColor, right }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-2 rounded"
      style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.08)" }}>
      <div className="min-w-0">
        <div className="font-bold text-[10px]" style={{ color: "#00ff41" }}>{left}</div>
        {sub && <div className="text-[8px]" style={{ color: "rgba(0,255,65,0.35)" }}>{sub}</div>}
      </div>
      {tag && (
        <span className="text-[8px] font-black px-2 py-0.5 border shrink-0 ml-2"
          style={{ color: tagColor || "#00ff41", borderColor: tagColor || "#00ff41" }}>
          {tag}
        </span>
      )}
      {right && !tag && <span className="text-[9px] font-black" style={{ color: "#00ff41" }}>{right}</span>}
    </div>
  );
}

function StatusDot({ active }) {
  return (
    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
      style={{ background: active ? "#00ff41" : "#4a5568", boxShadow: active ? "0 0 4px #00ff41" : "none" }} />
  );
}

/* ── Globe section ───────────────────────────────────────────── */
function GlobeSection({ threatCount, arcCount }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setSize({ w: width, h: Math.min(width * 0.6, 360) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full rounded-lg overflow-hidden"
      style={{ height: size.h || 280, background: "#000", border: "1px solid rgba(0,255,65,0.12)" }}>
      {size.w > 0 && <TacticalGlobe width={size.w} height={size.h || 280} />}
      {/* Corner brackets */}
      {[["top-0 left-0","border-t border-l"],["top-0 right-0","border-t border-r"],
        ["bottom-0 left-0","border-b border-l"],["bottom-0 right-0","border-b border-r"]].map(([pos, cls]) => (
        <div key={pos} className={`absolute ${pos} w-5 h-5 pointer-events-none ${cls}`}
          style={{ borderColor: "rgba(0,255,65,0.5)", opacity: 0.7 }} />
      ))}
      {/* HUD overlays */}
      <div className="absolute top-2 left-3 pointer-events-none">
        <div className="text-[8px] font-black tracking-widest" style={{ color: "#00ff41" }}>
          <StatusDot active />GLOBE FEED LIVE
        </div>
        <div className="text-[7px] mt-0.5" style={{ color: "rgba(0,255,65,0.3)" }}>DRAG TO ROTATE · SCROLL TO ZOOM</div>
      </div>
      <div className="absolute top-2 right-3 pointer-events-none text-right">
        <div className="text-[8px] font-black" style={{ color: "#ffa502" }}>{threatCount} THREAT NODES</div>
        <div className="text-[7px]" style={{ color: "rgba(0,255,65,0.3)" }}>{arcCount} ARC LINKS</div>
      </div>
      {/* Targeting reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-16 h-16 border border-green-500/50 rounded-full" />
        <div className="absolute w-20 h-px bg-green-500/30" />
        <div className="absolute h-20 w-px bg-green-500/30" />
      </div>
    </div>
  );
}

/* ── Intel feed ticker ───────────────────────────────────────── */
function IntelTicker({ items }) {
  const [pos, setPos] = useState(0);
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setPos(p => (p + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="px-3 py-1.5 flex items-center gap-3 overflow-hidden border-b"
      style={{ borderColor: "rgba(0,255,65,0.08)", background: "#020902" }}>
      <span className="text-[8px] font-black tracking-widest shrink-0" style={{ color: "#ff4757" }}>FLASH</span>
      <div className="flex-1 overflow-hidden">
        <div className="text-[9px] font-mono truncate" style={{ color: "rgba(0,255,65,0.7)" }}>
          {items[pos]}
        </div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-[#ff4757] animate-pulse shrink-0" />
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function SaDashboard() {
  const [clock, setClock] = useState(new Date());
  const [displayMode, setDisplayMode] = useState("normal");
  const [posture, setPosture] = useState("GREEN");

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: alerts = [] } = useQuery({
    queryKey: ["sa-alerts"],
    queryFn: () => base44.entities.OsintAlert.list("-created_date", 20),
  });
  const { data: indicators = [] } = useQuery({
    queryKey: ["sa-indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 20),
  });

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const pendingAlerts  = alerts.filter(a => ["new","in_progress"].includes(a.status));
  const activeMissions = MISSIONS.filter(m => m.status === "ACTIVE").length;
  const currentMode    = DISPLAY_MODES.find(m => m.key === displayMode);
  const postureColor   = { GREEN: "#00ff41", YELLOW: "#ffd600", RED: "#ff4757" }[posture];

  const flashItems = [
    ...criticalAlerts.slice(0,3).map(a => `[CRITICAL] ${a.title}`),
    "[OSINT] Persistent recon flight pattern observed over Baltic — NWM-014",
    "[SIGINT] Unusual RF emissions detected — Persian Gulf corridor",
    "[GEO] Mobilization activity at 47.3°N 38.2°E — imagery confirms",
  ];

  return (
    <div className="min-h-screen font-mono text-xs select-none"
      style={{ background: "#020b02", color: "#00ff41", fontFamily: "ui-monospace, 'SF Mono', monospace" }}>

      <DisplayModeShader mode={displayMode} />

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-20 border-b" style={{ borderColor: "rgba(0,255,65,0.1)", background: "#000" }}>
        {/* Flash ticker */}
        <IntelTicker items={flashItems} />

        <div className="flex items-center justify-between px-3 py-2">
          {/* Identity */}
          <div>
            <div className="text-sm font-black tracking-widest" style={{ color: "#00ff41" }}>
              ASOSINT — UNIFIED SA
            </div>
            <div className="text-[7px] tracking-widest hidden sm:block" style={{ color: "rgba(0,255,65,0.35)" }}>
              SITUATIONAL AWARENESS COMMAND · LIVE · MULTI-DOMAIN
            </div>
          </div>

          {/* Display mode picker */}
          <div className="flex items-center gap-0.5 bg-black/50 rounded-sm p-0.5 border border-white/5">
            {DISPLAY_MODES.map(m => {
              const Icon = m.icon;
              const active = displayMode === m.key;
              return (
                <button key={m.key} onClick={() => setDisplayMode(m.key)}
                  title={m.label}
                  className="flex items-center gap-1 px-1.5 py-1 rounded-sm text-[8px] font-black tracking-widest transition-all"
                  style={active ? { background: `${m.color}20`, color: m.color } : { color: "rgba(0,255,65,0.25)" }}>
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Clock + posture */}
          <div className="flex items-center gap-3">
            <div className="font-mono text-sm tabular-nums" style={{ color: currentMode?.color || "#ffa502" }}>
              {format(clock, "HH:mm:ss")}
            </div>
            <button
              onClick={() => setPosture(p => ({ GREEN: "YELLOW", YELLOW: "RED", RED: "GREEN" })[p])}
              className="border px-2 py-1 text-[9px] font-black tracking-widest transition-all"
              style={{ borderColor: postureColor, color: postureColor }}>
              POSTURE: {posture}
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div className="grid grid-cols-4 border-b" style={{ borderColor: "rgba(0,255,65,0.08)" }}>
        <Cell label="P1 CRITICAL"    value={criticalAlerts.length} color="#ff4757" />
        <Cell label="ACTIVE OPS"     value={activeMissions}        color="#ffa502" />
        <Cell label="PENDING ALERTS" value={pendingAlerts.length}  color="#ffd600" />
        <Cell label="INDICATORS"     value={indicators.length}     color="#00ff41" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="p-3 space-y-3">

        {/* 3D globe + right status column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <GlobeSection threatCount={12} arcCount={8} />
          </div>

          {/* Right status column */}
          <div className="space-y-3">
            {/* Network status */}
            <Panel title="Network Status" icon={Wifi} color="#00d4ff">
              {[
                { label: "OSINT FEEDS",  status: true,  val: "7 ACTIVE" },
                { label: "SIGINT RELAY", status: true,  val: "ONLINE" },
                { label: "SAT UPLINK",   status: true,  val: "4 BIRDS" },
                { label: "HUMINT NET",   status: false, val: "DEGRADED" },
                { label: "DISCORD BOT",  status: true,  val: "ACTIVE" },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-2 py-1.5 rounded text-[9px]"
                  style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.06)" }}>
                  <div className="flex items-center gap-1.5">
                    <StatusDot active={r.status} />
                    <span style={{ color: "rgba(0,255,65,0.6)" }}>{r.label}</span>
                  </div>
                  <span style={{ color: r.status ? "#00ff41" : "#ff4757" }}>{r.val}</span>
                </div>
              ))}
            </Panel>

            {/* Quick metrics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "THREAT LEVEL", value: criticalAlerts.length > 3 ? "HIGH" : "MOD", color: "#ff9100" },
                { label: "OPS STATUS",   value: "ACTIVE",  color: "#00ff41" },
                { label: "ANALYSTS ON",  value: "3",       color: "#00d4ff" },
                { label: "FEEDS LIVE",   value: "12",      color: "#00ff41" },
              ].map(m => (
                <div key={m.label} className="rounded px-2.5 py-2 text-center"
                  style={{ background: "#040d04", border: "1px solid rgba(0,255,65,0.08)" }}>
                  <div className="text-lg font-black tabular-nums" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[7px] tracking-widest mt-0.5" style={{ color: "rgba(0,255,65,0.3)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── OPERATIONS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Active Missions */}
          <Panel title="Active Missions" icon={Target} right={`${activeMissions} OPS`}
            accent="rgba(255,71,87,0.2)">
            {MISSIONS.filter(m => m.status === "ACTIVE").map(m => (
              <Row key={m.id} left={m.name} sub={`${m.id} · ${m.region}`}
                tag={m.priority} tagColor="#ff4757" />
            ))}
            {MISSIONS.filter(m => m.status !== "ACTIVE").map(m => (
              <Row key={m.id} left={m.name} sub={`${m.id} · ${m.region}`}
                tag="STANDBY" tagColor="rgba(0,255,65,0.4)" />
            ))}
          </Panel>

          {/* Asset Status */}
          <Panel title="Asset Status" icon={Zap} right={`${ASSETS.length} ASSETS`}
            accent="rgba(0,212,255,0.15)">
            {ASSETS.map(a => (
              <Row key={a.id} left={a.id} sub={`${a.model} · ${a.range}`}
                tag={a.status}
                tagColor={a.status === "ACTIVE" ? "#00ff41" : a.status === "DEPLOY" ? "#ffa502" : "rgba(0,255,65,0.5)"} />
            ))}
          </Panel>

          {/* Tracked Entities */}
          <Panel title="Tracked Entities" icon={Crosshair} right={`${ENTITIES.length} ACTIVE`}
            accent="rgba(255,165,2,0.15)">
            {ENTITIES.map(e => (
              <Row key={e.name} left={e.name} sub={`${e.alias} · ${e.loc}`}
                tag={e.tag} tagColor={e.tagColor} />
            ))}
          </Panel>

          {/* Geofences */}
          <Panel title="Geofences" icon={Shield} right={`${GEOFENCES.length} ZONES`}
            accent="rgba(0,255,65,0.15)">
            {GEOFENCES.map(g => (
              <div key={g.name} className="flex items-center justify-between px-2.5 py-2 rounded"
                style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.06)" }}>
                <div>
                  <div className="font-bold text-[10px]" style={{ color: "#00ff41" }}>{g.name}</div>
                  <div className="text-[8px]" style={{ color: "rgba(0,255,65,0.3)" }}>{g.loc}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[10px]"
                    style={{ color: g.breaches > 10 ? "#ff4757" : "#ffa502" }}>
                    {g.breaches}×
                  </div>
                  <div className="text-[7px]" style={{ color: "#00ff41" }}>● ACTIVE</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {/* ── INTELLIGENCE LAYERS ── */}
        <IntelLayersPanel />

        {/* ── AI Glasses Feed ── */}
        <GlassesFeedPanel />

        {/* ── Live OSINT Indicators ── */}
        {indicators.length > 0 && (
          <Panel title="Live OSINT Indicators" icon={Radio}
            right={`${indicators.length} ACTIVE`} accent="rgba(0,229,255,0.12)">
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {indicators.slice(0, 12).map(ind => {
                const sc = ind.severity === "critical" ? "#ff4757" : ind.severity === "high" ? "#ffa502" : "#00ff41";
                return (
                  <div key={ind.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded"
                    style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.06)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] truncate" style={{ color: "#00ff41" }}>{ind.title || ind.value}</div>
                      <div className="text-[8px] font-mono truncate" style={{ color: "rgba(0,255,65,0.3)" }}>{ind.value}</div>
                    </div>
                    <span className="text-[8px] font-black px-1.5 py-0.5 shrink-0"
                      style={{ color: sc, border: `1px solid ${sc}` }}>
                      {(ind.severity || "info").toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}