import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SeverityTimeline({ indicators }) {
  const severityMap = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  indicators.forEach((ind) => {
    const sev = ind.severity || "medium";
    severityMap[sev] = (severityMap[sev] || 0) + 1;
  });

  const data = [
    { name: "Critical", value: severityMap.critical, fill: "#ff4757" },
    { name: "High", value: severityMap.high, fill: "#ff6b81" },
    { name: "Medium", value: severityMap.medium, fill: "#ffa502" },
    { name: "Low", value: severityMap.low, fill: "#00d4ff" },
    { name: "Info", value: severityMap.informational, fill: "#2ed573" },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}