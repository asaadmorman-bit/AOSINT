import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  X, Brain, Loader2, Lightbulb, AlertTriangle, Database,
  Plus, CheckCircle2, Lock, Zap, Users
} from "lucide-react";
import { STATUS_META, CATEGORY_META } from "@/pages/QuestionLab";
import { meetsMinTier } from "@/components/shared/tierCapabilities";
import EvidenceTimeline from "@/components/lab/EvidenceTimeline";
import GapAnalysisPanel from "@/components/lab/GapAnalysisPanel";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function QuestionDetailDrawer({ question, evidenceItems, userTier, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingGap, setGeneratingGap] = useState(false);
  const [editForm, setEditForm] = useState({ ...question });
  const [newEvidence, setNewEvidence] = useState({ feed_source: "", reference_type: "indicator", summary: "", relevance_score: 70, observed_at: "" });
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const queryClient = useQueryClient();

  const canEdit = meetsMinTier(userTier, "pro");
  const canLinkEvidence = meetsMinTier(userTier, "pro");
  const canPeerReview = meetsMinTier(userTier, "enterprise");
  const canViewGaps = meetsMinTier(userTier, "pro");

  const { data: gapAnalyses = [] } = useQuery({
    queryKey: ["gap_analyses", question.id],
    queryFn: () => base44.entities.GapAnalysis.filter({ question_id: question.id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AnalyticQuestion.update(question.id, data),
    onSuccess: (updated) => { onUpdate(updated); },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: (data) => base44.entities.EvidenceItem.create({ ...data, question_id: question.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence_items"] });
      setShowAddEvidence(false);
      setNewEvidence({ feed_source: "", reference_type: "indicator", summary: "", relevance_score: 70, observed_at: "" });
    },
  });

  const analyzeQuestion = async () => {
    setAnalyzing(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior intelligence analyst for the 2026 threat landscape.
Analyze this intelligence question: "${question.question}"
Category: ${question.category}, Regions: ${question.related_regions?.join(", ") || "global"}, Sectors: ${question.related_sectors?.join(", ") || "multiple"}
Provide: evidence summary, confidence level (0-100), missing data, next best collection action, data sources needed, and updated status.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          evidence_summary: { type: "string" },
          confidence_level: { type: "number" },
          missing_data: { type: "string" },
          next_best_action: { type: "string" },
          data_sources_needed: { type: "array", items: { type: "string" } },
          new_status: { type: "string" },
        }
      }
    });
    const updated = await base44.entities.AnalyticQuestion.update(question.id, {
      evidence_summary: result.evidence_summary,
      confidence_level: result.confidence_level,
      missing_data: result.missing_data,
      next_best_action: result.next_best_action,
      data_sources_needed: result.data_sources_needed,
      status: result.new_status || question.status,
    });
    onUpdate(updated);
    setAnalyzing(false);
  };

  const generateGapAnalysis = async () => {
    setGeneratingGap(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Gap analysis for intelligence question: "${question.question}". Category: ${question.category}. Identify missing data types, recommended feeds, regions, actors, narratives, dark web sources, and collection priority.`,
      response_json_schema: {
        type: "object",
        properties: {
          missing_data_types: { type: "array", items: { type: "string" } },
          recommended_feeds: { type: "array", items: { type: "string" } },
          recommended_regions: { type: "array", items: { type: "string" } },
          recommended_actors_to_monitor: { type: "array", items: { type: "string" } },
          recommended_narratives_to_track: { type: "array", items: { type: "string" } },
          dark_web_sources: { type: "array", items: { type: "string" } },
          ai_rationale: { type: "string" },
          collection_priority: { type: "string" },
        }
      }
    });
    await base44.entities.GapAnalysis.create({ question_id: question.id, ...result, generated_at: new Date().toISOString(), status: "pending" });
    queryClient.invalidateQueries({ queryKey: ["gap_analyses", question.id] });
    setGeneratingGap(false);
  };

  const statusMeta = STATUS_META[question.status] || STATUS_META.unanswered;
  const catMeta = CATEGORY_META[question.category] || CATEGORY_META.custom;
  const confidenceColor = (question.confidence_level || 0) >= 60 ? "#2ed573" : (question.confidence_level || 0) >= 30 ? "#ffa502" : "#ff4757";

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "evidence", label: `Evidence (${evidenceItems.length})` },
    { key: "gaps", label: "Gap Analysis", locked: !canViewGaps },
    { key: "edit", label: "Edit", locked: !canEdit },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="absolute inset-0 -left-full bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0d1220] border-l border-white/10 flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/5 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>{catMeta.label}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: `${statusMeta.color}20`, color: statusMeta.color }}>{statusMeta.label}</span>
              {question.priority === "critical" && <span className="text-[9px] font-black text-red-400">● CRITICAL</span>}
              {question.source === "report_2026" && <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded">2026 Report</span>}
            </div>
            <h2 className="text-sm font-semibold text-white leading-relaxed pr-4">{question.question}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors mt-1 shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Confidence Bar */}
        {question.confidence_level != null && (
          <div className="px-5 py-2.5 border-b border-white/5 bg-black/20 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider w-20 shrink-0">Confidence</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${question.confidence_level}%`, background: confidenceColor }} />
              </div>
              <span className="text-sm font-bold w-10 text-right" style={{ color: confidenceColor }}>{question.confidence_level}%</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/5 shrink-0 px-5 gap-0">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => !tab.locked && setActiveTab(tab.key)}
              className={`relative px-3 py-3 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                tab.locked ? "text-gray-600 cursor-not-allowed" :
                activeTab === tab.key ? "text-[#00d4ff] border-b-2 border-[#00d4ff]" : "text-gray-500 hover:text-gray-300"
              }`}>
              {tab.locked && <Lock className="w-3 h-3" />}
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center pb-1">
            <Button size="sm" onClick={analyzeQuestion} disabled={analyzing}
              className="h-7 text-xs gap-1 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
              {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
              {analyzing ? "Analyzing..." : "AI Analyze"}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {question.evidence_summary && (
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">Evidence Summary</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{question.evidence_summary}</p>
                </div>
              )}
              {question.missing_data && (
                <div className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-xl p-4">
                  <p className="text-[9px] text-[#ffa502] uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />Missing Data</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{question.missing_data}</p>
                </div>
              )}
              {question.next_best_action && (
                <div className="bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-xl p-4">
                  <p className="text-[9px] text-[#2ed573] uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5"><Lightbulb className="w-3 h-3" />Next Best Collection Action</p>
                  <p className="text-sm text-white leading-relaxed font-medium">{question.next_best_action}</p>
                </div>
              )}
              {question.data_sources_needed?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Data Sources Needed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {question.data_sources_needed.map((s, i) => (
                      <span key={i} className="text-[10px] bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-0.5 rounded border border-[#00d4ff]/15 font-mono">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {!question.evidence_summary && !analyzing && (
                <div className="bg-[#111827] border border-dashed border-white/10 rounded-xl p-8 text-center">
                  <Brain className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-4">No analysis yet. Run AI analysis to get evidence summary and next best collection actions.</p>
                  <Button size="sm" onClick={analyzeQuestion} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 font-semibold">
                    <Brain className="w-3.5 h-3.5" /> Run AI Analysis
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-4">
              {canLinkEvidence && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">{evidenceItems.length} evidence items linked</p>
                  <Button size="sm" onClick={() => setShowAddEvidence(!showAddEvidence)}
                    className="h-7 text-xs gap-1 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
                    <Plus className="w-3 h-3" /> Add Evidence
                  </Button>
                </div>
              )}
              {showAddEvidence && canLinkEvidence && (
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-white">Link Evidence Item</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-gray-500">Feed Source</Label>
                      <Input value={newEvidence.feed_source} onChange={e => setNewEvidence({ ...newEvidence, feed_source: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1 h-8 text-xs" placeholder="e.g. Shodan, GreyNoise" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Reference Type</Label>
                      <Select value={newEvidence.reference_type} onValueChange={v => setNewEvidence({ ...newEvidence, reference_type: v })}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indicator">Indicator</SelectItem>
                          <SelectItem value="narrative">Narrative</SelectItem>
                          <SelectItem value="actor">Actor</SelectItem>
                          <SelectItem value="campaign">Campaign</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="raw_intel">Raw Intel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-500">Summary</Label>
                    <Textarea value={newEvidence.summary} onChange={e => setNewEvidence({ ...newEvidence, summary: e.target.value })}
                      className="bg-white/5 border-white/10 text-white mt-1 text-xs" rows={2} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddEvidence(false)} className="h-7 text-xs text-gray-500">Cancel</Button>
                    <Button size="sm" onClick={() => addEvidenceMutation.mutate(newEvidence)}
                      disabled={!newEvidence.feed_source || addEvidenceMutation.isPending}
                      className="h-7 text-xs bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
                      {addEvidenceMutation.isPending ? "Linking..." : "Link Evidence"}
                    </Button>
                  </div>
                </div>
              )}
              <EvidenceTimeline evidenceItems={evidenceItems} />
              {!canLinkEvidence && (
                <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-xl p-6 text-center">
                  <Lock className="w-6 h-6 text-[#00d4ff] mx-auto mb-2 opacity-60" />
                  <p className="text-sm text-white font-medium mb-1">Pro+ Required to Link Evidence</p>
                  <Link to={createPageUrl("Pricing")}>
                    <Button size="sm" className="bg-[#00d4ff] text-black gap-1.5 font-semibold mt-2">
                      <Zap className="w-3.5 h-3.5" /> Upgrade
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "gaps" && canViewGaps && (
            <GapAnalysisPanel gapAnalyses={gapAnalyses} userTier={userTier} onGenerate={generateGapAnalysis} generating={generatingGap} />
          )}

          {activeTab === "edit" && canEdit && (
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Question</Label>
                <Textarea value={editForm.question} onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1 text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Priority</Label>
                  <Select value={editForm.priority} onValueChange={v => setEditForm({ ...editForm, priority: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Evidence Summary</Label>
                <Textarea value={editForm.evidence_summary || ""} onChange={e => setEditForm({ ...editForm, evidence_summary: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1 text-sm" rows={3} />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Next Best Collection Action</Label>
                <Textarea value={editForm.next_best_action || ""} onChange={e => setEditForm({ ...editForm, next_best_action: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1 text-sm" rows={2} />
              </div>
              <div>
                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Confidence (0-100)</Label>
                <Input type="number" min={0} max={100} value={editForm.confidence_level || ""}
                  onChange={e => setEditForm({ ...editForm, confidence_level: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              {canPeerReview && (
                <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#a855f7] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />Peer Review (Enterprise)
                  </p>
                  <Input value={editForm.assigned_to || ""} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm" placeholder="analyst@org.com" />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}
                  className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] text-xs gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}