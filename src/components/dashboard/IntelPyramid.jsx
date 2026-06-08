import React from "react";

const layers = [
  { label: "HUMINT", sublabel: "Human Intelligence", color: "#ff4757", width: "w-24", desc: "Source-driven, subjective intent" },
  { label: "SIGINT", sublabel: "Signals Intelligence", color: "#ffa502", width: "w-36", desc: "Intercepts, comms, electronic signals" },
  { label: "OSINT", sublabel: "Open Source Intelligence", color: "#00d4ff", width: "w-52", desc: "Foundation — public & commercial data" },
];

export default function IntelPyramid({ counts = {} }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Intelligence Pyramid</p>
      {layers.map((layer, i) => (
        <div key={layer.label} className="flex items-center gap-4 w-full max-w-xs">
          <div
            className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-center transition-all cursor-default ${layer.width} mx-auto`}
            style={{
              background: `${layer.color}12`,
              border: `1px solid ${layer.color}30`,
              boxShadow: `0 0 12px ${layer.color}10`,
              width: `${100 - i * 22}%`,
            }}
          >
            <span className="text-[11px] font-bold tracking-widest" style={{ color: layer.color }}>{layer.label}</span>
            <span className="text-[9px] text-gray-500 mt-0.5">{layer.sublabel}</span>
          </div>
        </div>
      ))}
      <div className="mt-3 space-y-1 w-full">
        {layers.slice().reverse().map(l => (
          <div key={l.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-gray-500">{l.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}