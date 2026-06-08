import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Loader2, Trash2, Clock, ChevronRight } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";
import AMANIPanel from "@/components/agents/AMANIPanel";

const REPORT_TYPES = ["situational_awareness", "threat_assessment", "pattern_of_life", "adversary_profile", "campaign_analysis", "golaxy_exposure", "below_threshold_activity"];
const TIME_SENSITIVITY = ["immediate", "hours", "days", "weeks"];

const timeSensColors = { immediate: "#ff4757", hours: "#ffa502", days: "#00d4ff", weeks: "#6b7280" };

export default function IntelReports() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", report_type: "situational_awareness", time_sensitivity: "hours" });

  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["intel_reports"],
    queryFn: () => base44.entities.IntelligenceReport.list("-created_date"),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 50),
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: () => base44.entities.Entity.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntelligenceReport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["intel_reports"] }); setSelected(null); },
  });

  const generateReport = async () => {
    setGenerating(true);

    const indicatorSummary = indicators.slice(0, 20).map(i => `${i.title} (${i.severity})`).join("; ");
    const entitySummary = entities.slice(0, 10).map(e => `${e.name} (${e.entity_type})`).join("; ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a ${form.report_type.replace(/_/g, " ")} intelligence report titled "${form.title}".

Current intelligence context:
- Active indicators: ${indicatorSummary || "None"}
- Monitored entities: ${entitySummary || "None"}
- Time sensitivity: ${form.time_sensitivity}

This report should follow the OSINT→SIGINT→HUMINT intelligence pyramid framework.
Focus on the 2026 State of Security: Global Fragmentation context including:
- Strategic competition below the threshold of conflict
- GoLaxy/PRC commercial data harvesting
- Hybrid warfare: cyber + physical + influence convergence
- AI-accelerated threat actor operations

Provide:
1. OSINT layer findings (open source base)
2. SIGINT layer indicators (signals intelligence)
3. HUMINT factors (human intelligence considerations)
4. Key findings (3-5 actionable items)
5. Subjective intent assessment (stated goals)
6. Objective intent assessment (behavioral evidence)
7. Speed of action estimate
8. Below-threshold activity indicators
9. Recommended actions with urgency
10. Confidence level (0-100)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          osint_layer: { type: "string" },
          sigint_layer: { type: "string" },
          humint_layer: { type: "string" },
          key_findings: { type: "array", items: { type: "string" } },
          subjective_intent: { type: "string" },
          objective_intent: { type: "string" },
          speed_of_action: { type: "string" },
          below_threshold_indicators: { type: "array", items: { type: "string" } },
          recommended_actions: { type: "array", items: { type: "string" } },
          full_report: { type: "string" },
          confidence: { type: "number" }
        }
      }
    });

    const report = await base44.entities.IntelligenceReport.create({
      ...form,
      intel_layers: {
        osint: result.osint_layer,
        sigint: result.sigint_layer,
        humint: result.humint_layer,
      },
      key_findings: result.key_findings,
      subjective_intent_assessment: result.subjective_intent,
      objective_intent_assessment: result.objective_intent,
      speed_of_action_estimate: result.speed_of_action,
      below_threshold_indicators: result.below_threshold_indicators,
      recommended_actions: result.recommended_actions,
      full_report: result.full_report,
      confidence: result.confidence,
    });

    queryClient.invalidateQueries({ queryKey: ["intel_reports"] });
    setSelected(report);
    setShowCreate(false);
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">AI-generated multi-layer intelligence reports (OSINT → SIGINT → HUMINT)</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Report List */}
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No reports generated</p>
            </div>
          ) : reports.map(r => {
            const color = timeSensColors[r.time_sensitivity] || "#6b7280";
            return (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left bg-[#111827] border rounded-xl p-4 transition-all ${
                  selected?.id === r.id ? "border-[#00d4ff]/30" : "border-white/5 hover:border-white/10"
                }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/5 mt-0.5">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.title}</p>
                    <p className="text-[10px] text-gray-500 capitalize mt-0.5">{r.report_type?.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3" style={{ color }} />
                      <span className="text-[10px] capitalize" style={{ color }}>{r.time_sensitivity}</span>
                      {r.confidence && <span className="text-[10px] text-gray-600">{r.confidence}% conf</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 mt-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
              <div>
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a report to view intelligence layers</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">{selected.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{selected.report_type?.replace(/_/g, " ")}</Badge>
                    <span className="text-[10px]" style={{ color: timeSensColors[selected.time_sensitivity] || "#6b7280" }}>
                      ⏱ {selected.time_sensitivity}
                    </span>
                    {selected.confidence && <span className="text-[10px] text-[#00d4ff]">{selected.confidence}% confidence</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-400" onClick={() => deleteMutation.mutate(selected.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Intelligence Pyramid Layers */}
              {selected.intel_layers && (
                <div className="space-y-3">
                  {selected.intel_layers.osint && (
                    <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-lg p-4">
                      <p className="text-[10px] text-[#00d4ff] uppercase tracking-wider font-bold mb-2">▼ OSINT Layer (Foundation)</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{selected.intel_layers.osint}</p>
                    </div>
                  )}
                  {selected.intel_layers.sigint && (
                    <div className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-lg p-4">
                      <p className="text-[10px] text-[#ffa502] uppercase tracking-wider font-bold mb-2">▲ SIGINT Layer</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{selected.intel_layers.sigint}</p>
                    </div>
                  )}
                  {selected.intel_layers.humint && (
                    <div className="bg-[#ff4757]/5 border border-[#ff4757]/15 rounded-lg p-4">
                      <p className="text-[10px] text-[#ff4757] uppercase tracking-wider font-bold mb-2">▲▲ HUMINT Layer (Apex)</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{selected.intel_layers.humint}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Intent Duality */}
              {(selected.subjective_intent_assessment || selected.objective_intent_assessment) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Subjective Intent</p>
                    <p className="text-xs text-gray-300">{selected.subjective_intent_assessment}</p>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Objective Intent</p>
                    <p className="text-xs text-gray-300">{selected.objective_intent_assessment}</p>
                  </div>
                </div>
              )}

              {selected.speed_of_action_estimate && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Speed of Action Estimate</p>
                  <p className="text-xs text-gray-300">{selected.speed_of_action_estimate}</p>
                </div>
              )}

              {selected.key_findings?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Key Findings</p>
                  <ul className="space-y-1.5">
                    {selected.key_findings.map((f, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2"><span className="text-[#00d4ff] mt-0.5">▸</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.below_threshold_indicators?.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#ffa502] uppercase tracking-wider mb-2">Below-Threshold Indicators</p>
                  <ul className="space-y-1">{selected.below_threshold_indicators.map((b, i) => (
                    <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-[#ffa502]">◦</span>{b}</li>
                  ))}</ul>
                </div>
              )}

              {selected.recommended_actions?.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#2ed573] uppercase tracking-wider mb-2">Recommended Actions</p>
                  <ul className="space-y-1">{selected.recommended_actions.map((a, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2"><span className="text-[#2ed573]">▸</span>{a}</li>
                  ))}</ul>
                </div>
              )}

              {selected.full_report && (
                <div className="bg-black/20 rounded-lg p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Full Report</p>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{selected.full_report}</p>
                </div>
              )}

              {/* AMANI AI Panel */}
              <AMANIPanel context={selected} contextType="report" />
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={v => { if (!generating) setShowCreate(v); }}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Generate Intelligence Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Report Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Q1 2026 GoLaxy Exposure Assessment" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Report Type</Label>
                <Select value={form.report_type} onValueChange={v => setForm({ ...form, report_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Time Sensitivity</Label>
                <Select value={form.time_sensitivity} onValueChange={v => setForm({ ...form, time_sensitivity: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIME_SENSITIVITY.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={generating} className="text-gray-400">Cancel</Button>
            <Button onClick={generateReport} disabled={!form.title || generating} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}