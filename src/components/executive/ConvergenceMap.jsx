import React from "react";
import { Layers, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DOMAIN_COLORS = {
  cyber: "#00d4ff", physical: "#ffa502", influence: "#a855f7",
  hybrid: "#ff4757", geopolitical: "#f59e0b"
};

export default function ConvergenceMap({ convergence, events, userTier }) {
  const highConfidence = convergence.filter(c => (c.convergence_score || 0) >= 60).slice(0, 8);

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#a855f7]" />
          <h3 className="text-sm font-bold text-white">Threat Convergence Map</h3>
        </div>
        <Link to={createPageUrl("ResearchHub")} className="text-[10px] text-gray-500 hover:text-[#a855f7] flex items-center gap-1">
          Deep Analysis <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Domain overlap visual */}
      <div className="flex items-center justify-center my-4">
        <div className="relative w-48 h-48">
          {["cyber", "physical", "influence"].map((d, i) => {
            const offsets = [
              { top: "10%", left: "20%" },
              { top: "10%", right: "20%" },
              { bottom: "5%", left: "50%", transform: "translateX(-50%)" },
            ];
            return (
              <div key={d} className="absolute w-28 h-28 rounded-full opacity-20 mix-blend-screen"
                style={{ background: DOMAIN_COLORS[d], ...offsets[i] }} />
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-white">{highConfidence.length}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">Convergence<br/>Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top convergence nodes */}
      <div className="space-y-2">
        {highConfidence.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No high-confidence convergence nodes detected</p>
        )}
        {highConfidence.map((node, i) => {
          const score = node.convergence_score || 0;
          const scoreColor = score >= 80 ? "#ff4757" : score >= 60 ? "#ffa502" : "#2ed573";
          return (
            <div key={node.id || i} className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl border border-white/5">
              <div className="w-8 h-1.5 rounded-full bg-white/5 flex-shrink-0">
                <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{node.title}</p>
                <p className="text-[9px] text-gray-600 capitalize">{node.convergence_type?.replace(/_/g, " ")}</p>
              </div>
              <span className="text-xs font-bold font-mono shrink-0" style={{ color: scoreColor }}>{score.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}