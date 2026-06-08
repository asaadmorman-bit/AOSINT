import React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RiskTrajectoryAnalysis({ trajectoryData }) {
  if (!trajectoryData) return null;

  const { trajectory, trajectory_reason, risk_trend_30_days, risk_trend_90_days, inflection_points } = trajectoryData;

  const trajectoryIcon = {
    increasing: { icon: TrendingUp, color: "text-red-400", label: "Increasing" },
    stable: { icon: Minus, color: "text-yellow-400", label: "Stable" },
    decreasing: { icon: TrendingDown, color: "text-green-400", label: "Decreasing" },
  }[trajectory] || { icon: AlertCircle, color: "text-gray-400", label: "Unknown" };

  const TrajIcon = trajectoryIcon.icon;

  return (
    <div className="space-y-4">
      {/* Main Trajectory Card */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" /> Risk Trajectory Analysis
        </h3>

        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-lg">
          <TrajIcon className={`w-8 h-8 ${trajectoryIcon.color}`} />
          <div className="flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Trajectory</p>
            <p className={`text-lg font-bold capitalize ${trajectoryIcon.color}`}>{trajectoryIcon.label}</p>
          </div>
        </div>

        {trajectory_reason && (
          <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <p className="text-xs text-gray-300">
              <span className="text-gray-400 font-semibold">Why: </span>
              {trajectory_reason}
            </p>
          </div>
        )}

        {/* Trend Cards */}
        {(risk_trend_30_days || risk_trend_90_days) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {risk_trend_30_days && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">30-Day Trend</p>
                <p className="text-sm font-bold text-white">{risk_trend_30_days}</p>
              </div>
            )}
            {risk_trend_90_days && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">90-Day Trend</p>
                <p className="text-sm font-bold text-white">{risk_trend_90_days}</p>
              </div>
            )}
          </div>
        )}

        {/* Inflection Points */}
        {inflection_points && inflection_points.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/40">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Key Inflection Points</p>
            <div className="space-y-2">
              {inflection_points.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 mt-0.5">→</span>
                  <div>
                    <p className="text-gray-300"><span className="font-semibold">{point.event}</span> ({new Date(point.date).toLocaleDateString()})</p>
                    <p className="text-gray-500 text-[9px]">Impact: {point.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visualization */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 text-center py-6">
          Risk trend visualization would display here (historical risk scores over time)
        </p>
      </div>
    </div>
  );
}