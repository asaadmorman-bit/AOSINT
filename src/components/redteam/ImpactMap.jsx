import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, TrendingDown, Eye, Server, Users, Database, Globe2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const DEFENSE_DOMAINS = [
  { domain: "Endpoint Detection", baseline: 72, color: "#00d4ff" },
  { domain: "Network Monitoring", baseline: 65, color: "#3b82f6" },
  { domain: "Identity & Access", baseline: 58, color: "#a855f7" },
  { domain: "Email Security", baseline: 80, color: "#2ed573" },
  { domain: "Cloud Posture", baseline: 55, color: "#f59e0b" },
  { domain: "OT/ICS Security", baseline: 41, color: "#ff4757" },
  { domain: "Threat Intel Fusion", baseline: 69, color: "#ec4899" },
];

const INTEL_GAPS = [
  { category: "Actor Attribution", before: 45, after: 72, label: "APT Attribution" },
  { category: "Campaign Coverage", before: 38, after: 81, label: "Campaign Mapping" },
  { category: "TTP Visibility", before: 52, after: 93, label: "TTP Coverage" },
  { category: "IOC Coverage", before: 60, after: 88, label: "IOC Density" },
  { category: "Warning Time", before: 30, after: 67, label: "Avg Warning Time" },
];

export default function ImpactMap({ activeScenario }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [impact, setImpact] = useState(null);

  const { data: assets = [] } = useQuery({ queryKey: ["assets"], queryFn: () => base44.entities.Asset.list() });
  const { data: actors = [] } = useQuery({ queryKey: ["threat_actors"], queryFn: () => base44.entities.ThreatActor.list() });

  const runImpactAnalysis = async () => {
    setAnalyzing(true);
    try {
      const chain = activeScenario?.chain || [];
      const prompt = `You are a defensive intelligence analyst. Given this red team TTP chain, analyze impact on the organization's security posture and intelligence picture.

TTP Chain: ${chain.map(s => `[${s.tactic}] ${s.technique}`).join(", ") || "Generic APT simulation — Initial Access > Persistence > Lateral Movement > Exfiltration"}
Assets at risk: ${assets.slice(0, 5).map(a => a.name).join(", ") || "Corporate endpoints, AD domain controller, cloud storage, email server"}

Provide JSON with:
- compromised_assets: array of {asset, reason, severity}
- defense_posture_impacts: array of {domain, score_before, score_after, gap_description}
- intel_picture_changes: array of {change, impact, action}
- priority_mitigations: array of {mitigation, timeline, owner}
- executive_summary: string`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            compromised_assets: { type: "array", items: { type: "object", properties: { asset: { type: "string" }, reason: { type: "string" }, severity: { type: "string" } } } },
            defense_posture_impacts: { type: "array", items: { type: "object", properties: { domain: { type: "string" }, score_before: { type: "number" }, score_after: { type: "number" }, gap_description: { type: "string" } } } },
            intel_picture_changes: { type: "array", items: { type: "object", properties: { change: { type: "string" }, impact: { type: "string" }, action: { type: "string" } } } },
            priority_mitigations: { type: "array", items: { type: "object", properties: { mitigation: { type: "string" }, timeline: { type: "string" }, owner: { type: "string" } } } },
            executive_summary: { type: "string" },
          }
        }
      });
      setImpact(result);
    } finally {
      setAnalyzing(false);
    }
  };

  const radarData = DEFENSE_DOMAINS.map(d => ({
    domain: d.domain.split(" ")[0],
    Before: d.baseline,
    After: Math.max(10, d.baseline - Math.floor(Math.random() * 30 + 5)),
  }));

  const severityColor = (s) => s === "critical" ? "#ff4757" : s === "high" ? "#ffa502" : s === "medium" ? "#f59e0b" : "#2ed573";

  return (
    <div className="space-y-6">
      {/* Scenario context + trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0d1220] border border-white/5 rounded-xl p-4">
        <div>
          <p className="text-sm font-bold text-white">Impact Analysis Engine</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeScenario ? `Scenario: ${activeScenario.name} — ${activeScenario.chain?.length || 0} TTPs` : "Load a scenario from the TTP Chain Builder or use a default simulation"}
          </p>
        </div>
        <Button onClick={runImpactAnalysis} disabled={analyzing} className="bg-[#ff4757] hover:bg-[#ff4757]/80 text-white gap-2 text-sm">
          {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><TrendingDown className="w-4 h-4" /> Run Impact Analysis</>}
        </Button>
      </div>

      {/* Static Baseline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#00d4ff]" /> Defense Posture Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Radar name="Baseline" dataKey="Before" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} />
              <Radar name="Post-Attack" dataKey="After" stroke="#ff4757" fill="#ff4757" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#00d4ff] inline-block" /><span className="text-[10px] text-gray-500">Baseline</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#ff4757] inline-block" /><span className="text-[10px] text-gray-500">Post-Attack</span></div>
          </div>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-[#a855f7]" /> Intelligence Picture — Coverage Delta</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={INTEL_GAPS} layout="vertical" barSize={10} barGap={2}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fill: "#6b7280", fontSize: 10 }} width={110} />
              <Tooltip contentStyle={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12 }} />
              <Bar dataKey="before" name="Before Emulation" fill="#ff475740" radius={[0, 4, 4, 0]} />
              <Bar dataKey="after" name="After Emulation" fill="#00d4ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-600 text-center mt-1">Post-emulation intel coverage improvement (blue) vs. pre-exercise baseline (red)</p>
        </div>
      </div>

      {/* AI Impact Results */}
      {impact && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="bg-[#0d1220] border border-[#ff4757]/20 rounded-xl p-5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Executive Summary</p>
            <p className="text-sm text-gray-300 leading-relaxed">{impact.executive_summary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compromised Assets */}
            {impact.compromised_assets?.length > 0 && (
              <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-[#ff4757]" /> At-Risk Assets</h3>
                <div className="space-y-2">
                  {impact.compromised_assets.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: severityColor(a.severity) }} />
                      <div>
                        <p className="text-xs font-bold text-white">{a.asset}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{a.reason}</p>
                      </div>
                      <span className="ml-auto text-[9px] font-bold uppercase" style={{ color: severityColor(a.severity) }}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Mitigations */}
            {impact.priority_mitigations?.length > 0 && (
              <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ed573]" /> Priority Mitigations</h3>
                <div className="space-y-2">
                  {impact.priority_mitigations.map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-xs text-white font-medium">{m.mitigation}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-gray-500">{m.timeline}</span>
                        <span className="text-[10px] text-[#00d4ff]">{m.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Intel Picture Changes */}
          {impact.intel_picture_changes?.length > 0 && (
            <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Globe2 className="w-4 h-4 text-[#a855f7]" /> Intelligence Picture Changes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {impact.intel_picture_changes.map((c, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <p className="text-xs font-bold text-white mb-1">{c.change}</p>
                    <p className="text-[10px] text-gray-400 mb-2">{c.impact}</p>
                    <p className="text-[10px] text-[#00d4ff]">→ {c.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}