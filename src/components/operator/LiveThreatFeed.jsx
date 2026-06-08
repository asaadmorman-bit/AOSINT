import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Radio, Layers, Globe2, MessageSquare, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DOMAIN_META = {
  cyber: { color: "#00d4ff", icon: Radio },
  physical: { color: "#ffa502", icon: AlertTriangle },
  influence: { color: "#a855f7", icon: MessageSquare },
  hybrid: { color: "#ff4757", icon: Layers },
  geopolitical: { color: "#f59e0b", icon: Globe2 },
};

const SEV_COLORS = {
  critical: "#ff4757", high: "#ffa502", medium: "#00d4ff",
  low: "#2ed573", informational: "#6b7280"
};

export default function LiveThreatFeed({ events, search, loading, userTier }) {
  const filtered = events.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title?.toLowerCase().includes(q) || e.region?.toLowerCase().includes(q) || e.domain?.toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-[#ff4757] animate-spin" />
    </div>
  );

  if (filtered.length === 0) return (
    <div className="text-center py-16">
      <Radio className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{search ? "No events match your search" : "No active events"}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {filtered.map((event, i) => {
        const meta = DOMAIN_META[event.domain] || DOMAIN_META.cyber;
        const Icon = meta.icon;
        const sevColor = SEV_COLORS[event.severity] || "#6b7280";
        return (
          <div key={event.id || i}
            className="flex items-start gap-3 p-3 bg-[#0d1117] border border-white/5 rounded-xl hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}15` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${sevColor}15`, color: sevColor }}>
                  {event.severity?.toUpperCase()}
                </span>
                <span className="text-[9px] text-gray-600 capitalize">{event.domain}</span>
                {event.is_cross_domain && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] font-bold">CROSS-DOMAIN</span>
                )}
                {event.region && <span className="text-[9px] text-gray-700">{event.region}</span>}
              </div>
              <p className="text-xs font-medium text-white leading-snug">{event.title}</p>
              {event.description && (
                <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{event.description}</p>
              )}
              {event.sectors_affected?.length > 0 && (
                <p className="text-[9px] text-gray-700 mt-1">{event.sectors_affected.slice(0, 3).join(" · ")}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                event.status === "active" ? "bg-[#ff4757]/15 text-[#ff4757]" :
                event.status === "investigating" ? "bg-[#ffa502]/15 text-[#ffa502]" :
                "bg-white/5 text-gray-500"
              }`}>{event.status}</span>
              {event.created_date && (
                <p className="text-[9px] text-gray-700 mt-1 font-mono">
                  {formatDistanceToNow(new Date(event.created_date), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}