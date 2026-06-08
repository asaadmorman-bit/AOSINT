import React from "react";

// Floating HUD panel — glass morphism Palantir style
export default function HUDPanel({ children, className = "", title, accent = "#00e5ff" }) {
  return (
    <div
      className={`bg-[#020509]/90 border border-white/8 rounded-sm backdrop-blur-sm ${className}`}
      style={{ boxShadow: `0 0 20px ${accent}10, inset 0 0 40px rgba(0,0,0,0.5)` }}
    >
      {title && (
        <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-2">
          <div className="w-1 h-3 rounded-full" style={{ background: accent }} />
          <span className="text-[9px] font-black tracking-[0.2em] uppercase font-mono" style={{ color: accent }}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}