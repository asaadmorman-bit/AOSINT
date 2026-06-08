import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";

export default function ValidationDashboard({ validations, sources }) {
  const objectivityBreakdown = {
    objective_fact: validations.filter((v) => v.objectivity_assessment === "objective_fact").length,
    verifiable_claim: validations.filter((v) => v.objectivity_assessment === "verifiable_claim").length,
    inference: validations.filter((v) => v.objectivity_assessment === "inference").length,
    subjective_opinion: validations.filter((v) => v.objectivity_assessment === "subjective_opinion").length,
    unknown: validations.filter((v) => v.objectivity_assessment === "unknown").length,
  };

  const confidenceBreakdown = {
    high: validations.filter((v) => v.confidence_level === "high").length,
    medium: validations.filter((v) => v.confidence_level === "medium").length,
    low: validations.filter((v) => v.confidence_level === "low").length,
    unverified: validations.filter((v) => v.confidence_level === "unverified").length,
  };

  const avgAccuracy =
    validations.length > 0
      ? Math.round(
          validations.reduce((sum, v) => sum + (v.accuracy_score || 0), 0) /
            validations.length
        )
      : 0;

  const flaggedRecords = validations.filter((v) => v.quality_flags?.length > 0);
  const actionableRecords = validations.filter((v) => v.actionable === true).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Records Validated</p>
          <p className="text-3xl font-bold text-cyan-400">{validations.length}</p>
        </div>
        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Avg Accuracy</p>
          <p className="text-3xl font-bold text-green-400">{avgAccuracy}%</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Actionable</p>
          <p className="text-3xl font-bold text-blue-400">{actionableRecords}</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-1">Flagged</p>
          <p className="text-3xl font-bold text-orange-400">{flaggedRecords.length}</p>
        </div>
      </div>

      {/* Objectivity Assessment */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Objectivity Assessment
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(objectivityBreakdown).map(([type, count]) => (
            <div key={type} className="bg-slate-800/50 p-3 rounded text-center">
              <p className="text-xs text-gray-400 capitalize">
                {type.replace(/_/g, " ")}
              </p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{count}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                {validations.length > 0
                  ? Math.round((count / validations.length) * 100)
                  : 0}
                %
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence Levels */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Confidence Distribution</h3>
        <div className="space-y-3">
          {Object.entries(confidenceBreakdown).map(([level, count]) => {
            const color = {
              high: "bg-green-500",
              medium: "bg-yellow-500",
              low: "bg-orange-500",
              unverified: "bg-red-500",
            }[level];

            const textColor = {
              high: "text-green-400",
              medium: "text-yellow-400",
              low: "text-orange-400",
              unverified: "text-red-400",
            }[level];

            return (
              <div key={level}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold capitalize ${textColor}`}>
                    {level}
                  </span>
                  <span className="text-sm text-gray-400">{count}</span>
                </div>
                <div className="bg-slate-800/50 rounded-full h-2">
                  <div
                    className={`${color} h-full rounded-full`}
                    style={{
                      width: `${validations.length > 0 ? (count / validations.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flagged Records */}
      {flaggedRecords.length > 0 && (
        <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Quality Flags ({flaggedRecords.length})
          </h3>
          <div className="space-y-2">
            {flaggedRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="bg-slate-800/50 p-2 rounded text-sm">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-white font-semibold">Record: {record.record_id}</p>
                  <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20 text-[8px]">
                    {record.data_type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-300">
                  {record.quality_flags?.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Confidence Records */}
      <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          High Confidence Records ({confidenceBreakdown.high})
        </h3>
        <p className="text-sm text-gray-300">
          {confidenceBreakdown.high} records have high confidence and are ready for operational use
        </p>
      </div>
    </div>
  );
}