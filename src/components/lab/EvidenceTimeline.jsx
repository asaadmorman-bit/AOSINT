import React from "react";
import { format } from "date-fns";
import { Database, AlertTriangle, Users, Target, FileText, Cpu, ExternalLink } from "lucide-react";

const TYPE_META = {
  indicator:  { label: "Indicator",  color: "#ff4757", icon: AlertTriangle },
  narrative:  { label: "Narrative",  color: "#00d4ff", icon: Cpu },
  actor:      { label: "Actor",      color: "#a855f7", icon: Users },
  campaign:   { label: "Campaign",   color: "#f59e0b", icon: Target },
  report:     { label: "Report",     color: "#2ed573", icon: FileText },
  raw_intel:  { label: "Raw Intel",  color: "#6b7280", icon: Database },
};

export default function EvidenceTimeline({ evidenceItems }) {
  if (!evidenceItems || evidenceItems.length === 0) {
    return (
      <div className="bg-[#111827] border border-dashed border-white/10 rounded-xl p-8 text-center">
        <Database className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No evidence linked yet</p>
        <p className="text-gray-600 text-xs mt-1">Use "Add Evidence" to link feed sources, indicators, or reports</p>
      </div>
    );
  }

  const sorted = [...evidenceItems].sort((a, b) =>
    new Date(b.observed_at || b.created_date) - new Date(a.observed_at || a.created_date)
  );

  return (
    <div className="space-y-2">
      {sorted.map((item, idx) => {
        const meta = TYPE_META[item.reference_type] || TYPE_META.raw_intel;
        const Icon = meta.icon;
        return (
          <div key={item.id || idx} className="flex gap-3 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </div>
              {idx < sorted.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1 min-h-[12px]" />}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${meta.color}15`, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono truncate">{item.feed_source}</span>
                    {item.relevance_score != null && (
                      <span className="text-[9px] text-[#2ed573]">
                        {item.relevance_score}% relevant
                      </span>
                    )}
                  </div>
                  {item.reference_title && (
                    <p className="text-xs font-medium text-white truncate">{item.reference_title}</p>
                  )}
                  {item.summary && (
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5 line-clamp-2">{item.summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-600 hover:text-[#00d4ff] transition-colors">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {item.observed_at && (
                    <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">
                      {format(new Date(item.observed_at), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
              {item.confidence != null && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[9px] text-gray-600">Confidence</span>
                  <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded-full">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${item.confidence}%`,
                        background: item.confidence >= 70 ? "#2ed573" : item.confidence >= 40 ? "#ffa502" : "#ff4757"
                      }} />
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{item.confidence}%</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}