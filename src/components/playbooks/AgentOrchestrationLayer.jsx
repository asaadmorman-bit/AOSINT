import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle2, Clock, Activity } from "lucide-react";

function UtilizationBar({ label, value, color = "cyan" }) {
  const colors = {
    cyan: "bg-cyan-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };
  const barColor =
    value > 80 ? colors.red : value > 60 ? colors.orange : colors.green;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-300 truncate max-w-[70%]">{label}</span>
        <span className="text-xs font-bold text-gray-300">{value}%</span>
      </div>
      <div className="bg-slate-800 rounded-full h-1.5">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function TaskQueueRow({ item, index }) {
  const statusColors = {
    queued: "bg-gray-700/50 text-gray-400 border-gray-600/30",
    dispatched: "bg-blue-900/30 text-blue-300 border-blue-500/20",
    completed: "bg-green-900/30 text-green-300 border-green-500/20",
    failed: "bg-red-900/30 text-red-300 border-red-500/20",
  };
  const priorityColor =
    item.priority >= 90
      ? "text-red-400"
      : item.priority >= 70
      ? "text-orange-400"
      : "text-green-400";

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/40 rounded border border-slate-700/30">
      <span className="text-xs text-gray-600 w-4 shrink-0">#{index + 1}</span>
      <span className={`text-xs font-bold w-8 shrink-0 ${priorityColor}`}>
        {item.priority}
      </span>
      <span className="text-xs text-gray-200 flex-1 truncate">{item.step_name}</span>
      <Badge className={`text-[8px] ${statusColors[item.status] || statusColors.queued}`}>
        {item.status}
      </Badge>
      {item.duration_seconds != null && (
        <span className="text-[10px] text-gray-500 shrink-0">{item.duration_seconds}s</span>
      )}
    </div>
  );
}

export default function AgentOrchestrationLayer({ executionId }) {
  const [orchState, setOrchState] = useState(null);

  const { data: states = [] } = useQuery({
    queryKey: ["orchState", executionId],
    queryFn: () =>
      base44.entities.AgentOrchestrationState.filter({ execution_id: executionId }),
    refetchInterval: 2000,
    enabled: !!executionId,
  });

  useEffect(() => {
    if (states.length > 0) setOrchState(states[0]);
  }, [states]);

  // Also subscribe to real-time updates
  useEffect(() => {
    if (!executionId) return;
    const unsub = base44.entities.AgentOrchestrationState.subscribe((event) => {
      if (event.data?.execution_id === executionId) {
        setOrchState(event.data);
      }
    });
    return unsub;
  }, [executionId]);

  if (!orchState) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4 text-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        Waiting for orchestrator…
      </div>
    );
  }

  const taskQueue = orchState.task_queue || [];
  const agentUtilization = orchState.agent_utilization || [];
  const scalingEvents = orchState.scaling_events || [];
  const log = (() => {
    try {
      return JSON.parse(orchState.orchestration_log || "[]");
    } catch {
      return [];
    }
  })();

  const completionPct =
    orchState.total_tasks > 0
      ? Math.round((orchState.completed_tasks / orchState.total_tasks) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold">Orchestration Layer</span>
          <Badge
            className={`text-[8px] ${
              orchState.status === "running"
                ? "bg-blue-900/30 text-blue-300 border-blue-500/20"
                : orchState.status === "completed"
                ? "bg-green-900/30 text-green-300 border-green-500/20"
                : orchState.status === "failed"
                ? "bg-red-900/30 text-red-300 border-red-500/20"
                : "bg-gray-700/30 text-gray-300 border-gray-600/20"
            }`}
          >
            {orchState.status}
          </Badge>
        </div>
        <span className="text-xs text-gray-400">
          {orchState.throughput_tasks_per_minute
            ? `${orchState.throughput_tasks_per_minute} tasks/min`
            : ""}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {orchState.completed_tasks}/{orchState.total_tasks} tasks completed
          </span>
          <span>{completionPct}%</span>
        </div>
        <div className="bg-slate-800 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              orchState.status === "failed" ? "bg-red-500" : "bg-cyan-500"
            }`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCell
          label="Active Agents"
          value={orchState.active_agents || 0}
          icon={<Cpu className="w-4 h-4" />}
          color="cyan"
        />
        <MetricCell
          label="Completed"
          value={orchState.completed_tasks || 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <MetricCell
          label="Failed"
          value={orchState.failed_tasks || 0}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={orchState.failed_tasks > 0 ? "red" : "gray"}
        />
        <MetricCell
          label="Scale Events"
          value={scalingEvents.length}
          icon={<TrendingUp className="w-4 h-4" />}
          color="orange"
        />
      </div>

      {/* Agent Utilization */}
      {agentUtilization.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-semibold text-white">Agent Utilization</h4>
          </div>
          <div className="space-y-3">
            {agentUtilization.map((agent, i) => (
              <UtilizationBar
                key={i}
                label={`${agent.agent_name || agent.agent_id} (${agent.tasks_assigned} tasks)`}
                value={agent.utilization_percent || 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Task Queue */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-white mb-3">
          Priority Queue ({taskQueue.length} tasks)
        </h4>
        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2 px-3">
          <span className="w-4">#</span>
          <span className="w-8">SCORE</span>
          <span className="flex-1">TASK</span>
          <span>STATUS</span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {taskQueue.map((item, i) => (
            <TaskQueueRow key={i} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* Scaling Events */}
      {scalingEvents.length > 0 && (
        <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Scaling Events
          </h4>
          <div className="space-y-1">
            {scalingEvents.map((evt, i) => (
              <div key={i} className="text-xs text-gray-300">
                <span className="text-orange-400 font-mono">
                  [{new Date(evt.timestamp).toLocaleTimeString()}]
                </span>{" "}
                {evt.event_type}: {evt.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orchestration Log */}
      {log.length > 0 && (
        <div className="bg-black/40 rounded-lg p-3 max-h-40 overflow-y-auto">
          {log.map((entry, i) => (
            <p key={i} className="text-[10px] text-gray-400 font-mono leading-5">
              {entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCell({ label, value, icon, color }) {
  const colors = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    red: "text-red-400",
    orange: "text-orange-400",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
      <div className={`flex justify-center mb-1 ${colors[color]}`}>{icon}</div>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}