import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";

const THREAT_LEVELS = [
  { level: "SEVERE", color: "#ff4757", bg: "#ff475715", score: [80, 100] },
  { level: "HIGH", color: "#ff6b35", bg: "#ff6b3515", score: [60, 79] },
  { level: "ELEVATED", color: "#ffa502", bg: "#ffa50215", score: [40, 59] },
  { level: "GUARDED", color: "#00d4ff", bg: "#00d4ff15", score: [20, 39] },
  { level: "LOW", color: "#2ed573", bg: "#2ed57315", score: [0, 19] },
];

export default function SituationalAwareness({ score = 0 }) {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const level = THREAT_LEVELS.find(l => score >= l.score[0] && score <= l.score[1]) || THREAT_LEVELS[4];
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="rounded-xl p-5 border" style={{ background: level.bg, borderColor: `${level.color}30` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full transition-all duration-700"
            style={{ background: level.color, opacity: pulse ? 1 : 0.3, boxShadow: `0 0 8px ${level.color}` }}
          />
          <span className="text-[10px] uppercase tracking-widest text-gray-400">Situational Awareness</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-gray-300">{timeStr}</p>
          <p className="text-[10px] text-gray-500">{dateStr} ET</p>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-black tracking-tight" style={{ color: level.color }}>{level.level}</span>
        <span className="text-xl font-bold text-gray-500 mb-1">{score}/100</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {THREAT_LEVELS.slice().reverse().map(l => (
          <div key={l.level} className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: score >= l.score[0] ? l.color : "rgba(255,255,255,0.06)" }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-gray-500">OSINT Base</p>
          <p className="text-sm font-bold text-[#00d4ff]">Active</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">SIGINT Layer</p>
          <p className="text-sm font-bold text-[#ffa502]">Monitoring</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">HUMINT Layer</p>
          <p className="text-sm font-bold text-[#ff4757]">Alert</p>
        </div>
      </div>
    </div>
  );
}