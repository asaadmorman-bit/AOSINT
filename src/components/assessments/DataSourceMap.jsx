import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-[10px] text-gray-400">Indicators: <span className="text-[#00d4ff]">{payload[0]?.value}</span></p>
        {payload[1] && <p className="text-[10px] text-gray-400">Feeds: <span className="text-[#a855f7]">{payload[1]?.value}</span></p>}
      </div>
    );
  }
  return null;
};

export default function DataSourceMap({ indicators = [], feeds = [] }) {
  const categories = ["cyber", "crime", "influence", "geopolitical", "supply_chain", "insider_threat"];
  
  const data = categories.map(cat => ({
    name: cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    indicators: indicators.filter(i => i.threat_category === cat).length,
    feeds: feeds.filter(f => f.feed_type === cat).length,
  })).filter(d => d.indicators > 0 || d.feeds > 0);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-gray-500 text-xs">No data sources mapped yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={12} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
        <Bar dataKey="indicators" name="Indicators" radius={[3, 3, 0, 0]} fill="#00d4ff" />
        <Bar dataKey="feeds" name="Feeds" radius={[3, 3, 0, 0]} fill="#a855f7" />
      </BarChart>
    </ResponsiveContainer>
  );
}