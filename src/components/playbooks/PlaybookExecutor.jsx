import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import AgentOrchestrationLayer from "@/components/playbooks/AgentOrchestrationLayer";

export default function PlaybookExecutor({ playbook }) {
  const [triggerData, setTriggerData] = useState("");
  const [activeExecution, setActiveExecution] = useState(null); // { id, status }
  const [showSteps, setShowSteps] = useState(false);
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  // Poll for live execution updates
  const { data: liveExecution } = useQuery({
    queryKey: ["liveExecution", activeExecution?.id],
    queryFn: () =>
      base44.entities.PlaybookExecution.filter({ id: activeExecution.id }).then(
        (r) => r[0]
      ),
    enabled: !!activeExecution?.id && activeExecution?.status === "running",
    refetchInterval: 2000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!activeExecution?.id) return;
    const unsub = base44.entities.PlaybookExecution.subscribe((event) => {
      if (event.id === activeExecution.id) {
        setActiveExecution((prev) => ({ ...prev, status: event.data?.status }));
        if (["completed", "failed"].includes(event.data?.status)) {
          queryClient.invalidateQueries({ queryKey: ["playbookExecutions"] });
        }
      }
    });
    return unsub;
  }, [activeExecution?.id]);

  const executeMutation = useMutation({
    mutationFn: async () => {
      let parsed = {};
      if (triggerData.trim()) {
        parsed = JSON.parse(triggerData);
      }
      const result = await base44.functions.invoke("executePlaybook", {
        playbookId: playbook.id,
        triggerSource: "manual",
        triggerData: parsed,
      });
      return result.data;
    },
    onSuccess: (data) => {
      setActiveExecution({ id: data.execution_id, status: "running" });
      setError(null);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const currentExecution = liveExecution || null;
  const isRunning =
    executeMutation.isPending || activeExecution?.status === "running";
  const isDone = ["completed", "failed"].includes(activeExecution?.status);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Configuration + Controls */}
      <div className="space-y-5">
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-1">{playbook.playbook_name}</h2>
          <p className="text-gray-400 text-sm mb-4">{playbook.description}</p>

          <div className="flex gap-3 mb-4">
            <Badge className="bg-cyan-900/30 text-cyan-300 border-cyan-500/20 text-[8px]">
              {playbook.playbook_type}
            </Badge>
            <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/20 text-[8px]">
              {playbook.trigger_type}
            </Badge>
            {playbook.execution_count > 0 && (
              <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/20 text-[8px]">
                {playbook.execution_count} runs · {playbook.success_rate}% success
              </Badge>
            )}
          </div>

          {/* Trigger Data */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">
              Trigger Data (JSON — Optional)
            </label>
            <textarea
              value={triggerData}
              onChange={(e) => setTriggerData(e.target.value)}
              placeholder={'{\n  "iocs": ["1.2.3.4", "evil.com"],\n  "target": "corp-dc01"\n}'}
              rows="5"
              disabled={isRunning}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={() => {
              setActiveExecution(null);
              setError(null);
              executeMutation.mutate();
            }}
            disabled={isRunning}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 py-5"
          >
            <Play className="w-5 h-5" />
            {isRunning ? "Running via Orchestrator…" : "Execute Playbook"}
          </Button>
        </div>

        {/* Workflow Steps Preview (collapsible) */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg">
          <button
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            onClick={() => setShowSteps(!showSteps)}
          >
            <span className="text-sm font-semibold text-white">
              Workflow Steps ({(playbook.workflow_steps || []).length})
            </span>
            {showSteps ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showSteps && (
            <div className="px-5 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
              {(playbook.workflow_steps || []).map((step, idx) => {
                const stepExec = currentExecution?.step_executions?.find(
                  (s) => s.step_id === step.step_id
                );
                const statusColor =
                  stepExec?.status === "completed"
                    ? "bg-green-500"
                    : stepExec?.status === "failed"
                    ? "bg-red-500"
                    : stepExec?.status === "running"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-slate-700";

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-slate-800/30 p-3 rounded"
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{step.step_name}</p>
                      <p className="text-xs text-gray-400">{step.step_type}</p>
                    </div>
                    {stepExec?.duration_seconds != null && (
                      <span className="text-[10px] text-gray-500">
                        {stepExec.duration_seconds}s
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Final result summary */}
        {isDone && currentExecution && (
          <div
            className={`border rounded-lg p-4 ${
              currentExecution.success
                ? "bg-green-900/10 border-green-500/20"
                : "bg-red-900/10 border-red-500/20"
            }`}
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-400">Tasks</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {currentExecution.tasks_executed || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="text-2xl font-bold text-blue-400">
                  {currentExecution.total_duration_seconds || 0}s
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Result</p>
                <Badge
                  className={`mt-1 text-[8px] ${
                    currentExecution.success
                      ? "bg-green-900/30 text-green-300 border-green-500/20"
                      : "bg-red-900/30 text-red-300 border-red-500/20"
                  }`}
                >
                  {currentExecution.success ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Live Orchestration Monitor */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Live Orchestration Monitor</h3>
        {activeExecution?.id ? (
          <AgentOrchestrationLayer executionId={activeExecution.id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
            <Play className="w-10 h-10 opacity-30" />
            <p className="text-sm">Execute a playbook to see real-time orchestration</p>
          </div>
        )}
      </div>
    </div>
  );
}