import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, Database, MapPin, Tag } from "lucide-react";
import { STATUS_META, CATEGORY_META, PRIORITY_META } from "@/pages/QuestionLab";

export default function QuestionCard({ question: q, evidenceCount, userTier, viewMode, onSelect, isSelected }) {
  const statusMeta = STATUS_META[q.status] || STATUS_META.unanswered;
  const catMeta = CATEGORY_META[q.category] || CATEGORY_META.custom;
  const prioMeta = PRIORITY_META[q.priority] || PRIORITY_META.medium;

  const hasConfidence = q.confidence_level != null;
  const confidenceColor = (q.confidence_level || 0) >= 60 ? "#2ed573" : (q.confidence_level || 0) >= 30 ? "#ffa502" : "#ff4757";

  if (viewMode === "grid") {
    return (
      <div
        onClick={onSelect}
        className={`bg-[#111827] border rounded-xl p-4 cursor-pointer transition-all hover:border-white/10 flex flex-col gap-3 ${
          isSelected ? "border-[#00d4ff]/30 shadow-[0_0_0_1px_rgba(0,212,255,0.1)]" : "border-white/5"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>
              {catMeta.label}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${statusMeta.color}20`, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          </div>
          {q.priority === "critical" && (
            <span className="text-[9px] font-black text-red-400 shrink-0">●CRITICAL</span>
          )}
        </div>

        <p className="text-sm text-white font-medium leading-relaxed line-clamp-3">{q.question}</p>

        {hasConfidence && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Confidence</span>
              <span className="text-[10px] font-bold" style={{ color: confidenceColor }}>{q.confidence_level}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full">
              <div className="h-full rounded-full transition-all" style={{ width: `${q.confidence_level}%`, background: confidenceColor }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            {evidenceCount > 0 && (
              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                <Database className="w-3 h-3" />{evidenceCount}
              </span>
            )}
            {q.source === "report_2026" && (
              <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded">2026</span>
            )}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div
      onClick={onSelect}
      className={`bg-[#111827] border rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:border-white/10 ${
        isSelected ? "border-[#00d4ff]/30 shadow-[0_0_0_1px_rgba(0,212,255,0.1)]" : "border-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: statusMeta.color, boxShadow: `0 0 6px ${statusMeta.color}60` }} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>
              {catMeta.label}
            </span>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${statusMeta.color}15`, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
            {q.priority === "critical" && (
              <span className="text-[9px] font-black text-red-400">CRITICAL</span>
            )}
            {q.source === "report_2026" && (
              <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded font-semibold">2026 Report</span>
            )}
            {evidenceCount > 0 && (
              <span className="text-[9px] text-gray-500 flex items-center gap-1 ml-1">
                <Database className="w-2.5 h-2.5" />{evidenceCount} evidence
              </span>
            )}
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{q.question}</p>
          
          <div className="flex items-center gap-4 mt-2">
            {hasConfidence && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-white/5 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${q.confidence_level}%`, background: confidenceColor }} />
                </div>
                <span className="text-[9px] font-semibold" style={{ color: confidenceColor }}>{q.confidence_level}%</span>
              </div>
            )}
            {q.related_regions?.length > 0 && (
              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />{q.related_regions.slice(0, 2).join(", ")}
                {q.related_regions.length > 2 && ` +${q.related_regions.length - 2}`}
              </span>
            )}
            {q.tags?.length > 0 && (
              <span className="text-[9px] text-gray-500 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />{q.tags.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${isSelected ? "rotate-90 text-[#00d4ff]" : "text-gray-700"}`} />
      </div>
    </div>
  );
}