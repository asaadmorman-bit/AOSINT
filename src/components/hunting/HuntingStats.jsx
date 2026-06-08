import React from "react";
import { Crosshair, AlertTriangle, CheckCircle2, Search, Brain } from "lucide-react";

export default function HuntingStats({ tickets }) {
  const total = tickets.length;
  const open = tickets.filter(t => t.status === "open").length;
  const critical = tickets.filter(t => t.severity === "critical").length;
  const confirmed = tickets.filter(t => t.status === "confirmed").length;
  const resolved = tickets.filter(t => t.status === "resolved").length;
  const avgConfidence = total > 0
    ? Math.round(tickets.reduce((sum, t) => sum + (t.confidence || 0), 0) / total)
    : 0;

  const stats = [
    { label: "Total Findings", value: total, icon: Crosshair, color: "#00d4ff" },
    { label: "Open", value: open, icon: Search, color: "#ffa502" },
    { label: "Critical", value: critical, icon: AlertTriangle, color: "#ff4757" },
    { label: "Confirmed Threats", value: confirmed, icon: Brain, color: "#a855f7" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "#2ed573" },
    { label: "Avg AI Confidence", value: `${avgConfidence}%`, icon: Brain, color: "#00d4ff" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={i}
            className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: `${s.color}15` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <p className="text-lg font-black text-white">{s.value}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}