import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTION_COLORS = {
  signal_processed: "#00d4ff", alert_routed: "#2ed573", escalation_triggered: "#ffa502",
  verification_requested: "#a855f7", collaboration_sent: "#00d4ff", config_changed: "#6b7280",
  activated: "#2ed573", deactivated: "#ff4757", error: "#ff4757"
};

export default function AgentAuditViewer({ agentId }) {
  const [limit, setLimit] = useState(20);

  const { data: logs = [] } = useQuery({
    queryKey: ["agent_audit", agentId, limit],
    queryFn: () => agentId
      ? base44.entities.AgentAuditLog.filter({ agent_id: agentId }, "-created_date", limit)
      : base44.entities.AgentAuditLog.list("-created_date", limit),
  });

  if (logs.length === 0) return (
    <div className="text-center py-12">
      <Shield className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">No audit log entries</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {logs.map((log, i) => {
        const color = ACTION_COLORS[log.action_type] || "#6b7280";
        return (
          <div key={log.id || i} className="flex items-start gap-3 p-3 bg-[#0d1117] border border-white/5 rounded-xl">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
              {log.safety_check_passed ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color }} /> : <AlertTriangle className="w-3.5 h-3.5 text-[#ff4757]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${color}10`, color }}>
                  {log.action_type?.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">{log.agent_name}</span>
                {log.human_reviewed && (
                  <span className="text-[9px] bg-[#2ed573]/10 text-[#2ed573] px-1.5 py-0.5 rounded">Human Reviewed</span>
                )}
              </div>
              <p className="text-xs text-gray-300">{log.action}</p>
              {log.output_summary && (
                <p className="text-[10px] text-gray-600 mt-0.5 line-clamp-1">{log.output_summary}</p>
              )}
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                log.outcome === "success" ? "bg-[#2ed573]/10 text-[#2ed573]" :
                log.outcome === "escalated" ? "bg-[#ffa502]/10 text-[#ffa502]" :
                "bg-[#ff4757]/10 text-[#ff4757]"
              }`}>{log.outcome}</p>
              {log.created_date && (
                <p className="text-[9px] text-gray-700 font-mono">
                  {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                </p>
              )}
              {log.duration_ms && <p className="text-[9px] text-gray-700 font-mono">{log.duration_ms}ms</p>}
            </div>
          </div>
        );
      })}
      {logs.length >= limit && (
        <button onClick={() => setLimit(l => l + 20)}
          className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 border border-white/5 rounded-xl transition-colors">
          Load more
        </button>
      )}
    </div>
  );
}