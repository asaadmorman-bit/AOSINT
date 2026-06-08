import React from "react";
import { CheckSquare, Shield, AlertTriangle, Eye, Users, Lock } from "lucide-react";

const STATIC_ACTIONS = [
  { icon: Shield, color: "#ff4757", priority: "critical", title: "Review critical asset exposure", body: "Cross-reference high-risk assets against active threat actor targeting patterns." },
  { icon: Eye, color: "#ffa502", priority: "high", title: "Monitor convergence acceleration", body: "Escalating cross-domain correlation detected. Brief senior leadership on convergence nodes above score 75." },
  { icon: AlertTriangle, color: "#ffa502", priority: "high", title: "Validate ransomware preparedness", body: "Active RaaS operators targeting your sector. Verify backup integrity and incident response readiness." },
  { icon: Users, color: "#00d4ff", priority: "medium", title: "Review narrative exposure", body: "Influence narratives propagating across platforms. Assess brand and reputational risk posture." },
  { icon: Lock, color: "#2ed573", priority: "medium", title: "Close top 3 intelligence gaps", body: "Direct analyst resources to critical unanswered questions to reduce strategic blind spots." },
];

export default function RecommendedActions({ indicators, events, userTier }) {
  const PRIORITY_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#6b7280" };

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-4 h-4 text-[#2ed573]" />
        <h3 className="text-sm font-bold text-white">Recommended Actions</h3>
      </div>

      <div className="space-y-3">
        {STATIC_ACTIONS.map(({ icon: Icon, color, priority, title, body }, i) => (
          <div key={i} className="flex gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-semibold text-white">{title}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold capitalize shrink-0"
                  style={{ background: `${PRIORITY_COLORS[priority]}15`, color: PRIORITY_COLORS[priority] }}>
                  {priority}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-gray-700 mt-3">High-level strategic guidance only. No sensitive operational detail included.</p>
    </div>
  );
}