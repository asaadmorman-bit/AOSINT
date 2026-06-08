import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Zap, Loader2, RefreshCw, AlertTriangle, Skull,
  Target, TrendingUp, Filter, CheckCircle2, Globe2, Activity
} from "lucide-react";
import ThreatCorrelationMap from "@/components/vulns/ThreatCorrelationMap";
import CVECorrelationCard from "@/components/vulns/CVECorrelationCard";

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };

export default function ThreatIntelCorrelation() {
  const [correlationData, setCorrelationData] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [onlyRansomware, setOnlyRansomware] = useState(false);
  const [onlyActiveExploit, setOnlyActiveExploit] = useState(false);
  const [lastRunAt, setLastRunAt] = useState(null);

  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ["vuln-findings"],
    queryFn: () => base44.entities.VulnerabilityFinding.list("-priority_score", 200),
  });

  // Extract unique CVEs that are open
  const openFindings = useMemo(() =>
    findings.filter(f => f.status === "open" && f.cve_id),
    [findings]
  );

  const cveIds = useMemo(() =>
    [...new Set(openFindings.map(f => f.cve_id))],
    [openFindings]
  );

  const findingByCve = useMemo(() => {
    const map = {};
    openFindings.forEach(f => { if (f.cve_id) map[f.cve_id] = f; });
    return map;
  }, [openFindings]);

  const correlateMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("correlateCVEThreatIntel", { cve_ids: cveIds });
      return res.data;
    },
    onSuccess: (data) => {
      setCorrelationData(data);
      setLastRunAt(new Date());
    },
  });

  // Filtered correlations
  const filteredCorrelations = useMemo(() => {
    if (!correlationData?.correlations) return [];
    let list = [...correlationData.correlations];
    if (severityFilter !== "all") {
      list = list.filter(c => findingByCve[c.cve_id]?.severity === severityFilter);
    }
    if (onlyRansomware) list = list.filter(c => c.ransomware_association);
    if (onlyActiveExploit) list = list.filter(c => findingByCve[c.cve_id]?.actively_exploited);
    list.sort((a, b) => {
      const sa = SEVERITY_ORDER[findingByCve[a.cve_id]?.severity] ?? 99;
      const sb = SEVERITY_ORDER[findingByCve[b.cve_id]?.severity] ?? 99;
      return sa - sb;
    });
    return list;
  }, [correlationData, severityFilter, onlyRansomware, onlyActiveExploit, findingByCve]);

  const summary = correlationData?.summary;
  const ransomwareCves = correlationData?.correlations?.filter(c => c.ransomware_association).length || 0;
  const actorSet = new Set(correlationData?.correlations?.flatMap(c => (c.threat_actors || []).map(a => a.name)) || []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold text-white">Threat Intel Correlation</h1>
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">LIVE</Badge>
          </div>
          <p className="text-xs text-gray-500">
            Correlating <span className="text-white font-semibold">{cveIds.length} CVEs</span> in your environment against global threat intelligence feeds, exploit kits &amp; threat actor activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRunAt && (
            <span className="text-[10px] text-gray-500">
              Last run: {lastRunAt.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={() => correlateMutation.mutate()}
            disabled={correlateMutation.isPending || cveIds.length === 0}
            className="bg-cyan-700 hover:bg-cyan-600 gap-2"
          >
            {correlateMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Correlating…</>
              : <><Zap className="w-4 h-4" />Run Correlation</>}
          </Button>
        </div>
      </div>

      {/* CVE scope summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-white">{cveIds.length}</p>
          <p className="text-[10px] text-gray-500">CVEs in Scope</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-red-400">{actorSet.size}</p>
          <p className="text-[10px] text-gray-500">Threat Actors</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-orange-400">{summary?.total_exploit_kits || 0}</p>
          <p className="text-[10px] text-gray-500">Exploit Kits</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${ransomwareCves > 0 ? "bg-red-950/20 border-red-500/20" : "bg-slate-900/60 border-white/5"}`}>
          <p className={`text-xl font-black ${ransomwareCves > 0 ? "text-red-400" : "text-gray-500"}`}>{ransomwareCves}</p>
          <p className="text-[10px] text-gray-500">Ransomware-Linked CVEs</p>
        </div>
      </div>

      {/* Top risk banner */}
      {summary?.most_dangerous_cve && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="text-xs font-bold text-red-300">Highest Risk: </span>
            <span className="text-xs text-white font-mono">{summary.most_dangerous_cve}</span>
            {summary.top_targeting_country && (
              <span className="text-xs text-gray-500 ml-2">— primary threat origin: {summary.top_targeting_country}</span>
            )}
          </div>
          {summary.overall_risk_level && (
            <Badge className="ml-auto shrink-0 bg-red-900/30 text-red-300 border-red-500/30">{summary.overall_risk_level}</Badge>
          )}
        </div>
      )}

      {/* Empty / loading state */}
      {loadingFindings && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {!loadingFindings && cveIds.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-white/5 rounded-xl">
          <Shield className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No open CVEs found</p>
          <p className="text-gray-600 text-sm mt-1">Run a vulnerability scan first to populate CVE data.</p>
        </div>
      )}

      {!correlateMutation.isPending && !correlationData && cveIds.length > 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-white/5 rounded-xl">
          <Globe2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold">Ready to correlate {cveIds.length} CVEs</p>
          <p className="text-gray-600 text-sm mt-1 mb-4">Click "Run Correlation" to map your vulnerabilities against live threat actor activity, exploit kits, and global campaigns.</p>
          <Button onClick={() => correlateMutation.mutate()} className="bg-cyan-700 hover:bg-cyan-600 gap-2">
            <Zap className="w-4 h-4" />
            Run Threat Intel Correlation
          </Button>
        </div>
      )}

      {correlateMutation.isPending && (
        <div className="text-center py-16 bg-slate-900/40 border border-cyan-500/10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-cyan-300 font-semibold">Correlating against global threat intel feeds…</p>
          <p className="text-gray-600 text-sm mt-1">Querying exploit databases, APT reports, ransomware trackers, and MITRE ATT&CK…</p>
        </div>
      )}

      {correlationData && !correlateMutation.isPending && (
        <>
          {/* Visualization maps */}
          <ThreatCorrelationMap correlations={correlationData.correlations || []} findings={openFindings} />

          {/* Per-CVE cards */}
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-500">Filter:</span>
              {["all", "critical", "high", "medium", "low"].map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    severityFilter === sev
                      ? "bg-cyan-700/30 border-cyan-500/40 text-cyan-300"
                      : "bg-slate-800/40 border-white/5 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setOnlyRansomware(o => !o)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  onlyRansomware
                    ? "bg-red-900/20 border-red-500/30 text-red-300"
                    : "bg-slate-800/40 border-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                <AlertTriangle className="w-3 h-3" /> Ransomware Only
              </button>
              <button
                onClick={() => setOnlyActiveExploit(o => !o)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                  onlyActiveExploit
                    ? "bg-orange-900/20 border-orange-500/30 text-orange-300"
                    : "bg-slate-800/40 border-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                <Activity className="w-3 h-3" /> Active Exploits Only
              </button>
              <span className="ml-auto text-[10px] text-gray-600">{filteredCorrelations.length} CVEs shown</span>
            </div>

            {filteredCorrelations.map((corr, i) => (
              <CVECorrelationCard
                key={corr.cve_id || i}
                correlation={corr}
                finding={findingByCve[corr.cve_id]}
              />
            ))}

            {filteredCorrelations.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                No CVEs match the current filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}