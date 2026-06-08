import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Loader2 } from "lucide-react";

const IOC_TYPES = ["ip_address", "domain", "hash", "url", "email", "cve"];

const SEVERITY_COLORS = {
  critical: "bg-red-900/30 text-red-300 border-red-500/20",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/20",
};

export default function SingleIOCForm({ playbooks, recentIndicators, onSubmit, isLoading }) {
  const [ioc, setIoc] = useState("");
  const [iocType, setIocType] = useState("ip_address");
  const [selectedPlaybooks, setSelectedPlaybooks] = useState([]);

  const togglePlaybook = (id) =>
    setSelectedPlaybooks((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSubmit = () => onSubmit({ ioc, ioc_type: iocType, playbook_ids: selectedPlaybooks });

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          IOC Enrichment & Attack Vector Prediction
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1 font-semibold">IOC Value</label>
            <input
              type="text"
              value={ioc}
              onChange={(e) => setIoc(e.target.value)}
              placeholder="185.220.101.45 · evil.com · sha256:abc123 · CVE-2024-…"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Type</label>
            <select
              value={iocType}
              onChange={(e) => setIocType(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
            >
              {IOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {playbooks.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">Auto-update Playbooks</label>
            <div className="flex flex-wrap gap-2">
              {playbooks.map((pb) => (
                <button
                  key={pb.id}
                  onClick={() => togglePlaybook(pb.id)}
                  className={`text-xs px-2 py-1 rounded border transition ${
                    selectedPlaybooks.includes(pb.id)
                      ? "bg-cyan-900/30 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-800/50 text-gray-400 border-slate-700/30 hover:border-slate-600"
                  }`}
                >
                  {pb.playbook_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!ioc || isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enriching & predicting attack vectors…</> : <><Zap className="w-4 h-4" /> Enrich, Correlate & Predict</>}
        </Button>
      </div>

      {recentIndicators.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Indicators — Quick Enrich</h4>
          <div className="space-y-1">
            {recentIndicators.map((ind) => (
              <button
                key={ind.id}
                onClick={() => { setIoc(ind.value); setIocType(ind.indicator_type); }}
                className="w-full flex items-center gap-3 bg-slate-800/40 hover:bg-slate-800/70 rounded p-2 text-left transition"
              >
                <Badge className="bg-slate-700/30 text-gray-400 border-slate-600/20 text-[8px] shrink-0">{ind.indicator_type}</Badge>
                <span className="text-xs text-gray-300 font-mono truncate">{ind.value}</span>
                <Badge className={`text-[8px] shrink-0 ${SEVERITY_COLORS[ind.severity] || SEVERITY_COLORS.medium}`}>{ind.severity}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}