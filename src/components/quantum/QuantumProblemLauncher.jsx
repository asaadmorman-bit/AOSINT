import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Lock, Network, Brain, Target, Search, Cpu } from "lucide-react";

const QUANTUM_PROBLEMS = {
  cryptanalysis: {
    label: "Quantum Cryptanalysis",
    description: "Break RSA/ECC encryption using Shor's algorithm",
    icon: Lock,
    color: "#ff4757",
    algorithm: "shor_factorization",
  },
  network_optimization: {
    label: "Quantum Network Optimization",
    description: "Find optimal resource allocation using QAOA",
    icon: Network,
    color: "#00d4ff",
    algorithm: "qaoa",
  },
  threat_simulation: {
    label: "Quantum Threat Actor Simulation",
    description: "Simulate adversary decision trees with QML",
    icon: Brain,
    color: "#a855f7",
    algorithm: "quantum_ml",
  },
  pattern_search: {
    label: "Quantum Pattern Search",
    description: "Find threat indicators using Grover's algorithm",
    icon: Search,
    color: "#ffa502",
    algorithm: "grover_search",
  },
  resource_allocation: {
    label: "Quantum Resource Allocation",
    description: "Optimize defense spending across domains",
    icon: Target,
    color: "#2ed573",
    algorithm: "quantum_annealing",
  },
  graph_analysis: {
    label: "Quantum Graph Analysis",
    description: "Analyze threat actor networks with quantum entanglement",
    icon: Network,
    color: "#ff6b35",
    algorithm: "vqe",
  },
  machine_learning: {
    label: "Quantum Machine Learning",
    description: "Enhanced threat pattern detection using QML",
    icon: Cpu,
    color: "#00d4ff",
    algorithm: "quantum_ml",
  },
};

export default function QuantumProblemLauncher({ onTaskCreated }) {
  const [problemType, setProblemType] = useState("cryptanalysis");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [problemSize, setProblemSize] = useState("1000");
  const [launching, setLaunching] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const task = await base44.entities.QuantumTask.create(data);

      // Simulate quantum execution with LLM
      setTimeout(async () => {
        try {
          const problem = QUANTUM_PROBLEMS[problemType];
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a quantum computing algorithm executor. Simulate running a ${problem.label} problem using ${problem.algorithm}.

PROBLEM TITLE: ${title}
CONTEXT: ${context}
PROBLEM SIZE: ${problemSize} (variables/complexity metric)
ALGORITHM: ${problem.algorithm}

Generate a realistic quantum simulation result that includes:
1. Quantum execution result (the solution)
2. Classical comparison (what a classical algorithm would find)
3. Speedup factor (quantum time / classical time)
4. Qubits required for real quantum hardware
5. Strategic implications for this nation-state problem
6. Actionable operations that can be executed immediately

Provide specific, realistic values.`,
            add_context_from_internet: false,
            response_json_schema: {
              type: "object",
              properties: {
                quantum_result: { type: "string" },
                classical_result: { type: "string" },
                speedup_factor: { type: "number" },
                qubits_required: { type: "number" },
                runtime_seconds: { type: "number" },
                strategic_impact: { type: "string" },
                executable_actions: { type: "array", items: { type: "string" } },
              },
            },
          });

          await base44.entities.QuantumTask.update(task.id, {
            status: "completed",
            quantum_result: JSON.stringify(result),
            speedup_factor: result.speedup_factor,
            qubits_estimated: result.qubits_required,
            runtime_seconds: result.runtime_seconds,
            strategic_impact: result.strategic_impact,
            executable_actions: result.executable_actions,
            confidence: Math.round(80 + Math.random() * 20),
          });

          queryClient.invalidateQueries({ queryKey: ["quantum-tasks"] });
        } catch (err) {
          await base44.entities.QuantumTask.update(task.id, { status: "failed" });
        }
      }, 2000);

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quantum-tasks"] });
      setTitle("");
      setContext("");
      onTaskCreated();
    },
  });

  const problem = QUANTUM_PROBLEMS[problemType];
  const Icon = problem.icon;

  const handleLaunch = () => {
    if (!title || !context) return;
    createMutation.mutate({
      title,
      quantum_problem_type: problemType,
      nation_state_context: context,
      problem_size: parseInt(problemSize),
      quantum_algorithm: problem.algorithm,
      status: "running",
      input_data: JSON.stringify({ type: problemType, size: problemSize }),
    });
  };

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-base font-bold text-white mb-1">Launch Quantum Problem</h2>
        <p className="text-xs text-gray-500">Select a quantum problem type and define the strategic context</p>
      </div>

      {/* Problem Type Selection */}
      <div>
        <Label className="text-gray-400 text-xs mb-2 block">Quantum Problem Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(QUANTUM_PROBLEMS).map(([key, p]) => {
            const PIcon = p.icon;
            return (
              <button
                key={key}
                onClick={() => setProblemType(key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  problemType === key
                    ? "border-white/20 bg-white/5"
                    : "border-white/5 bg-black/20 hover:border-white/10"
                }`}
                style={problemType === key ? { borderColor: `${p.color}40`, background: `${p.color}08` } : {}}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: `${p.color}15` }}
                  >
                    <PIcon className="w-3.5 h-3.5" style={{ color: p.color }} />
                  </div>
                  <span className="text-xs font-semibold text-white">{p.label}</span>
                </div>
                <p className="text-[10px] text-gray-500">{p.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Details */}
      <div className="space-y-3">
        <div>
          <Label className="text-gray-400">Problem Title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Break PRC RSA-2048 Encryption for Communications Intel"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>

        <div>
          <Label className="text-gray-400">Strategic Context & Constraints</Label>
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe the nation-state challenge, timeline, enemy capabilities, strategic objectives, and success criteria..."
            className="bg-white/5 border-white/10 text-white mt-1 h-24"
          />
        </div>

        <div>
          <Label className="text-gray-400">Problem Complexity (est. qubits/variables)</Label>
          <Input
            type="number"
            value={problemSize}
            onChange={e => setProblemSize(e.target.value)}
            placeholder="1000"
            className="bg-white/5 border-white/10 text-white mt-1"
          />
        </div>
      </div>

      {/* Algorithm Info */}
      <div className="bg-black/20 border border-white/5 rounded-lg p-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Algorithm</p>
        <p className="text-xs text-gray-300">{problem.algorithm.replace(/_/g, " ").toUpperCase()}</p>
      </div>

      {/* Launch Button */}
      <Button
        onClick={handleLaunch}
        disabled={!title || !context || createMutation.isPending}
        className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 gap-2 h-10"
      >
        {createMutation.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching quantum problem…</>
          : <><Zap className="w-4 h-4" /> Launch Quantum Computation</>
        }
      </Button>
    </div>
  );
}