import React, { useState, useEffect, useRef } from "react";
import { Radio, Twitter, AlertTriangle, Car, RefreshCw, Filter, Pause, Play } from "lucide-react";

const FEED_SOURCES = [
  { id: "all", label: "All", color: "#00d4ff" },
  { id: "social", label: "Social", color: "#a855f7" },
  { id: "scanner", label: "Scanner", color: "#ff4757" },
  { id: "traffic", label: "Traffic", color: "#ffa502" },
];

const BASE_EVENTS = [
  { type: "social", source: "Twitter / X", msg: "BREAKING: Heavy police presence reported near K Street NW. Multiple units visible. #DCAlerts", sev: "high", tag: "SOCMINT", color: "#a855f7" },
  { type: "scanner", source: "Police Scanner · DC Metro", msg: "Units 14 and 22 respond to disturbance at 1400 block L St NW. Code 3. All units hold traffic.", sev: "critical", tag: "SCANNER", color: "#ff4757" },
  { type: "traffic", source: "Traffic API · WAZE", msg: "INCIDENT: I-395 SB closed at 14th St Bridge — multi-vehicle. Avoid. Alternate via Route 50.", sev: "high", tag: "TRAFFIC", color: "#ffa502" },
  { type: "social", source: "Reddit · r/washingtondc", msg: "Anyone know what's happening near Farragut? Saw like 10 cop cars headed east on I St.", sev: "medium", tag: "SOCMINT", color: "#a855f7" },
  { type: "scanner", source: "Police Scanner · DC Metro", msg: "Dispatch: BOLO issued. White van, no plates, last seen Rhode Island Ave heading northbound.", sev: "high", tag: "SCANNER", color: "#ff4757" },
  { type: "traffic", source: "Traffic API · HERE Maps", msg: "Massachusetts Ave approaching Dupont — 18 min delay due to demonstration. Road partially blocked.", sev: "medium", tag: "TRAFFIC", color: "#ffa502" },
  { type: "social", source: "Telegram · DC Monitor", msg: "Large group forming at McPherson Square — no permit on file. Crowd estimate 200+. Growing.", sev: "medium", tag: "SOCMINT", color: "#a855f7" },
  { type: "scanner", source: "Fire/EMS Scanner", msg: "EMS responding to medical emergency — Embassy Row. Heavy traffic. Avoid 23rd St NW.", sev: "low", tag: "EMS", color: "#00d4ff" },
  { type: "traffic", source: "Traffic API · DDOT", msg: "Construction alert: Pennsylvania Ave NW (1000-1200 block) closed until 1800 hrs today.", sev: "low", tag: "TRAFFIC", color: "#ffa502" },
  { type: "social", source: "Twitter / X", msg: "Hearing police helicopters over Capitol Hill area. Anyone know what's going on? #DC", sev: "medium", tag: "SOCMINT", color: "#a855f7" },
];

const sevColor = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };

let eventIdCounter = BASE_EVENTS.length;

function generateLiveEvent() {
  const templates = [
    { type: "social", source: "Twitter / X", msg: "New social signal detected in monitored area — keyword match on watchlist term.", sev: "medium", tag: "SOCMINT", color: "#a855f7" },
    { type: "scanner", source: "Police Scanner · DC Metro", msg: "Unit dispatched to sector. Stand by for further updates.", sev: "high", tag: "SCANNER", color: "#ff4757" },
    { type: "traffic", source: "Traffic API", msg: "Route condition updated. Re-routing recommended based on current IOC density.", sev: "medium", tag: "TRAFFIC", color: "#ffa502" },
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return { ...t, id: ++eventIdCounter, time: new Date() };
}

export default function LiveDataFeed() {
  const [events, setEvents] = useState(BASE_EVENTS.map((e, i) => ({...e, id: i, time: new Date(Date.now() - (BASE_EVENTS.length - i) * 45000)})));
  const [filter, setFilter] = useState("all");
  const [paused, setPaused] = useState(false);
  const listRef = useRef(null);

  // Simulate live incoming events
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setEvents(prev => [generateLiveEvent(), ...prev].slice(0, 60));
    }, 8000);
    return () => clearInterval(interval);
  }, [paused]);

  const filtered = filter === "all" ? events : events.filter(e => e.type === filter);

  const sourceIcon = (type) => {
    if (type === "social") return <Twitter className="w-3 h-3" />;
    if (type === "scanner") return <Radio className="w-3 h-3" />;
    if (type === "traffic") return <Car className="w-3 h-3" />;
    return <AlertTriangle className="w-3 h-3" />;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00d4ff] animate-pulse" /> Live Intelligence Feed
          </h2>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5">Social media · Police scanner · Traffic APIs · Updating every ~8s</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${paused ? "border-[#ffa502]/30 text-[#ffa502] bg-[#ffa502]/5" : "border-white/10 text-gray-500 hover:text-white hover:border-white/20"}`}
          >
            {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>
        </div>
      </div>

      {/* Source stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Social Signals", val: events.filter(e=>e.type==="social").length, color: "#a855f7", icon: Twitter },
          { label: "Scanner Events", val: events.filter(e=>e.type==="scanner").length, color: "#ff4757", icon: Radio },
          { label: "Traffic Alerts", val: events.filter(e=>e.type==="traffic").length, color: "#ffa502", icon: Car },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-[#0d1220] p-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-black" style={{ color }}>{val}</p>
              <p className="text-[9px] text-gray-600 font-mono">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FEED_SOURCES.map(s => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${filter === s.id ? "text-black" : "border-white/10 text-gray-500 bg-transparent hover:border-white/20"}`}
            style={filter === s.id ? { backgroundColor: s.color, borderColor: s.color } : {}}
          >
            {s.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
          <span className="text-[9px] font-mono text-gray-600">{paused ? "PAUSED" : "LIVE"} · {filtered.length} events</span>
        </div>
      </div>

      {/* Feed */}
      <div ref={listRef} className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {filtered.map((ev, i) => (
          <div
            key={ev.id}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-[#0d1220] hover:border-white/8 transition-colors"
          >
            {/* Source icon */}
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${ev.color}12`, border: `1px solid ${ev.color}20` }}>
              <span style={{ color: ev.color }}>{sourceIcon(ev.type)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono text-gray-600">{ev.source}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ color: ev.color, backgroundColor: `${ev.color}12`, border: `1px solid ${ev.color}20` }}>{ev.tag}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono border" style={{ color: sevColor[ev.sev], backgroundColor: `${sevColor[ev.sev]}10`, borderColor: `${sevColor[ev.sev]}25` }}>{ev.sev.toUpperCase()}</span>
                <span className="ml-auto text-[9px] font-mono text-gray-700">{ev.time?.toLocaleTimeString?.() || "now"}</span>
              </div>
              <p className="text-sm text-gray-300 leading-snug">{ev.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}