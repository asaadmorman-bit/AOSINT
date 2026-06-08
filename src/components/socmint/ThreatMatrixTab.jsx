import React from "react";

const TACTIC_COLORS = {
  "Reconnaissance":         "#00d4ff",
  "Resource Development":   "#a855f7",
  "Initial Access":         "#ffa502",
  "Execution":              "#ff6b35",
  "Persistence":            "#ff4757",
  "Privilege Escalation":   "#ff4757",
  "Defense Evasion":        "#ffa502",
  "Command and Control":    "#ff4757",
  "Impact":                 "#ff4757",
};

function Bar({ value, color }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}` }} />
      </div>
      <span className="text-[9px] font-black w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

export default function ThreatMatrixTab({ matrix = [] }) {
  if (!matrix.length) return <div className="text-[10px] text-center py-8" style={{ color: "#3d5c3d" }}>No threat matrix data</div>;

  return (
    <div className="space-y-2">
      {matrix.map((row, i) => {
        const color = TACTIC_COLORS[row.tactic] || "#00ff41";
        return (
          <div key={i} className="p-3 rounded" style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.12)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black tracking-wide" style={{ color }}>{row.tactic}</span>
              <span className="text-[9px] font-black px-2 py-0.5" style={{ color, border: `1px solid ${color}` }}>
                RISK {row.risk_score}
              </span>
            </div>
            <div className="space-y-1 mb-2">
              <div className="flex items-center gap-2 text-[8px]" style={{ color: "#3d5c3d" }}>
                <span className="w-16 shrink-0">LIKELIHOOD</span>
                <Bar value={row.likelihood} color={color} />
              </div>
              <div className="flex items-center gap-2 text-[8px]" style={{ color: "#3d5c3d" }}>
                <span className="w-16 shrink-0">IMPACT</span>
                <Bar value={row.impact} color={color} />
              </div>
            </div>
            {row.notes && <div className="text-[8px] italic mb-1" style={{ color: "#3d5c3d" }}>{row.notes}</div>}
            {row.indicators?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {row.indicators.slice(0,4).map((ind, j) => (
                  <span key={j} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>{ind}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}