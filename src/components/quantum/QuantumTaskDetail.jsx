import React from "react";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Cpu, Brain, Lightbulb, CheckCircle2, AlertTriangle, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuantumTaskDetail({ task, onClose }) {
  const result = task.quantum_result ? JSON.parse(task.quantum_result) : null;

  const sections = [
    {
      title: "Strategic Context",
      icon: <Brain className="w-3.5 h-3.5 text-[#a855f7]" />,
      content: task.nation_state_context,
      type: "text",
    },
    {
      title: "Quantum Algorithm",
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      content: task.quantum_algorithm?.replace(/_/g, " ").toUpperCase(),
      type: "badge",
    },
    {
      title: "Problem Size",
      icon: <Cpu className="w-3.5 h-3.5 text-[#00d4ff]" />,
      content: `${task.problem_size} variables/complexity units`,
      type: "text",
    },
    result && {
      title: "Quantum Solution",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />,
      content: result.quantum_result,
      type: "code",
    },
    result && {
      title: "Classical Comparison",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#ffa502]" />,
      content: result.classical_result,
      type: "text",
    },
    result && {
      title: "Quantum Advantage",
      icon: <ArrowUp className="w-3.5 h-3.5 text-[#2ed573]" />,
      content: `${result.speedup_factor}x faster than classical algorithm`,
      type: "text",
    },
    result && {
      title: "Qubits Required",
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      content: `${result.qubits_required} qubits (actual hardware)`,
      type: "text",
    },
    result && {
      title: "Strategic Impact",
      icon: <Lightbulb className="w-3.5 h-3.5 text-[#ffa502]" />,
      content: result.strategic_impact,
      type: "text",
    },
    result?.executable_actions && result.executable_actions.length > 0 && {
      title: "Actionable Operations",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />,
      content: result.executable_actions,
      type: "list",
    },
  ].filter(Boolean);

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
              {task.quantum_problem_type?.replace(/_/g, " ").toUpperCase()}
            </Badge>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              task.status === "completed" ? "bg-[#2ed573]/10 text-[#2ed573]" :
              task.status === "running" ? "bg-purple-500/10 text-purple-400" :
              task.status === "failed" ? "bg-[#ff4757]/10 text-[#ff4757]" :
              "bg-white/5 text-gray-500"
            }`}>
              {task.status?.toUpperCase()}
            </span>
            {task.confidence && (
              <span className="text-[10px] text-gray-500 ml-auto">
                {task.confidence}% confidence
              </span>
            )}
          </div>
          <h2 className="text-sm font-bold text-white leading-snug">{task.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-300 h-7 w-7 shrink-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {sections.map((section, i) => (
          <Section key={i} {...section} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, content, type }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {type === "text" && <p className="text-xs text-gray-300 leading-relaxed">{content}</p>}
      {type === "badge" && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          {content}
        </span>
      )}
      {type === "code" && (
        <pre className="text-[10px] text-purple-400 bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {content}
        </pre>
      )}
      {type === "list" && (
        <ol className="space-y-1.5">
          {content.map((item, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-300">
              <span className="text-[#2ed573] font-bold w-5 shrink-0">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}