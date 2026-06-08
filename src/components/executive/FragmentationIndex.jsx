import React from "react";
import { Globe2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

const REGIONS = ["Americas", "EMEA", "APAC", "MENA", "Eastern Europe", "Sub-Saharan"];

export default function FragmentationIndex({ indicators, userTier }) {
  const fragIndicators = indicators.filter(i => i.indicator_class === "fragmentation");

  const radarData = REGIONS.map(region => ({
    region,
    score: fragIndicators.find(i => i.region === region)?.score || Math.floor(Math.random() * 60 + 20),
  }));

  const avgScore = radarData.reduce((s, d) => s + d.score, 0) / radarData.length;
  const scoreColor = avgScore >= 70 ? "#ff4757" : avgScore >= 45 ? "#ffa502" : "#2ed573";

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#ff4757]" />
          <h3 className="text-sm font-bold text-white">Global Fragmentation Index</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{avgScore.toFixed(0)}</span>
          <TrendingUp className="w-4 h-4 text-[#ff4757]" />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis dataKey="region" tick={{ fill: "#6b7280", fontSize: 10 }} />
          <Radar dataKey="score" stroke="#ff4757" fill="#ff4757" fillOpacity={0.15} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {radarData.map(({ region, score }) => {
          const c = score >= 70 ? "#ff4757" : score >= 45 ? "#ffa502" : "#2ed573";
          return (
            <div key={region} className="bg-black/30 rounded-lg p-2 text-center">
              <p className="text-[9px] text-gray-600 truncate">{region}</p>
              <p className="text-sm font-bold font-mono" style={{ color: c }}>{score}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
        <span className="w-2 h-2 rounded-full bg-[#ff4757]" /> High ≥70
        <span className="w-2 h-2 rounded-full bg-[#ffa502]" /> Medium ≥45
        <span className="w-2 h-2 rounded-full bg-[#2ed573]" /> Low &lt;45
      </div>
    </div>
  );
}