import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const VALIDATION_TYPES = {
  darpa_benchmark: { icon: "🎯", label: "DARPA Benchmark" },
  bias_audit: { icon: "⚖️", label: "Bias Audit" },
  adversarial_robustness: { icon: "🛡️", label: "Adversarial Robustness" },
  explainability: { icon: "🧠", label: "Explainability" },
  formal_verification: { icon: "✓", label: "Formal Verification" },
  data_quality: { icon: "📊", label: "Data Quality" },
  performance: { icon: "📈", label: "Performance" },
};

export default function ModelValidationTracker({ models = [] }) {
  const [selectedModel, setSelectedModel] = useState(models[0]);

  if (!selectedModel) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-xs">No models to validate</p>
      </div>
    );
  }

  const validationStatus = {
    passed: models.filter(m => m.certification_status === 'certified').length,
    conditional: models.filter(m => m.certification_status === 'conditional').length,
    failed: models.filter(m => m.certification_status === 'failed').length,
    in_progress: models.filter(m => m.certification_status === 'in_progress').length,
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Passed" value={validationStatus.passed} icon={CheckCircle2} color="#2ed573" />
        <SummaryCard label="Conditional" value={validationStatus.conditional} icon={Clock} color="#ffa502" />
        <SummaryCard label="Failed" value={validationStatus.failed} icon={AlertTriangle} color="#ff4757" />
        <SummaryCard label="In Progress" value={validationStatus.in_progress} icon={Shield} color="#00d4ff" />
      </div>

      {/* Validation Timeline */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Validation Checklist</h3>
        <div className="space-y-2">
          {Object.entries(VALIDATION_TYPES).map(([key, val]) => {
            const isChecked = [
              selectedModel.darpa_validation_passed && key === 'darpa_benchmark',
              selectedModel.bias_audit_score && selectedModel.bias_audit_score >= 80 && key === 'bias_audit',
              selectedModel.adversarial_robustness_score && selectedModel.adversarial_robustness_score >= 80 && key === 'adversarial_robustness',
              selectedModel.reasoning_chain_enabled && key === 'explainability',
            ].includes(true);

            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5 hover:border-white/10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-sm ${isChecked ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                  {isChecked ? '✓' : val.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-white">{val.label}</p>
                </div>
                <Badge className={isChecked ? "text-[9px] bg-green-500/10 text-green-400 border-green-500/20" : "text-[9px] bg-gray-500/10 text-gray-400 border-gray-500/20"}>
                  {isChecked ? 'PASSED' : 'PENDING'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certification Details */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Certification Status</h3>
        <div className="space-y-3 text-[10px]">
          <Detail label="Status" value={selectedModel.certification_status?.replace(/_/g, " ")} />
          <Detail label="DARPA Score" value={selectedModel.darpa_validation_score ? `${selectedModel.darpa_validation_score}%` : "Not validated"} />
          <Detail label="Certified By" value={selectedModel.certified_by || "Pending"} />
          <Detail label="Certification Date" value={selectedModel.certified_date ? new Date(selectedModel.certified_date).toLocaleDateString() : "Pending"} />
          <Detail label="Next Evaluation" value={selectedModel.next_evaluation_date ? new Date(selectedModel.next_evaluation_date).toLocaleDateString() : "Not scheduled"} />
        </div>
      </div>

      {/* Model List for Selection */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">All Models</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {models.map(model => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${selectedModel.id === model.id ? 'bg-purple-500/20 border border-purple-500/40' : 'bg-black/20 border border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white font-semibold">{model.model_name}</span>
                <Badge className="text-[8px]" style={{
                  background: model.certification_status === 'certified' ? '#2ed57320' : '#ffa50220',
                  color: model.certification_status === 'certified' ? '#2ed573' : '#ffa502',
                  borderColor: model.certification_status === 'certified' ? '#2ed57340' : '#ffa50240'
                }}>
                  {model.certification_status?.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <div className="p-2 rounded-lg w-fit mb-2" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}