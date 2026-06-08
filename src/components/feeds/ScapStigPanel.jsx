import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, Smartphone, Server, Monitor, CheckCircle2, XCircle, Info } from "lucide-react";

const STIG_PRESETS = [
  { id: "RHEL9-STIG", name: "RHEL 9 STIG", platform: "Linux", icon: Server, version: "V1R3", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "WIN11-STIG", name: "Windows 11 STIG", platform: "Windows", icon: Monitor, version: "V1R4", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "IOS-STIG", name: "Apple iOS/iPadOS 17 STIG", platform: "iOS", icon: Smartphone, version: "V1R1", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "ANDROID-STIG", name: "Android 14 STIG", platform: "Android", icon: Smartphone, version: "V1R1", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "WIN2022-STIG", name: "Windows Server 2022 STIG", platform: "Windows Server", icon: Server, version: "V2R2", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "NIST-800-53", name: "NIST SP 800-53 Rev 5", platform: "All", icon: ShieldCheck, version: "Rev5", source: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final" },
  { id: "MOBILE-AWARE", name: "Mobile Device Security Awareness", platform: "Mobile", icon: Smartphone, version: "DoD", source: "https://public.cyber.mil/stigs/downloads/" },
  { id: "SCAP-1.3", name: "SCAP 1.3 Content Baseline", platform: "Multi-Platform", icon: ShieldCheck, version: "1.3", source: "https://csrc.nist.gov/projects/security-content-automation-protocol" },
];

const CAT_COLORS = {
  "CAT I": "text-red-400 bg-red-400/10 border-red-400/20",
  "CAT II": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "CAT III": "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

export default function ScapStigPanel({ onAddFeed }) {
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async (preset) => {
    setSelected(preset);
    setAnalysis(null);
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a DoD STIG/SCAP compliance expert. Provide a concise compliance summary for: ${preset.name} (${preset.id}, ${preset.version}).

Include:
1. overview: 1-2 sentence description of what this STIG/benchmark covers
2. top_findings: 3 most common CAT I or CAT II findings with their Vuln ID and short description
3. key_controls: 4 critical controls organizations must implement
4. mobile_notes: (only if platform is iOS/Android/Mobile) - mobile-specific security awareness tips
5. severity_distribution: estimated typical distribution { cat1: number, cat2: number, cat3: number }
6. recommended_tools: 2-3 tools/methods to run SCAP scans for this benchmark`,
        response_json_schema: {
          type: "object",
          properties: {
            overview: { type: "string" },
            top_findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vuln_id: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            key_controls: { type: "array", items: { type: "string" } },
            mobile_notes: { type: "array", items: { type: "string" } },
            severity_distribution: {
              type: "object",
              properties: {
                cat1: { type: "number" },
                cat2: { type: "number" },
                cat3: { type: "number" }
              }
            },
            recommended_tools: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = () => {
    if (!selected) return;
    onAddFeed({
      name: selected.name,
      feed_type: selected.platform.toLowerCase().includes("ios") || selected.platform.toLowerCase().includes("android") || selected.platform === "Mobile" ? "mobile_security" : "scap_stig",
      source_url: selected.source,
      confidence_level: "high",
      refresh_interval: "24hr",
      description: analysis?.overview || `${selected.name} compliance feed`,
      scap_benchmark_id: selected.id,
      stig_version: selected.version,
      platform: selected.platform,
      status: "active"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-[#00d4ff]" />
        <h3 className="text-sm font-semibold text-white">SCAP / STIG & Mobile Security Feeds</h3>
        <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 text-[10px]">DoD/NIST</Badge>
      </div>
      <p className="text-xs text-gray-500">Select a benchmark to load compliance intelligence and add it as a monitored feed.</p>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-2">
        {STIG_PRESETS.map(preset => {
          const Icon = preset.icon;
          const isSelected = selected?.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => analyze(preset)}
              className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-[#00d4ff]/40 bg-[#00d4ff]/5"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[#00d4ff]" : "text-gray-500"}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{preset.name}</p>
                <p className="text-[10px] text-gray-500">{preset.platform} · {preset.version}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Analysis Panel */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[#00d4ff] py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing {selected?.name}...
        </div>
      )}

      {analysis && selected && !loading && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-4">
          {/* Overview */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Overview</p>
            <p className="text-xs text-gray-300">{analysis.overview}</p>
          </div>

          {/* Severity Distribution */}
          {analysis.severity_distribution && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Typical Finding Distribution</p>
              <div className="flex gap-2">
                {[["CAT I", analysis.severity_distribution.cat1], ["CAT II", analysis.severity_distribution.cat2], ["CAT III", analysis.severity_distribution.cat3]].map(([cat, count]) => (
                  <div key={cat} className={`flex-1 rounded-lg border px-2 py-1.5 text-center ${CAT_COLORS[cat]}`}>
                    <p className="text-xs font-bold">{count}</p>
                    <p className="text-[10px]">{cat}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Findings */}
          {analysis.top_findings?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Common Findings</p>
              <div className="space-y-1.5">
                {analysis.top_findings.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 mr-1.5">{f.vuln_id}</span>
                      <span className="text-xs text-gray-300">{f.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Controls */}
          {analysis.key_controls?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Key Controls</p>
              <ul className="space-y-1">
                {analysis.key_controls.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-[#2ed573] shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile Notes */}
          {analysis.mobile_notes?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Mobile Security Awareness
              </p>
              <ul className="space-y-1">
                {analysis.mobile_notes.map((n, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-gray-300">
                    <Info className="w-3 h-3 text-[#00d4ff] shrink-0 mt-0.5" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Tools */}
          {analysis.recommended_tools?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Recommended SCAP Scan Tools</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.recommended_tools.map((t, i) => (
                  <span key={i} className="text-[10px] bg-white/5 text-gray-400 rounded-full px-2 py-0.5 border border-white/5">{t}</span>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleAddFeed} className="w-full bg-[#00d4ff] text-black hover:bg-[#00bfe6] h-8 text-xs mt-2">
            + Add as Monitored Feed
          </Button>
        </div>
      )}
    </div>
  );
}