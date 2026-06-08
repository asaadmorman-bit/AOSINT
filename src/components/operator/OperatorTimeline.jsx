import React from "react";
import { Clock, AlertTriangle, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const SEV_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573", informational: "#6b7280" };

export default function OperatorTimeline({ events, fieldReports, userTier }) {
  const combined = [
    ...events.map(e => ({ ...e, _type: "event" })),
    ...fieldReports.map(r => ({ ...r, _type: "report", severity: r.priority })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 30);

  if (combined.length === 0) return (
    <div className="text-center py-16">
      <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">No timeline events yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {combined.map((item, i) => {
        const color = SEV_COLORS[item.severity] || "#6b7280";
        const isEvent = item._type === "event";
        return (
          <div key={item.id || i} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                {isEvent ? <AlertTriangle className="w-3 h-3" style={{ color }} /> : <FileText className="w-3 h-3" style={{ color }} />}
              </div>
              {i < combined.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1 min-h-[16px]" />}
            </div>
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: `${color}15`, color }}>
                    {isEvent ? item.event_type?.replace(/_/g, " ").toUpperCase() : "FIELD REPORT"}
                  </span>
                  {item.region && <span className="text-[9px] text-gray-600">{item.region}</span>}
                </div>
                <span className="text-[9px] text-gray-700 font-mono shrink-0">
                  {item.created_date ? formatDistanceToNow(new Date(item.created_date), { addSuffix: true }) : ""}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{item.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}