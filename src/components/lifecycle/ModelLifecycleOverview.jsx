import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Zap, Shield } from "lucide-react";

const LIFECYCLE_STAGE_ICONS = {
  development: { icon: Clock, color: "#00d4ff" },
  validation: { icon: Shield, color: "#ffa502" },
  pre_deployment: { icon: Zap, color: "#a855f7" },
  operational: { icon: CheckCircle2, color: "#2ed573" },
  monitoring: { icon: RefreshCw, color: "#00d4ff" },
  retirement: { icon: AlertTriangle, color: "#ff4757" },
};

const CERTIFICATION_COLORS = {
  not_started: "#6b7280",
  in_progress: "#ffa502",
  certified: "#2ed573",
  conditional: "#ffa502",
  failed: "#ff4757",
  expired: "#ff4757",
};

export default function ModelLifecycleOverview({ models, onSelectModel, onValidate, onMonitor }) {
  return (
    <div className="space-y-4">
      {models.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-xs">No models in lifecycle management</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {models.map(model => {
            const stageIcon = LIFECYCLE_STAGE_ICONS[model.lifecycle_stage];
            const certColor = CERTIFICATION_COLORS[model.certification_status];

            return (
              <div
                key={model.id}
                className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-3 hover:border-white/10 transition-colors cursor-pointer"
                onClick={() => onSelectModel(model)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {stageIcon && <stageIcon.icon className="w-4 h-4" style={{ color: stageIcon.color }} />}
                      <h3 className="text-sm font-bold text-white">{model.model_name}</h3>
                      <Badge className="text-[8px]" style={{ background: `${certColor}15`, color: certColor, borderColor: `${certColor}30` }}>
                        {model.certification_status?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      v{model.model_version} • {model.vendor} • {model.model_type?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="text-right text-[10px]">
                    <p className="font-semibold text-white">Risk: {model.operational_risk_score || 0}%</p>
                    <p className="text-gray-500">Drift: {(model.current_data_drift_percentage || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {/* Assurance & Validation */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-black/20 rounded p-2 border border-white/5">
                    <p className="text-gray-500">Assurance Level</p>
                    <p className="text-white font-semibold capitalize">{model.current_assurance_level}</p>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/5">
                    <p className="text-gray-500">DARPA Score</p>
                    <p className="text-white font-semibold">{model.darpa_validation_score || "—"}%</p>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/5">
                    <p className="text-gray-500">Bias Audit</p>
                    <p className="text-white font-semibold">{model.bias_audit_score || "—"}%</p>
                  </div>
                  <div className="bg-black/20 rounded p-2 border border-white/5">
                    <p className="text-gray-500">Predictions</p>
                    <p className="text-white font-semibold">{(model.total_predictions || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 text-[9px]">
                  {model.reasoning_chain_enabled && (
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">✓ Auditable Reasoning</Badge>
                  )}
                  {model.uncertainty_quantification_enabled && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">✓ Uncertainty Quantified</Badge>
                  )}
                  {model.human_in_loop_required && (
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">⚠ Human-in-Loop</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onValidate(model.id);
                    }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Validate DARPA
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMonitor(model.id);
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Monitor Drift
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}