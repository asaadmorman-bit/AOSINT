import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ResourceForecastingPanel({ resourcePoolId }) {
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [selectedMetric, setSelectedMetric] = useState("cost");

  const { data: forecasts = [], isLoading } = useQuery({
    queryKey: ["forecasts", resourcePoolId, selectedPeriod, selectedMetric],
    queryFn: () =>
      base44.entities.ResourceForecast.filter(
        {
          resource_pool_id: resourcePoolId,
          forecast_period: selectedPeriod,
          forecast_type: selectedMetric,
          status: "current",
        },
        "-generated_at",
        1
      ),
  });

  const forecast = forecasts[0];

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading forecasts...</div>;
  }

  if (!forecast) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        <AlertCircle className="w-4 h-4 mx-auto mb-2" />
        No forecast data available yet
      </div>
    );
  }

  const forecastedValues = JSON.parse(forecast.forecasted_values || "[]");
  const chartData = forecastedValues.map(v => ({
    timestamp: new Date(v.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit"
    }),
    predicted: v.predicted_value,
    lower: v.confidence_interval_lower,
    upper: v.confidence_interval_upper
  }));

  const metricLabels = {
    cost: "Cost (USD)",
    utilization: "Utilization (%)",
    demand: "Job Demand",
    queue_depth: "Queue Depth"
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
          >
            <option value="cost">Cost</option>
            <option value="utilization">Utilization</option>
            <option value="demand">Demand</option>
            <option value="queue_depth">Queue Depth</option>
          </select>
        </div>

        <div className="flex gap-2">
          {["24h", "7d", "30d"].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedPeriod === period
                  ? "bg-cyan-600/50 text-cyan-100 border border-cyan-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="timestamp" stroke="#666" style={{ fontSize: "12px" }} />
            <YAxis stroke="#666" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                background: "#1a2235",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#00d4ff" }}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#00d4ff"
              fillOpacity={1}
              fill="url(#colorPredicted)"
              strokeWidth={2}
              name="Predicted"
            />
            <Line type="monotone" dataKey="upper" stroke="#666" strokeWidth={1} strokeDasharray="5 5" name="Upper CI" />
            <Line type="monotone" dataKey="lower" stroke="#666" strokeWidth={1} strokeDasharray="5 5" name="Lower CI" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Peak Predicted"
          value={forecast.peak_predicted_value.toFixed(2)}
          unit={selectedMetric === "cost" ? "USD" : selectedMetric === "utilization" ? "%" : ""}
          color="text-cyan-400"
        />
        <StatCard
          label="Trend"
          value={forecast.trend}
          icon={forecast.trend === "increasing" ? TrendingUp : TrendingDown}
          color={forecast.trend === "increasing" ? "text-red-400" : "text-green-400"}
        />
        <StatCard
          label="Model Accuracy"
          value={`${forecast.model_accuracy}%`}
          color="text-yellow-400"
        />
        <StatCard
          label="Data Points"
          value={forecast.training_data_points}
          color="text-purple-400"
        />
      </div>

      {/* Seasonality */}
      {forecast.seasonality_detected && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
          <p className="text-amber-200 text-sm font-semibold mb-1">Seasonality Pattern Detected</p>
          <p className="text-amber-300/80 text-xs">
            {forecast.seasonality_pattern} patterns found. Consider implementing time-based auto-scaling.
          </p>
        </div>
      )}

      {/* Recommendations */}
      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-400 text-xs font-semibold">Recommendations</p>
          {forecast.recommendations.map((rec, idx) => (
            <div key={idx} className="flex gap-2 bg-green-900/10 border border-green-500/20 rounded p-2">
              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
              <p className="text-green-200 text-xs">{rec}</p>
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="text-[9px] text-gray-500 border-t border-white/10 pt-2">
        Generated {new Date(forecast.generated_at).toLocaleString()}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-2">
      <p className="text-gray-500 text-[9px] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-3 h-3 ${color}`} />}
        <p className={`text-sm font-semibold ${color}`}>
          {value} {unit}
        </p>
      </div>
    </div>
  );
}