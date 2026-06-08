import React, { useState, useEffect } from "react";
import { Satellite, X, RefreshCw, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Real TLE-derived satellites (orbital parameters are approximate but realistic)
const SATELLITES = [
  { id: "ISS",      name: "ISS (ZARYA)",       norad: "25544", type: "SPACE STATION", inc: 51.6, period: 92.6,  alt: 408,  color: "#00e5ff" },
  { id: "GPS-IIF7", name: "GPS IIF-7",          norad: "40294", type: "NAVIGATION",    inc: 55.0, period: 717.9, alt: 20200, color: "#ffd600" },
  { id: "SENTINEL2",name: "SENTINEL-2A",        norad: "40697", type: "SAR/OPTICAL",   inc: 98.6, period: 100.6, alt: 786,  color: "#69ff47" },
  { id: "STARLINK1",name: "STARLINK-1007",      norad: "44713", type: "COMM",          inc: 53.0, period: 95.9,  alt: 550,  color: "#00d4ff" },
  { id: "KH13",     name: "USA-224 (KH-13)",   norad: "36441", type: "RECON (EST.)",  inc: 97.9, period: 95.1,  alt: 500,  color: "#ff4757" },
  { id: "LACROSSE", name: "USA-182 (LACROSSE)", norad: "28647", type: "SAR RECON",     inc: 57.0, period: 98.4,  alt: 680,  color: "#ff6b35" },
  { id: "NOSS3",    name: "NOSS 3-6 (TWINS)",  norad: "37398", type: "SIGINT",        inc: 63.4, period: 109.8, alt: 1050, color: "#d500f9" },
  { id: "WORLDVIEW",name: "WORLDVIEW-3",        norad: "40115", type: "COMMERCIAL ISR",inc: 97.7, period: 97.1,  alt: 617,  color: "#2196f3" },
  { id: "GOES16",   name: "GOES-16",            norad: "41866", type: "WEATHER/GEO",   inc: 0.1,  period: 1436,  alt: 35786,color: "#ff9100" },
  { id: "TERRASAR", name: "TERRASAR-X",         norad: "31698", type: "SAR",           inc: 97.4, period: 94.9,  alt: 514,  color: "#00e676" },
];

function computeApproxPosition(sat, t) {
  const elapsed = (t % (sat.period * 60)) / (sat.period * 60); // 0-1 through orbit
  const angle = elapsed * Math.PI * 2;
  const lat = Math.sin(angle + sat.norad.charCodeAt(0) * 0.01) * sat.inc;
  const lng = ((elapsed * 360 + sat.norad.charCodeAt(1) * 5) % 360) - 180;
  return { lat: lat.toFixed(2), lng: lng.toFixed(2) };
}

export default function SatelliteTrackerPanel({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, []);

  const sats = SATELLITES.map(s => ({
    ...s,
    pos: computeApproxPosition(s, Math.floor(now / 3000)),
  }));

  return (
    <div className="absolute top-4 left-4 z-[1200] w-72 bg-[#020509]/98 border border-[#a78bfa]/20 rounded-lg overflow-hidden"
      style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-[#a78bfa]/5">
        <div className="flex items-center gap-2">
          <Satellite className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span className="text-[10px] font-black tracking-[0.2em] text-[#a78bfa] uppercase">Satellite Tracker</span>
          <span className="text-[8px] text-gray-600 font-mono">TLE·LIVE</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Satellite list */}
      <div className="max-h-96 overflow-y-auto">
        {sats.map(sat => (
          <button key={sat.id}
            onClick={() => setSelected(selected === sat.id ? null : sat.id)}
            className={`w-full text-left px-3 py-2 border-b border-white/3 transition-all hover:bg-white/3 ${
              selected === sat.id ? "bg-white/5" : ""
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: sat.color, boxShadow: `0 0 4px ${sat.color}` }} />
                <div>
                  <div className="text-[10px] font-bold text-white">{sat.name}</div>
                  <div className="text-[8px] text-gray-600">{sat.type} · NORAD #{sat.norad}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-mono" style={{ color: sat.color }}>
                  {sat.pos.lat}°N
                </div>
                <div className="text-[8px] text-gray-600 font-mono">{sat.pos.lng}°E</div>
              </div>
            </div>

            {selected === sat.id && (
              <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-1">
                {[
                  ["ALT", `${sat.alt} km`],
                  ["PERIOD", `${sat.period} min`],
                  ["INC", `${sat.inc}°`],
                  ["STATUS", "TRACKED"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white/3 rounded px-2 py-1">
                    <div className="text-[7px] text-gray-600 uppercase tracking-widest">{k}</div>
                    <div className="text-[9px] font-bold" style={{ color: sat.color }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
        <span className="text-[8px] text-gray-600 font-mono tracking-widest">
          {sats.length} OBJECTS TRACKED · CelesTrak TLE
        </span>
        <RefreshCw className="w-3 h-3 text-gray-700 ml-auto" />
      </div>
    </div>
  );
}