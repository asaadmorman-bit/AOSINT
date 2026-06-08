import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Cpu, DollarSign, Clock, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import CostAnalyticsReport from "./CostAnalyticsReport";
import CostComparisonDashboard from "./CostComparisonDashboard";

export default function ResourceAllocationDashboard({ resources = [] }) {
  const [scalingMode, setScalingMode] = useState("balanced");
  const [costOptimization, setCostOptimization] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  if (resources.length === 0) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-xs">No quantum resources configured</p>
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalQubits = resources.reduce((sum, r) => sum + r.total_qubits, 0);
  const availableQubits = resources.reduce((sum, r) => sum + r.available_qubits, 0);
  const occupiedQubits = resources.reduce((sum, r) => sum + r.occupied_qubits, 0);
  const avgPerformance = (resources.reduce((sum, r) => sum + (r.performance_score || 75), 0) / resources.length).toFixed(1);
  const totalCost24h = resources.reduce((sum, r) => sum + (r.predicted_cost_24h_usd || 0), 0).toFixed(2);
  const avgCostEfficiency = (resources.reduce((sum, r) => sum + (r.cost_efficiency_ratio || 1.5), 0) / resources.length).toFixed(2);

  // Find optimal resource allocation
  const getRecommendedResource = () => {
    if (scalingMode === "cost_optimized") {
      return resources.reduce((prev, curr) => 
        ((curr.cost_efficiency_ratio || 1) > (prev.cost_efficiency_ratio || 1)) ? curr : prev
      );
    } else if (scalingMode === "performance_optimized") {
      return resources.reduce((prev, curr) => 
        ((curr.performance_score || 75) > (prev.performance_score || 75)) ? curr : prev
      );
    }
    // balanced mode
    const balancedScores = resources.map(r => ({
      ...r,
      balanceScore: ((r.performance_score || 75) * (r.cost_efficiency_ratio || 1)) / (r.cost_per_minute_usd || 0.5)
    }));
    return balancedScores.reduce((prev, curr) => 
      (curr.balanceScore > prev.balanceScore) ? curr : prev
    );
  };

  const recommendedResource = getRecommendedResource();

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: "overview", label: "Overview", icon: Cpu },
          { id: "analytics", label: "Cost Analytics", icon: LineChartIcon },
          { id: "comparison", label: "Cost Comparison", icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                activeView === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeView === "analytics" && selectedResourceId && (
        <CostAnalyticsReport resourcePoolId={selectedResourceId} />
      )}

      {activeView === "comparison" && (
        <CostComparisonDashboard />
      )}

      {activeView === "overview" && (
      <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-2">Allocation Strategy</h3>
            <div className="flex gap-2">
              {["cost_optimized", "balanced", "performance_optimized"].map(mode => (
                <Button
                  key={mode}
                  variant={scalingMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setScalingMode(mode)}
                  className="text-xs"
                >
                  {mode.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={costOptimization}
                onChange={(e) => setCostOptimization(e.target.checked)}
                className="rounded"
              />
              Auto Cost Optimization
            </label>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card icon={Cpu} label="Total Qubits" value={totalQubits.toLocaleString()} color="#a855f7" />
        <Card icon={CheckCircle2} label="Available" value={availableQubits.toLocaleString()} color="#2ed573" />
        <Card icon={Zap} label="In Use" value={occupiedQubits.toLocaleString()} color="#ffa502" />
        <Card icon={BarChart3} label="Avg Performance" value={avgPerformance} unit="pts" color="#00d4ff" />
        <Card icon={DollarSign} label="24h Cost" value={`$${totalCost24h}`} color="#ff6b9d" />
      </div>

      {/* Cost-Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#00d4ff]" />
            <h3 className="text-sm font-bold text-white">Cost-Performance Trade-off</h3>
          </div>
          <div className="space-y-2">
            {resources.slice(0, 3).map(r => {
              const ratio = ((r.cost_efficiency_ratio || 1.5) * 100).toFixed(0);
              return (
                <div key={r.id} className="text-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">{r.pool_name}</span>
                    <span className="text-white font-semibold">{ratio}% efficiency</span>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#ffa502]" />
            <h3 className="text-sm font-bold text-white">Predicted Job Times (24h)</h3>
          </div>
          <div className="space-y-2">
            {resources.slice(0, 3).map(r => {
              const avgTime = r.avg_job_completion_time_seconds || 120;
              const queueDepth = r.predicted_queue_depth_24h || 5;
              const totalMinutes = ((avgTime * queueDepth) / 60).toFixed(0);
              return (
                <div key={r.id} className="text-[10px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">{r.pool_name}</span>
                    <span className="text-white font-semibold">{totalMinutes}m projected</span>
                  </div>
                  <p className="text-gray-500 text-[9px]">{queueDepth} jobs × {(avgTime/60).toFixed(1)}m avg</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Recommended Resource</p>
            <p className="text-xs text-gray-300 mb-2">
              <span className="font-semibold">{recommendedResource.pool_name}</span> optimizes your {scalingMode.replace(/_/g, " ")} strategy
            </p>
            <div className="grid grid-cols-3 gap-3 text-[9px]">
              <div>
                <p className="text-gray-500">Cost/Min</p>
                <p className="text-white font-semibold">${recommendedResource.cost_per_minute_usd}</p>
              </div>
              <div>
                <p className="text-gray-500">Performance</p>
                <p className="text-white font-semibold">{recommendedResource.performance_score || 75}/100</p>
              </div>
              <div>
                <p className="text-gray-500">Efficiency</p>
                <p className="text-white font-semibold">{(recommendedResource.cost_efficiency_ratio || 1.5).toFixed(2)}x</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {resources.map(resource => {
          const utilizationPercent = ((resource.total_qubits - resource.available_qubits) / resource.total_qubits) * 100;
          const statusIcon = resource.status === "available" ? CheckCircle2 : AlertTriangle;
          const statusColor = resource.status === "available" ? "#2ed573" : "#ff4757";
          const scalingEnabled = resource.dynamic_scaling_enabled;
          const costTrend = resource.cost_trend_7d_percent || 0;
          const trendIcon = costTrend > 0 ? TrendingUp : TrendingDown;
          const trendColor = costTrend > 0 ? "#ff4757" : "#2ed573";

          return (
            <div key={resource.id} className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-cyan-500/20 transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{resource.pool_name}</h3>
                    <Badge className="text-[8px]" style={{ background: `${statusColor}20`, color: statusColor, borderColor: `${statusColor}30` }}>
                      {resource.status}
                    </Badge>
                    {scalingEnabled && (
                      <Badge className="text-[8px] bg-blue-500/20 text-blue-300 border-blue-500/30">
                        Auto Scaling
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{resource.pool_type} • {resource.backend_identifier}</p>
                </div>
                <div className="text-right">
                  {costTrend !== 0 && (
                    <div className="flex items-center gap-1 text-[9px]" style={{ color: trendColor }}>
                      {React.createElement(trendIcon, { className: "w-3 h-3" })}
                      {costTrend > 0 ? "+" : ""}{costTrend}%
                    </div>
                  )}
                </div>
              </div>

              {/* Qubit Utilization */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="text-gray-500">Qubit Utilization</span>
                  <span className="text-white font-semibold">{utilizationPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#a855f7] to-[#ffa502]"
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-500 mt-1">
                  {resource.total_qubits - resource.available_qubits} / {resource.total_qubits} qubits
                  {scalingEnabled && resource.min_qubits && (
                    <span> • Scaling: {resource.min_qubits}-{resource.max_qubits}</span>
                  )}
                </p>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setSelectedResourceId(resource.id);
                    setActiveView("analytics");
                  }}
                  className="mt-2 text-[9px] text-cyan-400 hover:text-cyan-300"
                >
                  View Cost Analytics →
                </Button>
              </div>

              {/* Core Specs */}
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                <Spec label="Gate Fidelity" value={`${resource.gate_fidelity || 98}%`} />
                <Spec label="Readout Fidelity" value={`${resource.readout_fidelity || 95}%`} />
                <Spec label="Performance" value={`${resource.performance_score || 75}/100`} />
                <Spec label="Reliability" value={`${resource.reliability_score || 95}%`} />
              </div>

              {/* Cost & Performance */}
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 p-2 rounded bg-black/20 border border-white/5">
                <div>
                  <p className="text-gray-500">Cost/Min</p>
                  <p className="text-white font-semibold">${resource.cost_per_minute_usd || 0.50}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cost Efficiency</p>
                  <p className="text-white font-semibold">{(resource.cost_efficiency_ratio || 1.5).toFixed(2)}x</p>
                </div>
              </div>

              {/* Predicted Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded bg-blue-900/20 border border-blue-500/20">
                <div>
                  <p className="text-gray-400">Predicted Cost (24h)</p>
                  <p className="text-blue-300 font-semibold">${resource.predicted_cost_24h_usd || 12.00}</p>
                </div>
                <div>
                  <p className="text-gray-400">Est. Queue Depth</p>
                  <p className="text-blue-300 font-semibold">{resource.predicted_queue_depth_24h || 3} jobs</p>
                </div>
              </div>

              {/* Queue & Uptime */}
              <div className="grid grid-cols-2 gap-2 text-[10px] mt-3 pt-3 border-t border-white/5">
                <Spec label="Jobs Queued" value={resource.current_job_count || 0} />
                <Spec label="Wait Time" value={`${resource.estimated_queue_wait_minutes || 5}m`} />
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}
    </div>
  );
}

function Card({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
          <Icon className="w-3 h-3" style={{ color }} />
        </div>
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color }}>
        {value}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="bg-black/40 rounded p-1.5 border border-white/5">
      <p className="text-gray-500 text-[9px]">{label}</p>
      <p className="text-white font-semibold text-[10px]">{value}</p>
    </div>
  );
}