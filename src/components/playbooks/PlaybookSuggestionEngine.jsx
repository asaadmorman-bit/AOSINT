import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Brain, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Loader2, Zap, TrendingUp, AlertTriangle, Plus
} from "lucide-react";

const IMPACT_COLORS = {
  critical: "bg-red-900/30 text-red-300 border-red-500/20",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/20",
};

const TYPE_LABELS = {
  new_playbook: "New Playbook",
  modify_steps: "Modify Steps",
  modify_triggers: "Modify Triggers",
  add_step: "Add Step",
  remove_step: "Remove Step",
};

function SuggestionCard({ suggestion, onAccept, onDismiss, onApply, applying }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = suggestion.status === "pending";

  const parsedSteps = (() => {
    try {
      return JSON.parse(suggestion.suggested_workflow_steps || "null");
    } catch {
      return null;
    }
  })();

  const parsedDef = (() => {
    try {
      return JSON.parse(suggestion.suggested_playbook_definition || "null");
    } catch {
      return null;
    }
  })();

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        suggestion.status === "applied"
          ? "bg-green-900/10 border-green-500/20"
          : suggestion.status === "accepted"
          ? "bg-cyan-900/10 border-cyan-500/20"
          : suggestion.status === "dismissed"
          ? "bg-slate-900/20 border-slate-700/30 opacity-60"
          : "bg-slate-900/50 border-slate-700/50"
      }`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20 text-[8px]">
                {TYPE_LABELS[suggestion.suggestion_type] || suggestion.suggestion_type}
              </Badge>
              {suggestion.impact_estimate && (
                <Badge className={`text-[8px] ${IMPACT_COLORS[suggestion.impact_estimate]}`}>
                  {suggestion.impact_estimate} impact
                </Badge>
              )}
              {suggestion.confidence_score && (
                <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/20 text-[8px]">
                  {suggestion.confidence_score}% confidence
                </Badge>
              )}
              {suggestion.status !== "pending" && (
                <Badge
                  className={`text-[8px] ${
                    suggestion.status === "applied"
                      ? "bg-green-900/30 text-green-300 border-green-500/20"
                      : suggestion.status === "accepted"
                      ? "bg-cyan-900/30 text-cyan-300 border-cyan-500/20"
                      : "bg-slate-700/30 text-gray-400 border-slate-600/20"
                  }`}
                >
                  {suggestion.status}
                </Badge>
              )}
            </div>
            <h3 className="text-white font-semibold">{suggestion.title}</h3>
            {suggestion.target_playbook_name && (
              <p className="text-xs text-cyan-400 mt-0.5">
                → {suggestion.target_playbook_name}
              </p>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-sm text-gray-300">{suggestion.rationale}</p>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          {/* Evidence */}
          {suggestion.evidence?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                Evidence
              </p>
              <ul className="space-y-1">
                {suggestion.evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-cyan-400 shrink-0">▸</span>
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Workflow Steps */}
          {parsedSteps && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                Suggested Steps
              </p>
              <div className="space-y-1">
                {parsedSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-800/50 rounded p-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-900/30 text-cyan-300 text-[10px] flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">
                        {step.step_name}
                      </p>
                      <p className="text-gray-500 text-[10px]">{step.step_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Trigger Conditions */}
          {suggestion.suggested_trigger_conditions && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                Trigger Conditions
              </p>
              <pre className="bg-black/30 rounded p-2 text-[10px] text-gray-300 font-mono overflow-x-auto">
                {suggestion.suggested_trigger_conditions}
              </pre>
            </div>
          )}

          {/* Full Playbook Def */}
          {parsedDef && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                New Playbook Definition
              </p>
              <div className="bg-black/30 rounded p-2 text-[10px] text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(parsedDef, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Tags */}
          {suggestion.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.tags.map((tag, i) => (
                <Badge
                  key={i}
                  className="bg-slate-700/30 text-gray-400 border-slate-600/20 text-[8px]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="px-4 pb-4 flex gap-2">
          <Button
            size="sm"
            onClick={() => onAccept(suggestion.id)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accept
          </Button>
          {(suggestion.suggestion_type === "new_playbook" ||
            suggestion.suggestion_type === "modify_steps") && (
            <Button
              size="sm"
              onClick={() => onApply(suggestion)}
              disabled={applying}
              className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
            >
              {applying ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              Apply
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onDismiss(suggestion.id)}
            variant="outline"
            className="flex-1 text-xs border-slate-600/50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlaybookSuggestionEngine() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [applying, setApplying] = useState(null);
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["playbookSuggestions"],
    queryFn: () =>
      base44.entities.PlaybookSuggestion.list("-generated_at", 50),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("analyzePlaybookPatterns", {});
      return res.data;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["playbookSuggestions"] });
    },
  });

  const updateSuggestion = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.PlaybookSuggestion.update(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["playbookSuggestions"] }),
  });

  const handleAccept = (id) => {
    updateSuggestion.mutate({
      id,
      data: { status: "accepted", reviewed_at: new Date().toISOString() },
    });
  };

  const handleDismiss = (id) => {
    updateSuggestion.mutate({
      id,
      data: { status: "dismissed", reviewed_at: new Date().toISOString() },
    });
  };

  const handleApply = async (suggestion) => {
    setApplying(suggestion.id);
    try {
      if (suggestion.suggestion_type === "new_playbook") {
        const def = JSON.parse(suggestion.suggested_playbook_definition || "{}");
        await base44.entities.Playbook.create({
          playbook_name: def.playbook_name || suggestion.title,
          description: suggestion.rationale,
          playbook_type: def.playbook_type || "threat_hunt",
          trigger_type: def.trigger_type || "manual",
          trigger_conditions: suggestion.suggested_trigger_conditions || null,
          workflow_steps: def.workflow_steps || JSON.parse(suggestion.suggested_workflow_steps || "[]"),
          status: "draft",
        });
      } else if (
        suggestion.suggestion_type === "modify_steps" &&
        suggestion.target_playbook_id
      ) {
        const steps = JSON.parse(suggestion.suggested_workflow_steps || "[]");
        await base44.entities.Playbook.update(suggestion.target_playbook_id, {
          workflow_steps: steps,
        });
      }

      updateSuggestion.mutate({
        id: suggestion.id,
        data: { status: "applied", reviewed_at: new Date().toISOString() },
      });
      queryClient.invalidateQueries({ queryKey: ["playbooks"] });
    } catch (err) {
      console.error("Apply failed:", err);
    } finally {
      setApplying(null);
    }
  };

  const pending = suggestions.filter((s) => s.status === "pending");
  const accepted = suggestions.filter((s) => s.status === "accepted");
  const applied = suggestions.filter((s) => s.status === "applied");
  const dismissed = suggestions.filter((s) => s.status === "dismissed");

  return (
    <div className="space-y-6">
      {/* Header + Analyze */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI Playbook Suggestions
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Analyzes execution history, agent feedback, and threat hunt patterns to recommend improvements
          </p>
        </div>
        <Button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 shrink-0"
        >
          {analyzeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
          {analyzeMutation.isPending ? "Analyzing…" : "Run Analysis"}
        </Button>
      </div>

      {/* Analysis result summary */}
      {analysisResult && (
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <p className="text-purple-300 font-semibold">
              Analysis Complete — {analysisResult.suggestions_generated} suggestions generated
            </p>
          </div>
          {analysisResult.analysis_summary && (
            <p className="text-sm text-gray-300 mb-3">{analysisResult.analysis_summary}</p>
          )}
          {analysisResult.top_patterns_detected?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                Top Patterns Detected
              </p>
              <ul className="space-y-1">
                {analysisResult.top_patterns_detected.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <TrendingUp className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "text-yellow-400" },
          { label: "Accepted", value: accepted.length, color: "text-cyan-400" },
          { label: "Applied", value: applied.length, color: "text-green-400" },
          { label: "Dismissed", value: dismissed.length, color: "text-gray-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending suggestions */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Pending Review ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onApply={handleApply}
                applying={applying === s.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Accepted / Applied */}
      {(accepted.length > 0 || applied.length > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Accepted & Applied ({accepted.length + applied.length})
          </h3>
          <div className="space-y-3">
            {[...accepted, ...applied].map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onDismiss={handleDismiss}
                onApply={handleApply}
                applying={applying === s.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {suggestions.length === 0 && !isLoading && !analyzeMutation.isPending && (
        <div className="text-center py-16 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            No suggestions yet. Run the analysis to generate AI-powered recommendations.
          </p>
        </div>
      )}
    </div>
  );
}