import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-gray-400">{payload[0]?.payload?.axis}</p>
        <p className="text-[#ffa502]">Current: {payload[0]?.value}</p>
        {payload[1] && <p className="text-[#2ed573]">Target: {payload[1]?.value}</p>}
      </div>
    );
  }
  return null;
};

export default function GapRadar({ gaps = [] }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-xs">
        Generate an assessment to see gap analysis
      </div>
    );
  }

  const data = gaps.slice(0, 8).map(g => ({
    axis: g.category?.length > 12 ? g.category.substring(0, 12) + "…" : g.category,
    current: ((g.current_maturity || 1) / 5) * 100,
    target: ((g.target_maturity || 3) / 5) * 100,
  }));

  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-2.5 h-0.5 bg-[#ffa502] inline-block" />Current</span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-2.5 h-0.5 bg-[#2ed573] inline-block" />Target</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#6b7280", fontSize: 9 }} />
          <Radar dataKey="current" stroke="#ffa502" fill="#ffa502" fillOpacity={0.15} strokeWidth={1.5} />
          <Radar dataKey="target" stroke="#2ed573" fill="#2ed573" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}