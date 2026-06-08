import React, { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, Download, Maximize2 } from "lucide-react";

const chartTypes = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
];

const COLORS = ["#00d4ff", "#a855f7", "#ffa502", "#2ed573", "#ff4757"];

export default function CustomVisualizationCard({ title, data, metric, onDrillDown }) {
  const [chartType, setChartType] = useState("bar");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p className="text-sm">No data available</p>
        </div>
      );
    }

    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Line type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Bar dataKey="value" fill="#00d4ff" onClick={(e) => onDrillDown && onDrillDown(e)} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const cardContent = (
    <div className={`bg-[#111827] border border-white/5 rounded-lg overflow-hidden ${isFullscreen ? "" : "p-6"}`}>
      <div className={`flex items-center justify-between ${isFullscreen ? "p-6 border-b border-white/10" : ""}`}>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 mt-1 bg-[#0d1220] border border-white/10 rounded-lg shadow-xl p-1 hidden group-hover:block z-10">
              {chartTypes.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setChartType(ct.value)}
                  className={`block w-full text-left px-4 py-2 text-xs rounded transition-colors ${
                    chartType === ct.value ? "bg-[#00d4ff] text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className={isFullscreen ? "p-6" : ""}>{renderChart()}</div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button onClick={() => setIsFullscreen(false)} className="text-gray-400 hover:text-white text-2xl">
              ✕
            </button>
          </div>
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {cardContent}
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}