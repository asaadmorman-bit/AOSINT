import React from "react";
import { X, Users, Database, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SEVERITY_COLORS = {
  critical: "#ff1744", high: "#ff6d00", medium: "#ffd600",
  low: "#00b0ff", informational: "#546e7a",
};

export default function TechniqueDetailPanel({ technique, actors, indicators, onClose }) {
  if (!technique) return null;
  const { color } = technique.tactic;

  const matchedActors = actors.filter(a =>
    (a.shared_ttps || []).some(t => t.includes(technique.id) || t.toLowerCase().includes(technique.name.toLowerCase())) ||
    (a.associated_campaigns || []).some(c => c.toLowerCase().includes(technique.id.toLowerCase()))
  );

  const matchedIndicators = indicators.filter(i =>
    (i.mitre_tactics || []).some(t => t.includes(technique.id) || t.toLowerCase().includes(technique.name.toLowerCase()))
  );

  return (
    <div className="bg-[#0d1220] border rounded-lg overflow-hidden" style={{ borderColor: `${color}40` }}>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b" style={{ borderColor: `${color}25`, background: `${color}12` }}>
        <div>
          <div className="text-[9px] font-mono mb-1" style={{ color }}>
            {technique.tactic.name} · {technique.id}
          </div>
          <h3 className="text-sm font-bold text-white">{technique.name}</h3>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[400px]">
        <a
          href={`https://attack.mitre.org/techniques/${technique.id}/`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-mono hover:underline"
          style={{ color }}
        >
          <ExternalLink className="w-3 h-3" />
          View on MITRE ATT&CK
        </a>

        {/* Matched actors */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              Threat Actors ({matchedActors.length})
            </span>
          </div>
          {matchedActors.length === 0 ? (
            <p className="text-[10px] text-gray-700 font-mono">No mapped actors in database</p>
          ) : (
            <div className="space-y-1.5">
              {matchedActors.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-white/4 rounded px-2 py-1.5">
                  <div>
                    <div className="text-xs font-semibold text-white">{a.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono capitalize">{a.actor_type} · {a.attributed_country || "unknown"}</div>
                  </div>
                  <Badge className={`text-[8px] font-mono ${a.status === "active" ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matched indicators */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="w-3 h-3 text-gray-500" />
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              Indicators ({matchedIndicators.length})
            </span>
          </div>
          {matchedIndicators.length === 0 ? (
            <p className="text-[10px] text-gray-700 font-mono">No indicators with this technique tagged</p>
          ) : (
            <div className="space-y-1.5">
              {matchedIndicators.slice(0, 6).map(ind => {
                const c = SEVERITY_COLORS[ind.severity] || "#546e7a";
                return (
                  <div key={ind.id} className="flex items-center justify-between bg-white/4 rounded px-2 py-1.5">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-white truncate">{ind.title}</div>
                      <div className="text-[9px] font-mono truncate" style={{ color: "#00e5ff" }}>{ind.value}</div>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded ml-2 shrink-0"
                      style={{ background: `${c}20`, color: c }}>
                      {ind.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}