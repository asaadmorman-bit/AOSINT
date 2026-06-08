import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

export default function CostComparisonDashboard() {
  const [compareBy, setCompareBy] = useState("resource_type");
  const [selectedStrategy, setSelectedStrategy] = useState("balanced");

  const { data: resources = [] } = useQuery({
    queryKey: ["resources-comparison"],
    queryFn: () => base44.entities.QuantumResourcePool.list(),
  });

  const { data: costHistories = [] } = useQuery({
    queryKey: ["all-cost-history"],
    queryFn: () => base44.entities.CostHistoryRecord.list("-timestamp", 500),
  });

  // Prepare comparison data
  let comparisonData = [];
  
  if (compareBy === "resource_type") {
    const byType = {};
    resources.forEach(r => {
      const type = r.pool_type;
      if (!byType[type]) {
        byType[type] = { name: type, cost: 0, performance: 0, efficiency: 0, count: 0 };
      }
      const costs = costHistories.filter(c => c.resource_pool_id === r.id);
      const totalCost = costs.reduce((sum, c) => sum + c.amount_usd, 0);
      const avgPerformance = r.performance_score || 75;
      const avgEfficiency = r.cost_efficiency_ratio || 1.5;
      
      byType[type].cost += totalCost;
      byType[type].performance += avgPerformance;
      byType[type].efficiency += avgEfficiency;
      byType[type].count += 1;
    });
    
    comparisonData = Object.values(byType).map(d => ({
      ...d,
      performance: (d.performance / d.count).toFixed(1),
      efficiency: (d.efficiency / d.count).toFixed(2),
    }));
  } else if (compareBy === "scaling_strategy") {
    const strategies = ["cost_optimized", "balanced", "performance_optimized"];
    comparisonData = strategies.map(strategy => {
      const records = costHistories.filter(c => c.scaling_strategy_used === strategy);
      const totalCost = records.reduce((sum, r) => sum + r.amount_usd, 0);
      const avgEfficiency = records.length > 0 
        ? (records.reduce((sum, r) => sum + (r.cost_efficiency || 0), 0) / records.length).toFixed(2)
        : 0;
      const avgPerformance = records.length > 0
        ? (records.reduce((sum, r) => sum + (r.performance_score_achieved || 0), 0) / records.length).toFixed(1)
        : 0;
      
      return {
        name: strategy.replace(/_/g, " "),
        cost: totalCost,
        efficiency: avgEfficiency,
        performance: avgPerformance,
      };
    });
  }

  // Cost-Performance scatter data
  const scatterData = resources.map(r => {
    const costs = costHistories.filter(c => c.resource_pool_id === r.id);
    const totalCost = costs.reduce((sum, c) => sum + c.amount_usd, 0);
    return {
      name: r.pool_name,
      cost: totalCost,
      performance: r.performance_score || 75,
      efficiency: r.cost_efficiency_ratio || 1.5,
    };
  });

  // Top performers
  const topEfficient = [...resources]
    .sort((a, b) => (b.cost_efficiency_ratio || 0) - (a.cost_efficiency_ratio || 0))
    .slice(0, 3);

  const lowestCost = [...resources]
    .sort((a, b) => (a.cost_per_minute_usd || 0) - (b.cost_per_minute_usd || 0))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-2">Compare By</p>
            <div className="flex gap-2">
              {["resource_type", "scaling_strategy"].map(option => (
                <Button
                  key={option}
                  variant={compareBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCompareBy(option)}
                  className="text-xs"
                >
                  {option === "resource_type" ? "Resource Type" : "Scaling Strategy"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Cost & Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#999" style={{ fontSize: "12px" }} />
            <YAxis stroke="#999" style={{ fontSize: "12px" }} />
            <Tooltip 
              contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar dataKey="cost" fill="#ff6b9d" name="Total Cost ($)" />
            <Bar dataKey="performance" fill="#00d4ff" name="Avg Performance" />
            <Bar dataKey="efficiency" fill="#2ed573" name="Efficiency Ratio" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost vs Performance Scatter */}
      {scatterData.length > 1 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-4">Cost vs Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="cost" 
                name="Total Cost ($)" 
                stroke="#999"
                style={{ fontSize: "12px" }}
              />
              <YAxis 
                dataKey="performance" 
                name="Performance (0-100)" 
                stroke="#999"
                style={{ fontSize: "12px" }}
              />
              <Tooltip 
                contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)" }}
                labelStyle={{ color: "#fff" }}
                cursor={{ fill: "rgba(0,212,255,0.1)" }}
              />
              <Scatter name="Resources" data={scatterData} fill="#a855f7" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Most Cost Efficient</h3>
          <div className="space-y-2">
            {topEfficient.map((r, idx) => (
              <div key={r.id} className="text-[10px] p-2 rounded bg-gradient-to-r from-green-900/20 to-green-900/5 border border-green-500/20 flex items-center justify-between">
                <div>
                  <p className="text-green-400 font-semibold">#{idx + 1} {r.pool_name}</p>
                  <p className="text-gray-500">{r.pool_type}</p>
                </div>
                <p className="text-green-400 font-bold">{(r.cost_efficiency_ratio || 1.5).toFixed(2)}x</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Lowest Cost/Min</h3>
          <div className="space-y-2">
            {lowestCost.map((r, idx) => (
              <div key={r.id} className="text-[10px] p-2 rounded bg-gradient-to-r from-blue-900/20 to-blue-900/5 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <p className="text-blue-400 font-semibold">#{idx + 1} {r.pool_name}</p>
                  <p className="text-gray-500">{r.pool_type}</p>
                </div>
                <p className="text-blue-400 font-bold">${r.cost_per_minute_usd || 0.50}/min</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Savings Analysis */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <h3 className="text-sm font-bold text-white mb-3">Cost Savings Opportunity</h3>
        <div className="space-y-2">
          {(() => {
            const avgCost = resources.reduce((sum, r) => sum + (r.cost_per_minute_usd || 0.5), 0) / resources.length;
            const expensiveResources = resources.filter(r => (r.cost_per_minute_usd || 0) > avgCost * 1.2);
            
            return expensiveResources.length > 0 ? expensiveResources.map(r => {
              const savingsPer = ((r.cost_per_minute_usd - avgCost) * 60 * 24).toFixed(2);
              return (
                <div key={r.id} className="text-[10px] p-2 rounded bg-yellow-900/20 border border-yellow-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-300 font-semibold">{r.pool_name}</span>
                    <span className="text-yellow-400">Potential savings: ${savingsPer}/day</span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-500 text-[10px]">All resources are competitively priced</p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}