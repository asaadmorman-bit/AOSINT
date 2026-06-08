import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  cyber: "#00d4ff",
  crime: "#ff4757",
  influence: "#ffa502",
  geopolitical: "#a855f7",
  supply_chain: "#2ed573",
  insider_threat: "#ff6b81",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-300">{payload[0].name}</p>
        <p className="text-sm font-bold text-white">{payload[0].value} indicators</p>
      </div>
    );
  }
  return null;
};

export default function ThreatMap({ indicators }) {
  const grouped = indicators.reduce((acc, ind) => {
    const cat = ind.threat_category || "cyber";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([key, value]) => ({
    name: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: COLORS[key] || "#666",
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No indicator data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-xs text-gray-400">{item.name}</span>
            <span className="text-xs font-semibold text-white ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}