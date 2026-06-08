import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield, Zap } from "lucide-react";

const reliabilityColor = (s) => s >= 70 ? "#2ed573" : s >= 40 ? "#ffa502" : "#ff4757";
const exploitColor = (s) => s >= 70 ? "#ff4757" : s >= 40 ? "#ffa502" : "#2ed573";

const ScoreBar = ({ value, color, width = "100%" }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}60` }} />
    </div>
    <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value}</span>
  </div>
);

export default function AssetScoreTable({ assets = [], assetScores = {} }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-[9px] text-gray-600 uppercase tracking-wider px-3">
        <div className="col-span-3">Asset</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3 flex items-center gap-1"><Shield className="w-2.5 h-2.5" />Reliability</div>
        <div className="col-span-3 flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Exploitation</div>
        <div className="col-span-1">Crit</div>
      </div>
      {assets.map(asset => {
        const scores = assetScores[asset.id] || {
          reliability: asset.reliability_score || 65,
          exploitation: asset.exploitation_score || (asset.criticality === "critical" ? 82 : asset.criticality === "high" ? 61 : 35),
        };
        const relColor = reliabilityColor(scores.reliability);
        const expColor = exploitColor(scores.exploitation);
        return (
          <div key={asset.id} className="bg-black/20 border border-white/5 rounded-lg p-3 grid grid-cols-12 gap-2 items-center hover:border-white/10 transition-colors">
            <div className="col-span-3">
              <p className="text-xs font-medium text-white truncate">{asset.name}</p>
              <p className="text-[9px] text-gray-600">{asset.domain}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[9px] text-gray-500 capitalize">{asset.asset_type?.replace(/_/g, " ")}</span>
            </div>
            <div className="col-span-3">
              <ScoreBar value={scores.reliability} color={relColor} />
            </div>
            <div className="col-span-3">
              <ScoreBar value={scores.exploitation} color={expColor} />
            </div>
            <div className="col-span-1">
              <Badge variant="outline" className={`text-[8px] px-1 ${
                asset.criticality === "critical" ? "text-red-400 border-red-500/20" :
                asset.criticality === "high" ? "text-orange-400 border-orange-500/20" :
                "text-gray-400 border-gray-500/20"
              }`}>{asset.criticality?.[0]?.toUpperCase()}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}