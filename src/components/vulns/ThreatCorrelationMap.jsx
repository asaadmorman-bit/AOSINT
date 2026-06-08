import React, { useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const COUNTRY_FLAGS = { "Russia": "🇷🇺", "China": "🇨🇳", "North Korea": "🇰🇵", "Iran": "🇮🇷", "USA": "🇺🇸", "Vietnam": "🇻🇳", "Ukraine": "🇺🇦", "India": "🇮🇳", "Brazil": "🇧🇷", "Romania": "🇷🇴" };
const ACTOR_TYPE_COLOR = { nation_state: "#f59e0b", criminal: "#ef4444", hacktivist: "#8b5cf6", ransomware: "#ff4757", unknown: "#6b7280" };

function ActorNode({ actor, size = "md" }) {
  const typeColor = ACTOR_TYPE_COLOR[actor.type?.toLowerCase().replace(" ", "_")] || ACTOR_TYPE_COLOR.unknown;
  const isLarge = size === "lg";
  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColor }} />
      <span className="text-white font-semibold">{actor.name}</span>
      {actor.country && <span className="text-gray-500">{COUNTRY_FLAGS[actor.country] || ""} {actor.country}</span>}
      {actor.confidence && (
        <span className="text-[9px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded">{actor.confidence}% conf</span>
      )}
    </div>
  );
}

export default function ThreatCorrelationMap({ correlations, findings }) {
  // Build actor frequency map
  const actorFreq = useMemo(() => {
    const map = {};
    correlations.forEach(c => {
      (c.threat_actors || []).forEach(a => {
        if (!map[a.name]) map[a.name] = { ...a, cve_count: 0, cves: [] };
        map[a.name].cve_count++;
        map[a.name].cves.push(c.cve_id);
      });
    });
    return Object.values(map).sort((a, b) => b.cve_count - a.cve_count).slice(0, 10);
  }, [correlations]);

  // Exploit kit frequency
  const kitFreq = useMemo(() => {
    const map = {};
    correlations.forEach(c => {
      (c.exploit_kits || []).forEach(k => {
        if (!map[k.name]) map[k.name] = { name: k.name, count: 0, activity: k.activity_level };
        map[k.name].count++;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [correlations]);

  // Industry targeting radar
  const industryData = useMemo(() => {
    const map = {};
    correlations.forEach(c => {
      (c.target_industries || []).forEach(ind => {
        map[ind] = (map[ind] || 0) + 1;
      });
    });
    return Object.entries(map).slice(0, 8).map(([industry, count]) => ({ industry, count }));
  }, [correlations]);

  // Country origin bar
  const countryData = useMemo(() => {
    const map = {};
    correlations.forEach(c => {
      (c.origin_countries || []).forEach(co => {
        map[co] = (map[co] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([country, count]) => ({ country, count, flag: COUNTRY_FLAGS[country] || "🌐" }));
  }, [correlations]);

  if (!correlations.length) return null;

  return (
    <div className="space-y-4">
      {/* Actor + Exploit Kit row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Threat Actors */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Threat Actors Targeting Your CVEs
          </h3>
          {actorFreq.length === 0 ? (
            <p className="text-gray-600 text-xs">No actor data</p>
          ) : (
            <div className="space-y-1.5">
              {actorFreq.map((actor, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 text-[10px] text-gray-600 text-right">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{actor.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{ color: ACTOR_TYPE_COLOR[actor.type?.toLowerCase().replace(" ", "_")] || "#6b7280", borderColor: ACTOR_TYPE_COLOR[actor.type?.toLowerCase().replace(" ", "_")] + "33" || "#ffffff11" }}>
                        {actor.type}
                      </span>
                      {actor.country && <span className="text-[10px] text-gray-500">{COUNTRY_FLAGS[actor.country] || ""} {actor.country}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-slate-800 rounded-full h-1">
                        <div className="h-1 rounded-full bg-red-500/70" style={{ width: `${(actor.cve_count / (actorFreq[0]?.cve_count || 1)) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-500 shrink-0">{actor.cve_count} CVE{actor.cve_count > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exploit Kits */}
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            Exploit Kits & Tooling
          </h3>
          {kitFreq.length === 0 ? (
            <p className="text-gray-600 text-xs">No exploit kit data</p>
          ) : (
            <div className="space-y-2">
              {kitFreq.map((kit, i) => {
                const activityColor = kit.activity === "high" ? "text-red-400 bg-red-900/20 border-red-500/30"
                  : kit.activity === "medium" ? "text-yellow-400 bg-yellow-900/20 border-yellow-500/30"
                  : "text-gray-400 bg-gray-800/20 border-gray-600/30";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">⚙️</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{kit.name}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border ${activityColor}`}>{kit.activity || "unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 bg-slate-800 rounded-full h-1">
                          <div className="h-1 rounded-full bg-orange-500/70" style={{ width: `${(kit.count / (kitFreq[0]?.count || 1)) * 100}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-500 shrink-0">{kit.count} CVE{kit.count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Industry + Country row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {industryData.length > 0 && (
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Target Industry Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={industryData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="industry" tick={{ fill: "#9ca3af", fontSize: 9 }} />
                <Radar name="Industries" dataKey="count" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {countryData.length > 0 && (
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Threat Origin Countries</h3>
            <div className="space-y-2 mt-2">
              {countryData.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base w-6">{c.flag}</span>
                  <span className="text-xs text-gray-300 w-24 shrink-0">{c.country}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400" style={{ width: `${(c.count / (countryData[0]?.count || 1)) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0 w-12 text-right">{c.count} CVE{c.count > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}