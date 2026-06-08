import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, HelpCircle, Brain, Loader2, AlertTriangle, CheckCircle2, Clock, Search, Lightbulb } from "lucide-react";
import UpgradePrompt from "@/components/shared/UpgradePrompt";

const STATUS_META = {
  unanswered: { color: "#ff4757", label: "Unanswered" },
  partially_answered: { color: "#ffa502", label: "Partial" },
  under_review: { color: "#00d4ff", label: "Under Review" },
  answered: { color: "#2ed573", label: "Answered" },
};

const CATEGORY_META = {
  fragmentation: { color: "#a855f7", label: "Fragmentation" },
  convergence: { color: "#ff6b35", label: "Convergence" },
  warning_time: { color: "#ff4757", label: "Warning Time" },
  ransomware: { color: "#ffa502", label: "Ransomware" },
  influence: { color: "#00d4ff", label: "Influence Ops" },
  cross_domain: { color: "#2ed573", label: "Cross-Domain" },
  actor_tracking: { color: "#f59e0b", label: "Actor Tracking" },
  custom: { color: "#6b7280", label: "Custom" },
};

const SEED_QUESTIONS = [
  { question: "Which emerging actors are most likely to bridge state and criminal ecosystems in Eastern Europe?", category: "convergence", priority: "critical", source: "report_2026", status: "unanswered" },
  { question: "Where is warning time decreasing fastest for critical infrastructure sectors?", category: "warning_time", priority: "critical", source: "report_2026", status: "partially_answered" },
  { question: "Which narratives consistently precede ransomware campaigns targeting the healthcare sector?", category: "influence", priority: "high", source: "report_2026", status: "partially_answered" },
  { question: "How is GoLaxy/PRC data aggregation enabling targeting of Western government officials?", category: "cross_domain", priority: "critical", source: "report_2026", status: "under_review" },
  { question: "What is the rate of RaaS affiliate overlap between major ransomware families?", category: "ransomware", priority: "high", source: "report_2026", status: "unanswered" },
  { question: "Which regions are experiencing the highest fragmentation index increase in 2026?", category: "fragmentation", priority: "high", source: "report_2026", status: "unanswered" },
];

export default function AnalyticQuestions() {
  const [userTier] = useState("pro");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [form, setForm] = useState({ question: "", category: "custom", priority: "medium", related_regions: "", related_sectors: "", related_actors: "" });

  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["analytic_questions"],
    queryFn: () => base44.entities.AnalyticQuestion.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnalyticQuestion.create({
      ...data,
      related_regions: data.related_regions ? data.related_regions.split(",").map(s => s.trim()).filter(Boolean) : [],
      related_sectors: data.related_sectors ? data.related_sectors.split(",").map(s => s.trim()).filter(Boolean) : [],
      related_actors: data.related_actors ? data.related_actors.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "unanswered",
      source: "analyst_input",
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["analytic_questions"] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AnalyticQuestion.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytic_questions"] }),
  });

  const seedQuestions = async () => {
    for (const q of SEED_QUESTIONS) {
      await base44.entities.AnalyticQuestion.create({ ...q, min_tier: "pro" });
    }
    queryClient.invalidateQueries({ queryKey: ["analytic_questions"] });
  };

  const analyzeQuestion = async (q) => {
    setAnalyzing(q.id);
    const prompt = `You are a senior intelligence analyst specializing in the 2026 threat landscape. 
    
Analyze this intelligence question: "${q.question}"

Category: ${q.category}
Related Regions: ${q.related_regions?.join(", ") || "global"}
Related Sectors: ${q.related_sectors?.join(", ") || "multiple"}
Related Actors: ${q.related_actors?.join(", ") || "unknown"}

Provide a structured intelligence analysis including:
1. Current evidence and partial answers based on open-source intelligence
2. Confidence level (0-100) in current assessment
3. Key missing data or feeds needed to fully answer this
4. Next best collection action (specific recommendation)
5. Data sources that would help resolve this question`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          evidence_summary: { type: "string" },
          confidence_level: { type: "number" },
          missing_data: { type: "string" },
          next_best_action: { type: "string" },
          data_sources_needed: { type: "array", items: { type: "string" } },
          new_status: { type: "string" }
        }
      }
    });

    await base44.entities.AnalyticQuestion.update(q.id, {
      evidence_summary: result.evidence_summary,
      confidence_level: result.confidence_level,
      missing_data: result.missing_data,
      next_best_action: result.next_best_action,
      data_sources_needed: result.data_sources_needed,
      status: result.new_status || "partially_answered",
    });
    queryClient.invalidateQueries({ queryKey: ["analytic_questions"] });
    setAnalyzing(null);
  };

  const filtered = questions.filter(q => {
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    const matchCat = filterCat === "all" || q.category === filterCat;
    const matchSearch = !search || q.question?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">Track unanswered intelligence questions, analytic gaps, and next best collection actions</p>
        </div>
        <div className="flex gap-2">
          {questions.length === 0 && (
            <Button onClick={seedQuestions} variant="outline" size="sm" className="border-white/10 text-gray-400 text-xs gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Seed 2026 Report Questions
            </Button>
          )}
          <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
            <Plus className="w-4 h-4" /> New Question
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const count = questions.filter(q => q.status === key).length;
          return (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`bg-[#111827] border rounded-xl p-4 text-left transition-all ${filterStatus === key ? "border-opacity-50" : "border-white/5 hover:border-white/10"}`}
              style={filterStatus === key ? { borderColor: `${meta.color}40` } : {}}>
              <p className="text-2xl font-bold" style={{ color: meta.color }}>{count}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." className="pl-9 bg-white/5 border-white/10 text-white" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading questions...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <HelpCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">No analytic questions yet</p>
          <Button onClick={seedQuestions} className="bg-white/10 text-white hover:bg-white/20 gap-2 text-sm">
            <Brain className="w-4 h-4" /> Seed from 2026 State of Security Report
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const statusMeta = STATUS_META[q.status] || STATUS_META.unanswered;
            const catMeta = CATEGORY_META[q.category] || CATEGORY_META.custom;
            return (
              <div key={q.id} className={`bg-[#111827] border rounded-xl p-5 transition-all cursor-pointer hover:border-white/10 ${selected?.id === q.id ? "border-[#00d4ff]/30" : "border-white/5"}`}
                onClick={() => setSelected(selected?.id === q.id ? null : q)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <HelpCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: statusMeta.color }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${catMeta.color}20`, color: catMeta.color }}>{catMeta.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusMeta.color}20`, color: statusMeta.color }}>{statusMeta.label}</span>
                        {q.priority === "critical" && <span className="text-[10px] text-red-400 font-bold">CRITICAL</span>}
                        {q.source === "report_2026" && <span className="text-[10px] text-[#a855f7] bg-[#a855f7]/10 px-2 py-0.5 rounded-full">2026 Report</span>}
                      </div>
                      <p className="text-sm font-medium text-white">{q.question}</p>
                      {q.confidence_level != null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-gray-500">Confidence:</span>
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${q.confidence_level}%`, background: q.confidence_level >= 60 ? "#2ed573" : q.confidence_level >= 30 ? "#ffa502" : "#ff4757" }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{q.confidence_level}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[#00d4ff] hover:bg-[#00d4ff]/10"
                      onClick={e => { e.stopPropagation(); analyzeQuestion(q); }}
                      disabled={analyzing === q.id}>
                      {analyzing === q.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                      {analyzing === q.id ? "Analyzing..." : "AI Analyze"}
                    </Button>
                    <Select value={q.status} onValueChange={v => { updateMutation.mutate({ id: q.id, data: { status: v } }); }}
                      onClick={e => e.stopPropagation()}>
                      <SelectTrigger className="h-7 bg-white/5 border-white/10 text-white text-xs w-36" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expanded Detail */}
                {selected?.id === q.id && (
                  <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                    {q.evidence_summary && (
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Evidence Summary</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{q.evidence_summary}</p>
                      </div>
                    )}
                    {q.missing_data && (
                      <div className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-lg p-3">
                        <p className="text-[10px] text-[#ffa502] uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Missing Data</p>
                        <p className="text-xs text-gray-300">{q.missing_data}</p>
                      </div>
                    )}
                    {q.next_best_action && (
                      <div className="bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-lg p-3">
                        <p className="text-[10px] text-[#2ed573] uppercase tracking-wider mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" />Next Best Collection Action</p>
                        <p className="text-xs text-gray-300">{q.next_best_action}</p>
                      </div>
                    )}
                    {q.data_sources_needed?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Data Sources Needed</p>
                        <div className="flex flex-wrap gap-2">
                          {q.data_sources_needed.map((s, i) => (
                            <span key={i} className="text-[10px] bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-0.5 rounded border border-[#00d4ff]/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-[#00d4ff]" />Add Analytic Question</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Intelligence Question</Label>
              <Textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} placeholder="What do you need to know? Be specific and analytic..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Related Regions (comma-separated)</Label>
              <Input value={form.related_regions} onChange={e => setForm({ ...form, related_regions: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Eastern Europe, Southeast Asia" />
            </div>
            <div>
              <Label className="text-gray-400">Related Sectors (comma-separated)</Label>
              <Input value={form.related_sectors} onChange={e => setForm({ ...form, related_sectors: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. healthcare, energy, defense" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.question || createMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {createMutation.isPending ? "Creating..." : "Create Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}