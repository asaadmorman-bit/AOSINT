import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function PerformanceAnalyzer({ agentId }) {
  const { data: metrics = [] } = useQuery({
    queryKey: ["agentMetrics", agentId],
    queryFn: () =>
      agentId
        ? base44.entities.AgentPerformanceMetric.filter({ agent_id: agentId })
        : Promise.resolve([]),
    enabled: !!agentId,
  });

  const latestMetric = metrics[0];

  if (!latestMetric) {
    return <div className="text-gray-400 p-4">No performance data available</div>;
  }

  const detectionMetrics = [
    { name: "Precision", value: latestMetric.threat_detection_precision || 0 },
    { name: "Recall", value: latestMetric.threat_detection_recall || 0 },
    { name: "F1 Score", value: latestMetric.f1_score || 0 },
  ];

  const accuracyData = [
    { name: "Accuracy", value: latestMetric.average_accuracy || 0 },
    { name: "Success Rate", value: latestMetric.success_rate || 0 },
    { name: "Consistency", value: latestMetric.consistency_score || 0 },
  ];

  const errorRates = [
    { name: "False Positives", value: latestMetric.false_positive_rate || 0, type: "negative" },
    { name: "False Negatives", value: latestMetric.false_negative_rate || 0, type: "negative" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Agent Performance Analysis</h3>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          label="Success Rate"
          value={`${latestMetric.success_rate || 0}%`}
          trend={latestMetric.trend}
        />
        <MetricCard
          label="Threat Detection"
          value={`${latestMetric.threat_detection_precision || 0}%`}
          trend={latestMetric.trend}
        />
        <MetricCard
          label="Response Time"
          value={`${latestMetric.average_response_time_seconds || 0}s`}
          trend="neutral"
        />
        <MetricCard
          label="F1 Score"
          value={`${(latestMetric.f1_score || 0).toFixed(2)}`}
          trend={latestMetric.trend}
        />
      </div>

      {/* Detection Metrics */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm font-semibold text-white mb-3">Threat Detection Metrics</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={detectionMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="value" fill="#00d4ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy Metrics */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm font-semibold text-white mb-3">Accuracy Breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={accuracyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={60} />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="value" fill="#2ed573" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Error Analysis */}
      {(latestMetric.false_positive_rate > 0 || latestMetric.false_negative_rate > 0) && (
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Error Analysis
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/30 p-3 rounded">
              <p className="text-xs text-gray-400">False Positive Rate</p>
              <p className="text-lg font-bold text-orange-400">{latestMetric.false_positive_rate || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">Benign alerts</p>
            </div>
            <div className="bg-black/30 p-3 rounded">
              <p className="text-xs text-gray-400">False Negative Rate</p>
              <p className="text-lg font-bold text-red-400">{latestMetric.false_negative_rate || 0}%</p>
              <p className="text-xs text-gray-500 mt-1">Missed threats</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {latestMetric.recommendations && latestMetric.recommendations.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-300 mb-2">Improvement Recommendations</p>
          <ul className="space-y-1">
            {latestMetric.recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Training Impact */}
      {latestMetric.improvement_from_training > 0 && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <p className="text-xs text-green-300">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            {latestMetric.improvement_from_training}% improvement from training datasets
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, trend }) {
  const trendIcon = trend === "improving" ? <TrendingUp /> : trend === "declining" ? <TrendingDown /> : null;
  const trendColor =
    trend === "improving" ? "text-green-400" : trend === "declining" ? "text-red-400" : "text-gray-400";

  return (
    <div className="bg-black/30 border border-white/10 rounded p-2">
      <p className="text-[10px] text-gray-400">{label}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-base font-bold text-white">{value}</p>
        {trendIcon && <div className={`w-3 h-3 ${trendColor}`}>{trendIcon}</div>}
      </div>
    </div>
  );
}