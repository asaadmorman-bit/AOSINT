import React from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Lock, Network, Brain, Target, Search, Cpu, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PROBLEM_TYPE_META = {
  cryptanalysis: { label: "Cryptanalysis", color: "#ff4757", icon: Lock },
  network_optimization: { label: "Network Opt", color: "#00d4ff", icon: Network },
  threat_simulation: { label: "Threat Sim", color: "#a855f7", icon: Brain },
  pattern_search: { label: "Pattern Search", color: "#ffa502", icon: Search },
  resource_allocation: { label: "Resource Alloc", color: "#2ed573", icon: Target },
  graph_analysis: { label: "Graph Analysis", color: "#ff6b35", icon: Network },
  machine_learning: { label: "Quantum ML", color: "#00d4ff", icon: Cpu },
};

export default function QuantumTaskList({ tasks, isLoading, selectedTask, onSelect }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {tasks.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
          <Zap className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-xs">No quantum tasks yet</p>
        </div>
      ) : tasks.map(task => {
        const meta = PROBLEM_TYPE_META[task.quantum_problem_type];
        const Icon = meta?.icon || Zap;
        const isSelected = selectedTask?.id === task.id;
        const isRunning = task.status === "running";
        const isCompleted = task.status === "completed";

        return (
          <button
            key={task.id}
            onClick={() => onSelect(task)}
            className={`w-full text-left rounded-xl border p-3 transition-all ${
              isSelected ? "border-white/20" : "border-white/5 bg-[#111827] hover:border-white/10"
            }`}
            style={isSelected ? { borderColor: `${meta.color}40`, background: `${meta.color}06` } : {}}
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ background: `${meta.color}15` }}>
                {isRunning ? (
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: meta.color }} />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-3 h-3" style={{ color: meta.color }} />
                ) : (
                  <Icon className="w-3 h-3" style={{ color: meta.color }} />
                )}
              </div>
              <p className="text-xs font-medium text-white leading-snug flex-1">{task.title}</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">
                {meta.label}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                task.status === "running" ? "bg-purple-500/10 text-purple-400" :
                task.status === "completed" ? "bg-[#2ed573]/10 text-[#2ed573]" :
                task.status === "failed" ? "bg-[#ff4757]/10 text-[#ff4757]" :
                "bg-white/5 text-gray-500"
              }`}>
                {task.status}
              </span>
              {task.speedup_factor && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 ml-auto">
                  {task.speedup_factor}x speedup
                </span>
              )}
            </div>

            {task.confidence && (
              <div className="flex items-center gap-1 text-[9px]">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${task.confidence}%`, background: meta.color }} />
                </div>
                <span className="text-gray-500">{task.confidence}%</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}