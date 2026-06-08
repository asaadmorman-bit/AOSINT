import React from "react";
import { Shield, Globe2, Radio, Zap, Satellite, AlertTriangle } from "lucide-react";

export default function DomainMetricsBar({ events }) {
  const counts = events.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    acc[e.domain] = (acc[e.domain] || 0) + 1;
    return acc;
  }, {});

  const metrics = [
    { label: "CRITICAL", value: counts.critical || 0, color: "#ef4444", pulse: (counts.critical || 0) > 0 },
    { label: "HIGH", value: counts.high || 0, color: "#f97316", pulse: false },
    { label: "MEDIUM", value: counts.medium || 0, color: "#f59e0b", pulse: false },
    { label: "CYBER", value: counts.cyber || 0, color: "#00d4ff", pulse: false },
    { label: "GEO/KINETIC", value: counts.geopolitical || 0, color: "#ef4444", pulse: false },
    { label: "EW/INFLUENCE", value: counts.influence || 0, color: "#a855f7", pulse: false },
    { label: "HYBRID", value: counts.hybrid || 0, color: "#f97316", pulse: false },
    { label: "TOTAL", value: events.length, color: "#00ff88", pulse: false },
  ];

  return (
    <div className="border-b border-white/5 bg-[#060c18]/80 px-4 py-2 flex items-center gap-4 overflow-x-auto">
      {metrics.map(m => (
        <div key={m.label} className="flex items-center gap-1.5 shrink-0">
          {m.pulse && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />
          )}
          <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">{m.label}</span>
          <span className="text-sm font-black font-mono" style={{ color: m.color }}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}