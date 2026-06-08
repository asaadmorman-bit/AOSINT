import React from "react";
import { MITRE_TACTICS } from "./mitreData";

export default function MitreMatrix({ heatmap, onTacticClick, onTechniqueClick, activeTactic, selectedTechnique }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1.5 min-w-max">
        {MITRE_TACTICS.map(tactic => {
          const tacticHits = Object.entries(heatmap)
            .filter(([tid]) => tactic.techniques.some(t => t.id === tid) || tid === tactic.id)
            .reduce((s, [, v]) => s + v, 0);
          const isActive = activeTactic === tactic.id;

          return (
            <div key={tactic.id} className="flex flex-col" style={{ width: 110 }}>
              {/* Tactic header */}
              <button
                onClick={() => onTacticClick(isActive ? null : tactic.id)}
                className="rounded-t px-1.5 py-2 text-center transition-all"
                style={{
                  background: isActive ? tactic.color : `${tactic.color}55`,
                  border: `1px solid ${isActive ? tactic.color : `${tactic.color}40`}`,
                  borderBottom: "none",
                }}
              >
                <div className="text-[9px] font-black text-white uppercase tracking-wider leading-tight mb-0.5">{tactic.name}</div>
                <div className="text-[8px] font-mono text-white/60">{tactic.id}</div>
                {tacticHits > 0 && (
                  <div className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block"
                    style={{ background: tactic.color, color: "#fff" }}>
                    {tacticHits}
                  </div>
                )}
              </button>

              {/* Techniques */}
              <div className="flex flex-col gap-px rounded-b overflow-hidden border border-t-0"
                style={{ borderColor: `${tactic.color}30` }}>
                {tactic.techniques.map(tech => {
                  const hits = heatmap[tech.id] || 0;
                  const isSelected = selectedTechnique?.id === tech.id;
                  return (
                    <button
                      key={tech.id}
                      onClick={() => onTechniqueClick(isSelected ? null : { ...tech, tactic })}
                      className="text-left px-1.5 py-1.5 transition-all hover:opacity-100 relative"
                      style={{
                        background: hits > 0
                          ? `${tactic.color}${Math.min(Math.round((hits / 5) * 220 + 35), 255).toString(16).padStart(2, "0")}`
                          : isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                        borderLeft: isSelected ? `2px solid ${tactic.color}` : "2px solid transparent",
                        opacity: activeTactic && !isActive ? 0.4 : 1,
                      }}
                    >
                      <div className="text-[9px] font-mono text-white/50 mb-px">{tech.id}</div>
                      <div className={`text-[9px] leading-tight ${hits > 0 ? "text-white font-semibold" : "text-gray-500"}`}>
                        {tech.name}
                      </div>
                      {hits > 0 && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black"
                          style={{ background: tactic.color }}>
                          {hits}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}