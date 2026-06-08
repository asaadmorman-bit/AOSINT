import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Database, Filter, RefreshCw, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MitreMatrix from "@/components/mitre/MitreMatrix";
import TechniqueDetailPanel from "@/components/mitre/TechniqueDetailPanel";
import { MITRE_TACTICS } from "@/components/mitre/mitreData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function MitreAttackDashboard() {
  const [activeTactic, setActiveTactic] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [actorFilter, setActorFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: actors = [], isLoading: actorsLoading, refetch: refetchActors } = useQuery({
    queryKey: ["mitre-actors"],
    queryFn: () => base44.entities.ThreatActor.list("-last_active", 100),
  });

  const { data: indicators = [], isLoading: indLoading, refetch: refetchInd } = useQuery({
    queryKey: ["mitre-indicators"],
    queryFn: () => base44.entities.ThreatIndicator.filter({ status: "active" }, "-created_date", 100),
  });

  const loading = actorsLoading || indLoading;

  // Build heatmap: techniqueId → count
  const heatmap = useMemo(() => {
    const map = {};
    const addHit = (id) => { map[id] = (map[id] || 0) + 1; };

    // From actors
    actors
      .filter(a => actorFilter === "all" || a.id === actorFilter)
      .forEach(a => {
        (a.shared_ttps || []).forEach(t => {
          // Match against known technique IDs (T1xxx) or names
          MITRE_TACTICS.forEach(tac => {
            tac.techniques.forEach(tech => {
              if (t.includes(tech.id) || t.toLowerCase().includes(tech.name.toLowerCase())) {
                addHit(tech.id);
              }
            });
          });
        });
      });

    // From indicators
    indicators
      .filter(i => severityFilter === "all" || i.severity === severityFilter)
      .forEach(ind => {
        (ind.mitre_tactics || []).forEach(t => {
          MITRE_TACTICS.forEach(tac => {
            tac.techniques.forEach(tech => {
              if (t.includes(tech.id) || t.toLowerCase().includes(tech.name.toLowerCase())) {
                addHit(tech.id);
              }
            });
          });
        });
      });

    return map;
  }, [actors, indicators, actorFilter, severityFilter]);

  // Coverage stats
  const coveredTechniques = Object.keys(heatmap).length;
  const totalTechniques = MITRE_TACTICS.reduce((s, t) => s + t.techniques.length, 0);

  // Tactic coverage bar chart data
  const tacticBarData = useMemo(() =>
    MITRE_TACTICS.map(tac => ({
      name: tac.name.length > 12 ? tac.name.slice(0, 11) + "…" : tac.name,
      hits: tac.techniques.reduce((s, t) => s + (heatmap[t.id] || 0), 0),
      color: tac.color,
    })).filter(d => d.hits > 0),
    [heatmap]
  );

  // Filtered actor list for sidebar
  const filteredActors = useMemo(() => {
    if (!search) return actors;
    const q = search.toLowerCase();
    return actors.filter(a => a.name?.toLowerCase().includes(q));
  }, [actors, search]);

  const handleRefresh = () => { refetchActors(); refetchInd(); };

  return (
    <div className="min-h-screen bg-[#080c16] text-gray-100 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ff6d00]/10 border border-[#ff6d00]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#ff6d00]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">MITRE ATT&CK Matrix</h1>
            <p className="text-xs text-gray-500">Threat actors & indicators mapped to Enterprise tactics & techniques</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-[#ff6d00]/10 text-[#ff6d00] border border-[#ff6d00]/25 text-[9px] font-mono">
            {coveredTechniques}/{totalTechniques} techniques covered
          </Badge>
          <button onClick={handleRefresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-white/8 hover:border-white/20 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Threat Actors", value: actors.length, color: "#d500f9", icon: Users },
          { label: "Active Indicators", value: indicators.length, color: "#00e5ff", icon: Database },
          { label: "Tactics Covered", value: MITRE_TACTICS.filter(t => t.techniques.some(te => heatmap[te.id])).length, color: "#ff6d00", icon: Shield },
          { label: "Technique Hits", value: Object.values(heatmap).reduce((s, v) => s + v, 0), color: "#ff1744", icon: Filter },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[#0d1220] border border-white/5 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">{label}</div>
              <div className="text-xl font-black text-white">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-[#0d1220] border border-white/5 rounded-lg p-3">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Filter</span>

        <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}
          className="bg-white/5 border border-white/8 text-gray-300 text-[11px] rounded px-2 py-1.5 font-mono focus:outline-none">
          <option value="all">All Actors</option>
          {actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
          className="bg-white/5 border border-white/8 text-gray-300 text-[11px] rounded px-2 py-1.5 font-mono focus:outline-none">
          <option value="all">All Severities</option>
          {["critical","high","medium","low","informational"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded px-2 py-1.5 ml-auto">
          <Search className="w-3 h-3 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actors…"
            className="bg-transparent text-[11px] text-gray-300 font-mono w-28 focus:outline-none placeholder:text-gray-700" />
        </div>

        {activeTactic && (
          <button onClick={() => { setActiveTactic(null); setSelectedTechnique(null); }}
            className="text-[10px] font-mono text-[#ff6d00] hover:underline">
            × Clear tactic filter
          </button>
        )}
      </div>

      {/* Tactic hits bar chart */}
      {tacticBarData.length > 0 && (
        <div className="bg-[#0d1220] border border-white/5 rounded-lg p-4 mb-4">
          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-3">Technique Hits by Tactic</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={tacticBarData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontFamily: "monospace", borderRadius: 4 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Bar dataKey="hits" radius={[2, 2, 0, 0]}>
                {tacticBarData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Main layout: matrix + detail */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Matrix */}
        <div className="flex-1 min-w-0 bg-[#0d1220] border border-white/5 rounded-lg p-3">
          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Click a <span className="text-white">tactic header</span> to filter · Click a <span className="text-white">technique</span> to inspect
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-600 text-sm font-mono animate-pulse">
              Building matrix…
            </div>
          ) : (
            <MitreMatrix
              heatmap={heatmap}
              onTacticClick={setActiveTactic}
              onTechniqueClick={setSelectedTechnique}
              activeTactic={activeTactic}
              selectedTechnique={selectedTechnique}
            />
          )}
        </div>

        {/* Right: detail + actor list */}
        <div className="xl:w-80 flex flex-col gap-4 shrink-0">
          {selectedTechnique ? (
            <TechniqueDetailPanel
              technique={selectedTechnique}
              actors={actors}
              indicators={indicators}
              onClose={() => setSelectedTechnique(null)}
            />
          ) : (
            <div className="bg-[#0d1220] border border-white/5 rounded-lg p-4 text-center">
              <Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-mono">Select a technique cell<br />to see mapped actors & indicators</p>
            </div>
          )}

          {/* Actors list */}
          <div className="bg-[#0d1220] border border-white/5 rounded-lg p-3 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-[#d500f9]" />
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Threat Actors ({filteredActors.length})</span>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredActors.length === 0 && (
                <p className="text-[10px] text-gray-700 font-mono">No actors in database</p>
              )}
              {filteredActors.map(a => {
                const ttpCount = (a.shared_ttps || []).length;
                return (
                  <button key={a.id} onClick={() => setActorFilter(a.id === actorFilter ? "all" : a.id)}
                    className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded transition-all ${
                      actorFilter === a.id ? "bg-[#d500f9]/10 border border-[#d500f9]/25" : "hover:bg-white/4 border border-transparent"
                    }`}>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-white truncate">{a.name}</div>
                      <div className="text-[8px] font-mono text-gray-600 capitalize">{a.actor_type}</div>
                    </div>
                    <Badge className="text-[8px] font-mono bg-white/5 text-gray-500 border-white/8 shrink-0 ml-1">
                      {ttpCount} TTPs
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}