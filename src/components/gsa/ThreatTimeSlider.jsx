import React, { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ThreatTimeSlider({
  minTime,
  maxTime,
  currentTime,
  onChange,
  isPlaying,
  onPlayPause,
  onReset,
  visibleCount,
  totalCount,
}) {
  const intervalRef = useRef(null);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onChange(prev => {
          const step = (maxTime - minTime) / 60; // 60 steps across the range
          const next = prev + step;
          if (next >= maxTime) {
            onPlayPause(false);
            return maxTime;
          }
          return next;
        });
      }, 300);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, minTime, maxTime]);

  const pct = maxTime === minTime ? 100 : ((currentTime - minTime) / (maxTime - minTime)) * 100;
  const fmtDate = (ts) => {
    try { return format(new Date(ts), "MMM d, yyyy HH:mm"); }
    catch { return "—"; }
  };

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-white flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#00d4ff]" />
          Threat Timeline Replay
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded">
            {visibleCount} / {totalCount} threats
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative mb-2">
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #00d4ff, #a855f7)",
            }}
          />
        </div>
        <input
          type="range"
          min={minTime}
          max={maxTime}
          value={currentTime}
          onChange={e => onChange(() => Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          style={{ margin: 0 }}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#00d4ff] border-2 border-[#0d1220] shadow-lg pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>

      {/* Date labels */}
      <div className="flex justify-between text-[8px] font-mono text-gray-600 mb-2.5">
        <span>{fmtDate(minTime)}</span>
        <span className="text-[#00d4ff]">{fmtDate(currentTime)}</span>
        <span>{fmtDate(maxTime)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-white/5 border border-white/8 hover:border-white/20 text-gray-500 hover:text-gray-300 transition-all"
          title="Reset to start"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <button
          onClick={() => onPlayPause(!isPlaying)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all text-xs font-bold"
          style={{
            background: isPlaying ? "rgba(255,71,87,0.1)" : "rgba(0,212,255,0.1)",
            borderColor: isPlaying ? "rgba(255,71,87,0.3)" : "rgba(0,212,255,0.3)",
            color: isPlaying ? "#ff4757" : "#00d4ff",
          }}
        >
          {isPlaying ? (
            <><Pause className="w-3 h-3" /> Pause Replay</>
          ) : (
            <><Play className="w-3 h-3" /> Play Replay</>
          )}
        </button>
      </div>
    </div>
  );
}