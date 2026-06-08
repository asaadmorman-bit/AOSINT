import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle } from "lucide-react";

export default function PerformanceAnalytics({ metrics }) {
  if (!metrics || !metrics.id) {
    return <div className="text-gray-500">No performance data available</div>;
  }

  // Mock trend data
  const trendData = [
    { period: "Week 1", accuracy: 75, precision: 70, recall: 72 },
    { period: "Week 2", accuracy: 77, precision: 73, recall: 74 },
    { period: "Week 3", accuracy: 80, precision: 76, recall: 78 },
    { period: "Week 4", accuracy: metrics.accuracy || 82, precision: metrics.precision || 79, recall: metrics.recall || 80 },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <MetricBox
          title="Success Rate"
          value={`${metrics.success_rate || 0}%`}
          trend={metrics.improvement_trend}
        />
        <MetricBox
          title="False Positive Rate"
          value={`${metrics.false_positive_rate || 0}%`}
          trend={metrics.improvement_trend === 'declining' ? 'improving' : metrics.improvement_trend}
        />
        <MetricBox
          title="Avg Response Time"
          value={`${Math.round(metrics.avg_response_time_seconds || 0)}s`}
        />
      </div>

      {/* Accuracy Trends */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#00d4ff" strokeWidth={2} />
            <Line type="monotone" dataKey="precision" stroke="#2ed573" strokeWidth={2} />
            <Line type="monotone" dataKey="recall" stroke="#ffa502" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {metrics.strengths?.map((strength, idx) => (
              <li key={idx} className="text-xs text-gray-300">
                ✓ {strength}
              </li>
            )) || <li className="text-xs text-gray-500">No data</li>}
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Weaknesses
          </h3>
          <ul className="space-y-2">
            {metrics.weaknesses?.map((weakness, idx) => (
              <li key={idx} className="text-xs text-gray-300">
                ⚠ {weakness}
              </li>
            )) || <li className="text-xs text-gray-500">No data</li>}
          </ul>
        </div>
      </div>

      {/* Training Recommendations */}
      {metrics.recommended_training_focus?.length > 0 && (
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Recommended Training Focus</h3>
          <div className="space-y-2">
            {metrics.recommended_training_focus.map((focus, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/20 text-[8px] mt-0.5">
                  {idx + 1}
                </Badge>
                <p className="text-sm text-gray-300">{focus}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBox({ title, value, trend }) {
  const trendColor = {
    improving: "text-green-400",
    stable: "text-gray-400",
    declining: "text-red-400",
  }[trend] || "text-gray-400";

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <p className="text-xs text-gray-400 uppercase font-semibold mb-2">{title}</p>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {trend && <p className={`text-xs ${trendColor}`}>{trend}</p>}
    </div>
  );
}