import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Server, CheckCircle2, AlertTriangle } from "lucide-react";

export default function VulnScanLauncher({ onScanComplete }) {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [scanType, setScanType] = useState("full");
  const [scanName, setScanName] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("", 100),
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("runVulnerabilityScan", {
        asset_ids: selectedAssets,
        scan_type: scanType,
        scan_name: scanName || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      onScanComplete?.();
    },
  });

  const toggleAsset = (id) =>
    setSelectedAssets(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const selectAll = () => setSelectedAssets(assets.map(a => a.id));
  const clearAll = () => setSelectedAssets([]);

  const CRIT_COLORS = { critical: "border-red-500/30 text-red-300", high: "border-orange-500/30 text-orange-300", medium: "border-yellow-500/30 text-yellow-300", low: "border-blue-500/30 text-blue-300" };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          Configure Vulnerability Scan
        </h3>

        {/* Scan name & type */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Scan Name (optional)</label>
            <input
              type="text"
              value={scanName}
              onChange={e => setScanName(e.target.value)}
              placeholder="e.g. Q1 Full Infrastructure Scan"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Scan Type</label>
            <select
              value={scanType}
              onChange={e => setScanType(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
            >
              <option value="full">Full Scan</option>
              <option value="quick">Quick Scan</option>
              <option value="targeted">Targeted</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>
        </div>

        {/* Asset selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400 font-semibold">
              Target Assets {selectedAssets.length > 0 ? `(${selectedAssets.length} selected)` : "(all assets if none selected)"}
            </label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-cyan-400 hover:text-cyan-300">Select all</button>
              <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-400">Clear</button>
            </div>
          </div>
          {assets.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No assets found — add assets in the Assets page first</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {assets.map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleAsset(a.id)}
                  className={`text-left p-2 rounded-lg border text-xs transition ${
                    selectedAssets.includes(a.id)
                      ? "bg-orange-900/20 border-orange-500/40 text-white"
                      : "bg-slate-800/40 border-slate-700/30 text-gray-400 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Server className="w-3 h-3 shrink-0" />
                    <span className="font-semibold truncate">{a.name}</span>
                  </div>
                  <Badge className={`text-[8px] border ${CRIT_COLORS[a.criticality] || CRIT_COLORS.medium} bg-transparent`}>{a.criticality}</Badge>
                  <span className="text-[9px] text-gray-600 ml-1">{a.asset_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2"
        >
          {scanMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning assets & correlating threat intel…</>
            : <><Zap className="w-4 h-4" /> Launch Vulnerability Scan ({selectedAssets.length || assets.length} assets)</>}
        </Button>
        {scanMutation.isPending && (
          <p className="text-xs text-gray-500 text-center mt-2 animate-pulse">AI-powered assessment in progress — may take 1-2 minutes…</p>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className={`rounded-lg border p-4 ${lastResult.status === 'completed' ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
          <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Scan Complete
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-black text-white">{lastResult.assets_scanned}</p><p className="text-[10px] text-gray-500">Assets Scanned</p></div>
            <div><p className="text-xl font-black text-orange-300">{lastResult.findings}</p><p className="text-[10px] text-gray-500">Findings</p></div>
            <div><p className="text-xl font-black text-red-300">{lastResult.actively_exploited}</p><p className="text-[10px] text-gray-500">Actively Exploited</p></div>
          </div>
          {lastResult.remediation_tasks_created > 0 && (
            <p className="text-xs text-cyan-300 mt-3 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {lastResult.remediation_tasks_created} remediation tasks auto-generated for high-priority findings
            </p>
          )}
          {lastResult.top_findings?.map((f, i) => (
            <div key={i} className="flex items-center gap-2 mt-2 text-xs">
              <Badge className={`text-[8px] shrink-0 ${f.severity === 'critical' ? 'bg-red-900/30 text-red-300 border-red-500/20' : 'bg-orange-900/30 text-orange-300 border-orange-500/20'}`}>{f.severity}</Badge>
              {f.actively_exploited && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
              <span className="text-gray-300 truncate">{f.cve_id ? `${f.cve_id} — ` : ''}{f.title}</span>
              <span className="text-gray-500 shrink-0">CVSS {f.cvss_score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}