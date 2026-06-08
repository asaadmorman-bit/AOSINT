import React from "react";
import { User, Server, AlertTriangle } from "lucide-react";

export default function ExposureSummary({ assets, userTier }) {
  const digital = assets.filter(a => a.domain === "digital" || a.domain === "hybrid");
  const physical = assets.filter(a => a.domain === "physical" || a.domain === "hybrid");
  const highRisk = assets.filter(a => (a.risk_score || 0) >= 70);
  const nonCompliant = assets.filter(a => a.compliance_status === "non_compliant");

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-[#2ed573]" />
        <h3 className="text-sm font-bold text-white">Asset Exposure Overview</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: "Digital Assets", value: digital.length, color: "#00d4ff", icon: Server },
          { label: "Physical Assets", value: physical.length, color: "#ffa502", icon: Server },
          { label: "High Risk", value: highRisk.length, color: "#ff4757", icon: AlertTriangle },
          { label: "Non-Compliant", value: nonCompliant.length, color: "#ff6b35", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-black/30 rounded-xl p-3 flex items-center gap-2">
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <div>
              <p className="text-lg font-bold font-mono text-white">{value}</p>
              <p className="text-[9px] text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Risk distribution bar */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">Risk Distribution</p>
        {[
          { label: "Critical", count: assets.filter(a => a.criticality === "critical").length, color: "#ff4757" },
          { label: "High", count: assets.filter(a => a.criticality === "high").length, color: "#ffa502" },
          { label: "Medium", count: assets.filter(a => a.criticality === "medium").length, color: "#00d4ff" },
          { label: "Low", count: assets.filter(a => a.criticality === "low").length, color: "#2ed573" },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[10px] w-14 text-gray-500">{label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full">
              <div className="h-full rounded-full" style={{ width: assets.length ? `${(count / assets.length) * 100}%` : "0%", background: color }} />
            </div>
            <span className="text-[10px] font-mono w-5 text-right" style={{ color }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}