import React from "react";
import { ShieldAlert, TrendingUp } from "lucide-react";

export default function RansomwarePanel({ ransomware, userTier }) {
  const active = ransomware.filter(r => r.status === "active");
  const raas = active.filter(r => r.raas_model);

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#ff6b35]" />
          <h3 className="text-sm font-bold text-white">Ransomware & Crimeware Evolution</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-500">{active.length} active</span>
          <span className="text-[#ff6b35]">{raas.length} RaaS</span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-xs">No active ransomware variants tracked</p>
          <p className="text-gray-700 text-[10px] mt-1">Add variants in the Ransomware Tracker</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.slice(0, 6).map((r, i) => (
            <div key={r.id || i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-[#ff6b35] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white">{r.variant_name}</p>
                  {r.raas_model && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#ff6b35]/15 text-[#ff6b35] font-bold">RaaS</span>}
                </div>
                {r.target_sectors?.length > 0 && (
                  <p className="text-[9px] text-gray-600 truncate">{r.target_sectors.slice(0, 3).join(" · ")}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {r.known_victims_count > 0 && (
                  <p className="text-xs font-bold font-mono text-[#ff4757]">{r.known_victims_count}</p>
                )}
                {r.avg_ransom_usd > 0 && (
                  <p className="text-[9px] text-gray-600">${(r.avg_ransom_usd / 1000).toFixed(0)}k avg</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-black/30 rounded-lg p-2">
          <p className="text-lg font-bold font-mono text-[#ff6b35]">{active.length}</p>
          <p className="text-[9px] text-gray-600">Active Variants</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <p className="text-lg font-bold font-mono text-[#ff4757]">{raas.length}</p>
          <p className="text-[9px] text-gray-600">RaaS Models</p>
        </div>
        <div className="bg-black/30 rounded-lg p-2">
          <p className="text-lg font-bold font-mono text-white">{active.reduce((s, r) => s + (r.known_victims_count || 0), 0)}</p>
          <p className="text-[9px] text-gray-600">Known Victims</p>
        </div>
      </div>
    </div>
  );
}