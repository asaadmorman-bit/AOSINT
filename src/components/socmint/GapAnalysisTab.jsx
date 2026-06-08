import React from "react";

const SEV_COLOR = { CRITICAL: "#ff4757", HIGH: "#ffa502", MEDIUM: "#00d4ff", LOW: "#00ff41" };

export default function GapAnalysisTab({ gaps = [] }) {
  if (!gaps.length) return <div className="text-[10px] text-center py-8" style={{ color: "#3d5c3d" }}>No gap analysis data</div>;

  return (
    <div className="space-y-2">
      {gaps.map((g, i) => {
        const sc = SEV_COLOR[g.severity] || "#ffa502";
        return (
          <div key={i} className="p-3 rounded" style={{ background: "#060f06", border: "1px solid rgba(0,255,65,0.12)" }}>
            <div className="flex items-start justify-between mb-1 gap-2">
              <div>
                <span className="font-black text-[10px] mr-2" style={{ color: "#00ff41" }}>{g.gap_id}</span>
                <span className="font-bold text-[10px]" style={{ color: "#7aad7a" }}>{g.title}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {g.mitre_technique_id && (
                  <span className="text-[8px] px-1.5 py-0.5 font-mono font-black" style={{ color: "#00d4ff", border: "1px solid #00d4ff40" }}>{g.mitre_technique_id}</span>
                )}
                <span className="text-[8px] px-1.5 py-0.5 font-black" style={{ color: sc, border: `1px solid ${sc}` }}>{g.severity}</span>
              </div>
            </div>
            <p className="text-[9px] mb-2 leading-relaxed" style={{ color: "#4a6a4a" }}>{g.description}</p>
            <div className="flex items-start gap-1.5">
              <span className="text-[8px] font-black shrink-0 mt-0.5" style={{ color: "#00ff41" }}>↳ FIX:</span>
              <span className="text-[9px]" style={{ color: "#7aad7a" }}>{g.remediation}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}