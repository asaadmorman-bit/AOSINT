import React, { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { Settings, Eye, EyeOff, TrendingUp, Shield, Activity, AlertTriangle, Target, Layers } from "lucide-react";

const SEVERITY_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#ffd700", low: "#2ed573", informational: "#00d4ff" };

const WIDGET_DEFS = [
  { id: "severity_dist", label: "Severity Distribution", icon: AlertTriangle },
  { id: "indicator_types", label: "Indicator Types", icon: Layers },
  { id: "asset_criticality", label: "Asset Criticality", icon: Target },
  { id: "feed_health", label: "Feed Health", icon: Activity },
  { id: "threat_trends", label: "Threat Trends", icon: TrendingUp },
  { id: "domain_radar", label: "Domain Radar", icon: Shield },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1220] border border-white/10 rounded px-3 py-2 text-xs">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.stroke || "#00d4ff" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function MetricsPanel({ indicators = [], assets = [], feeds = [], events = [] }) {
  const DEFAULT_WIDGETS = { severity_dist: true, indicator_types: true, asset_criticality: true, feed_health: true, threat_trends: true, domain_radar: true };
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("asosint_widgets"));
      return saved || DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });
  const [showConfig, setShowConfig] = useState(false);

  const toggleWidget = (id) => {
    const updated = { ...visibleWidgets, [id]: !visibleWidgets[id] };
    setVisibleWidgets(updated);
    localStorage.setItem("asosint_widgets", JSON.stringify(updated));
  };

  // Severity distribution
  const severityData = ["critical", "high", "medium", "low", "informational"].map(s => ({
    name: s, value: indicators.filter(i => i.severity === s).length, fill: SEVERITY_COLORS[s]
  })).filter(d => d.value > 0);

  // Indicator types
  const typeMap = {};
  indicators.forEach(i => { typeMap[i.indicator_type] = (typeMap[i.indicator_type] || 0) + 1; });
  const indicatorTypeData = Object.entries(typeMap).map(([k, v]) => ({ name: k, value: v })).slice(0, 8);

  // Asset criticality
  const critMap = {};
  assets.forEach(a => { critMap[a.criticality] = (critMap[a.criticality] || 0) + 1; });
  const assetData = Object.entries(critMap).map(([k, v]) => ({
    name: k, value: v,
    fill: k === "critical" ? "#ff4757" : k === "high" ? "#ffa502" : k === "medium" ? "#ffd700" : "#2ed573"
  }));

  // Feed health
  const feedStatusMap = {};
  feeds.forEach(f => { feedStatusMap[f.status] = (feedStatusMap[f.status] || 0) + 1; });
  const feedData = Object.entries(feedStatusMap).map(([k, v]) => ({
    name: k, value: v,
    fill: k === "active" ? "#2ed573" : k === "error" ? "#ff4757" : k === "inactive" ? "#6b7280" : "#ffa502"
  }));

  // Domain radar
  const domainCounts = { cyber: 0, physical: 0, influence: 0, geopolitical: 0, hybrid: 0 };
  events.forEach(e => { if (domainCounts[e.domain] !== undefined) domainCounts[e.domain]++; });
  const radarData = Object.entries(domainCounts).map(([domain, count]) => ({
    subject: domain.charAt(0).toUpperCase() + domain.slice(1), A: count
  }));

  // Fake trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      critical: Math.floor(Math.random() * 5 + (indicators.filter(x => x.severity === "critical").length / 7)),
      high: Math.floor(Math.random() * 8 + (indicators.filter(x => x.severity === "high").length / 7)),
      medium: Math.floor(Math.random() * 12 + (indicators.filter(x => x.severity === "medium").length / 7)),
    };
  });

  const widgetStyle = "bg-[#0d1220] border border-white/8 rounded-xl p-4";
  const labelStyle = "text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5";

  return (
    <div>
      {/* Config toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-white">Analytics Widgets</p>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" /> Customize
        </button>
      </div>

      {showConfig && (
        <div className="bg-[#0d1220] border border-white/10 rounded-xl p-4 mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {WIDGET_DEFS.map(w => (
            <button
              key={w.id}
              onClick={() => toggleWidget(w.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                visibleWidgets[w.id]
                  ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                  : "bg-white/5 text-gray-500 border border-white/5"
              }`}
            >
              {visibleWidgets[w.id] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {w.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Severity Distribution */}
        {visibleWidgets.severity_dist && (
          <div className={widgetStyle}>
            <p className={labelStyle}><AlertTriangle className="w-3 h-3 text-[#ff4757]" /> Severity Distribution</p>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={60} dataKey="value" stroke="none">
                    {severityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {severityData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                  <span className="text-[9px] text-gray-500 capitalize">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicator Types */}
        {visibleWidgets.indicator_types && (
          <div className={widgetStyle}>
            <p className={labelStyle}><Layers className="w-3 h-3 text-[#a855f7]" /> Indicator Types</p>
            {indicatorTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={indicatorTypeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#a855f7" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        )}

        {/* Asset Criticality */}
        {visibleWidgets.asset_criticality && (
          <div className={widgetStyle}>
            <p className={labelStyle}><Target className="w-3 h-3 text-[#2ed573]" /> Asset Criticality</p>
            {assetData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={assetData} margin={{ left: 0, right: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {assetData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        )}

        {/* Feed Health */}
        {visibleWidgets.feed_health && (
          <div className={widgetStyle}>
            <p className={labelStyle}><Activity className="w-3 h-3 text-[#00d4ff]" /> Feed Health</p>
            {feedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={feedData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                    {feedData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {feedData.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                  <span className="text-[9px] text-gray-500 capitalize">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threat Trends */}
        {visibleWidgets.threat_trends && (
          <div className={widgetStyle + " md:col-span-2"}>
            <p className={labelStyle}><TrendingUp className="w-3 h-3 text-[#ffa502]" /> Incident Trends (7-Day)</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ left: 0, right: 10 }}>
                <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="critical" stroke="#ff4757" fill="#ff4757" fillOpacity={0.1} strokeWidth={1.5} name="Critical" />
                <Area type="monotone" dataKey="high" stroke="#ffa502" fill="#ffa502" fillOpacity={0.08} strokeWidth={1.5} name="High" />
                <Area type="monotone" dataKey="medium" stroke="#ffd700" fill="#ffd700" fillOpacity={0.06} strokeWidth={1} name="Medium" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Domain Radar */}
        {visibleWidgets.domain_radar && (
          <div className={widgetStyle}>
            <p className={labelStyle}><Shield className="w-3 h-3 text-[#a855f7]" /> Domain Activity</p>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={65}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 8 }} />
                <Radar name="Events" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={1.5} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center text-xs text-gray-600">
      No data available
    </div>
  );
}