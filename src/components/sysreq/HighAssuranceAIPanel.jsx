import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Brain, CheckCircle2, AlertTriangle, Lock, Zap } from "lucide-react";

const ASSURANCE_LEVELS = {
  none: { color: "#6b7280", label: "None" },
  low: { color: "#ffa502", label: "Low" },
  medium: { color: "#00d4ff", label: "Medium" },
  high: { color: "#2ed573", label: "High" },
  very_high: { color: "#a855f7", label: "Very High" },
  eda: { color: "#ff4757", label: "EDA" },
  ea: { color: "#ff4757", label: "EA" },
};

export default function HighAssuranceAIPanel({ aiTasks = [] }) {
  const [selectedAssurance, setSelectedAssurance] = useState("all");

  const filtered = selectedAssurance === "all"
    ? aiTasks
    : aiTasks.filter(t => t.assurance_level === selectedAssurance);

  const assuranceLevels = [...new Set(aiTasks.map(t => t.assurance_level))];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Select value={selectedAssurance} onValueChange={setSelectedAssurance}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white w-60">
          <SelectValue placeholder="Filter by assurance level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assurance Levels</SelectItem>
          {assuranceLevels.map(level => (
            <SelectItem key={level} value={level}>{ASSURANCE_LEVELS[level]?.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tasks */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
            <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No high-assurance AI tasks</p>
          </div>
        ) : filtered.map(task => {
          const assurance = ASSURANCE_LEVELS[task.assurance_level];
          return (
            <div
              key={task.id}
              className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-3"
              style={{ borderColor: `${assurance.color}20` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{task.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="text-[9px]" style={{ background: `${assurance.color}15`, color: assurance.color, borderColor: `${assurance.color}30` }}>
                      {assurance.label} Assurance
                    </Badge>
                    <Badge className="text-[9px] bg-white/5 text-gray-400 border-white/10">
                      {task.task_type?.replace(/_/g, " ")}
                    </Badge>
                    <Badge className="text-[9px] bg-white/5 text-gray-400 border-white/10">
                      {task.classification}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {task.model_name && (
                  <Property label="Model" value={task.model_name} icon={<Brain className="w-3 h-3" />} />
                )}
                {task.model_size_parameters && (
                  <Property label="Parameters" value={`${(task.model_size_parameters / 1e9).toFixed(1)}B`} icon={<Zap className="w-3 h-3" />} />
                )}
                {task.explainability_method && (
                  <Property label="Explainability" value={task.explainability_method.toUpperCase()} icon={<Brain className="w-3 h-3" />} />
                )}
                {task.operational_success_rate && (
                  <Property label="Success Rate" value={`${task.operational_success_rate}%`} icon={<CheckCircle2 className="w-3 h-3" />} />
                )}
              </div>

              {/* Verification Checklist */}
              <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verification</p>
                <div className="space-y-1 text-[9px]">
                  {task.reasoning_chain_auditable && (
                    <Item status="✓" text="Reasoning chain auditable" color="#2ed573" />
                  )}
                  {task.adversarial_tested && (
                    <Item status="✓" text="Adversarial tested" color="#2ed573" />
                  )}
                  {task.data_provenance_tracked && (
                    <Item status="✓" text="Data provenance tracked" color="#2ed573" />
                  )}
                  {task.bias_mitigation_applied && (
                    <Item status="✓" text="Bias mitigation applied" color="#2ed573" />
                  )}
                  {task.uncertainty_quantified && (
                    <Item status="✓" text="Uncertainty quantified" color="#2ed573" />
                  )}
                  {task.formal_methods_applied && (
                    <Item status="✓" text={`Formal methods: ${task.formal_methods_tool}`} color="#2ed573" />
                  )}
                  {task.decision_audit_trail && (
                    <Item status="✓" text="Full audit trail" color="#2ed573" />
                  )}
                </div>
              </div>

              {/* Risk & Recommendations */}
              {(task.operational_risk_assessment || task.recommendations?.length > 0) && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 text-[10px] space-y-1.5">
                  {task.operational_risk_assessment && (
                    <p className="text-orange-400"><span className="font-bold">Risk:</span> {task.operational_risk_assessment}</p>
                  )}
                  {task.recommendations?.length > 0 && (
                    <ul className="text-gray-400 space-y-0.5">
                      {task.recommendations.map((rec, i) => (
                        <li key={i} className="text-[9px]">• {rec}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="text-[10px] text-gray-500">
                Status: <span className="text-white font-semibold capitalize">{task.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Property({ label, value, icon }) {
  return (
    <div className="bg-black/20 rounded p-1.5 border border-white/5 flex items-start gap-2">
      <div className="text-gray-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-gray-500">{label}</p>
        <p className="text-gray-200 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Item({ status, text, color }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color }}>
      <span className="font-bold">{status}</span>
      <span>{text}</span>
    </div>
  );
}