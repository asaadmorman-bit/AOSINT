import React, { useState, useEffect, useCallback } from "react";
import {
  Globe2, Shield, Crosshair, AlertTriangle, Activity,
  ChevronDown, ChevronUp, RefreshCw, MapPin, Target,
  Filter, Loader2, Rss, CheckCircle2, XCircle, Zap,
  TrendingUp, Database, Clock, ExternalLink
} from "lucide-react";

const FUNCTION_URL = "https://rick-james-74fa0295.base44.app/functions/threatByRegion";

const REGION_META = {
  "East Asia":       { icon: "🌏", color: "#ff4757" },
  "Eastern Europe":  { icon: "🌍", color: "#ff6b6b" },
  "Middle East":     { icon: "🌍", color: "#ffa502" },
  "North America":   { icon: "🌎", color: "#00d4ff" },
  "Western Europe":  { icon: "🌍", color: "#a855f7" },
  "South Asia":      { icon: "🌏", color: "#eccc68" },
  "Southeast Asia":  { icon: "🌏", color: "#2ed573" },
  "Latin America":   { icon: "🌎", color: "#1e90ff" },
  "Africa":          { icon: "🌍", color: "#ff8c00" },
  "Central Asia":    { icon: "🌏", color: "#ff69b4" },
  "Unknown":         { icon: "🌐", color: "#555" },
};

const SEV_COLOR = { critical:"#ff4757", high:"#ff6b6b", medium:"#ffa502", low:"#2ed573" };
const SOURCE_COLOR = {
  "CISA KEV":               "#ff4757",
  "Abuse.ch Feodo Tracker": "#ffa502",
  "Abuse.ch ThreatFox":     "#00d4ff",
  "Abuse.ch URLhaus":       "#a855f7",
  "CISA Advisories":        "#2ed573",
  "ASOSINT DB":             "#eccc68",
};

function SeverityBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[9px] mb-0.5">
        <span className="font-mono capitalize text-gray-400">{label}</span>
        <span style={{ color }}>{count}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RegionCard({ region, data, expanded, onToggle }) {
  const meta = REGION_META[region] || REGION_META["Unknown"];
  if (!data) return null;

  const { total, critical, high, medium, low, by_source, by_type, by_country, malware_families, top_iocs } = data;

  const threatLevel = critical > 5  ? { label: "CRITICAL", color: "#ff4757" }
    : critical > 0  ? { label: "HIGH",     color: "#ff6b6b" }
    : high > 10     ? { label: "ELEVATED", color: "#ffa502" }
    : high > 0      ? { label: "MODERATE", color: "#eccc68" }
    : total > 0     ? { label: "LOW",       color: "#2ed573" }
    : { label: "CLEAR", color: "#444" };

  const topCountry = Object.entries(by_country || {}).sort((a,b) => b[1] - a[1])[0];
  const topMalware = Object.entries(malware_families || {}).sort((a,b) => b[1] - a[1])[0];

  return (
    <div className="bg-[#0d1220] border border-white/8 rounded-xl overflow-hidden transition-all">
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left">
        <span className="text-xl shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-black text-sm">{region}</p>
            {total > 0 && (
              <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border"
                style={{ color: threatLevel.color, backgroundColor: `${threatLevel.color}15`, borderColor: `${threatLevel.color}30` }}>
                {threatLevel.label}
              </span>
            )}
            {topMalware && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-gray-500">
                {topMalware[0]}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-[9px] mt-0.5 font-mono">
            {total} IOCs · {critical} crit · {high} high
            {topCountry ? ` · top origin: ${topCountry[0]}` : ""}
          </p>
        </div>
        <div className="hidden sm:flex items-end gap-0.5 mr-2 h-8">
          {[{v:critical,c:"#ff4757"},{v:high,c:"#ff6b6b"},{v:medium,c:"#ffa502"},{v:low,c:"#2ed573"}].map(({v,c},i) => (
            <div key={i} className="w-2 rounded-sm"
              style={{ height:`${Math.max(3, Math.min(32, Math.log1p(v)*8))}px`, backgroundColor: v > 0 ? c : "rgba(255,255,255,0.05)" }} />
          ))}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-gray-600 font-mono uppercase mb-2">Severity</p>
              <SeverityBar label="Critical" count={critical} total={total} color="#ff4757" />
              <SeverityBar label="High"     count={high}     total={total} color="#ff6b6b" />
              <SeverityBar label="Medium"   count={medium}   total={total} color="#ffa502" />
              <SeverityBar label="Low"      count={low}      total={total} color="#2ed573" />
            </div>
            <div>
              <p className="text-[9px] text-gray-600 font-mono uppercase mb-2">Feed Sources</p>
              <div className="space-y-1.5">
                {Object.entries(by_source || {}).sort((a,b) => b[1] - a[1]).map(([src, cnt]) => (
                  <div key={src} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: SOURCE_COLOR[src] || "#666" }} />
                      <span className="text-[9px] text-gray-400 truncate">{src}</span>
                    </div>
                    <span className="text-[9px] font-bold text-white shrink-0">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-600 font-mono uppercase mb-2">Top Origins</p>
              <div className="space-y-1 mb-3">
                {Object.entries(by_country || {}).sort((a,b) => b[1] - a[1]).slice(0,5).map(([cc, cnt]) => (
                  <div key={cc} className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-gray-400">{cc}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 rounded-full bg-[#00d4ff]/30" style={{ width:`${Math.min(60, cnt*2)}px` }} />
                      <span className="text-[9px] text-[#00d4ff] font-bold">{cnt}</span>
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(malware_families || {}).length > 0 && (
                <>
                  <p className="text-[9px] text-gray-600 font-mono uppercase mb-1.5">Malware Families</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(malware_families).sort((a,b) => b[1]-a[1]).slice(0,6).map(([m, cnt]) => (
                      <span key={m} className="text-[8px] px-1.5 py-0.5 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded font-mono text-[#ff4757]">
                        {m} ({cnt})
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-[9px] text-gray-600 font-mono uppercase mb-2">IOC Types</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(by_type || {}).sort((a,b) => b[1]-a[1]).map(([t, cnt]) => (
                <span key={t} className="text-[9px] px-2 py-1 bg-white/5 border border-white/8 rounded font-mono text-gray-400">
                  {t} <span className="text-white font-bold">{cnt}</span>
                </span>
              ))}
            </div>
          </div>

          {top_iocs?.length > 0 && (
            <div>
              <p className="text-[9px] text-gray-600 font-mono uppercase mb-2">Live IOC Samples</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {top_iocs.slice(0, 10).map((ioc, i) => (
                  <div key={i} className="flex items-start gap-2 px-2 py-1.5 bg-white/3 rounded-lg border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: SEV_COLOR[ioc.severity] || "#666" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-300 font-mono truncate">{ioc.value}</p>
                      <p className="text-[8px] text-gray-600 mt-0.5">{ioc.description?.slice(0,80)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[7px] font-mono uppercase px-1 py-0.5 rounded"
                        style={{ color: SEV_COLOR[ioc.severity], backgroundColor: `${SEV_COLOR[ioc.severity]}15` }}>
                        {ioc.severity}
                      </span>
                      <span className="text-[7px] text-gray-700 font-mono">{ioc.ioc_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-4">
              <MapPin className="w-5 h-5 mx-auto text-gray-700 mb-1" />
              <p className="text-gray-600 text-xs">No live threat data attributed to this region</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ThreatIntelByRegion() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [expanded, setExpanded]       = useState({});
  const [filter, setFilter]           = useState("all");
  const [sortBy, setSortBy]           = useState("total");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Unknown error");
      setData(json);
      setLastFetched(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const regions = data?.regions || {};
  const summary = data?.summary || {};
  const feeds   = summary.feeds || {};

  const regionList = Object.entries(regions)
    .filter(([name]) => name !== "Unknown")
    .map(([name, d]) => ({ name, ...d }))
    .filter(r => {
      if (filter === "critical") return r.critical > 0;
      if (filter === "high")     return r.critical > 0 || r.high > 0;
      if (filter === "active")   return r.total > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "critical") return b.critical - a.critical;
      if (sortBy === "high")     return (b.critical + b.high) - (a.critical + a.high);
      return b.total - a.total;
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#00d4ff]" /> Threat by Region
            <span className="text-[10px] text-[#00d4ff] font-mono bg-[#00d4ff]/10 px-2 py-0.5 rounded-full border border-[#00d4ff]/20 animate-pulse">LIVE</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time IOC attribution from CISA KEV · Feodo · ThreatFox · URLhaus
            {lastFetched && <span className="ml-2 text-gray-700">· updated {lastFetched.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {data && (
        <div className="flex items-center gap-3 flex-wrap bg-[#0a0f1e] border border-white/5 rounded-xl px-4 py-2.5">
          <Rss className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          <span className="text-[9px] text-gray-600 font-mono uppercase mr-1">Live Feeds:</span>
          {[
            { key:"cisa_kev",   label:"CISA KEV",   color:"#ff4757" },
            { key:"feodo",      label:"Feodo",      color:"#ffa502" },
            { key:"threatfox",  label:"ThreatFox",  color:"#00d4ff" },
            { key:"urlhaus",    label:"URLhaus",    color:"#a855f7" },
            { key:"advisories", label:"Advisories", color:"#2ed573" },
          ].map(({ key, label, color }) => {
            const f = feeds[key];
            return (
              <div key={key} className="flex items-center gap-1.5 bg-white/3 border border-white/5 rounded-lg px-2 py-1">
                <div className={`w-1.5 h-1.5 rounded-full ${f?.ok ? "bg-[#2ed573] animate-pulse" : "bg-[#ff4757]"}`} />
                <span className="text-[8px] font-mono" style={{ color }}>{label}</span>
                <span className="text-[8px] text-gray-600">{f?.ok ? f.count : "ERR"}</span>
              </div>
            );
          })}
          <span className="text-[9px] text-gray-600 ml-auto font-mono">
            {summary.total?.toLocaleString()} total · {summary.attributed} attributed
          </span>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label:"Live IOCs",        value:summary.live?.toLocaleString(),        color:"#00d4ff", icon:Database      },
            { label:"Attributed",       value:summary.attributed?.toLocaleString(),  color:"#2ed573", icon:MapPin        },
            { label:"Critical Regions", value:regionList.filter(r=>r.critical>0).length, color:"#ff4757", icon:AlertTriangle },
            { label:"Hottest Region",   value:regionList[0]?.name || "—",            color:"#a855f7", icon:TrendingUp    },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-[#0d1220] border border-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor:`${color}15`, border:`1px solid ${color}25` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{value}</p>
                <p className="text-[9px] text-gray-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-gray-600" />
        {[
          { key:"all",      label:"All"           },
          { key:"active",   label:"Has Data"      },
          { key:"high",     label:"High+ Threat"  },
          { key:"critical", label:"Critical Only" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
              filter === f.key
                ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                : "bg-white/3 border-white/8 text-gray-500 hover:text-white"
            }`}>{f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] text-gray-600 font-mono">Sort:</span>
          {[{k:"total",label:"Total"},{k:"critical",label:"Critical"},{k:"high",label:"High+"}].map(s => (
            <button key={s.k} onClick={() => setSortBy(s.k)}
              className={`px-2 py-1 rounded text-[9px] font-mono transition-colors border ${
                sortBy === s.k ? "bg-white/8 border-white/15 text-white" : "border-white/5 text-gray-600 hover:text-white"
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
          <p className="text-sm">Fetching live threat feeds...</p>
          <p className="text-xs text-gray-600">Pulling CISA KEV · Feodo · ThreatFox · URLhaus</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-[#ff4757]" />
          <p className="text-white font-bold">Failed to load threat feeds</p>
          <p className="text-gray-500 text-xs">{error}</p>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-xl text-sm text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-2">
          {regionList.map(region => (
            <RegionCard
              key={region.name}
              region={region.name}
              data={region}
              expanded={!!expanded[region.name]}
              onToggle={() => toggle(region.name)}
            />
          ))}
        </div>
      )}

      {data && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Database className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-gray-600 font-mono uppercase mb-1">Data Sources & Attribution</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Live feeds: <strong className="text-gray-400">CISA KEV</strong> · <strong className="text-gray-400">Abuse.ch Feodo Tracker</strong> (C2 IPs w/ country) · <strong className="text-gray-400">ThreatFox</strong> (multi-type IOCs) · <strong className="text-gray-400">URLhaus</strong> (malware URLs + IP geo via ipinfo.io).
                Regional attribution uses IP country codes and APT actor-to-nation-state mapping.
                {summary.unattributed > 0 && ` ${summary.unattributed} IOCs unattributed.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}