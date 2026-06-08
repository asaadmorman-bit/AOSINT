import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Shield, Globe, RefreshCw, Radio, Filter, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThreatEventFeed from "@/components/threat_events/ThreatEventFeed";
import ThreatMapboxGL from "@/components/threat_events/ThreatMapboxGL";
import ThreatDetailPanel from "@/components/threat_events/ThreatDetailPanel";

const SEVERITY_COLORS = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#00d4ff",
  low: "#2ed573",
  informational: "#6b7280",
};

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-4 py-3 bg-[#111827] border border-white/5 rounded-xl min-w-[90px]">
      <span className="text-xl font-black" style={{ color }}>{value}</span>
      <span className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );
}

export default function ThreatEventDashboard() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [liveMode, setLiveMode] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["threat_events"],
    queryFn: () => base44.entities.ThreatEvent.list("-timestamp", 200),
    refetchInterval: liveMode ? 15000 : false,
  });

  // Real-time subscription
  useEffect(() => {
    if (!liveMode) return;
    const unsub = base44.entities.ThreatEvent.subscribe((evt) => {
      queryClient.invalidateQueries({ queryKey: ["threat_events"] });
    });
    return unsub;
  }, [liveMode, queryClient]);

  const filtered = events.filter(e => {
    const matchSev = severityFilter === "all" || e.severity === severityFilter;
    const matchDom = domainFilter === "all" || e.domain === domainFilter;
    return matchSev && matchDom;
  });

  // Metrics
  const criticalCount = events.filter(e => e.severity === "critical").length;
  const highCount = events.filter(e => e.severity === "high").length;
  const newCount = events.filter(e => e.status === "new").length;
  const avgScore = events.length ? Math.round(events.reduce((s, e) => s + (e.threat_score || 0), 0) / events.length) : 0;
  const topScore = events.length ? Math.max(...events.map(e => e.threat_score || 0)) : 0;

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#ff4757] animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">ASOSINT IO · Fusion Center</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Threat Event Dashboard</h1>
          <p className="text-xs text-gray-600 mt-0.5">Single Pane of Glass · Unified Telemetry Ingest</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setLiveMode(l => !l)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
              liveMode ? "bg-[#2ed573]/10 border-[#2ed573]/30 text-[#2ed573]" : "bg-white/5 border-white/10 text-gray-400"
            }`}
          >
            <Radio className="w-3 h-3" />
            {liveMode ? "LIVE" : "PAUSED"}
          </button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-gray-400 hover:text-white text-xs gap-1.5"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["threat_events"] })}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
          <span className="text-[10px] text-gray-700">Updated {lastUpdate}</span>
        </div>
      </div>

      {/* Metric strip */}
      <div className="flex gap-3 flex-wrap">
        <StatPill label="Total Events" value={events.length} color="#00d4ff" />
        <StatPill label="Critical" value={criticalCount} color="#ff4757" />
        <StatPill label="High" value={highCount} color="#ffa502" />
        <StatPill label="Unacknowledged" value={newCount} color="#a855f7" />
        <StatPill label="Avg Score" value={avgScore} color="#00d4ff" />
        <StatPill label="Top Score" value={topScore} color={topScore >= 85 ? "#ff4757" : topScore >= 65 ? "#ffa502" : "#2ed573"} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-[10px] text-gray-600 uppercase tracking-wider mr-1">Severity:</span>
        {["all", "critical", "high", "medium", "low", "informational"].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium ${
              severityFilter === s
                ? "border-[#00d4ff]/40 bg-[#00d4ff]/10 text-[#00d4ff]"
                : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="text-gray-700 mx-1">|</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Domain:</span>
        {["all", "cyber", "physical", "influence", "hybrid", "geopolitical"].map(d => (
          <button
            key={d}
            onClick={() => setDomainFilter(d)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium ${
              domainFilter === d
                ? "border-[#a855f7]/40 bg-[#a855f7]/10 text-[#a855f7]"
                : "border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
        <span className="text-[10px] text-gray-600 ml-2">{filtered.length} events shown</span>
      </div>

      {/* Main Grid: Map + Feed + Detail Panel */}
      <div className={`grid gap-5 ${selectedFeature ? "grid-cols-1 lg:grid-cols-[1fr_420px_320px]" : "grid-cols-1 lg:grid-cols-2"}`}>
        {/* Mapbox Tactical Map */}
        <div className="bg-[#0d1220] border border-white/5 rounded-2xl overflow-hidden" style={{ minHeight: 380 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-sm font-semibold text-white">Tactical Threat Map</span>
              <Badge variant="outline" className="text-[9px] border-[#00d4ff]/20 text-[#00d4ff]">Mapbox GL</Badge>
            </div>
            <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">
              {filtered.filter(e => e.location_data?.lat).length} plotted
            </Badge>
          </div>
          <div style={{ height: 360 }}>
            <ThreatMapboxGL
              events={filtered}
              geofences={[]}
              onFeatureSelect={setSelectedFeature}
            />
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-[#0d1220] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-sm font-semibold text-white">Live Threat Feed</span>
              {liveMode && <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />}
            </div>
            <div className="flex items-center gap-2">
              {selectedFeature && (
                <button onClick={() => setSelectedFeature(null)} className="text-[9px] text-gray-500 hover:text-gray-300">
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
              )}
              <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">
                {filtered.length} events
              </Badge>
            </div>
          </div>
          <div className="p-3 flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading telemetry...
              </div>
            ) : (
              <ThreatEventFeed events={filtered} maxItems={50} />
            )}
          </div>
        </div>

        {/* Detail Side Panel */}
        {selectedFeature && (
          <div className="bg-[#0d1220] border border-white/5 rounded-2xl overflow-hidden" style={{ minHeight: 380 }}>
            <ThreatDetailPanel feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
          </div>
        )}
      </div>

      {/* Source breakdown */}
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#00d4ff]" />
          <span className="text-sm font-semibold text-white">Source Breakdown</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            events.reduce((acc, e) => {
              const src = e.source_tool || "unknown";
              acc[src] = (acc[src] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .map(([src, count]) => (
              <div key={src} className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5">
                <span className="text-xs font-semibold text-white">{count}</span>
                <span className="text-[10px] text-gray-500">{src.replace(/_/g, " ").toUpperCase()}</span>
              </div>
            ))}
          {events.length === 0 && <span className="text-xs text-gray-600">No events ingested yet</span>}
        </div>
      </div>
    </div>
  );
}