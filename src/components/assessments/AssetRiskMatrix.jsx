import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="font-semibold text-white mb-1">{d.name}</p>
        <p className="text-gray-400">Reliability: <span className="text-[#00d4ff]">{d.x}/100</span></p>
        <p className="text-gray-400">Exploitation Risk: <span className="text-[#ff4757]">{d.y}/100</span></p>
        <p className="text-gray-400">Type: {d.asset_type}</p>
      </div>
    );
  }
  return null;
};

const getDotColor = (x, y) => {
  if (y >= 70) return "#ff4757";
  if (y >= 40) return "#ffa502";
  return "#2ed573";
};

export default function AssetRiskMatrix({ assets = [] }) {
  const data = assets.map(a => ({
    name: a.name,
    x: a.reliability_score || Math.floor(Math.random() * 40 + 50),
    y: a.exploitation_score || (a.criticality === "critical" ? Math.floor(Math.random() * 30 + 65) :
       a.criticality === "high" ? Math.floor(Math.random() * 30 + 45) :
       Math.floor(Math.random() * 40 + 20)),
    asset_type: a.asset_type,
    criticality: a.criticality,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-xs">
        No asset data yet
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#ff4757] inline-block" />High Risk</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#ffa502] inline-block" />Medium Risk</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-[#2ed573] inline-block" />Low Risk</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="x" type="number" name="Reliability" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} label={{ value: "Reliability Score →", position: "insideBottomRight", fill: "#4b5563", fontSize: 9, offset: -5 }} />
          <YAxis dataKey="y" type="number" name="Exploitation" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} label={{ value: "Exploitation Risk ↑", angle: -90, position: "insideLeft", fill: "#4b5563", fontSize: 9 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }} />
          <ReferenceLine x={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <ReferenceLine y={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <Scatter data={data} r={6}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getDotColor(entry.x, entry.y)} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[9px] text-gray-600">
        <div className="text-center">← Low reliability / Low exploitation = Monitor</div>
        <div className="text-center">High exploitation = Prioritize remediation →</div>
      </div>
    </div>
  );
}