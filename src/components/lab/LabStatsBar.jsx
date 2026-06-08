import React from "react";
import { HelpCircle, AlertTriangle, Clock, CheckCircle2, Database, TrendingUp } from "lucide-react";

const STATS = [
  { key: "unanswered",         label: "Unanswered",   color: "#ff4757", icon: HelpCircle },
  { key: "partially_answered", label: "Partial",      color: "#ffa502", icon: AlertTriangle },
  { key: "under_review",       label: "Under Review", color: "#00d4ff", icon: Clock },
  { key: "answered",           label: "Answered",     color: "#2ed573", icon: CheckCircle2 },
];

export default function LabStatsBar({ questions, evidenceItems }) {
  const totalEvidence = evidenceItems.length;
  const avgConfidence = questions.length
    ? Math.round(questions.filter(q => q.confidence_level).reduce((s, q) => s + q.confidence_level, 0) / Math.max(1, questions.filter(q => q.confidence_level).length))
    : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {STATS.map(({ key, label, color, icon: Icon }) => {
        const count = questions.filter(q => q.status === key).length;
        return (
          <div key={key} className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
              <Icon className="w-4 h-4 opacity-40" style={{ color }} />
            </div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
          </div>
        );
      })}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-[#a855f7]">{totalEvidence}</p>
          <Database className="w-4 h-4 opacity-40 text-[#a855f7]" />
        </div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Evidence Items</p>
      </div>
      <div className="bg-[#111827] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-[#f59e0b]">{avgConfidence}%</p>
          <TrendingUp className="w-4 h-4 opacity-40 text-[#f59e0b]" />
        </div>
        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Avg Confidence</p>
      </div>
    </div>
  );
}