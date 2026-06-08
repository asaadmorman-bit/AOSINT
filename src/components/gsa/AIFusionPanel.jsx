import React, { useState } from "react";
import { Brain, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Zap, CheckSquare } from "lucide-react";

const THREAT_LEVEL_COLORS = {
  LOW:      { color: "#00e676", bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.25)" },
  MODERATE: { color: "#b2ff59", bg: "rgba(178,255,89,0.08)", border: "rgba(178,255,89,0.25)" },
  ELEVATED: { color: "#ffd600", bg: "rgba(255,214,0,0.08)", border: "rgba(255,214,0,0.25)" },
  HIGH:     { color: "#ff9100", bg: "rgba(255,145,0,0.08)", border: "rgba(255,145,0,0.25)" },
  CRITICAL: { color: "#ff1744", bg: "rgba(255,23,68,0.08)", border: "rgba(255,23,68,0.25)" },
};

export default function AIFusionPanel({ summary, loading, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const tlMeta = summary ? THREAT_LEVEL_COLORS[summary.threat_level] || THREAT_LEVEL_COLORS.MODERATE : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Brain className="w-3 h-3 text-[#00e5ff]" />
          <span className="text-[9px] font-black tracking-[0.2em] text-[#00e5ff] uppercase font-mono">AI Fusion</span>
          {loading && <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onRefresh} disabled={loading}
            className="text-gray-600 hover:text-[#00e5ff] transition-colors p-0.5">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-gray-300 p-0.5">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 280 }}>
          {loading && !summary && (
            <div className="space-y-2">
              {[80, 65, 90, 55].map((w, i) => (
                <div key={i} className="h-1.5 rounded-full bg-white/5 animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {summary && (
            <>
              {/* Threat Level */}
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-gray-600 font-mono uppercase tracking-widest">Threat Level</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
                  style={{ background: tlMeta?.bg, border: `1px solid ${tlMeta?.border}` }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tlMeta?.color }} />
                  <span className="text-[10px] font-black font-mono" style={{ color: tlMeta?.color }}>
                    {summary.threat_level}
                  </span>
                </div>
              </div>

              {/* SITREP */}
              <div>
                <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">SITREP</div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{summary.sitrep}</p>
              </div>

              {/* Priority Threats */}
              {summary.priority_threats?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[8px] text-orange-400 font-mono uppercase tracking-widest mb-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Priority
                  </div>
                  <ul className="space-y-1.5">
                    {summary.priority_threats.map((t, i) => (
                      <li key={i} className="flex gap-2 text-[10px] text-gray-400">
                        <span className="text-orange-400 font-black font-mono shrink-0">{i + 1}.</span>
                        <span className="leading-snug">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {summary.recommended_actions?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[8px] text-[#00e676] font-mono uppercase tracking-widest mb-1">
                    <Zap className="w-2.5 h-2.5" /> Actions
                  </div>
                  <ul className="space-y-1.5">
                    {summary.recommended_actions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[10px] text-gray-400">
                        <CheckSquare className="w-2.5 h-2.5 text-[#00e676] shrink-0 mt-0.5" />
                        <span className="leading-snug">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!loading && !summary && (
            <p className="text-[10px] text-gray-700 italic font-mono">Awaiting intelligence data...</p>
          )}
        </div>
      )}
    </div>
  );
}