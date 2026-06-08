import React from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

const data = [
  { axis: "Detection", A: 72, B: 45 },
  { axis: "Attribution", A: 58, B: 30 },
  { axis: "Response", A: 65, B: 55 },
  { axis: "Adaptation", A: 50, B: 38 },
  { axis: "Deception", A: 80, B: 25 },
  { axis: "Influence", A: 75, B: 42 },
];

export default function SpeedOfAction() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#ff4757] inline-block" /><span className="text-[10px] text-gray-400">Adversary</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#00d4ff] inline-block" /><span className="text-[10px] text-gray-400">Defender</span></div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#6b7280", fontSize: 10 }} />
          <Radar dataKey="A" stroke="#ff4757" fill="#ff4757" fillOpacity={0.15} strokeWidth={1.5} />
          <Radar dataKey="B" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}