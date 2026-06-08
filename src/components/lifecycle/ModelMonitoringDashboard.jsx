import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ModelMonitoringDashboard({ models = [], selectedModel }) {
  const model = selectedModel || models[0];

  if (!model) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-xs">No models to monitor</p>
      </div>
    );
  }

  const driftData = [
    { time: "1h", data_drift: model.current_data_drift_percentage * 0.7, perf_drift: model.current_performance_drift_percentage * 0.6 },
    { time: "6h", data_drift: model.current_data_drift_percentage * 0.85, perf_drift: model.current_performance_drift_percentage * 0.8 },
    { time: "12h", data_drift: model.current_data_drift_percentage * 0.95, perf_drift: model.current_performance_drift_percentage * 0.9 },
    { time: "24h", data_drift: model.current_data_drift_percentage, perf_drift: model.current_performance_drift_percentage },
  ];

  return (
    <div className="space-y-5">
      {/* Selected Model Info */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">{model.model_name} v{model.model_version}</h3>
            <p className="text-[10px] text-gray-500">Last update: {model.last_monitoring_update ? new Date(model.last_monitoring_update).toLocaleString() : "—"}</p>
          </div>
          <Badge className={model.current_data_drift_percentage > 20 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}>
            {model.current_data_drift_percentage > 20 ? "⚠ ALERT" : "✓ HEALTHY"}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
          <Metric label="Data Drift" value={`${model.current_data_drift_percentage.toFixed(1)}%`} color={model.current_data_drift_percentage > 20 ? "#ff4757" : "#2ed573"} />
          <Metric label="Performance Drift" value={`${model.current_performance_drift_percentage.toFixed(1)}%`} color={model.current_performance_drift_percentage > 15 ? "#ffa502" : "#2ed573"} />
          <Metric label="Total Predictions" value={(model.total_predictions || 0).toLocaleString()} color="#00d4ff" />
          <Metric label="Risk Score" value={`${model.operational_risk_score || 0}%`} color={model.operational_risk_score > 70 ? "#ff4757" : "#2ed573"} />
        </div>
      </div>

      {/* Drift Trend */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-[#a855f7]" />
          <h3 className="text-sm font-bold text-white">Drift Trend (Last 24h)</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={driftData}>
            <defs>
              <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }} />
            <Area type="monotone" dataKey="data_drift" stroke="#a855f7" fillOpacity={1} fill="url(#colorDrift)" name="Data Drift" />
            <Area type="monotone" dataKey="perf_drift" stroke="#ffa502" fillOpacity={0.3} name="Performance Drift" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monitoring Alerts */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#ff4757]" />
          <h3 className="text-sm font-bold text-white">Active Alerts</h3>
        </div>
        <div className="space-y-2">
          {model.current_data_drift_percentage > 20 && (
            <AlertItem 
              title="High Data Drift Detected" 
              detail={`${model.current_data_drift_percentage.toFixed(1)}% drift exceeds 20% threshold`}
              severity="high"
            />
          )}
          {model.current_performance_drift_percentage > 15 && (
            <AlertItem 
              title="Performance Degradation" 
              detail={`${model.current_performance_drift_percentage.toFixed(1)}% performance drift detected`}
              severity="medium"
            />
          )}
          {model.operational_risk_score > 70 && (
            <AlertItem 
              title="High Operational Risk" 
              detail={`Risk score: ${model.operational_risk_score}%`}
              severity="high"
            />
          )}
          {!model.current_data_drift_percentage && (
            <div className="text-[10px] text-gray-500 p-3 rounded bg-green-500/5 border border-green-500/20">
              ✓ All systems healthy - continue monitoring
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="bg-black/20 rounded p-2 border border-white/5">
      <p className="text-gray-500">{label}</p>
      <p className="text-white font-semibold" style={{ color }}>{value}</p>
    </div>
  );
}

function AlertItem({ title, detail, severity }) {
  const bgColor = severity === "high" ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/20";
  const textColor = severity === "high" ? "text-red-400" : "text-orange-400";

  return (
    <div className={`text-[10px] p-3 rounded border ${bgColor}`}>
      <p className={`font-semibold ${textColor} mb-0.5`}>{title}</p>
      <p className="text-gray-400">{detail}</p>
    </div>
  );
}