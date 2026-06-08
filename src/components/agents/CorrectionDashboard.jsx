import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Edit2, Zap } from "lucide-react";

export default function CorrectionDashboard({ agentId }) {
  const [editingCorrectionId, setEditingCorrectionId] = useState(null);
  const [selectedCorrection, setSelectedCorrection] = useState(null);

  const queryClient = useQueryClient();

  const { data: corrections = [] } = useQuery({
    queryKey: ["corrections", agentId],
    queryFn: () =>
      agentId
        ? base44.entities.CorrectionAction.filter({ agent_id: agentId })
        : Promise.resolve([]),
    enabled: !!agentId,
  });

  const incorporateMutation = useMutation({
    mutationFn: (correctionId) =>
      base44.entities.CorrectionAction.update(correctionId, {
        incorporated_into_model: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corrections"] });
    },
  });

  const severityColor = {
    minor: "bg-blue-900/30 text-blue-300 border-blue-500/20",
    moderate: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
    major: "bg-orange-900/30 text-orange-300 border-orange-500/20",
    critical: "bg-red-900/30 text-red-300 border-red-500/20",
  };

  const pendingCorrections = corrections.filter(c => !c.incorporated_into_model);
  const incorporatedCorrections = corrections.filter(c => c.incorporated_into_model);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-orange-400" />
        Correction & Learning Dashboard
      </h3>

      {/* Pending Corrections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Pending Corrections ({pendingCorrections.length})</p>
          <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20">
            {pendingCorrections.length} to review
          </Badge>
        </div>

        {pendingCorrections.length > 0 ? (
          <div className="space-y-2">
            {pendingCorrections.map((correction) => (
              <div
                key={correction.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer"
                onClick={() => setSelectedCorrection(correction)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {correction.correction_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{correction.reasoning}</p>
                  </div>
                  <Badge className={`${severityColor[correction.action_severity]} text-[8px]`}>
                    {correction.action_severity}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <p className="text-gray-400">Original Action</p>
                    <p className="text-gray-300 truncate">{correction.original_action}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Corrected Action</p>
                    <p className="text-green-400 truncate">{correction.corrected_action}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      incorporateMutation.mutate(correction.id);
                    }}
                    disabled={incorporateMutation.isPending}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Incorporate Learning
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 p-4 text-center">All corrections have been incorporated</p>
        )}
      </div>

      {/* Detail View */}
      {selectedCorrection && (
        <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Correction Details</h4>
            <button
              onClick={() => setSelectedCorrection(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-gray-400">Learning Points</p>
              <div className="mt-1 bg-black/30 p-2 rounded border border-white/5">
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {typeof selectedCorrection.learning_points === 'string'
                    ? selectedCorrection.learning_points
                    : JSON.stringify(selectedCorrection.learning_points, null, 2)}
                </pre>
              </div>
            </div>

            {selectedCorrection.impact_on_future_decisions && (
              <div>
                <p className="text-gray-400">Expected Impact</p>
                <p className="text-gray-300 mt-1">{selectedCorrection.impact_on_future_decisions}</p>
              </div>
            )}

            {selectedCorrection.similar_errors_prevented > 0 && (
              <div className="p-2 bg-green-900/20 border border-green-500/30 rounded">
                <p className="text-green-300">
                  <Zap className="w-3 h-3 inline mr-1" />
                  This correction has prevented {selectedCorrection.similar_errors_prevented} similar errors
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incorporated Corrections */}
      {incorporatedCorrections.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">
            Incorporated Corrections ({incorporatedCorrections.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {incorporatedCorrections.slice(0, 4).map((correction) => (
              <div
                key={correction.id}
                className="bg-green-900/10 border border-green-500/20 rounded p-2"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Check className="w-3 h-3 text-green-400" />
                  <p className="text-xs text-green-400 font-semibold">Incorporated</p>
                </div>
                <p className="text-xs text-gray-300 truncate">{correction.correction_type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}