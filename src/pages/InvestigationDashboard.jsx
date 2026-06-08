import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, AreaChart, Area
} from "recharts";
import {
  BarChart3, TrendingUp, Tag, Search, Calendar, ArrowLeft,
  Skull, Shield, AlertTriangle, Activity, Layers, Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const STORAGE_KEY = "asosint_investigations";

const COLORS = ["#00d4ff", "#2ed573", "#ffa502", "#ff4757", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#14b8a6"];

// Map tags → threat category buckets
const CATEGORY_MAP = {
  "Malware & Ransomware": ["malware", "ransomware", "trojan", "rat", "backdoor", "loader", "dropper"],
  "Phishing & BEC":       ["phishing", "bec", "spoof", "credential-leak"],
  "Threat Actors":        ["threat-actor", "apt"],
  "Vulnerability & Exploit": ["vulnerability", "ioc"],
  "Infrastructure":       ["infrastructure", "network"],
  "Dark Web":             ["dark-web"],
  "OSINT":                ["osint"],
  "Geopolitical":         ["geopolitical"],
};

// Known threat actor keywords (from tags or query)
const ACTOR_KEYWORDS = [
  "lazarus", "apt28", "apt29", "cozy bear", "fancy bear", "sandworm",
  "kimsuky", "turla", "fin7", "wizard spider", "carbanak", "ta505",
  "lapsus", "lockbit", "blackcat", "conti", "ryuk", "revil", "darkside",
  "nobelium", "comet", "scattered spider", "volt typhoon", "salt typhoon",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-semibold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default function InvestigationDashboard() {
  const [investigations, setInvestigations] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setInvestigations(JSON.parse(saved));
  }, []);

  // --- Scan activity over time (last 30 days) ---
  const volumeOverTime = (() => {
    const days = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[key] = 0;
    }
    investigations.forEach(inv => {
      const key = new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  })();

  // --- Threat categories from tags ---
  const categoryData = (() => {
    const counts = {};
    Object.keys(CATEGORY_MAP).forEach(cat => (counts[cat] = 0));
    investigations.forEach(inv => {
      const allTags = (inv.tags || []).map(t => t.toLowerCase());
      Object.entries(CATEGORY_MAP).forEach(([cat, keywords]) => {
        if (keywords.some(kw => allTags.includes(kw))) counts[cat]++;
      });
    });
    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
  })();

  // --- Top threat actors (from query text + tags) ---
  const actorData = (() => {
    const counts = {};
    investigations.forEach(inv => {
      const text = [
        inv.query || "",
        ...(inv.tags || []),
        ...(inv.results || []).map(r => r.title || r.description || ""),
      ].join(" ").toLowerCase();

      ACTOR_KEYWORDS.forEach(actor => {
        if (text.includes(actor)) {
          const label = actor.charAt(0).toUpperCase() + actor.slice(1);
          counts[label] = (counts[label] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  })();

  // --- Severity distribution across all results ---
  const severityData = (() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    investigations.forEach(inv => {
      (inv.results || []).forEach(r => {
        if (r.severity && counts[r.severity] !== undefined) counts[r.severity]++;
      });
    });
    return [
      { name: "Critical", value: counts.critical, color: "#ff4757" },
      { name: "High",     value: counts.high,     color: "#ffa502" },
      { name: "Medium",   value: counts.medium,   color: "#f59e0b" },
      { name: "Low",      value: counts.low,      color: "#2ed573" },
    ].filter(d => d.value > 0);
  })();

  // --- Tag frequency ---
  const tagDistribution = (() => {
    const counts = {};
    investigations.forEach(inv => {
      (inv.tags || []).forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  })();

  // --- Radar: category coverage ---
  const radarData = Object.keys(CATEGORY_MAP).map(cat => {
    const count = categoryData.find(d => d.category === cat)?.count || 0;
    return { category: cat.replace(" & ", "/").split(" ")[0], count };
  });

  const tagged = investigations.filter(inv => inv.tags?.length > 0).length;
  const totalResults = investigations.reduce((s, inv) => s + (inv.results?.length || 0), 0);

  const isEmpty = investigations.length === 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1220] to-[#111827] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-[#00d4ff]" />
              <h1 className="text-3xl font-black text-white">Investigation Trends</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Visual breakdown of threat actors, categories, severity, and scan activity from your saved investigations
            </p>
          </div>
          <Link to={createPageUrl("Investigations")}>
            <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Investigations
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Investigations" value={investigations.length} icon={Search} color="#00d4ff" />
        <StatCard label="Total Scan Results" value={totalResults} icon={Activity} color="#2ed573" />
        <StatCard label="Threat Categories Found" value={categoryData.length} icon={Layers} color="#ffa502" />
        <StatCard label="Actors Detected" value={actorData.length} icon={Skull} color="#ff4757" />
      </div>

      {isEmpty && (
        <div className="text-center py-16 bg-[#111827] border border-white/5 rounded-xl">
          <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No investigation data yet.</p>
          <p className="text-gray-600 text-xs mt-1">Run scans and save investigations to see trends here.</p>
          <Link to={createPageUrl("Investigations")} className="inline-block mt-4">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">Go to Investigations</Button>
          </Link>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Scan Activity Over Time */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-[#00d4ff]" />
              <h2 className="text-base font-semibold text-white">
                Scan Activity <span className="text-xs text-gray-500 font-normal ml-1">(last 30 days)</span>
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Scans" stroke="#00d4ff" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: "#00d4ff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Threat Categories + Top Threat Actors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Frequent Threat Categories */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Layers className="w-4 h-4 text-[#ffa502]" />
                <h2 className="text-base font-semibold text-white">Most Frequent Threat Categories</h2>
              </div>
              {categoryData.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">Tag your investigations to populate this chart</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Investigations" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Threat Actors */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Skull className="w-4 h-4 text-[#ff4757]" />
                <h2 className="text-base font-semibold text-white">Top Threat Actors Mentioned</h2>
              </div>
              {actorData.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">No known threat actors detected in investigations yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Mention actors like "Lazarus", "APT28", "LockBit" in queries or results.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={actorData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="actor" tick={{ fontSize: 10, fill: "#9ca3af" }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]} fill="#ff4757">
                      {actorData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Severity Distribution + Tag Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Pie */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-[#ff4757]" />
                <h2 className="text-base font-semibold text-white">Result Severity Distribution</h2>
              </div>
              {severityData.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">No severity data from scan results yet</p>
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm flex-1">
                    {severityData.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                          <span className="text-gray-300 text-xs">{name}</span>
                        </div>
                        <span className="text-white font-bold text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tag frequency bar */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Tag className="w-4 h-4 text-[#2ed573]" />
                <h2 className="text-base font-semibold text-white">Tag Frequency</h2>
              </div>
              {tagDistribution.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">No tags applied yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tagDistribution} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="tag" tick={{ fontSize: 10, fill: "#9ca3af" }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                      {tagDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Radar — threat coverage */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Crosshair className="w-4 h-4 text-[#a855f7]" />
              <h2 className="text-base font-semibold text-white">Threat Coverage Radar</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Radar name="Investigations" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}