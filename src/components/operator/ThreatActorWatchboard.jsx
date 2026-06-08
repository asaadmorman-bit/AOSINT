import React from "react";
import { Users, AlertTriangle } from "lucide-react";

const MOTIVE_COLORS = {
  financial: "#ffa502", espionage: "#a855f7", hacktivism: "#00d4ff",
  terrorism: "#ff4757", state_sponsored: "#ff6b35", criminal: "#ff4757"
};

export default function ThreatActorWatchboard({ actors, events, userTier }) {
  if (actors.length === 0) return (
    <div className="text-center py-16">
      <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">No threat actors being tracked</p>
      <p className="text-gray-600 text-xs mt-1">Add actors in the Threat Actors section</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {actors.map((actor, i) => {
        const color = MOTIVE_COLORS[actor.motivation] || "#6b7280";
        const linked = events.filter(e => e.related_actors?.includes(actor.name)).length;
        return (
          <div key={actor.id || i}
            className="flex items-start gap-3 p-3 bg-[#0d1117] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
              <Users className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-white">{actor.name}</p>
                {actor.nation_state && <span className="text-[9px] text-gray-600">{actor.nation_state}</span>}
                <span className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                  style={{ background: `${color}10`, color }}>{actor.motivation}</span>
              </div>
              {actor.primary_ttps?.length > 0 && (
                <p className="text-[9px] text-gray-600 truncate">{actor.primary_ttps.slice(0, 3).join(" · ")}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              {linked > 0 && (
                <div className="flex items-center gap-1 text-[#ff4757]">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs font-bold font-mono">{linked}</span>
                </div>
              )}
              <p className="text-[9px] text-gray-600 mt-0.5 capitalize">{actor.status || "unknown"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}