import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import SituationalMap from "@/components/gsa/SituationalMap";
import Earth3D from "@/components/gsa/Earth3D";
import ThreatEventFeed from "@/components/gsa/ThreatEventFeed";
import AIFusionPanel from "@/components/gsa/AIFusionPanel";
import EventDetailDrawer from "@/components/gsa/EventDetailDrawer";
import TimelineScrubber from "@/components/gsa/TimelineScrubber";
import ThreatCounters from "@/components/gsa/ThreatCounters";
import LayerControls from "@/components/gsa/LayerControls";
import RegionNavigator from "@/components/gsa/RegionNavigator";
import DisplayModeShader from "@/components/gsa/DisplayModeShader";
import SatelliteTrackerPanel from "@/components/gsa/SatelliteTrackerPanel";
import LiveCameraPanel from "@/components/gsa/LiveCameraPanel";
import PredictiveRiskOverlay from "@/components/gsa/PredictiveRiskOverlay";
import RiskAnalyticsPanel from "@/components/gsa/RiskAnalyticsPanel";
import TemporalReplayControls from "@/components/gsa/TemporalReplayControls";
import RegionalComparisonView from "@/components/gsa/RegionalComparisonView";
import ThreatHeatmapLayer from "@/components/gsa/ThreatHeatmapLayer";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Radio, Shield, Globe2, Zap, Satellite, Layers,
  ChevronLeft, ChevronRight, Navigation, Wifi, WifiOff, Download,
  Eye, Crosshair, Thermometer, Monitor, FlipHorizontal, Maximize2, GitCompare
} from "lucide-react";

const REFRESH_INTERVAL = 60000;

const MAP_STYLES = [
  { key: "tactical", label: "TACT" },
  { key: "satellite", label: "SAT" },
  { key: "night", label: "NIGHT" },
];

const DISPLAY_MODES = [
  { key: "normal",    label: "NORMAL", icon: Monitor,      color: "#00e5ff", desc: "Standard tactical display" },
  { key: "nvg",       label: "NVG",    icon: Eye,          color: "#00ff88", desc: "Night vision goggles" },
  { key: "flir",      label: "FLIR",   icon: Thermometer,  color: "#ff4400", desc: "Forward-looking infrared" },
  { key: "crt",       label: "CRT",    icon: FlipHorizontal,color: "#00e5ff",desc: "CRT scan-line overlay" },
  { key: "god",       label: "GOD",    icon: Crosshair,    color: "#ff1744", desc: "God mode — all overlays active" },
];

export default function GlobalSituationalAwareness() {
  const [events, setEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapStyle, setMapStyle] = useState("tactical");
  const [view3D, setView3D] = useState(true);
  const [showCameras, setShowCameras] = useState(false);
  const [displayMode, setDisplayMode] = useState("normal");
  const [domainFilter, setDomainFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeTimeWindow, setActiveTimeWindow] = useState("ALL");
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSatTracker, setShowSatTracker] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [globalThreatLevel, setGlobalThreatLevel] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [layers, setLayers] = useState({
    cyber: true, geopolitical: true, influence: true,
    hybrid: true, physical: true, arcs: true, satellites: true, flights: true,
  });
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [globeScene, setGlobeScene] = useState(null);
  const earthRotationRef = useRef(null);
  const [replayMode, setReplayMode] = useState(false);
  const [replayTime, setReplayTime] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapDomain, setHeatmapDomain] = useState("all");
  const intervalRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [opEvents] = await Promise.all([
        base44.entities.OperationalEvent.list("-occurred_at", 30),
      ]);
      const normalized = opEvents
        .filter(e => e.region && getLatForOpEvent(e) && getLngForOpEvent(e))
        .map(e => ({
          id: e.id, source: "operational", domain: e.domain || "hybrid",
          title: e.title, severity: e.severity, status: e.status,
          lat: getLatForOpEvent(e), lng: getLngForOpEvent(e),
          description: e.description, tags: e.tags || [],
          timestamp: e.occurred_at || e.created_date, raw: e,
        }));
      setEvents(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Event fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveOsintData = async () => {
    setLiveLoading(true);
    try {
      const res = await base44.functions.invoke("fetchLiveConflictData", {});
      const data = res.data;
      
      if (data?.error) {
        console.error("Live OSINT error:", data.error);
        setLiveLoaded(false);
        return;
      }

      if (data?.events) {
        const mapped = data.events
          .filter(e => e.lat && e.lng)
          .map((e, idx) => ({
            id: `live-${idx}-${Date.now()}`,
            _isLive: true,
            _layer: e._layer || e.domain || "geopolitical",
            source: e.source || "OSINT Live",
            domain: e.domain || "geopolitical",
            title: e.title,
            severity: e.severity || "medium",
            status: "active",
            lat: e.lat, lng: e.lng,
            description: e.description || "",
            tags: e.tags || [],
            region: e.region || "",
            event_type: e.event_type || "",
            timestamp: new Date().toISOString(),
            parties_involved: e.parties_involved || [],
            casualties: e.casualties,
            geopolitical_significance: e.geopolitical_significance,
            current_phase: e.current_phase,
            related_actors: e.related_actors || [],
            key_facts: e.key_facts || [],
            recent_developments: e.recent_developments || [],
            strategic_implications: e.strategic_implications,
            affected_population: e.affected_population,
            response_status: e.response_status,
            threat_actor: e.threat_actor,
            attribution: e.attribution,
            ttps: e.ttps || [],
            affected_sectors: e.affected_sectors || [],
            economic_impact: e.economic_impact,
          }));
        setLiveEvents(mapped);
        if (data.global_threat_level) setGlobalThreatLevel(data.global_threat_level);
        setLiveLoaded(true);
      }
    } catch (err) {
      console.error("Live OSINT fetch error:", err);
      setLiveLoaded(false);
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchAISummary = async () => {
    setAiLoading(true);
    try {
      const criticalEvents = [...events, ...liveEvents]
        .filter(e => e.severity === "critical" || e.severity === "high")
        .slice(0, 10);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI global situational awareness analyst — "Eye of Shauntze". Analyze these ${criticalEvents.length} high-priority events and provide a commander's intelligence picture:
1. SITREP (2-3 sentences on current global threat posture)
2. PRIORITY THREATS (top 3 specific threats requiring immediate attention)
3. RECOMMENDED ACTIONS (3 specific actions for decision makers)

Events: ${JSON.stringify(criticalEvents.map(e => ({ title: e.title, domain: e.domain, severity: e.severity, description: e.description?.slice(0, 100) })))}`,
        response_json_schema: {
          type: "object",
          properties: {
            sitrep: { type: "string" },
            priority_threats: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            threat_level: { type: "string", enum: ["LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"] },
          },
        },
      });
      setAiSummary(res);
    } catch (err) {
      console.error("AI summary error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchLiveOsintData();
    intervalRef.current = setInterval(() => fetchEvents(true), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (events.length > 0 && !aiSummary) fetchAISummary();
  }, [events]);

  useEffect(() => {
    let result = [...events, ...liveEvents];
    if (domainFilter !== "all") result = result.filter(e => e.domain === domainFilter);
    result = result.filter(e => layers[e.domain] !== false);
    
    // Skip time window filter if in replay mode
    if (replayMode) {
      setFilteredEvents(result);
      return;
    }
    
    // Apply time window filter
    if (activeTimeWindow !== "ALL") {
      const timeWindows = {
        "15m": 15, "1h": 60, "6h": 360, "24h": 1440, "7d": 10080
      };
      const minutes = timeWindows[activeTimeWindow];
      if (minutes) {
        const cutoff = Date.now() - (minutes * 60 * 1000);
        result = result.filter(e => {
          const t = e.timestamp ? new Date(e.timestamp).getTime() : e.occurred_at ? new Date(e.occurred_at).getTime() : Date.now();
          return t >= cutoff;
        });
      }
    }
    
    setFilteredEvents(result);
  }, [events, liveEvents, domainFilter, layers, activeTimeWindow, replayMode]);

  const handleNavigate = (lat, lng, zoom) => {
    setFlyTarget({ lat, lng, zoom });
    setShowNavigator(false);
  };

  const THREAT_LEVEL_COLORS = {
    LOW: "#2ed573", MODERATE: "#ffd600", ELEVATED: "#ff9100",
    HIGH: "#ff4757", CRITICAL: "#ff1744",
  };
  const activeThreatLevel = globalThreatLevel || aiSummary?.threat_level || null;
  const currentMode = DISPLAY_MODES.find(m => m.key === displayMode) || DISPLAY_MODES[0];

  return (
    <div
      className="fixed inset-0 bg-[#020509] text-gray-100 flex flex-col overflow-hidden"
      style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
    >
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scanline-anim {
          position: fixed; inset-x: 0; height: 2px;
          background: linear-gradient(transparent, rgba(0,229,255,0.04), transparent);
          pointer-events: none; z-index: 9999;
          animation: scanline 8s linear infinite;
        }
        @keyframes godPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="scanline-anim" />

      {/* Display mode shader overlay */}
      <DisplayModeShader mode={displayMode} />

      {/* ── TOP COMMAND BAR ── */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-[#020509]/98 border-b z-30"
        style={{ borderColor: `${currentMode.color}18` }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#00e5ff]/20"
                style={{ animation: liveLoaded ? "ping 2s cubic-bezier(0,0,0.2,1) infinite" : "none" }} />
              <div className="w-2 h-2 rounded-full"
                style={{ background: liveLoaded ? "#00e5ff" : "#546e7a", boxShadow: liveLoaded ? "0 0 8px #00e5ff" : "none" }} />
            </div>
            <div>
              <div className="text-[11px] font-black tracking-[0.25em] text-white">EYE OF SHAUNTZE</div>
              <div className="text-[7px] tracking-[0.3em]" style={{ color: `${currentMode.color}80` }}>
                GLOBAL SITUATIONAL AWARENESS · {displayMode.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/5" />

          {/* Live / threat badges */}
          {liveLoaded ? (
            <Badge className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/25 text-[8px] font-mono tracking-widest px-2">
              <Wifi className="w-2.5 h-2.5 mr-1" />LIVE OSINT
            </Badge>
          ) : (
            <Badge className="bg-gray-800/50 text-gray-600 border border-gray-700/50 text-[8px] font-mono tracking-widest px-2">
              <WifiOff className="w-2.5 h-2.5 mr-1" />INACTIVE
            </Badge>
          )}

          {activeThreatLevel && (
            <Badge className="text-[8px] font-mono tracking-widest px-2 border"
              style={{
                background: `${THREAT_LEVEL_COLORS[activeThreatLevel]}18`,
                color: THREAT_LEVEL_COLORS[activeThreatLevel],
                borderColor: `${THREAT_LEVEL_COLORS[activeThreatLevel]}40`,
              }}>
              {activeThreatLevel}
            </Badge>
          )}

          {lastUpdated && (
            <span className="text-[8px] text-gray-600 font-mono">
              UPD {lastUpdated.toUTCString().slice(17, 25)} UTC
            </span>
          )}

          {/* UTC clock */}
          <span className="text-[10px] font-mono tabular-nums"
            style={{ color: currentMode.color }}>
            {clock.toUTCString().slice(17, 25)} Z
          </span>
        </div>

        {/* Center: threat counters */}
        <div className="flex-1 mx-4">
          <ThreatCounters events={[...events, ...liveEvents]} />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Display mode switcher */}
          <div className="flex items-center gap-0.5 bg-white/3 rounded-sm p-0.5 border border-white/5">
            {DISPLAY_MODES.map(m => {
              const Icon = m.icon;
              const active = displayMode === m.key;
              return (
                <button key={m.key} onClick={() => setDisplayMode(m.key)} title={m.desc}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all ${
                    active ? "text-white" : "text-gray-700 hover:text-gray-400"
                  }`}
                  style={active ? { background: `${m.color}20`, color: m.color } : {}}>
                  <Icon className="w-3 h-3" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-white/5" />

          {/* Regional Comparison */}
          <button onClick={() => setShowComparison(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border text-gray-600 hover:text-[#a855f7] border-white/5 hover:border-[#a855f7]/20">
            <GitCompare className="w-3 h-3" />
            <span>COMPARE</span>
          </button>

          {/* Temporal Replay toggle */}
          <button onClick={() => setReplayMode(r => !r)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border ${
              replayMode ? "bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30" : "text-gray-600 hover:text-[#00e5ff] border-white/5 hover:border-[#00e5ff]/20"
            }`}>
            <RefreshCw className="w-3 h-3" />
            <span>REPLAY</span>
          </button>

          {/* Heatmap toggle + domain selector */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowHeatmap(h => !h)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-l-sm text-[9px] font-bold tracking-widest transition-all border border-r-0 ${
                showHeatmap ? "bg-[#ffd600]/15 text-[#ffd600] border-[#ffd600]/30" : "text-gray-600 hover:text-[#ffd600] border-white/5 hover:border-[#ffd600]/20"
              }`}>
              <Thermometer className="w-3 h-3" />
              <span>HEAT</span>
            </button>
            {showHeatmap && (
              <div className="flex items-center gap-0 bg-white/3 rounded-r-sm border border-white/5">
                {[
                  { key: "all", label: "ALL" },
                  { key: "cyber", label: "CYB" },
                  { key: "physical", label: "PHY" },
                  { key: "geopolitical", label: "GEO" },
                  { key: "influence", label: "INF" },
                  { key: "hybrid", label: "HYB" },
                ].map(d => (
                  <button key={d.key} onClick={() => setHeatmapDomain(d.key)}
                    className={`px-1.5 py-1 text-[8px] font-bold tracking-widest transition-all first:rounded-l-sm last:rounded-r-sm ${
                      heatmapDomain === d.key ? "bg-[#ffd600]/20 text-[#ffd600]" : "text-gray-700 hover:text-gray-400"
                    }`}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Risk Analytics toggle */}
          <button onClick={() => setShowRiskOverlay(r => !r)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border ${
              showRiskOverlay ? "bg-[#ff6d00]/15 text-[#ff6d00] border-[#ff6d00]/30" : "text-gray-600 hover:text-[#ff6d00] border-white/5 hover:border-[#ff6d00]/20"
            }`}>
            <Zap className="w-3 h-3" />
            <span>RISK</span>
          </button>

          {/* Satellite tracker */}
          <button onClick={() => setShowSatTracker(s => !s)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border ${
              showSatTracker ? "bg-[#a78bfa]/15 text-[#a78bfa] border-[#a78bfa]/30" : "text-gray-600 hover:text-[#a78bfa] border-white/5 hover:border-[#a78bfa]/20"
            }`}>
            <Satellite className="w-3 h-3" />
            <span>SAT</span>
          </button>

          {/* Navigate */}
          <button onClick={() => setShowNavigator(n => !n)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border ${
              showNavigator ? "bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30" : "text-gray-600 hover:text-[#00e5ff] border-white/5 hover:border-[#00e5ff]/20"
            }`}>
            <Navigation className="w-3 h-3" />
            <span>NAV</span>
          </button>

          {/* Camera feeds */}
          <button onClick={() => setShowCameras(c => !c)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border ${
              showCameras ? "bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30" : "text-gray-600 hover:text-[#00e5ff] border-white/5 hover:border-[#00e5ff]/20"
            }`}>
            <Eye className="w-3 h-3" />
            <span>CAM</span>
          </button>

          {/* Load live */}
          <button onClick={fetchLiveOsintData} disabled={liveLoading}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all border text-[#00ff88] border-[#00ff88]/20 hover:bg-[#00ff88]/10">
            {liveLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span>{liveLoading ? "..." : "LIVE"}</span>
          </button>

          {/* 2D/3D toggle */}
          <div className="flex items-center gap-0.5 bg-white/3 rounded-sm p-0.5 border border-white/5">
            <button onClick={() => setView3D(false)}
              className={`px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all ${
                !view3D ? "bg-[#00e5ff]/15 text-[#00e5ff]" : "text-gray-600 hover:text-gray-400"
              }`}>
              2D
            </button>
            <button onClick={() => setView3D(true)}
              className={`px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all ${
                view3D ? "bg-[#00e5ff]/15 text-[#00e5ff]" : "text-gray-600 hover:text-gray-400"
              }`}>
              3D
            </button>
          </div>

          {/* Map style (only for 2D) */}
          {!view3D && (
            <div className="flex items-center gap-0.5 bg-white/3 rounded-sm p-0.5">
              {MAP_STYLES.map(s => (
                <button key={s.key} onClick={() => setMapStyle(s.key)}
                  className={`px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest transition-all ${
                    mapStyle === s.key ? "bg-[#00e5ff]/15 text-[#00e5ff]" : "text-gray-600 hover:text-gray-400"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => fetchEvents()} disabled={loading}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] text-gray-600 hover:text-[#00e5ff] transition-colors border border-white/5 hover:border-[#00e5ff]/20">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-[#00e5ff]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">

        {/* ── LEFT PANEL ── */}
        {leftPanelOpen && (
          <div className="shrink-0 w-[130px] border-r border-white/5 bg-[#020509]/90 flex flex-col z-20 hidden lg:flex">
            <div className="px-3 py-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#00e5ff]" />
                <span className="text-[8px] font-black tracking-[0.2em] text-[#00e5ff] uppercase">Layers</span>
              </div>
            </div>
            <LayerControls layers={layers} setLayers={setLayers} />
            <div className="mt-auto border-t border-white/5 p-2">
              <div className="text-[8px] text-gray-600 tracking-widest uppercase font-mono mb-1 px-1">Filter</div>
              {["all","cyber","geopolitical","influence","hybrid","physical"].map(k => (
                <button key={k} onClick={() => setDomainFilter(k)}
                  className={`w-full text-left px-2 py-1 text-[9px] font-mono tracking-widest rounded-sm transition-all ${
                    domainFilter === k ? "text-[#00e5ff] bg-[#00e5ff]/8" : "text-gray-700 hover:text-gray-400"
                  }`}>
                  {k.toUpperCase().slice(0,7)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Left panel toggle */}
        <button onClick={() => setLeftPanelOpen(o => !o)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-[#020509]/90 border border-white/8 border-l-0 rounded-r-sm p-1 text-gray-600 hover:text-[#00e5ff] transition-colors hidden lg:flex"
          style={{ left: leftPanelOpen ? 130 : 0 }}>
          {leftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* ── MAP ── */}
        <div className="flex-1 relative min-h-0 overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#020509] z-10">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border border-[#00e5ff]/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-2 rounded-full border border-[#00e5ff]/20 animate-ping" style={{ animationDuration: "2s" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-[#00e5ff]/30 animate-pulse" />
                  </div>
                </div>
                <p className="text-[#00e5ff]/70 text-[10px] font-mono tracking-[0.3em] animate-pulse">
                  ACQUIRING GLOBAL PICTURE...
                </p>
                <p className="text-gray-700 text-[8px] font-mono mt-1 tracking-widest">
                  FUSING OSINT · SIGINT · HUMINT
                </p>
              </div>
            </div>
          ) : view3D ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-w-4xl max-h-4xl">
                <Earth3D
                  key="earth3d-globe"
                  events={filteredEvents}
                  onEventClick={setSelectedEvent}
                  selectedEvent={selectedEvent}
                  displayMode={displayMode}
                  onSceneReady={setGlobeScene}
                  earthRotation={(rotation) => { earthRotationRef.current = rotation; }}
                  replayTime={replayMode ? replayTime : null}
                />
                <PredictiveRiskOverlay
                  scene={globeScene}
                  earthRotation={earthRotationRef.current}
                  events={[...events, ...liveEvents]}
                  enabled={showRiskOverlay}
                  replayTime={replayMode ? replayTime : null}
                />
                <ThreatHeatmapLayer
                  scene={globeScene}
                  earthRotation={earthRotationRef.current}
                  events={[...events, ...liveEvents]}
                  enabled={showHeatmap}
                  domain={heatmapDomain}
                />
              </div>
            </div>
          ) : (
            <SituationalMap
              events={filteredEvents.filter(e => !e._isLive)}
              liveEvents={filteredEvents.filter(e => e._isLive)}
              mapStyle={mapStyle}
              onEventClick={setSelectedEvent}
              selectedEvent={selectedEvent}
              layers={layers}
              flyTarget={flyTarget}
            />
          )}

          {/* Overlays */}
          {showNavigator && (
            <RegionNavigator onNavigate={handleNavigate} onClose={() => setShowNavigator(false)} />
          )}

          {/* Satellite tracker panel */}
          {showSatTracker && (
            <SatelliteTrackerPanel onClose={() => setShowSatTracker(false)} />
          )}

          {/* GOD MODE crosshair reticle */}
          {displayMode === "god" && (
            <div className="absolute inset-0 pointer-events-none z-[1050] flex items-center justify-center">
              <div className="relative w-24 h-24" style={{ animation: "godPulse 2s ease-in-out infinite" }}>
                <div className="absolute inset-0 border border-[#ff1744]/40 rounded-full" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#ff1744]/20" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#ff1744]/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 border border-[#ff1744]/60 rounded-full" />
              </div>
            </div>
          )}

          {/* Acquiring indicator */}
          {!liveLoaded && liveLoading && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1100]">
              <div className="bg-[#020509]/95 border border-[#00ff88]/20 rounded-sm px-4 py-2 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="text-[9px] font-mono text-[#00ff88]/70 tracking-widest animate-pulse">
                  ACQUIRING LIVE OSINT FEEDS — 5 INTELLIGENCE LAYERS…
                </span>
              </div>
            </div>
          )}

          {/* Event count HUD */}
          {!loading && (
            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
              <div className="bg-[#020509]/90 border border-white/8 rounded-sm px-3 py-2 space-y-1">
                <div className="text-[8px] font-mono tracking-widest font-bold" style={{ color: currentMode.color }}>
                  {filteredEvents.length} EVENTS · {filteredEvents.filter(e => e.severity === "critical").length} CRITICAL
                </div>
                {liveEvents.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {[
                      { label: "CONFLICTS", domain: "physical", color: "#ff5252" },
                      { label: "GEO-POL", domain: "geopolitical", color: "#ff1744" },
                      { label: "ECONOMIC", domain: "hybrid", color: "#ff9100" },
                      { label: "CYBER", domain: "cyber", color: "#00e5ff" },
                    ].map(({ label, domain, color }) => {
                      const count = liveEvents.filter(e => e.domain === domain || e._layer === domain).length;
                      return count > 0 ? (
                        <div key={domain} className="text-[8px] font-mono tracking-widest flex gap-1.5">
                          <span style={{ color }}>●</span>
                          <span style={{ color: "#546e7a" }}>{label}</span>
                          <span style={{ color }}>{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {liveLoading && <div className="text-[8px] font-mono text-[#00ff88]/60 animate-pulse tracking-widest">ACQUIRING…</div>}
              </div>
            </div>
          )}

          {/* Display mode label */}
          {displayMode !== "normal" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="px-3 py-1 rounded-sm text-[9px] font-black tracking-[0.3em] border"
                style={{ background: `${currentMode.color}15`, color: currentMode.color, borderColor: `${currentMode.color}40` }}>
                {currentMode.label} MODE ACTIVE
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL TOGGLE ── */}
        <button onClick={() => setRightPanelOpen(o => !o)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-[#020509]/90 border border-white/8 border-r-0 rounded-l-sm p-1 text-gray-600 hover:text-[#00e5ff] transition-colors hidden lg:flex"
          style={{ right: rightPanelOpen ? 288 : 0 }}>
          {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* ── RIGHT PANEL ── */}
        {rightPanelOpen && (
          <div className="w-72 shrink-0 flex flex-col border-l border-white/5 bg-[#020509]/95 z-20 hidden lg:flex overflow-hidden">
            {showCameras ? (
              <LiveCameraPanel 
                onCameraSelect={setFlyTarget}
                selectedLocation={flyTarget}
              />
            ) : showRiskOverlay && view3D ? (
              <>
                <RiskAnalyticsPanel events={[...events, ...liveEvents]} />
                <div className="flex-1 border-t border-white/5 overflow-hidden">
                  <ThreatEventFeed
                    events={[...filteredEvents].sort((a, b) => {
                      const order = { critical: 0, high: 1, medium: 2, low: 3 };
                      return (order[a.severity] || 4) - (order[b.severity] || 4);
                    })}
                    onSelect={setSelectedEvent}
                    selected={selectedEvent}
                  />
                </div>
              </>
            ) : (
              <>
                <AIFusionPanel summary={aiSummary} loading={aiLoading} onRefresh={fetchAISummary} />
                <ThreatEventFeed
                  events={[...filteredEvents].sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return (order[a.severity] || 4) - (order[b.severity] || 4);
                  })}
                  onSelect={setSelectedEvent}
                  selected={selectedEvent}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── TIMELINE SCRUBBER / TEMPORAL REPLAY ── */}
      <div className="shrink-0 z-20">
        {replayMode ? (
          <TemporalReplayControls
            events={[...events, ...liveEvents]}
            onTimeChange={setReplayTime}
            onPlayStateChange={(playing) => {
              // Optional: could pause auto-refresh when playing
            }}
            enabled={replayMode}
          />
        ) : (
          <TimelineScrubber
            events={[...events, ...liveEvents]}
            onTimeFilter={(minutes) => {
              // Filter callback - handled in useEffect above via activeTimeWindow
            }}
            activeWindow={activeTimeWindow}
            setActiveWindow={setActiveTimeWindow}
          />
        )}
      </div>

      {/* ── EVENT DETAIL DRAWER ── */}
      {selectedEvent && (
        <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      {/* ── REGIONAL COMPARISON VIEW ── */}
      {showComparison && (
        <RegionalComparisonView
          events={[...events, ...liveEvents]}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}

function getLatForOpEvent(e) {
  const regionMap = {
    "Europe": 50.0, "Middle East": 32.0, "Asia": 34.0, "Africa": 5.0,
    "North America": 38.0, "South America": -15.0, "Pacific": -20.0,
    "Eastern Europe": 50.5, "Central Asia": 43.0,
  };
  if (e.region && regionMap[e.region]) return regionMap[e.region] + (pseudoGeo(e.id, 3).lat % 5);
  return pseudoGeo(e.id, 3).lat;
}

function getLngForOpEvent(e) {
  const regionMap = {
    "Europe": 15.0, "Middle East": 42.0, "Asia": 105.0, "Africa": 20.0,
    "North America": -95.0, "South America": -60.0, "Pacific": 150.0,
    "Eastern Europe": 32.0, "Central Asia": 65.0,
  };
  if (e.region && regionMap[e.region]) return regionMap[e.region] + (pseudoGeo(e.id, 3).lng % 5);
  return pseudoGeo(e.id, 3).lng;
}

function pseudoGeo(id = "", seed = 1) {
  let h = seed;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  const lat = ((Math.abs(h) % 1400) - 700) / 10;
  const lng = ((Math.abs(h * 1.618) % 3600) - 1800) / 10;
  return { lat, lng };
}