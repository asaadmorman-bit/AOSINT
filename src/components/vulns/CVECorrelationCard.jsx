import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, AlertTriangle, Skull, Zap, Target, Shield } from "lucide-react";

const SEV_STYLE = {
  critical: "bg-red-900/20 border-red-500/30 text-red-300",
  high: "bg-orange-900/20 border-orange-500/30 text-orange-300",
  medium: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
  low: "bg-blue-900/20 border-blue-500/30 text-blue-300",
};

const ACTOR_TYPE_COLOR = {
  "nation_state": "#f59e0b",
  "criminal": "#ef4444",
  "hacktivist": "#8b5cf6",
  "ransomware": "#ff4757",
  "unknown": "#6b7280",
};

export default function CVECorrelationCard({ correlation, finding }) {
  const [expanded, setExpanded] = useState(false);
  const hasRansomware = correlation.ransomware_association;
  const actorCount = correlation.threat_actors?.length || 0;
  const kitCount = correlation.exploit_kits?.length || 0;
  const sevStyle = SEV_STYLE[finding?.severity] || SEV_STYLE.medium;

  return (
    <div className={`border rounded-xl overflow-hidden ${hasRansomware ? "border-red-500/30 bg-red-950/10" : "border-white/5 bg-slate-900/40"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white font-mono">{correlation.cve_id}</span>
            {finding?.severity && (
              <Badge className={`text-[9px] border shrink-0 ${sevStyle}`}>{finding.severity}</Badge>
            )}
            {finding?.cvss_score && (
              <span className="text-[10px] text-gray-500">CVSS {finding.cvss_score}</span>
            )}
            {hasRansomware && (
              <Badge className="text-[9px] border bg-red-900/30 text-red-300 border-red-500/30 shrink-0 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Ransomware
              </Badge>
            )}
            {finding?.actively_exploited && (
              <Badge className="text-[9px] border bg-orange-900/30 text-orange-300 border-orange-500/30 shrink-0">
                🔥 Active Exploit
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{finding?.title || correlation.exploitation_method}</p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 shrink-0 text-[10px]">
          {actorCount > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <Skull className="w-3 h-3" />
              <span>{actorCount}</span>
            </div>
          )}
          {kitCount > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Zap className="w-3 h-3" />
              <span>{kitCount}</span>
            </div>
          )}
          {(correlation.mitre_techniques?.length || 0) > 0 && (
            <div className="flex items-center gap-1 text-purple-400">
              <Target className="w-3 h-3" />
              <span>{correlation.mitre_techniques.length}</span>
            </div>
          )}
        </div>

        <button onClick={() => setExpanded(o => !o)} className="text-gray-600 hover:text-gray-300 p-1 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4 bg-slate-950/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Threat Actors */}
            {actorCount > 0 && (
              <div>
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Skull className="w-2.5 h-2.5" /> Threat Actors ({actorCount})
                </p>
                <div className="space-y-1.5">
                  {correlation.threat_actors.map((actor, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ACTOR_TYPE_COLOR[actor.type?.toLowerCase().replace(" ", "_")] || "#6b7280" }} />
                      <span className="text-xs text-white font-semibold">{actor.name}</span>
                      <span className="text-[9px] text-gray-500">{actor.type}</span>
                      {actor.country && <span className="text-[9px] text-gray-600 ml-auto">{actor.country}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exploit Kits */}
            {kitCount > 0 && (
              <div>
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Exploit Kits ({kitCount})
                </p>
                <div className="space-y-1.5">
                  {correlation.exploit_kits.map((kit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-white font-semibold">⚙️ {kit.name}</span>
                      {kit.activity_level && (
                        <span className={`text-[8px] px-1 rounded border ${kit.activity_level === "high" ? "text-red-400 border-red-500/30 bg-red-900/10" : "text-gray-500 border-gray-600/30"}`}>
                          {kit.activity_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MITRE Techniques */}
            {(correlation.mitre_techniques?.length || 0) > 0 && (
              <div>
                <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" /> MITRE ATT&CK
                </p>
                <div className="flex flex-wrap gap-1">
                  {correlation.mitre_techniques.map((t, i) => (
                    <span key={i} className="text-[9px] bg-purple-900/20 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                      {t.id || t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Campaigns + Industries */}
            <div className="space-y-3">
              {(correlation.attack_campaigns?.length || 0) > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Campaigns</p>
                  <div className="space-y-0.5">
                    {correlation.attack_campaigns.slice(0, 3).map((c, i) => (
                      <p key={i} className="text-[10px] text-gray-400">• {c}</p>
                    ))}
                  </div>
                </div>
              )}
              {(correlation.target_industries?.length || 0) > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest mb-1">Target Industries</p>
                  <div className="flex flex-wrap gap-1">
                    {correlation.target_industries.slice(0, 5).map((ind, i) => (
                      <span key={i} className="text-[9px] bg-green-900/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded">{ind}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ransomware groups */}
          {hasRansomware && (correlation.ransomware_groups?.length || 0) > 0 && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-2.5">
              <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Ransomware Groups Leveraging This CVE
              </p>
              <div className="flex flex-wrap gap-1.5">
                {correlation.ransomware_groups.map((g, i) => (
                  <span key={i} className="text-[10px] font-semibold text-red-300 bg-red-900/20 border border-red-500/20 px-2 py-0.5 rounded">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Risk context */}
          {correlation.risk_context && (
            <p className="text-[11px] text-gray-400 border-l-2 border-cyan-500/30 pl-3 italic">{correlation.risk_context}</p>
          )}
        </div>
      )}
    </div>
  );
}