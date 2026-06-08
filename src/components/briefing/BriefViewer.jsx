import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Pin, PinOff, Download, Globe2, Shield, Zap, FileText,
  AlertTriangle, Activity, TrendingUp, MapPin, Clock, CheckCircle2,
  HelpCircle, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const SECTIONS = [
  { key: "executive_summary",        label: "Executive Summary",          icon: Globe2,        color: "#00d4ff" },
  { key: "threat_landscape",         label: "Global Threat Landscape",    icon: AlertTriangle, color: "#ff4757" },
  { key: "fragmentation_index",      label: "Fragmentation Index",        icon: Activity,      color: "#a855f7" },
  { key: "convergence_patterns",     label: "Convergence Patterns",       icon: TrendingUp,    color: "#f59e0b" },
  { key: "ransomware_evolution",     label: "Ransomware Evolution",       icon: Shield,        color: "#ff6b35" },
  { key: "influence_narratives",     label: "Influence Narratives",       icon: Globe2,        color: "#00d4ff" },
  { key: "sector_vulnerabilities",   label: "Sector Vulnerabilities",     icon: BarChart3,     color: "#2ed573" },
  { key: "warning_time_analysis",    label: "Warning Time Analysis",      icon: Clock,         color: "#ffa502" },
  { key: "regional_instability",     label: "Regional Instability",       icon: MapPin,        color: "#ff4757" },
  { key: "asset_exposure_summary",   label: "Asset Exposure",             icon: Shield,        color: "#a855f7" },
  { key: "unanswered_questions_summary", label: "Unanswered Questions",  icon: HelpCircle,    color: "#6b7280" },
];

export default function BriefViewer({ brief, onClose, onUpdate }) {
  const [activeSection, setActiveSection] = useState("executive_summary");
  const [editingAnnotations, setEditingAnnotations] = useState(false);
  const [annotations, setAnnotations] = useState(brief.annotations || "");
  const queryClient = useQueryClient();

  const pinMutation = useMutation({
    mutationFn: () => base44.entities.IntelBrief.update(brief.id, { is_pinned: !brief.is_pinned }),
    onSuccess: (updated) => { onUpdate(updated); queryClient.invalidateQueries({ queryKey: ["intel_briefs"] }); },
  });

  const annotationMutation = useMutation({
    mutationFn: (text) => base44.entities.IntelBrief.update(brief.id, { annotations: text }),
    onSuccess: (updated) => { onUpdate(updated); setEditingAnnotations(false); queryClient.invalidateQueries({ queryKey: ["intel_briefs"] }); },
  });

  const availableSections = SECTIONS.filter(s => brief[s.key]);
  const currentSection = availableSections.find(s => s.key === activeSection) || availableSections[0];
  const content = brief[currentSection?.key];

  const exportBrief = () => {
    const text = SECTIONS.filter(s => brief[s.key]).map(s =>
      `## ${s.label}\n\n${brief[s.key]}\n`
    ).join('\n---\n\n');
    const recommended = brief.recommended_actions?.length
      ? `\n## Recommended Actions\n\n${brief.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : '';
    const blob = new Blob([`# ${brief.title}\nGenerated: ${brief.generated_at ? format(new Date(brief.generated_at), "PPP") : "N/A"}\n\n${text}${recommended}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${brief.title}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl mx-auto bg-[#0d1220] border border-white/10 rounded-2xl m-4 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-white/5 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-[#00d4ff] bg-[#00d4ff]/10 px-2 py-0.5 rounded uppercase tracking-wider">Intelligence Brief</span>
              {brief.key_metrics?.threat_level && (
                <span className="text-[9px] font-black text-[#ff4757] bg-[#ff4757]/10 px-2 py-0.5 rounded">{brief.key_metrics.threat_level} THREAT</span>
              )}
              {brief.generated_at && (
                <span className="text-[9px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {format(new Date(brief.generated_at), "MMM d, yyyy HH:mm")}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white">{brief.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => pinMutation.mutate()}
              className={`h-8 w-8 p-0 ${brief.is_pinned ? "text-[#00d4ff]" : "text-gray-500 hover:text-white"}`}>
              {brief.is_pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={exportBrief} className="h-8 w-8 p-0 text-gray-500 hover:text-white">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        {brief.key_metrics && (
          <div className="flex gap-4 px-5 py-3 border-b border-white/5 bg-black/20 overflow-x-auto shrink-0">
            {brief.key_metrics.fragmentation_score != null && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-gray-500 uppercase">Fragmentation</span>
                <span className="text-sm font-bold text-[#a855f7]">{brief.key_metrics.fragmentation_score}/100</span>
              </div>
            )}
            {brief.key_metrics.convergence_score != null && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-gray-500 uppercase">Convergence</span>
                <span className="text-sm font-bold text-[#f59e0b]">{brief.key_metrics.convergence_score}/100</span>
              </div>
            )}
            {brief.key_metrics.warning_time_days != null && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-gray-500 uppercase">Warning Time</span>
                <span className="text-sm font-bold text-[#ff4757]">{brief.key_metrics.warning_time_days}d</span>
              </div>
            )}
            {brief.key_metrics.active_ransomware_families != null && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-gray-500 uppercase">Active Ransomware</span>
                <span className="text-sm font-bold text-[#ff6b35]">{brief.key_metrics.active_ransomware_families}</span>
              </div>
            )}
            {brief.key_metrics.top_targeted_sectors?.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] text-gray-500 uppercase">Top Sectors</span>
                <span className="text-xs text-gray-300">{brief.key_metrics.top_targeted_sectors.slice(0, 3).join(", ")}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Section Nav */}
          <div className="w-48 border-r border-white/5 overflow-y-auto shrink-0 py-2">
            {availableSections.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  activeSection === s.key ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/3"
                }`}>
                <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: activeSection === s.key ? s.color : undefined }} />
                <span className="leading-tight">{s.label}</span>
              </button>
            ))}
            {brief.recommended_actions?.length > 0 && (
              <button onClick={() => setActiveSection("actions")}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  activeSection === "actions" ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300"
                }`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: activeSection === "actions" ? "#2ed573" : undefined }} />
                <span>Recommended Actions</span>
              </button>
            )}
            <button onClick={() => setActiveSection("annotations")}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                activeSection === "annotations" ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300"
              }`}>
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>My Annotations</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "actions" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#2ed573] flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4" /> Recommended Actions
                </h3>
                {brief.recommended_actions?.map((action, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-lg">
                    <span className="text-[#2ed573] font-black text-sm shrink-0 w-5">{i + 1}.</span>
                    <p className="text-sm text-gray-200 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            ) : activeSection === "annotations" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> My Annotations</h3>
                  {!editingAnnotations && (
                    <Button size="sm" variant="ghost" onClick={() => setEditingAnnotations(true)} className="h-7 text-xs text-[#00d4ff]">Edit</Button>
                  )}
                </div>
                {editingAnnotations ? (
                  <div className="space-y-3">
                    <Textarea value={annotations} onChange={e => setAnnotations(e.target.value)}
                      className="bg-white/5 border-white/10 text-white min-h-[200px] text-sm" placeholder="Add your private annotations for this brief..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => annotationMutation.mutate(annotations)} disabled={annotationMutation.isPending}
                        className="h-8 text-xs bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
                        {annotationMutation.isPending ? "Saving..." : "Save Annotations"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingAnnotations(false)} className="h-8 text-xs text-gray-500">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5 min-h-[100px]">
                    {brief.annotations ? (
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{brief.annotations}</p>
                    ) : (
                      <p className="text-gray-600 text-sm italic">No annotations yet. Click Edit to add your notes.</p>
                    )}
                  </div>
                )}
              </div>
            ) : currentSection && content ? (
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: currentSection.color }}>
                  <currentSection.icon className="w-4 h-4" /> {currentSection.label}
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{content}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}