import React from "react";

/**
 * DisplayModeShader — full-screen CSS overlay that simulates
 * NVG (night vision), FLIR (thermal), CRT scan-lines, or God Mode.
 * Rendered via pointer-events:none so it never blocks map interaction.
 */
export default function DisplayModeShader({ mode }) {
  if (mode === "normal") return null;

  const shaders = {
    nvg: (
      <div className="fixed inset-0 pointer-events-none z-[900]" style={{ mixBlendMode: "multiply" }}>
        {/* Green phosphor tint */}
        <div className="absolute inset-0" style={{ background: "rgba(0,40,0,0.45)" }} />
        {/* Green vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,20,0,0.7) 100%)"
        }} />
        {/* Scanlines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,80,0.03) 2px, rgba(0,255,80,0.03) 4px)",
          backgroundSize: "100% 4px"
        }} />
        {/* NVG noise grain */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "150px 150px"
        }} />
        {/* Corner HUD label */}
        <div className="absolute top-16 right-4 text-[10px] font-mono font-black tracking-[0.2em]" style={{ color: "#00ff44", textShadow: "0 0 8px #00ff44" }}>
          NVG · AN/PVS-14 · GEN III
        </div>
      </div>
    ),

    flir: (
      <div className="fixed inset-0 pointer-events-none z-[900]">
        {/* Thermal orange/red wash */}
        <div className="absolute inset-0" style={{ background: "rgba(40,10,0,0.5)", mixBlendMode: "multiply" }} />
        {/* Thermal gradient */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, rgba(255,80,0,0.08) 0%, rgba(40,0,0,0.5) 100%)",
          mixBlendMode: "screen"
        }} />
        {/* Targeting reticle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-32 h-32 opacity-30">
            <div className="absolute inset-0 border border-orange-500/50 rounded-full" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-orange-500/40" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-orange-500/40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-4 border-t-2 border-orange-400/60" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-4 border-b-2 border-orange-400/60" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-4 border-l-2 border-orange-400/60" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-4 border-r-2 border-orange-400/60" />
          </div>
        </div>
        {/* Scan lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,100,0,0.02) 3px, rgba(255,100,0,0.02) 6px)",
        }} />
        <div className="absolute top-16 right-4 text-[10px] font-mono font-black tracking-[0.2em]" style={{ color: "#ff6600", textShadow: "0 0 8px #ff6600" }}>
          FLIR · THERMAL · 8–14µm
        </div>
        <div className="absolute bottom-20 right-4 text-[9px] font-mono" style={{ color: "#ff4400" }}>
          ● REC  TEMP RANGE: -20°C / +550°C
        </div>
      </div>
    ),

    crt: (
      <div className="fixed inset-0 pointer-events-none z-[900]">
        {/* CRT scan-lines — denser */}
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.25) 1px, rgba(0,0,0,0.25) 2px)",
          backgroundSize: "100% 2px"
        }} />
        {/* Moving bright scanline */}
        <div className="absolute inset-x-0 h-1 opacity-20" style={{
          background: "linear-gradient(transparent, rgba(0,229,255,0.4), transparent)",
          animation: "scanline 4s linear infinite"
        }} />
        {/* Phosphor bloom vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)"
        }} />
        {/* RGB fringe */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          background: "repeating-linear-gradient(90deg, rgba(255,0,0,0.3), rgba(0,255,0,0.3) 1px, rgba(0,0,255,0.3) 2px)"
        }} />
        <div className="absolute top-16 right-4 text-[10px] font-mono font-black tracking-[0.2em]" style={{ color: "#00e5ff", textShadow: "0 0 12px #00e5ff80" }}>
          CRT · P31 PHOSPHOR · 60Hz
        </div>
      </div>
    ),

    god: (
      <div className="fixed inset-0 pointer-events-none z-[900]">
        {/* Red alert tint */}
        <div className="absolute inset-0" style={{ background: "rgba(30,0,0,0.35)" }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(80,0,0,0.5) 100%)"
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(rgba(255,23,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,23,68,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Scan line */}
        <div className="absolute inset-x-0 h-px opacity-10" style={{
          background: "linear-gradient(transparent, rgba(255,23,68,0.8), transparent)",
          animation: "scanline 6s linear infinite"
        }} />
        <div className="absolute top-16 right-4 text-[10px] font-mono font-black tracking-[0.2em]" style={{ color: "#ff1744", textShadow: "0 0 10px #ff1744" }}>
          ⚠ GOD MODE · PANOPTIC VIEW ACTIVE
        </div>
        <div className="absolute bottom-20 right-4 text-[9px] font-mono" style={{ color: "#ff4444" }}>
          ALL SENSORS FUSED · DETECTION OVERLAYS ON
        </div>
      </div>
    ),
  };

  return shaders[mode] || null;
}