import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle,
  RefreshCw, GitCompare, ChevronDown, ChevronUp
} from "lucide-react";

const SEV_COLOR = {
  critical: "text-red-400 bg-red-900/20 border-red-500/30",
  high: "text-orange-400 bg-orange-900/20 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-900/20 border-yellow-500/30",
  low: "text-blue-400 bg-blue-900/20 border-blue-500/30",
  informational: "text-gray-400 bg-gray-800/20 border-gray-600/30",
};

function SeverityBadge({ severity }) {
  return (
    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${SEV_COLOR[severity] || SEV_COLOR.informational}`}>
      {severity}
    </span>
  );
}

function FindingRow({ finding, tag }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-900/40 hover:bg-slate-800/40 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        {tag}
        <SeverityBadge severity={finding.severity} />
        <span className="flex-1 text-sm text-white truncate">{finding.title}</span>
        {finding.cve_id && <span className="text-[10px] text-cyan-500 font-mono">{finding.cve_id}</span>}
        <span className="text-xs text-gray-500 hidden sm:block">{finding.asset_name || "—"}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-slate-900/20 border-t border-white/5 space-y-1.5 text-xs text-gray-400">
          {finding.description && <p>{finding.description}</p>}
          <div className="flex flex-wrap gap-4 mt-1">
            {finding.cvss_score != null && <span>CVSS: <strong className="text-white">{finding.cvss_score}</strong></span>}
            {finding.priority_score != null && <span>Priority: <strong className="text-white">{finding.priority_score}</strong></span>}
            {finding.actively_exploited && <span className="text-red-400 font-semibold">⚡ Actively Exploited</span>}
            {finding.patch_available && <span className="text-green-400">✓ Patch Available</span>}
            {finding.status && <span>Status: <strong className="text-white">{finding.status}</strong></span>}
          </div>
          {finding.remediation_guidance && (
            <p className="mt-1 text-gray-500"><span className="text-gray-300 font-medium">Remediation:</span> {finding.remediation_guidance}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, color, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/60 hover:bg-slate-800/50 transition-colors"
      >
        <span className={color}>{icon}</span>
        <span className="font-semibold text-sm text-white flex-1 text-left">{title}</span>
        <span className={`text-sm font-bold ${color}`}>{count}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-3 space-y-2 bg-slate-950/30">{children}</div>}
    </div>
  );
}

export default function ScanDeltaReport({ scans, allFindings }) {
  const completedScans = scans.filter(s => s.status === "completed");

  const [baselineId, setBaselineId] = useState("");
  const [latestId, setLatestId] = useState("");

  // Auto-select most recent two on first render
  const defaultLatest = completedScans[0]?.id || "";
  const defaultBaseline = completedScans[1]?.id || "";
  const effectiveLatest = latestId || defaultLatest;
  const effectiveBaseline = baselineId || defaultBaseline;

  const delta = useMemo(() => {
    if (!effectiveBaseline || !effectiveLatest || effectiveBaseline === effectiveLatest) return null;

    const baseFindings = allFindings.filter(f => f.scan_id === effectiveBaseline);
    const latestFindings = allFindings.filter(f => f.scan_id === effectiveLatest);

    // Key findings by cve_id+asset_id, fallback to title+asset_id
    const key = f => (f.cve_id ? `${f.cve_id}::${f.asset_id}` : `${f.title}::${f.asset_id}`);

    const baseMap = new Map(baseFindings.map(f => [key(f), f]));
    const latestMap = new Map(latestFindings.map(f => [key(f), f]));

    const introduced = []; // in latest but not in base
    const remediated = []; // in base (open/in_remediation) but not in latest
    const persisted = [];  // in both, still open in latest
    const regressed = [];  // in base as remediated/accepted but back in latest as open

    for (const [k, lf] of latestMap) {
      const bf = baseMap.get(k);
      if (!bf) {
        introduced.push(lf);
      } else {
        const wasResolved = ["remediated", "false_positive"].includes(bf.status);
        const nowOpen = ["open", "in_remediation"].includes(lf.status);
        if (wasResolved && nowOpen) {
          regressed.push({ finding: lf, previousStatus: bf.status });
        } else if (nowOpen) {
          persisted.push(lf);
        }
      }
    }

    for (const [k, bf] of baseMap) {
      if (!latestMap.has(k) && ["open", "in_remediation"].includes(bf.status)) {
        remediated.push(bf);
      }
    }

    // Sort each group by priority_score desc
    const byPriority = arr => [...arr].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

    return {
      introduced: byPriority(introduced),
      remediated: byPriority(remediated),
      persisted: byPriority(persisted),
      regressed: regressed.sort((a, b) => (b.finding.priority_score || 0) - (a.finding.priority_score || 0)),
      baselineScan: completedScans.find(s => s.id === effectiveBaseline),
      latestScan: completedScans.find(s => s.id === effectiveLatest),
    };
  }, [effectiveBaseline, effectiveLatest, allFindings]);

  if (completedScans.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <GitCompare className="w-10 h-10 text-gray-600 mb-3" />
        <p className="text-gray-400 font-semibold">At least 2 completed scans needed</p>
        <p className="text-gray-600 text-sm mt-1">Run another scan to enable delta comparison.</p>
      </div>
    );
  }

  const fmtDate = id => {
    const s = completedScans.find(x => x.id === id);
    return s?.started_at ? new Date(s.started_at).toLocaleDateString() : "—";
  };

  return (
    <div className="space-y-5">
      {/* Scan selectors */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 border border-white/5 rounded-xl p-4">
        <GitCompare className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs text-gray-400 font-medium">Baseline Scan:</span>
        <Select value={effectiveBaseline} onValueChange={setBaselineId}>
          <SelectTrigger className="w-64 h-8 text-xs bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select baseline" />
          </SelectTrigger>
          <SelectContent>
            {completedScans.map(s => (
              <SelectItem key={s.id} value={s.id} disabled={s.id === effectiveLatest}>
                {s.scan_name} — {s.started_at ? new Date(s.started_at).toLocaleDateString() : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-gray-600">→</span>

        <span className="text-xs text-gray-400 font-medium">Latest Scan:</span>
        <Select value={effectiveLatest} onValueChange={setLatestId}>
          <SelectTrigger className="w-64 h-8 text-xs bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select latest" />
          </SelectTrigger>
          <SelectContent>
            {completedScans.map(s => (
              <SelectItem key={s.id} value={s.id} disabled={s.id === effectiveBaseline}>
                {s.scan_name} — {s.started_at ? new Date(s.started_at).toLocaleDateString() : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!delta ? (
        <div className="text-center py-12 text-gray-500 text-sm">Select two different scans to compare.</div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="New" value={delta.introduced.length} color="text-red-400" bg="bg-red-900/10 border-red-500/20" icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard label="Remediated" value={delta.remediated.length} color="text-green-400" bg="bg-green-900/10 border-green-500/20" icon={<ShieldCheck className="w-4 h-4" />} />
            <StatCard label="Persisted" value={delta.persisted.length} color="text-yellow-400" bg="bg-yellow-900/10 border-yellow-500/20" icon={<Minus className="w-4 h-4" />} />
            <StatCard label="Regressed" value={delta.regressed.length} color="text-orange-400" bg="bg-orange-900/10 border-orange-500/20" icon={<RefreshCw className="w-4 h-4" />} />
          </div>

          {/* Sections */}
          <Section
            icon={<TrendingUp className="w-4 h-4" />}
            title="Newly Introduced Vulnerabilities"
            color="text-red-400"
            count={delta.introduced.length}
            defaultOpen={true}
          >
            {delta.introduced.length === 0
              ? <p className="text-center text-gray-600 text-sm py-4">None — clean delta!</p>
              : delta.introduced.map(f => (
                <FindingRow key={f.id} finding={f} tag={
                  <span className="text-[9px] font-bold bg-red-900/30 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded shrink-0">NEW</span>
                } />
              ))
            }
          </Section>

          <Section
            icon={<AlertTriangle className="w-4 h-4" />}
            title="Regressed Vulnerabilities"
            color="text-orange-400"
            count={delta.regressed.length}
            defaultOpen={delta.regressed.length > 0}
          >
            {delta.regressed.length === 0
              ? <p className="text-center text-gray-600 text-sm py-4">No regressions detected.</p>
              : delta.regressed.map(({ finding, previousStatus }) => (
                <FindingRow key={finding.id} finding={finding} tag={
                  <span className="text-[9px] font-bold bg-orange-900/30 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded shrink-0">
                    REGRESSED
                  </span>
                } />
              ))
            }
          </Section>

          <Section
            icon={<Minus className="w-4 h-4" />}
            title="Persisting Vulnerabilities"
            color="text-yellow-400"
            count={delta.persisted.length}
          >
            {delta.persisted.length === 0
              ? <p className="text-center text-gray-600 text-sm py-4">All prior findings resolved!</p>
              : delta.persisted.map(f => (
                <FindingRow key={f.id} finding={f} tag={
                  <span className="text-[9px] font-bold bg-yellow-900/30 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded shrink-0">OPEN</span>
                } />
              ))
            }
          </Section>

          <Section
            icon={<ShieldCheck className="w-4 h-4" />}
            title="Remediated Since Baseline"
            color="text-green-400"
            count={delta.remediated.length}
          >
            {delta.remediated.length === 0
              ? <p className="text-center text-gray-600 text-sm py-4">No remediations detected yet.</p>
              : delta.remediated.map(f => (
                <FindingRow key={f.id} finding={f} tag={
                  <span className="text-[9px] font-bold bg-green-900/30 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded shrink-0">FIXED</span>
                } />
              ))
            }
          </Section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 border ${bg}`}>
      <span className={color}>{icon}</span>
      <div>
        <p className={`text-xl font-black ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
    </div>
  );
}