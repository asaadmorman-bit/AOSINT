import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Database, Globe2, Users, MessageSquare, Server, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const PRIORITY_COLORS = {
  immediate: "#ff4757",
  high:      "#ffa502",
  medium:    "#00d4ff",
  low:       "#6b7280",
};

export default function GapAnalysisPanel({ gapAnalyses, userTier, onGenerate, generating }) {
  if (!gapAnalyses || gapAnalyses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-[#111827] border border-dashed border-white/10 rounded-xl p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium mb-1">No gap analysis generated yet</p>
          <p className="text-gray-600 text-xs mb-5">AI will identify missing data types, recommended feeds, and collection priorities</p>
          <Button onClick={onGenerate} disabled={generating}
            className="bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/30 gap-2 font-semibold">
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <>
              <AlertTriangle className="w-3.5 h-3.5" /> Generate Gap Analysis
            </>}
          </Button>
        </div>
      </div>
    );
  }

  const latest = gapAnalyses[0];
  const priorityColor = PRIORITY_COLORS[latest.collection_priority] || "#6b7280";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded"
            style={{ background: `${priorityColor}15`, color: priorityColor }}>
            {latest.collection_priority?.toUpperCase()} PRIORITY
          </span>
          {latest.generated_at && (
            <span className="text-[9px] text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(latest.generated_at), "MMM d, yyyy HH:mm")}
            </span>
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
            latest.status === "actioned" ? "bg-[#2ed573]/15 text-[#2ed573]" :
            latest.status === "dismissed" ? "bg-white/5 text-gray-500" :
            "bg-[#ffa502]/15 text-[#ffa502]"
          }`}>{latest.status}</span>
        </div>
        <Button size="sm" onClick={onGenerate} disabled={generating}
          className="h-7 text-xs bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/20 gap-1.5">
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
          Refresh
        </Button>
      </div>

      {/* AI Rationale */}
      {latest.ai_rationale && (
        <div className="bg-[#a855f7]/5 border border-[#a855f7]/15 rounded-xl p-4">
          <p className="text-[9px] text-[#a855f7] uppercase tracking-wider font-semibold mb-2">AI Rationale</p>
          <p className="text-xs text-gray-300 leading-relaxed">{latest.ai_rationale}</p>
        </div>
      )}

      {/* Gap Sections */}
      <div className="space-y-3">
        {latest.missing_data_types?.length > 0 && (
          <GapSection icon={Database} label="Missing Data Types" color="#ff4757"
            items={latest.missing_data_types} />
        )}
        {latest.recommended_feeds?.length > 0 && (
          <GapSection icon={Server} label="Recommended Feeds" color="#00d4ff"
            items={latest.recommended_feeds} />
        )}
        {latest.recommended_regions?.length > 0 && (
          <GapSection icon={Globe2} label="Regions to Monitor" color="#2ed573"
            items={latest.recommended_regions} />
        )}
        {latest.recommended_actors_to_monitor?.length > 0 && (
          <GapSection icon={Users} label="Actors to Monitor" color="#a855f7"
            items={latest.recommended_actors_to_monitor} />
        )}
        {latest.recommended_narratives_to_track?.length > 0 && (
          <GapSection icon={MessageSquare} label="Narratives to Track" color="#f59e0b"
            items={latest.recommended_narratives_to_track} />
        )}
        {latest.dark_web_sources?.length > 0 && (userTier === "enterprise" || userTier === "gov") && (
          <GapSection icon={Eye} label="Dark Web Sources" color="#ff6b35"
            items={latest.dark_web_sources} locked={false} />
        )}
      </div>

      {/* History */}
      {gapAnalyses.length > 1 && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Previous Analyses ({gapAnalyses.length - 1})</p>
          <div className="space-y-1">
            {gapAnalyses.slice(1).map((g, i) => (
              <div key={g.id || i} className="flex items-center justify-between text-[11px] text-gray-500 py-1 border-b border-white/3">
                <span>{g.generated_at ? format(new Date(g.generated_at), "MMM d, yyyy") : "Unknown date"}</span>
                <span className="capitalize">{g.collection_priority} priority</span>
                <span className="capitalize">{g.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GapSection({ icon: Icon, label, color, items }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color }}>
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded border font-mono"
            style={{ background: `${color}10`, color, borderColor: `${color}20` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}