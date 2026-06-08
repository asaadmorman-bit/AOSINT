import React from "react";
import { HelpCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PRIORITY_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#6b7280" };
const CAT_LABELS = {
  fragmentation: "Fragmentation", convergence: "Convergence", warning_time: "Warning Time",
  ransomware: "Ransomware", influence: "Influence", cross_domain: "Cross-Domain",
  actor_tracking: "Actor Tracking", custom: "Custom"
};

export default function UnansweredSummary({ questions, userTier }) {
  const critical = questions.filter(q => q.priority === "critical");
  const high = questions.filter(q => q.priority === "high");
  const top = questions.slice(0, 5);

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#00d4ff]" />
          <h3 className="text-sm font-bold text-white">Unanswered Intel Gaps</h3>
        </div>
        <Link to={createPageUrl("QuestionLab")} className="text-[10px] text-gray-600 hover:text-[#00d4ff] flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-black/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-[#ff4757]">{critical.length}</p>
          <p className="text-[9px] text-gray-600">Critical Gaps</p>
        </div>
        <div className="flex-1 bg-black/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-[#ffa502]">{high.length}</p>
          <p className="text-[9px] text-gray-600">High Priority</p>
        </div>
        <div className="flex-1 bg-black/30 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold font-mono text-white">{questions.length}</p>
          <p className="text-[9px] text-gray-600">Total Open</p>
        </div>
      </div>

      <div className="space-y-2">
        {top.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No open intelligence gaps</p>
        )}
        {top.map((q, i) => (
          <div key={q.id || i} className="flex items-start gap-2.5 p-2.5 bg-black/20 rounded-xl border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: PRIORITY_COLORS[q.priority] || "#6b7280" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">{q.question}</p>
              <p className="text-[9px] text-gray-700 mt-0.5">{CAT_LABELS[q.category] || q.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}