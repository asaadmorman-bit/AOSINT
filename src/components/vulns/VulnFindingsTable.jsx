import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, ChevronDown, ChevronRight, CheckCircle2, Filter } from "lucide-react";

const SEV_STYLE = {
  critical: "bg-red-900/30 text-red-300 border-red-500/20",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/20",
  informational: "bg-slate-700/30 text-gray-400 border-slate-600/20",
};
const STATUS_STYLE = {
  open: "bg-red-900/20 text-red-300",
  in_remediation: "bg-blue-900/20 text-blue-300",
  remediated: "bg-green-900/20 text-green-300",
  accepted_risk: "bg-slate-700/20 text-gray-400",
  false_positive: "bg-slate-700/20 text-gray-500",
};

export default function VulnFindingsTable({ findings, isLoading, onUpdate }) {
  const [expanded, setExpanded] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [exploitedOnly, setExploitedOnly] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VulnerabilityFinding.update(id, data),
    onSuccess: onUpdate,
  });

  const filtered = findings.filter(f => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (exploitedOnly && !f.actively_exploited) return false;
    return true;
  });

  if (isLoading) return <div className="text-center py-12 text-gray-500 text-sm">Loading findings…</div>;
  if (findings.length === 0) return (
    <div className="text-center py-16 bg-slate-900/30 border border-slate-700/30 rounded-lg">
      <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
      <p className="text-gray-400 text-sm">No vulnerability findings yet</p>
      <p className="text-gray-600 text-xs mt-1">Run a scan to discover vulnerabilities</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-white">
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-white">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_remediation">In Remediation</option>
          <option value="remediated">Remediated</option>
          <option value="accepted_risk">Accepted Risk</option>
        </select>
        <button
          onClick={() => setExploitedOnly(!exploitedOnly)}
          className={`text-xs px-2 py-1 rounded border transition flex items-center gap-1 ${exploitedOnly ? "bg-red-900/20 text-red-300 border-red-500/30" : "bg-slate-800/50 text-gray-400 border-slate-700/30"}`}
        >
          <AlertTriangle className="w-3 h-3" /> Actively Exploited Only
        </button>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} findings</span>
      </div>

      {/* Table */}
      <div className="space-y-1">
        {filtered.map(f => (
          <div key={f.id} className="bg-slate-900/50 border border-slate-700/40 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === f.id ? null : f.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
            >
              <Badge className={`text-[8px] shrink-0 ${SEV_STYLE[f.severity] || SEV_STYLE.medium}`}>{f.severity}</Badge>
              {f.actively_exploited && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" title="Actively exploited in the wild" />}
              {f.threat_intel_match && <Zap className="w-3.5 h-3.5 text-orange-400 shrink-0" title="Matched in threat intel feeds" />}
              <span className="text-xs text-gray-300 font-mono shrink-0">{f.cve_id || '—'}</span>
              <span className="text-xs text-white truncate flex-1">{f.title}</span>
              <span className="text-xs text-gray-500 shrink-0">{f.asset_name}</span>
              <span className="text-xs font-bold text-orange-300 shrink-0">CVSS {f.cvss_score?.toFixed(1)}</span>
              <Badge className={`text-[8px] ${STATUS_STYLE[f.status] || ''} shrink-0`}>{f.status?.replace('_', ' ')}</Badge>
              {expanded === f.id ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
            </button>

            {expanded === f.id && (
              <div className="px-4 pb-4 border-t border-slate-700/40 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">{f.description}</p>
                  {f.affected_software && <p className="text-xs text-gray-500"><span className="text-gray-300">Affected:</span> {f.affected_software} {f.affected_versions}</p>}
                  {f.exploit_available && <p className="text-xs text-orange-300 mt-1"><AlertTriangle className="w-3 h-3 inline mr-1" />Exploit available — {f.exploit_source}</p>}
                  {f.threat_actors_exploiting?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {f.threat_actors_exploiting.map((a, i) => (
                        <Badge key={i} className="bg-orange-900/20 text-orange-300 border-orange-500/20 text-[8px]">{a}</Badge>
                      ))}
                    </div>
                  )}
                  {f.mitre_techniques?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {f.mitre_techniques.map((t, i) => (
                        <Badge key={i} className="bg-purple-900/20 text-purple-300 border-purple-500/20 text-[8px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {f.remediation_guidance && (
                    <div className="bg-slate-800/40 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-green-400 mb-1">Remediation Guidance</p>
                      <p className="text-xs text-gray-300">{f.remediation_guidance}</p>
                      {f.patch_reference && <p className="text-xs text-cyan-400 mt-1">{f.patch_reference}</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {f.status === "open" && (
                      <Button size="sm" className="h-7 text-xs bg-blue-700 hover:bg-blue-600" onClick={() => updateMutation.mutate({ id: f.id, data: { status: "in_remediation" } })}>
                        Mark In Remediation
                      </Button>
                    )}
                    {f.status === "in_remediation" && (
                      <Button size="sm" className="h-7 text-xs bg-green-700 hover:bg-green-600" onClick={() => updateMutation.mutate({ id: f.id, data: { status: "remediated" } })}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Remediated
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={() => updateMutation.mutate({ id: f.id, data: { status: "accepted_risk" } })}>
                      Accept Risk
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}