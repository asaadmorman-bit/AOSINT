import React from "react";

const SEV_CONFIG = [
  { key: "critical", label: "CRIT", color: "#ff1744", glow: "rgba(255,23,68,0.4)" },
  { key: "high",     label: "HIGH", color: "#ff6d00", glow: "rgba(255,109,0,0.3)" },
  { key: "medium",   label: "MED",  color: "#ffd600", glow: "rgba(255,214,0,0.3)" },
  { key: "low",      label: "LOW",  color: "#00b0ff", glow: "rgba(0,176,255,0.3)" },
];

const DOMAIN_CONFIG = [
  { key: "cyber",        label: "CYBER",   color: "#00e5ff" },
  { key: "geopolitical", label: "GEO",     color: "#ff1744" },
  { key: "influence",    label: "INFO",    color: "#d500f9" },
  { key: "hybrid",       label: "HYBRID",  color: "#ff9100" },
  { key: "physical",     label: "PHYS",    color: "#ff5252" },
];

export default function ThreatCounters({ events }) {
  const bySev = SEV_CONFIG.reduce((acc, s) => {
    acc[s.key] = events.filter(e => e.severity === s.key).length;
    return acc;
  }, {});

  const byDomain = DOMAIN_CONFIG.reduce((acc, d) => {
    acc[d.key] = events.filter(e => e.domain === d.key).length;
    return acc;
  }, {});

  const total = events.length;
  const critPct = total > 0 ? Math.round((bySev.critical / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 font-mono">
      {/* Total */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-[22px] font-black text-white leading-none tabular-nums">{total}</span>
        <span className="text-[8px] text-gray-600 tracking-widest uppercase">EVENTS</span>
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Severity counters */}
      <div className="flex items-center gap-2">
        {SEV_CONFIG.map(s => (
          <div key={s.key} className="flex flex-col items-center">
            <span
              className="text-[15px] font-black leading-none tabular-nums"
              style={{ color: bySev[s.key] > 0 ? s.color : "#2a3348", textShadow: bySev[s.key] > 0 ? `0 0 8px ${s.glow}` : "none" }}
            >
              {bySev[s.key]}
            </span>
            <span className="text-[7px] tracking-widest uppercase" style={{ color: bySev[s.key] > 0 ? s.color : "#2a3348", opacity: 0.7 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Domain counters */}
      <div className="flex items-center gap-2">
        {DOMAIN_CONFIG.map(d => (
          <div key={d.key} className="flex flex-col items-center">
            <span
              className="text-[13px] font-bold leading-none tabular-nums"
              style={{ color: byDomain[d.key] > 0 ? d.color : "#2a3348" }}
            >
              {byDomain[d.key]}
            </span>
            <span className="text-[7px] tracking-widest uppercase" style={{ color: byDomain[d.key] > 0 ? d.color : "#2a3348", opacity: 0.7 }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      <div className="w-px h-8 bg-white/5" />

      {/* Threat % bar */}
      <div className="flex-1 min-w-[60px]">
        <div className="flex justify-between text-[8px] font-mono text-gray-600 mb-1">
          <span>CRIT RATIO</span>
          <span style={{ color: critPct > 20 ? "#ff1744" : "#4a5568" }}>{critPct}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${critPct}%`,
              background: `linear-gradient(90deg, #ff6d00, #ff1744)`,
              boxShadow: critPct > 0 ? "0 0 6px rgba(255,23,68,0.6)" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}