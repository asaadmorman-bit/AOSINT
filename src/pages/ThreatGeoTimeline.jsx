import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Globe2, Clock, AlertTriangle, Database, Activity, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import IndicatorGeoMap from "@/components/threat_geo/IndicatorGeoMap";
import EventTimeline from "@/components/threat_geo/EventTimeline";
import IndicatorDetailPanel from "@/components/threat_geo/IndicatorDetailPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts";

const SEVERITY_COLORS = { critical: "#ff1744", high: "#ff6d00", medium: "#ffd600", low: "#00b0ff", informational: "#546e7a" };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-lg p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{label}</div>
        <div className="text-2xl font-black text-white">{value}</div>
      </div>
    </div>
  );
}

export default function ThreatGeoTimeline() {
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: indicators = [], isLoading: indLoading, refetch: refetchInd } = useQuery({
    queryKey: ["geo-indicators"],
    queryFn: () => base44.entities.ThreatIndicator.filter({ status: "active" }, "-created_date", 100),
  });

  const { data: alerts = [], isLoading: alertLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ["geo-alerts"],
    queryFn: () => base44.entities.OsintAlert.list("-triggered_at", 60),
  });

  const { data: opEvents = [] } = useQuery({
    queryKey: ["geo-opevents"],
    queryFn: () => base44.entities.OperationalEvent.list("-occurred_at", 40),
  });

  const loading = indLoading || alertLoading;

  // Unified timeline events
  const timelineEvents = useMemo(() => [
    ...alerts.map(a => ({
      id: a.id, title: a.title, severity: a.severity,
      domain: a.alert_type?.includes("cyber") ? "cyber" : "hybrid",
      timestamp: a.triggered_at || a.created_date, type: "alert",
    })),
    ...opEvents.map(e => ({
      id: e.id, title: e.title, severity: e.severity,
      domain: e.domain || "hybrid",
      timestamp: e.occurred_at || e.created_date, type: "event",
    })),
    ...indicators.map(i => ({
      id: i.id, title: i.title, severity: i.severity,
      domain: i.threat_category || "cyber",
      timestamp: i.created_date, type: "indicator",
    })),
  ], [alerts, opEvents, indicators]);

  // Filtered indicators for map
  const filteredIndicators = useMemo(() => {
    let res = indicators;
    if (severityFilter !== "all") res = res.filter(i => i.severity === severityFilter);
    if (typeFilter !== "all") res = res.filter(i => i.indicator_type === typeFilter);
    return res;
  }, [indicators, severityFilter, typeFilter]);

  // Severity pie data
  const severityPie = useMemo(() => {
    const counts = {};
    indicators.forEach(i => { counts[i.severity || "unknown"] = (counts[i.severity || "unknown"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [indicators]);

  const indicatorTypes = useMemo(() => [...new Set(indicators.map(i => i.indicator_type).filter(Boolean))], [indicators]);

  const handleRefresh = () => { refetchInd(); refetchAlerts(); };

  return (
    <div className="min-h-screen bg-[#080c16] text-gray-100 p-4 lg:p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-[#00e5ff]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Threat Geo-Intelligence Dashboard</h1>
            <p className="text-xs text-gray-500">Active indicators mapped globally · Security event timeline · Live recharts analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/25 text-[9px] font-mono">
            ● {indicators.filter(i => i.status === "active").length} ACTIVE
          </Badge>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-[#00e5ff] border border-white/8 hover:border-[#00e5ff]/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#00e5ff]" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Database} label="Active Indicators" value={indicators.length} color="#00e5ff" />
        <StatCard icon={AlertTriangle} label="OSINT Alerts" value={alerts.length} color="#ff6d00" />
        <StatCard icon={Activity} label="Op Events" value={opEvents.length} color="#d500f9" />
        <StatCard icon={Shield} label="Critical" value={indicators.filter(i => i.severity === "critical").length} color="#ff1744" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

        {/* MAP — takes up 2 cols */}
        <div className="xl:col-span-2 bg-[#0d1220] border border-white/5 rounded-lg overflow-hidden" style={{ height: 440 }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#00e5ff]" />
              <span className="text-xs font-bold text-white">Active Threat Indicator Map</span>
              <Badge className="text-[9px] bg-white/5 text-gray-400 border-white/8">{filteredIndicators.length} plotted</Badge>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="bg-white/5 border border-white/8 text-gray-400 text-[10px] rounded px-2 py-1 font-mono focus:outline-none"
              >
                <option value="all">All Severity</option>
                {Object.keys(SEVERITY_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-white/5 border border-white/8 text-gray-400 text-[10px] rounded px-2 py-1 font-mono focus:outline-none"
              >
                <option value="all">All Types</option>
                {indicatorTypes.map(t => <option key={t} value={t}>{t?.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div style={{ height: "calc(100% - 44px)" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm font-mono animate-pulse">
                Loading indicator data...
              </div>
            ) : (
              <IndicatorGeoMap
                indicators={filteredIndicators}
                selectedId={selectedIndicator?.id}
                onSelect={setSelectedIndicator}
              />
            )}
          </div>
        </div>

        {/* RIGHT SIDE — Pie + Detail */}
        <div className="flex flex-col gap-4">
          {/* Severity Pie */}
          <div className="bg-[#0d1220] border border-white/5 rounded-lg p-4" style={{ height: 210 }}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">Severity Breakdown</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={severityPie} cx="50%" cy="50%" innerRadius={40} outerRadius={68}
                  dataKey="value" paddingAngle={3}>
                  {severityPie.map((entry, i) => (
                    <Cell key={i} fill={SEVERITY_COLORS[entry.name] || "#546e7a"} fillOpacity={0.85} />
                  ))}
                </Pie>
                <RechartTooltip
                  contentStyle={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Indicator detail or placeholder */}
          <div className="flex-1 min-h-[200px]">
            {selectedIndicator ? (
              <IndicatorDetailPanel indicator={selectedIndicator} onClose={() => setSelectedIndicator(null)} />
            ) : (
              <div className="bg-[#0d1220] border border-white/5 rounded-lg h-full flex flex-col items-center justify-center p-4 text-center">
                <Globe2 className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-xs text-gray-600 font-mono">Click a marker on the map<br />to view indicator details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Charts */}
      <div className="bg-[#0d1220] border border-white/5 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#d500f9]" />
          <span className="text-xs font-bold text-white">Security Event Timeline</span>
          <Badge className="text-[9px] bg-white/5 text-gray-400 border-white/8">{timelineEvents.length} total events</Badge>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-600 text-sm font-mono animate-pulse">
            Building timeline...
          </div>
        ) : (
          <EventTimeline events={timelineEvents} />
        )}
      </div>
    </div>
  );
}