import React from "react";
import { X, Tag, Calendar, AlertTriangle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const SEVERITY_COLORS = {
  critical: "#ff1744", high: "#ff6d00", medium: "#ffd600",
  low: "#00b0ff", informational: "#546e7a",
};

export default function IndicatorDetailPanel({ indicator, onClose }) {
  if (!indicator) return null;
  const c = SEVERITY_COLORS[indicator.severity] || "#546e7a";

  return (
    <div className="bg-[#0d1220] border border-white/8 rounded-lg p-4 h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">
            {indicator.indicator_type?.replace("_", " ")}
          </div>
          <h3 className="text-sm font-bold text-white leading-tight truncate">{indicator.title}</h3>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 ml-2 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className="text-[9px] font-mono border" style={{ background: `${c}18`, color: c, borderColor: `${c}40` }}>
          {indicator.severity?.toUpperCase()}
        </Badge>
        {indicator.threat_category && (
          <Badge className="text-[9px] font-mono bg-white/5 text-gray-400 border-white/10">
            {indicator.threat_category}
          </Badge>
        )}
        <Badge className={`text-[9px] font-mono ${indicator.status === "active" ? "bg-green-900/30 text-green-400 border-green-700/30" : "bg-gray-800/50 text-gray-500 border-gray-700/30"}`}>
          {indicator.status}
        </Badge>
      </div>

      {indicator.value && (
        <div className="mb-3 p-2 bg-black/30 rounded border border-white/5">
          <div className="text-[8px] text-gray-600 font-mono mb-0.5 uppercase tracking-widest">Value</div>
          <div className="text-xs font-mono text-[#00e5ff] break-all">{indicator.value}</div>
        </div>
      )}

      {indicator.notes && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{indicator.notes}</p>
      )}

      {indicator.confidence !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-[9px] font-mono text-gray-600 mb-1">
            <span>CONFIDENCE</span><span>{indicator.confidence}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${indicator.confidence}%`, background: c }} />
          </div>
        </div>
      )}

      {indicator.mitre_tactics?.length > 0 && (
        <div className="mb-3">
          <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1.5">MITRE ATT&CK</div>
          <div className="flex flex-wrap gap-1">
            {indicator.mitre_tactics.map(t => (
              <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff9100]/10 text-[#ff9100] border border-[#ff9100]/20">{t}</span>
            ))}
          </div>
        </div>
      )}

      {indicator.tags?.length > 0 && (
        <div className="mb-3">
          <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1.5">Tags</div>
          <div className="flex flex-wrap gap-1">
            {indicator.tags.map(t => (
              <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="text-[8px] text-gray-700 font-mono mt-auto pt-2 border-t border-white/5">
        {indicator.first_seen && <div>First: {format(new Date(indicator.first_seen), "MMM d, yyyy HH:mm")}</div>}
        {indicator.last_seen && <div>Last: {format(new Date(indicator.last_seen), "MMM d, yyyy HH:mm")}</div>}
      </div>
    </div>
  );
}