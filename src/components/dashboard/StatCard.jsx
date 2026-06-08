import React from "react";

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "#00d4ff", onClick }) {
  return (
    <div
      className={`bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trendUp ? "text-[#2ed573]" : "text-[#ff4757]"}`}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div
          className="p-2.5 rounded-lg transition-colors"
          style={{ background: `${color}10` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}