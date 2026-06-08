import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Radar, Plus, Trash2, Play, Loader2, CheckCircle2, AlertCircle,
  Cloud, Network, Server, ChevronDown, ChevronUp, Info
} from "lucide-react";

const CLOUD_PRESETS = [
  { id: "aws", label: "AWS", icon: Cloud, color: "text-orange-400" },
  { id: "azure", label: "Azure", icon: Cloud, color: "text-blue-400" },
  { id: "gcp", label: "GCP", icon: Cloud, color: "text-green-400" },
];

const RISK_COLOR = (score) => {
  if (score >= 75) return "bg-red-500/15 text-red-400 border-red-500/30";
  if (score >= 50) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (score >= 25) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
};

export default function AssetDiscoveryModule() {
  const [cidrInputs, setCidrInputs] = useState([""]);
  const [cloudTargets, setCloudTargets] = useState([]);
  const [dryRun, setDryRun] = useState(true);
  const [skipProbe, setSkipProbe] = useState(false);
  const [maxHosts, setMaxHosts] = useState(50);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showAssets, setShowAssets] = useState(true);

  function toggleCloud(id) {
    setCloudTargets(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  }

  function addCidr() { setCidrInputs(c => [...c, ""]); }
  function removeCidr(i) { setCidrInputs(c => c.filter((_, idx) => idx !== i)); }
  function updateCidr(i, val) { setCidrInputs(c => c.map((v, idx) => idx === i ? val : v)); }

  async function runScan() {
    const cidrTargets = cidrInputs.map(s => s.trim()).filter(Boolean);
    const scanTargets = [...cloudTargets, ...cidrTargets];
    if (!scanTargets.length) return;

    setScanning(true);
    setResult(null);

    const res = await base44.functions.invoke("assetDiscoveryScan", {
      scan_targets: scanTargets,
      dry_run: dryRun,
      skip_probe: skipProbe,
      max_hosts: parseInt(maxHosts) || 50,
    });

    setResult(res.data);
    setScanning(false);
  }

  const allTargets = [...cloudTargets, ...cidrInputs.filter(Boolean)];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20">
          <Radar className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div>
          <h2 className="text-white font-bold text-base">Asset Discovery Module</h2>
          <p className="text-gray-500 text-xs">Scan network ranges or cloud environments to auto-populate assets, score risk, and map threat feeds</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Config Panel */}
        <div className="bg-[#111827] border border-white/8 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Scan Configuration</p>

          {/* Cloud presets */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs flex items-center gap-1.5"><Cloud className="w-3 h-3" /> Cloud Provider Ranges</Label>
            <div className="flex gap-2 flex-wrap">
              {CLOUD_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleCloud(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    cloudTargets.includes(p.id)
                      ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"
                  }`}
                >
                  <p.icon className={`w-3 h-3 ${cloudTargets.includes(p.id) ? "text-[#00d4ff]" : p.color}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* CIDR ranges */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs flex items-center gap-1.5"><Network className="w-3 h-3" /> Network Ranges (CIDR)</Label>
            {cidrInputs.map((val, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={val}
                  onChange={e => updateCidr(i, e.target.value)}
                  placeholder="e.g. 10.0.1.0/24"
                  className="bg-[#1a2235] border-white/10 text-white font-mono text-sm placeholder:text-gray-700"
                />
                {cidrInputs.length > 1 && (
                  <button onClick={() => removeCidr(i)} className="text-gray-600 hover:text-red-400 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addCidr} className="text-[#00d4ff] text-xs flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add range
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-sm">Max Hosts to Probe</Label>
              <Input
                type="number"
                value={maxHosts}
                onChange={e => setMaxHosts(e.target.value)}
                className="bg-[#1a2235] border-white/10 text-white w-20 text-sm text-center"
                min={1} max={500}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 text-sm">Dry Run</Label>
                <p className="text-gray-600 text-xs">Discover without saving to database</p>
              </div>
              <Switch checked={dryRun} onCheckedChange={setDryRun} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300 text-sm">Skip Live Probe</Label>
                <p className="text-gray-600 text-xs">Score based on IP intel only (faster)</p>
              </div>
              <Switch checked={skipProbe} onCheckedChange={setSkipProbe} />
            </div>
          </div>

          <Button
            onClick={runScan}
            disabled={scanning || !allTargets.length}
            className="w-full bg-[#00d4ff] hover:bg-[#0099cc] text-black font-bold gap-2"
          >
            {scanning
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
              : <><Play className="w-4 h-4" /> {dryRun ? "Run Dry Scan" : "Launch Discovery Scan"}</>
            }
          </Button>

          {!dryRun && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs text-yellow-400">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Live mode will write discovered assets to the database and map threat feeds.
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-[#111827] border border-white/8 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Scan Results</p>

          {!result && !scanning && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Radar className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Configure targets and run a scan</p>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center justify-center py-12 text-[#00d4ff]">
              <Loader2 className="w-10 h-10 mb-3 animate-spin opacity-60" />
              <p className="text-sm">Probing hosts and enriching intelligence…</p>
              <p className="text-xs text-gray-600 mt-1">This may take up to 60 seconds</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Discovered", val: result.discovered, color: "text-[#00d4ff]" },
                  { label: "Skipped", val: result.skipped_existing, color: "text-gray-400" },
                  { label: "Errors", val: result.errors, color: "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {result.success
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span className="text-sm text-gray-300">
                  {result.dry_run ? "Dry run — " : ""}{result.total_probed} hosts probed · {result.discovered} assets {result.dry_run ? "would be" : ""} added
                </span>
              </div>

              {result.assets?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowAssets(v => !v)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white mb-2"
                  >
                    {showAssets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {result.assets.length} asset{result.assets.length !== 1 ? 's' : ''} found
                  </button>

                  {showAssets && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {result.assets.map((a, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Server className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-xs text-white font-mono truncate">{a.ip}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            <Badge variant="outline" className="text-[10px] text-gray-400 border-white/10">{a.classification}</Badge>
                            <Badge variant="outline" className={`text-[10px] border ${RISK_COLOR(a.risk_score)}`}>
                              Risk {a.risk_score}
                            </Badge>
                            {a.mapped_feeds > 0 && (
                              <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/20 bg-purple-500/10">
                                {a.mapped_feeds} feed{a.mapped_feeds !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {result.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">
                  {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}