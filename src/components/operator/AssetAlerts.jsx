import React from "react";
import { Shield, AlertTriangle, Server } from "lucide-react";

const CRIT_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };

export default function AssetAlerts({ assets, events, userTier }) {
  const atRisk = assets.filter(a => (a.risk_score || 0) >= 60 || a.criticality === "critical");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <span>{atRisk.length} assets at elevated risk</span>
        <span>·</span>
        <span>{assets.filter(a => a.compliance_status === "non_compliant").length} non-compliant</span>
      </div>

      {atRisk.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No high-risk asset alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {atRisk.map((asset, i) => {
            const color = CRIT_COLORS[asset.criticality] || "#6b7280";
            return (
              <div key={asset.id || i}
                className="flex items-center gap-3 p-3 bg-[#0d1117] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
                  <Server className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{asset.name}</p>
                  <p className="text-[9px] text-gray-600">{asset.asset_type?.replace(/_/g, " ")} · {asset.owner || "Unknown owner"}</p>
                </div>
                <div className="text-right shrink-0">
                  {asset.risk_score != null && (
                    <p className="text-sm font-bold font-mono" style={{ color }}>{asset.risk_score}</p>
                  )}
                  <p className="text-[9px] capitalize" style={{ color }}>{asset.criticality}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}