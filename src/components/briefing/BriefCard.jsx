import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Pin, Clock, ChevronRight, Loader2, Shield, AlertTriangle, Globe2, Zap } from "lucide-react";
import { format } from "date-fns";

const TYPE_META = {
  weekly_strategic:     { label: "Weekly Strategic",     color: "#00d4ff", icon: Globe2 },
  daily_operational:    { label: "Daily Operational",    color: "#2ed573", icon: Zap },
  executive_protection: { label: "Executive Protection", color: "#a855f7", icon: Shield },
  law_enforcement:      { label: "Law Enforcement",      color: "#f59e0b", icon: Shield },
  custom:               { label: "Custom Brief",          color: "#6b7280", icon: FileText },
};

export default function BriefCard({ brief, onOpen }) {
  const meta = TYPE_META[brief.brief_type] || TYPE_META.custom;
  const Icon = meta.icon;
  const isGenerating = brief.status === "generating";

  return (
    <div
      className={`bg-[#111827] border rounded-xl p-4 hover:border-white/15 transition-all cursor-pointer group ${
        brief.is_pinned ? "border-[#00d4ff]/30" : "border-white/5"
      }`}
      onClick={() => !isGenerating && onOpen(brief)}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}20` }}>
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: meta.color }} /> :
            <Icon className="w-4 h-4" style={{ color: meta.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${meta.color}15`, color: meta.color }}>
              {meta.label}
            </span>
            {brief.is_pinned && <Pin className="w-3 h-3 text-[#00d4ff]" />}
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${
              brief.status === 'ready' ? 'bg-[#2ed573]/15 text-[#2ed573]' :
              brief.status === 'generating' ? 'bg-[#ffa502]/15 text-[#ffa502]' :
              'bg-white/5 text-gray-500'
            }`}>{brief.status}</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">{brief.title}</p>
          {brief.executive_summary && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{brief.executive_summary}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {brief.generated_at ? format(new Date(brief.generated_at), "MMM d, yyyy") : "Pending"}
            </span>
            {brief.key_metrics?.threat_level && (
              <span className="text-[11px] font-bold text-[#ff4757] bg-[#ff4757]/10 px-1.5 py-0.5 rounded">
                {brief.key_metrics.threat_level}
              </span>
            )}
          </div>
        </div>
        {!isGenerating && (
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}