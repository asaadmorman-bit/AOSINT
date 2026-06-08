import React from "react";
import { Clock, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";

const MOCK_SECTORS = [
  { sector: "Ransomware / Finance", baseline: 72, current: 18, unit: "hrs" },
  { sector: "OT / Energy", baseline: 48, current: 12, unit: "hrs" },
  { sector: "Healthcare IT", baseline: 36, current: 9, unit: "hrs" },
  { sector: "Gov / Critical Infra", baseline: 96, current: 36, unit: "hrs" },
  { sector: "Telecom / ISP", baseline: 24, current: 8, unit: "hrs" },
  { sector: "Supply Chain", baseline: 120, current: 48, unit: "hrs" },
];

export default function WarningTimeMonitor({ events, indicators, userTier }) {
  const data = MOCK_SECTORS.map(s => ({
    ...s,
    compression: Math.round((1 - s.current / s.baseline) * 100),
  }));

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00d4ff]" />
          <h3 className="text-sm font-bold text-white">Warning Time Compression</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#ff4757]">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Detection windows shrinking</span>
        </div>
      </div>

      <div className="space-y-3">
        {data.map(({ sector, baseline, current, unit, compression }) => {
          const color = compression >= 75 ? "#ff4757" : compression >= 50 ? "#ffa502" : "#00d4ff";
          return (
            <div key={sector} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400 truncate pr-2">{sector}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gray-600 line-through font-mono">{baseline}{unit}</span>
                  <span className="font-bold font-mono" style={{ color }}>{current}{unit}</span>
                  <span className="text-[9px] px-1 rounded" style={{ background: `${color}15`, color }}>-{compression}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full">
                <div className="h-full rounded-full transition-all" style={{ width: `${100 - compression}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-700 mt-4">Detection-to-impact window based on recent incident patterns. Cross-reference Operator Mode for live event data.</p>
    </div>
  );
}