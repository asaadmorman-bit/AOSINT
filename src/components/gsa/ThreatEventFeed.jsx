import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Shield, Globe2, Radio, Zap, Satellite, Activity, ChevronDown, ChevronUp } from "lucide-react";

const SEV_COLORS = {
  critical: "#ff1744",
  high: "#ff6d00",
  medium: "#ffd600",
  low: "#00b0ff",
  informational: "#546e7a",
};

const DOMAIN_ICON = {
  cyber: Shield,
  geopolitical: Globe2,
  influence: Radio,
  hybrid: Zap,
  physical: Satellite,
};

export default function ThreatEventFeed({ events, onSelect, selected }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(true);

  const sorted = [...events]
    .sort((a, b) => {
      const o = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
      return (o[a.severity] ?? 5) - (o[b.severity] ?? 5);
    })
    .filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-[#00e5ff]" />
          <span className="text-[9px] font-black tracking-[0.2em] text-[#00e5ff] uppercase font-mono">Live Feed</span>
          <span className="text-[9px] font-mono text-gray-600">{events.length}</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-gray-300 p-0.5">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="px-2 py-1.5 border-b border-white/5 shrink-0">
            <input
              className="w-full bg-white/3 border border-white/6 rounded-sm px-2 py-1 text-[10px] text-gray-400 placeholder-gray-700 outline-none focus:border-[#00e5ff]/30 font-mono"
              placeholder="FILTER EVENTS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {sorted.map(ev => {
              const Icon = DOMAIN_ICON[ev.domain] || Activity;
              const isSelected = selected?.id === ev.id;
              const sevColor = SEV_COLORS[ev.severity] || "#546e7a";
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelect(ev)}
                  className={`w-full text-left px-3 py-2 border-b border-white/3 transition-all group ${
                    isSelected ? "bg-white/5" : "hover:bg-white/3"
                  }`}
                  style={isSelected ? { borderLeft: `2px solid ${sevColor}` } : {}}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: sevColor, boxShadow: `0 0 4px ${sevColor}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[8px] font-black font-mono uppercase tracking-widest"
                          style={{ color: sevColor }}>{ev.severity}</span>
                        <span className="text-[8px] text-gray-700 font-mono uppercase">·{ev.domain}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-medium leading-tight truncate">{ev.title}</p>
                      <p className="text-[9px] text-gray-700 mt-0.5 font-mono">
                        {ev.timestamp ? formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true }) : "—"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            {sorted.length === 0 && (
              <div className="p-4 text-center text-gray-700 text-[10px] font-mono">NO EVENTS</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}