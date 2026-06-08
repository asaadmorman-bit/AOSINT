import React, { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react";

const TIME_WINDOWS = [
  { label: "15m", minutes: 15 },
  { label: "1h", minutes: 60 },
  { label: "6h", minutes: 360 },
  { label: "24h", minutes: 1440 },
  { label: "7d", minutes: 10080 },
  { label: "ALL", minutes: null },
];

export default function TimelineScrubber({ events, onTimeFilter, activeWindow, setActiveWindow }) {
  const [playing, setPlaying] = useState(false);
  const [scrubPos, setScrubPos] = useState(100); // 0-100 percent

  // Build hour-bucket histogram for sparkline
  const now = Date.now();
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const bucketStart = now - (24 - i) * 3600000;
    const bucketEnd = bucketStart + 3600000;
    return events.filter(e => {
      const t = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      return t >= bucketStart && t < bucketEnd;
    }).length;
  });
  const maxBucket = Math.max(...buckets, 1);

  // Auto-play scrub
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setScrubPos(p => {
        if (p >= 100) { setPlaying(false); return 100; }
        return p + 0.5;
      });
    }, 80);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="bg-[#020509]/95 border-t border-white/5 backdrop-blur-sm px-4 py-2 flex flex-col gap-1.5">
      {/* Sparkline */}
      <div className="flex items-end gap-px h-8">
        {buckets.map((count, i) => {
          const h = Math.max(2, (count / maxBucket) * 28);
          const isCurrent = i === 23;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300"
              style={{
                height: h,
                background: isCurrent
                  ? "#00e5ff"
                  : count > 3
                  ? "#ff1744"
                  : count > 1
                  ? "#ff6d00"
                  : "#1a2535",
                opacity: isCurrent ? 1 : 0.7,
              }}
              title={`${count} events`}
            />
          );
        })}
      </div>

      {/* Scrubber row */}
      <div className="flex items-center gap-3">
        {/* Playback controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setScrubPos(0)} className="text-gray-600 hover:text-gray-300 p-1 transition-colors">
            <SkipBack className="w-3 h-3" />
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="text-[#00e5ff] hover:text-white p-1 transition-colors"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setScrubPos(100)} className="text-gray-600 hover:text-gray-300 p-1 transition-colors">
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        {/* Timeline bar */}
        <div className="flex-1 relative h-1.5 bg-white/5 rounded-full cursor-pointer group"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setScrubPos(Math.round(((e.clientX - rect.left) / rect.width) * 100));
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#00e5ff]/40 transition-all"
            style={{ width: `${scrubPos}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00e5ff] border-2 border-[#020509] shadow-lg shadow-[#00e5ff]/40 transition-all"
            style={{ left: `calc(${scrubPos}% - 6px)` }} />
        </div>

        {/* Time window toggles */}
        <div className="flex items-center gap-0.5 shrink-0">
          {TIME_WINDOWS.map(w => (
            <button
              key={w.label}
              onClick={() => { setActiveWindow(w.label); onTimeFilter(w.minutes); }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-widest transition-all ${
                activeWindow === w.label
                  ? "bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30"
                  : "text-gray-600 hover:text-gray-400 border border-transparent"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-gray-600" />
          <span className="text-[9px] font-mono text-gray-600">
            {new Date().toUTCString().slice(17, 25)} UTC
          </span>
        </div>
      </div>

      {/* Hour labels */}
      <div className="flex justify-between text-[8px] font-mono text-gray-700 px-0">
        <span>T-24h</span>
        <span>T-18h</span>
        <span>T-12h</span>
        <span>T-6h</span>
        <span>NOW</span>
      </div>
    </div>
  );
}