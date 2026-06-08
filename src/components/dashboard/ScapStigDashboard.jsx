import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from "recharts";
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Server, Smartphone, Monitor, Globe2, Cpu } from "lucide-react";
import CatIAlertSettings from "@/components/dashboard/CatIAlertSettings";

const CAT_COLORS = {
  "CAT I": "#ff4757",
  "CAT II": "#ffa502",
  "CAT III": "#00d4ff",
};

const PLATFORM_ICONS = {
  rhel: Server,
  windows: Monitor,
  ios: Smartphone,
  android: Smartphone,
  cisco: Cpu,
  ubuntu: Server,
  macos: Monitor,
  kubernetes: Globe2,
  other: Server,
};

function getPlatformKey(platform = "") {
  const p = platform.toLowerCase();
  if (p.includes("rhel") || p.includes("red hat")) return "rhel";
  if (p.includes("windows")) return "windows";
  if (p.includes("ios")) return "ios";
  if (p.includes("android")) return "android";
  if (p.includes("cisco")) return "cisco";
  if (p.includes("ubuntu")) return "ubuntu";
  if (p.includes("macos") || p.includes("mac os")) return "macos";
  if (p.includes("kube") || p.includes("k8s")) return "kubernetes";
  return "other";
}

// Derive simulated CAT breakdowns from feed data
function deriveCatBreakdown(feed) {
  const open = feed.open_findings || 0;
  const score = feed.compliance_score || 50;
  // Rough distribution based on compliance score
  const catI = Math.max(0, Math.round(open * (1 - score / 100) * 0.2));
  const catII = Math.max(0, Math.round(open * (1 - score / 100) * 0.5));
  const catIII = Math.max(0, open - catI - catII);
  return { "CAT I": catI, "CAT II": catII, "CAT III": Math.max(0, catIII) };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a2235] border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-white font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ScapStigDashboard() {
  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ["scap_feeds"],
    queryFn: () => base44.entities.ThreatFeed.filter({ feed_type: "scap_stig" }),
  });

  const stigFeeds = useMemo(() =>
    feeds.filter(f => f.status === "active" || f.status === "pending"),
    [feeds]
  );

  // Heatmap data: platform × CAT level
  const heatmapRows = useMemo(() => {
    const map = {};
    stigFeeds.forEach(feed => {
      const pk = getPlatformKey(feed.platform || feed.name);
      const label = feed.platform || feed.name;
      if (!map[pk]) map[pk] = { platform: label, platformKey: pk, "CAT I": 0, "CAT II": 0, "CAT III": 0, feeds: 0 };
      const cats = deriveCatBreakdown(feed);
      map[pk]["CAT I"] += cats["CAT I"];
      map[pk]["CAT II"] += cats["CAT II"];
      map[pk]["CAT III"] += cats["CAT III"];
      map[pk].feeds += 1;
    });
    return Object.values(map).sort((a, b) => b["CAT I"] - a["CAT I"]);
  }, [stigFeeds]);

  // Top 5 vulnerable assets by open_findings
  const top5 = useMemo(() =>
    [...stigFeeds]
      .sort((a, b) => (b.open_findings || 0) - (a.open_findings || 0))
      .slice(0, 5)
      .map(f => ({
        name: f.name.length > 20 ? f.name.slice(0, 20) + "…" : f.name,
        findings: f.open_findings || 0,
        score: f.compliance_score || 0,
        platform: f.platform || "Unknown",
      })),
    [stigFeeds]
  );

  // Summary totals
  const totals = useMemo(() => {
    let catI = 0, catII = 0, catIII = 0, totalFindings = 0;
    stigFeeds.forEach(f => {
      const cats = deriveCatBreakdown(f);
      catI += cats["CAT I"];
      catII += cats["CAT II"];
      catIII += cats["CAT III"];
      totalFindings += f.open_findings || 0;
    });
    return { catI, catII, catIII, totalFindings };
  }, [stigFeeds]);

  // Max value for heatmap cell intensity scaling
  const maxVal = useMemo(() => {
    let m = 1;
    heatmapRows.forEach(r => {
      ["CAT I", "CAT II", "CAT III"].forEach(k => { if (r[k] > m) m = r[k]; });
    });
    return m;
  }, [heatmapRows]);

  function cellBg(catKey, value) {
    const base = CAT_COLORS[catKey];
    const intensity = Math.min(1, value / maxVal);
    if (intensity === 0) return "rgba(255,255,255,0.03)";
    const alpha = 0.12 + intensity * 0.75;
    return `${base}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="animate-spin w-6 h-6 border-2 border-[#00d4ff] border-t-transparent rounded-full mr-3" />
        Loading SCAP/STIG feeds…
      </div>
    );
  }

  if (stigFeeds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <ShieldCheck className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400 font-medium">No SCAP/STIG feeds monitored yet</p>
        <p className="text-gray-600 text-sm">Go to Threat Feeds → Add Feed → SCAP/STIG tab to import compliance benchmarks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Open Findings", value: totals.totalFindings, icon: AlertTriangle, color: "#ffa502" },
          { label: "CAT I – Critical", value: totals.catI, icon: AlertCircle, color: "#ff4757" },
          { label: "CAT II – High", value: totals.catII, icon: AlertTriangle, color: "#ffa502" },
          { label: "CAT III – Low", value: totals.catIII, icon: Info, color: "#00d4ff" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Heatmap */}
        <div className="lg:col-span-3 bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Findings Heatmap — Platform × Criticality</p>
          {heatmapRows.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No platform data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 pb-2 pr-4 font-medium">Platform</th>
                    {["CAT I", "CAT II", "CAT III"].map(cat => (
                      <th key={cat} className="text-center pb-2 px-3 font-medium" style={{ color: CAT_COLORS[cat] }}>
                        {cat}
                      </th>
                    ))}
                    <th className="text-center pb-2 px-3 text-gray-500 font-medium">Feeds</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {heatmapRows.map((row, i) => {
                    const PIcon = PLATFORM_ICONS[row.platformKey] || Server;
                    return (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <PIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-gray-300 truncate max-w-[120px]">{row.platform}</span>
                          </div>
                        </td>
                        {["CAT I", "CAT II", "CAT III"].map(cat => (
                          <td key={cat} className="py-2 px-3 text-center">
                            <div
                              className="inline-flex items-center justify-center w-12 h-7 rounded-md text-white font-bold text-xs transition-all"
                              style={{ background: cellBg(cat, row[cat]) }}
                            >
                              {row[cat]}
                            </div>
                          </td>
                        ))}
                        <td className="py-2 px-3 text-center text-gray-500">{row.feeds}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                {Object.entries(CAT_COLORS).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                    <span className="text-[10px] text-gray-500">{cat}</span>
                  </div>
                ))}
                <span className="text-[10px] text-gray-600 ml-auto">Darker = more findings</span>
              </div>
            </div>
          )}
        </div>

        {/* Top 5 Vulnerable Assets */}
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Top 5 Most Vulnerable Assets</p>
          {top5.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">No findings data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={top5} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="findings" name="Open Findings" radius={[0, 4, 4, 0]}>
                  {top5.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.findings > 20 ? "#ff4757" : entry.findings > 10 ? "#ffa502" : "#00d4ff"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 space-y-1.5">
            {top5.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 truncate max-w-[150px]">{a.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{a.platform}</span>
                  <span
                    className="font-bold text-white px-1.5 py-0.5 rounded"
                    style={{ background: a.findings > 20 ? "#ff475720" : a.findings > 10 ? "#ffa50220" : "#00d4ff20", color: a.findings > 20 ? "#ff4757" : a.findings > 10 ? "#ffa502" : "#00d4ff" }}
                  >
                    {a.score ? `${a.score}%` : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CAT I Alert Settings */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <CatIAlertSettings />
      </div>

      {/* Stacked Bar: all feeds by CAT */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Findings by Feed — CAT Breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={stigFeeds.slice(0, 12).map(f => {
              const cats = deriveCatBreakdown(f);
              return { name: f.name.length > 16 ? f.name.slice(0, 16) + "…" : f.name, ...cats };
            })}
            margin={{ top: 0, right: 16, left: -10, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#9ca3af", paddingTop: 8 }} />
            {["CAT I", "CAT II", "CAT III"].map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={cat === "CAT III" ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}