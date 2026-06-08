import React from "react";
import { Shield, Globe2, Radio, Zap, Satellite, GitBranch, Eye, EyeOff, PlaneTakeoff } from "lucide-react";

const LAYERS = [
  { key: "cyber",        label: "CYBER",     color: "#00e5ff", icon: Shield },
  { key: "geopolitical", label: "GEO/KIN",   color: "#ff1744", icon: Globe2 },
  { key: "influence",    label: "EW/INFO",   color: "#d500f9", icon: Radio },
  { key: "hybrid",       label: "HYBRID",    color: "#ff9100", icon: Zap },
  { key: "physical",     label: "PHYS",      color: "#ff5252", icon: Satellite },
  { key: "arcs",         label: "TRAJ",      color: "#00e676", icon: GitBranch },
  { key: "satellites",   label: "SAT/ORB",   color: "#00e5ff", icon: Satellite },
  { key: "flights",      label: "FLIGHTS",   color: "#ffa502", icon: PlaneTakeoff },
];

export default function LayerControls({ layers, setLayers }) {
  const toggle = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {LAYERS.map(l => {
        const Icon = l.icon;
        const on = layers[l.key] !== false;
        return (
          <button
            key={l.key}
            onClick={() => toggle(l.key)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-sm text-[10px] font-mono font-bold tracking-widest transition-all w-full text-left ${
              on ? "text-white bg-white/5" : "text-gray-700 bg-transparent"
            }`}
            style={on ? { borderLeft: `2px solid ${l.color}`, paddingLeft: "6px" } : { borderLeft: "2px solid transparent", paddingLeft: "6px" }}
          >
            <Icon className="w-3 h-3 shrink-0" style={{ color: on ? l.color : "#374151" }} />
            <span className="flex-1">{l.label}</span>
            {on
              ? <Eye className="w-2.5 h-2.5" style={{ color: l.color }} />
              : <EyeOff className="w-2.5 h-2.5 text-gray-700" />
            }
          </button>
        );
      })}
    </div>
  );
}