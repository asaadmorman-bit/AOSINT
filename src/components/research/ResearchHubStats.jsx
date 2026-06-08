import React from "react";
import { Shield, Network, Bug, Clock, BookOpen } from "lucide-react";

export default function ResearchHubStats({ ttpClusters, convergenceNodes, exposureTrends, timelineEvents, researchTopics }) {
  const stats = [
    { label: "TTP Clusters",       value: ttpClusters.length,      color: "#00d4ff", icon: Shield },
    { label: "Convergence Nodes",  value: convergenceNodes.length, color: "#a855f7", icon: Network },
    { label: "Exposure Trends",    value: exposureTrends.length,   color: "#ffa502", icon: Bug },
    { label: "Timeline Events",    value: timelineEvents.length,   color: "#ff4757", icon: Clock },
    { label: "Research Topics",    value: researchTopics.length,   color: "#2ed573", icon: BookOpen },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {stats.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="bg-[#111827] border border-white/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-none">{value}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}