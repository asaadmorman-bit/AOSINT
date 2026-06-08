import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, HelpCircle, Brain, Search, Filter, AlertTriangle,
  Zap, ChevronRight, LayoutGrid, List, BookOpen, Cpu
} from "lucide-react";
import { meetsMinTier, TIER_META } from "@/components/shared/tierCapabilities";
import QuestionCard from "@/components/lab/QuestionCard";
import QuestionDetailDrawer from "@/components/lab/QuestionDetailDrawer";
import CreateQuestionDialog from "@/components/lab/CreateQuestionDialog";
import LabStatsBar from "@/components/lab/LabStatsBar";
import SeedQuestionsPanel from "@/components/lab/SeedQuestionsPanel";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const USER_TIER = "pro"; // In production, pull from auth context

export const STATUS_META = {
  unanswered:         { color: "#ff4757", label: "Unanswered",       icon: "●" },
  partially_answered: { color: "#ffa502", label: "Partial Answer",   icon: "◑" },
  under_review:       { color: "#00d4ff", label: "Under Review",     icon: "◎" },
  answered:           { color: "#2ed573", label: "Answered",         icon: "●" },
};

export const CATEGORY_META = {
  fragmentation: { color: "#a855f7", label: "Fragmentation" },
  convergence:   { color: "#ff6b35", label: "Convergence" },
  warning_time:  { color: "#ff4757", label: "Warning Time" },
  ransomware:    { color: "#ffa502", label: "Ransomware" },
  influence:     { color: "#00d4ff", label: "Influence Ops" },
  cross_domain:  { color: "#2ed573", label: "Cross-Domain" },
  actor_tracking:{ color: "#f59e0b", label: "Actor Tracking" },
  custom:        { color: "#6b7280", label: "Custom" },
};

export const PRIORITY_META = {
  critical: { color: "#ff4757", label: "CRITICAL" },
  high:     { color: "#ffa502", label: "HIGH" },
  medium:   { color: "#6b7280", label: "MEDIUM" },
  low:      { color: "#374151", label: "LOW" },
};

export default function QuestionLab() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list | grid
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["analytic_questions"],
    queryFn: () => base44.entities.AnalyticQuestion.list("-created_date", 200),
  });

  const { data: evidenceItems = [] } = useQuery({
    queryKey: ["evidence_items"],
    queryFn: () => base44.entities.EvidenceItem.list("-created_date", 500),
  });

  const canCreate = meetsMinTier(USER_TIER, "pro");
  const canViewAll = meetsMinTier(USER_TIER, "community");
  const questionLimit = USER_TIER === "pro" ? 10 : USER_TIER === "community" ? 0 : Infinity;
  const userQuestionCount = questions.filter(q => q.created_by === "me").length;

  const filtered = questions.filter(q => {
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    const matchCat = filterCat === "all" || q.category === filterCat;
    const matchPriority = filterPriority === "all" || q.priority === filterPriority;
    const matchSearch = !search || q.question?.toLowerCase().includes(search.toLowerCase()) ||
      q.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchCat && matchPriority && matchSearch;
  });

  // For community: show only a limited preview
  const displayQuestions = USER_TIER === "community"
    ? filtered.slice(0, 5)
    : filtered;

  const evidenceByQuestion = evidenceItems.reduce((acc, e) => {
    acc[e.question_id] = (acc[e.question_id] || []);
    acc[e.question_id].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400 mt-0.5">
            Research-grade subsystem for analytic gaps from the 2026 State of Security report
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {questions.length === 0 && (
            <Button onClick={() => setShowSeed(true)} variant="outline" size="sm"
              className="border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/10 gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Seed 2026 Report
            </Button>
          )}
          {canCreate && (
            <Button onClick={() => setShowCreate(true)}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 text-sm font-semibold"
              disabled={USER_TIER === "pro" && userQuestionCount >= questionLimit}>
              <Plus className="w-4 h-4" />
              New Question
              {USER_TIER === "pro" && (
                <span className="text-black/60 text-xs ml-1">({userQuestionCount}/{questionLimit})</span>
              )}
            </Button>
          )}
          {!canCreate && (
            <Link to={createPageUrl("Pricing")}>
              <Button className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-2 text-sm">
                <Zap className="w-4 h-4" /> Upgrade to Create
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <LabStatsBar questions={questions} evidenceItems={evidenceItems} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions, tags..."
            className="pl-9 bg-white/5 border-white/10 text-white h-9 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_META).map(([k, m]) => (
              <SelectItem key={k} value={k}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_META).map(([k, m]) => (
              <SelectItem key={k} value={k}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="sm"
            onClick={() => setViewMode("list")}
            className={`h-9 w-9 p-0 ${viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500"}`}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm"
            onClick={() => setViewMode("grid")}
            className={`h-9 w-9 p-0 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500"}`}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Questions List / Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading intelligence questions...</p>
          </div>
        </div>
      ) : displayQuestions.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-14 text-center">
          <HelpCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-300 font-medium mb-1">No questions match your filters</p>
          <p className="text-gray-500 text-sm mb-5">Try adjusting filters or seed from the 2026 report</p>
          {questions.length === 0 && (
            <Button onClick={() => setShowSeed(true)}
              className="bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/30 gap-2">
              <BookOpen className="w-4 h-4" /> Seed 2026 State of Security Questions
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
            : "space-y-2"
          }>
            {displayQuestions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                evidenceCount={(evidenceByQuestion[q.id] || []).length}
                userTier={USER_TIER}
                viewMode={viewMode}
                onSelect={() => setSelectedQuestion(q)}
                isSelected={selectedQuestion?.id === q.id}
              />
            ))}
          </div>

          {/* Community upgrade gate */}
          {USER_TIER === "community" && filtered.length > 5 && (
            <div className="bg-gradient-to-r from-[#00d4ff]/5 to-[#a855f7]/5 border border-[#00d4ff]/20 rounded-xl p-6 text-center">
              <p className="text-white font-semibold mb-1">
                {filtered.length - 5} more questions hidden
              </p>
              <p className="text-gray-400 text-sm mb-4">Upgrade to Pro to view all questions, create your own, and link evidence</p>
              <Link to={createPageUrl("Pricing")}>
                <Button className="bg-[#00d4ff] text-black font-semibold hover:bg-[#00bfe6] gap-2">
                  <Zap className="w-4 h-4" /> Upgrade to Pro — $79/mo
                </Button>
              </Link>
            </div>
          )}
        </>
      )}

      {/* Detail Drawer */}
      {selectedQuestion && (
        <QuestionDetailDrawer
          question={selectedQuestion}
          evidenceItems={evidenceByQuestion[selectedQuestion.id] || []}
          userTier={USER_TIER}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={(updated) => {
            setSelectedQuestion(updated);
            queryClient.invalidateQueries({ queryKey: ["analytic_questions"] });
            queryClient.invalidateQueries({ queryKey: ["evidence_items"] });
          }}
        />
      )}

      {/* Create Dialog */}
      <CreateQuestionDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        userTier={USER_TIER}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["analytic_questions"] });
          setShowCreate(false);
        }}
      />

      {/* Seed Panel */}
      <SeedQuestionsPanel
        open={showSeed}
        onClose={() => setShowSeed(false)}
        onSeeded={() => {
          queryClient.invalidateQueries({ queryKey: ["analytic_questions"] });
          setShowSeed(false);
        }}
      />
    </div>
  );
}