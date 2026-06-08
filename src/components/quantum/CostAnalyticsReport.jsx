import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CostAnalyticsReport({ resourcePoolId }) {
  const [period, setPeriod] = useState("7days");
  const [costType, setCostType] = useState("all");

  const { data: costHistory = [], isLoading } = useQuery({
    queryKey: ["cost-history", resourcePoolId, period],
    queryFn: () => base44.entities.CostHistoryRecord.filter(
      { resource_pool_id: resourcePoolId },
      "-timestamp",
      100
    ),
  });

  const { data: resourcePool } = useQuery({
    queryKey: ["resource-pool", resourcePoolId],
    queryFn: () => base44.entities.QuantumResourcePool.read(resourcePoolId),
  });

  // Filter by period
  const now = new Date();
  const periodMs = {
    "7days": 7 * 24 * 60 * 60 * 1000,
    "30days": 30 * 24 * 60 * 60 * 1000,
    "90days": 90 * 24 * 60 * 60 * 1000,
  }[period];

  const filteredData = costHistory.filter(record => {
    const recordTime = new Date(record.timestamp).getTime();
    const isWithinPeriod = (now.getTime() - recordTime) <= periodMs;
    const isCorrectType = costType === "all" || record.cost_type === costType;
    return isWithinPeriod && isCorrectType;
  });

  // Aggregate data by day
  const dailyData = {};
  filteredData.forEach(record => {
    const date = new Date(record.timestamp).toLocaleDateString();
    if (!dailyData[date]) {
      dailyData[date] = { date, totalCost: 0, avgUtilization: 0, jobCount: 0, efficiency: 0, count: 0 };
    }
    dailyData[date].totalCost += record.amount_usd;
    dailyData[date].avgUtilization += record.resource_utilization_percent || 0;
    dailyData[date].jobCount += record.job_count_at_time || 0;
    dailyData[date].efficiency += record.cost_efficiency || 0;
    dailyData[date].count += 1;
  });

  const chartData = Object.values(dailyData).map(d => ({
    ...d,
    avgUtilization: (d.avgUtilization / d.count).toFixed(1),
    efficiency: (d.efficiency / d.count).toFixed(2),
  }));

  // Calculate summary metrics
  const totalCost = filteredData.reduce((sum, r) => sum + r.amount_usd, 0);
  const avgDailyCost = chartData.length > 0 ? (totalCost / chartData.length).toFixed(2) : 0;
  const avgEfficiency = (filteredData.reduce((sum, r) => sum + (r.cost_efficiency || 0), 0) / filteredData.length).toFixed(2);
  
  // Cost trend
  const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
  const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, d) => sum + d.totalCost, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, d) => sum + d.totalCost, 0) / secondHalf.length : 0;
  const costTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100).toFixed(1);

  // Group by cost type
  const costByType = {};
  filteredData.forEach(record => {
    if (!costByType[record.cost_type]) {
      costByType[record.cost_type] = 0;
    }
    costByType[record.cost_type] += record.amount_usd;
  });

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading cost history...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex gap-2">
            {["7days", "30days", "90days"].map(p => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {p === "7days" ? "Last 7 Days" : p === "30days" ? "Last 30 Days" : "Last 90 Days"}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {["all", "per_minute", "per_hour", "per_job"].map(t => (
              <Button
                key={t}
                variant={costType === t ? "default" : "ghost"}
                size="sm"
                onClick={() => setCostType(t)}
                className="text-xs"
              >
                {t === "all" ? "All Types" : t.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard 
          label="Total Cost" 
          value={`$${totalCost.toFixed(2)}`} 
          icon={BarChart3}
          color="#ff6b9d"
        />
        <MetricCard 
          label="Avg Daily" 
          value={`$${avgDailyCost}`} 
          icon={LineChartIcon}
          color="#00d4ff"
        />
        <MetricCard 
          label="Cost Trend" 
          value={`${costTrend > 0 ? "+" : ""}${costTrend}%`} 
          icon={costTrend > 0 ? TrendingUp : TrendingDown}
          color={costTrend > 0 ? "#ff4757" : "#2ed573"}
        />
        <MetricCard 
          label="Avg Efficiency" 
          value={`${avgEfficiency}x`} 
          icon={BarChart3}
          color="#a855f7"
        />
      </div>

      {/* Cost Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-4">Cost Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#999" style={{ fontSize: "12px" }} />
              <YAxis stroke="#999" style={{ fontSize: "12px" }} />
              <Tooltip 
                contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalCost" 
                stroke="#ff6b9d" 
                name="Daily Cost ($)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line 
                type="monotone" 
                dataKey="avgUtilization" 
                stroke="#00d4ff" 
                name="Utilization (%)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost by Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-4">Cost Breakdown by Type</h3>
          <div className="space-y-2">
            {Object.entries(costByType).map(([type, amount]) => {
              const percent = ((amount / totalCost) * 100).toFixed(1);
              return (
                <div key={type} className="text-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 capitalize">{type.replace(/_/g, " ")}</span>
                    <span className="text-white font-semibold">${amount.toFixed(2)} ({percent}%)</span>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Efficiency vs Cost */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-4">Efficiency Metrics</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-[10px] mb-1">Cost Per Hour</p>
              <p className="text-white font-bold text-lg">${(totalCost / (parseInt(period) || 7)).toFixed(2)}/hr avg</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-black/40 rounded p-2 border border-white/5">
                <p className="text-gray-500">Peak Daily Cost</p>
                <p className="text-green-400 font-semibold">${Math.max(...chartData.map(d => d.totalCost)).toFixed(2)}</p>
              </div>
              <div className="bg-black/40 rounded p-2 border border-white/5">
                <p className="text-gray-500">Lowest Daily Cost</p>
                <p className="text-cyan-400 font-semibold">${Math.min(...chartData.map(d => d.totalCost)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Records */}
      {filteredData.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Cost Records</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredData.slice(0, 10).map((record, idx) => (
              <div key={idx} className="text-[10px] p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">${record.amount_usd.toFixed(2)}</p>
                  <p className="text-gray-500">{record.cost_type.replace(/_/g, " ")} • {new Date(record.timestamp).toLocaleString()}</p>
                </div>
                <Badge className="text-[8px]">{record.scaling_strategy_used || "unknown"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}