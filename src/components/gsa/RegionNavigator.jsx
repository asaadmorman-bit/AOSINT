import React, { useState } from "react";
import { MapPin, Search, Navigation, X } from "lucide-react";

const QUICK_REGIONS = [
  { label: "Middle East", lat: 32.0, lng: 42.0, zoom: 5 },
  { label: "Ukraine", lat: 49.0, lng: 32.0, zoom: 6 },
  { label: "South China Sea", lat: 14.0, lng: 115.0, zoom: 5 },
  { label: "Sahel", lat: 15.0, lng: 5.0, zoom: 5 },
  { label: "Korean Peninsula", lat: 37.5, lng: 127.5, zoom: 6 },
  { label: "Taiwan Strait", lat: 24.5, lng: 120.5, zoom: 7 },
  { label: "Horn of Africa", lat: 10.0, lng: 45.0, zoom: 5 },
  { label: "Indo-Pacific", lat: 5.0, lng: 120.0, zoom: 4 },
];

export default function RegionNavigator({ onNavigate, onClose }) {
  const [input, setInput] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [mode, setMode] = useState("region"); // "region" | "coords"

  const handleRegionSearch = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Try to match quick region
    const quick = QUICK_REGIONS.find(r => r.label.toLowerCase().includes(input.toLowerCase()));
    if (quick) {
      onNavigate(quick.lat, quick.lng, quick.zoom);
    } else {
      // Generic: use LLM-enriched approach — just center roughly
      onNavigate(20, 0, 3);
    }
  };

  const handleCoordsGo = (e) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      onNavigate(lat, lng, 7);
    }
  };

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[1200] w-[520px] max-w-[96vw]">
      <div
        className="rounded-sm border border-[#00e5ff]/25 bg-[#020509]/98 shadow-[0_0_40px_rgba(0,229,255,0.15)]"
        style={{ backdropFilter: "blur(20px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="text-[10px] font-black tracking-[0.2em] text-[#00e5ff] uppercase">Navigate Globe</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("region")}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-sm transition-all ${mode === "region" ? "bg-[#00e5ff]/15 text-[#00e5ff]" : "text-gray-600 hover:text-gray-400"}`}
            >
              REGION
            </button>
            <button
              onClick={() => setMode("coords")}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-sm transition-all ${mode === "coords" ? "bg-[#00e5ff]/15 text-[#00e5ff]" : "text-gray-600 hover:text-gray-400"}`}
            >
              LAT/LONG
            </button>
            <button onClick={onClose} className="text-gray-700 hover:text-gray-400 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          {mode === "region" ? (
            <>
              <form onSubmit={handleRegionSearch} className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                  <input
                    autoFocus
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type region name (e.g. Ukraine, Taiwan Strait)..."
                    className="w-full bg-white/3 border border-white/8 rounded-sm pl-7 pr-3 py-1.5 text-[11px] text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#00e5ff]/40 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#00e5ff]/15 border border-[#00e5ff]/25 text-[#00e5ff] text-[10px] font-bold tracking-widest rounded-sm hover:bg-[#00e5ff]/25 transition-all"
                >
                  FLY TO
                </button>
              </form>
              <div className="grid grid-cols-4 gap-1">
                {QUICK_REGIONS.map(r => (
                  <button
                    key={r.label}
                    onClick={() => onNavigate(r.lat, r.lng, r.zoom)}
                    className="text-[9px] font-mono text-gray-500 hover:text-[#00e5ff] hover:bg-[#00e5ff]/8 px-1.5 py-1 rounded-sm border border-white/3 hover:border-[#00e5ff]/20 transition-all text-left truncate"
                  >
                    <MapPin className="w-2.5 h-2.5 inline mr-0.5 opacity-50" />
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleCoordsGo} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-[8px] text-gray-600 font-mono tracking-widest block mb-1">LATITUDE (-90 to 90)</label>
                <input
                  autoFocus
                  value={latInput}
                  onChange={e => setLatInput(e.target.value)}
                  placeholder="e.g. 49.0"
                  className="w-full bg-white/3 border border-white/8 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#00e5ff]/40 font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-[8px] text-gray-600 font-mono tracking-widest block mb-1">LONGITUDE (-180 to 180)</label>
                <input
                  value={lngInput}
                  onChange={e => setLngInput(e.target.value)}
                  placeholder="e.g. 32.0"
                  className="w-full bg-white/3 border border-white/8 rounded-sm px-2.5 py-1.5 text-[11px] text-gray-200 placeholder-gray-700 focus:outline-none focus:border-[#00e5ff]/40 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#00e5ff]/15 border border-[#00e5ff]/25 text-[#00e5ff] text-[10px] font-bold tracking-widest rounded-sm hover:bg-[#00e5ff]/25 transition-all whitespace-nowrap"
              >
                FLY TO
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}