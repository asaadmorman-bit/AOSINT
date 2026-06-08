import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MaturityDashboard() {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showAssessment, setShowAssessment] = useState(false);

  const { data: programs } = useQuery({
    queryKey: ["my_programs"],
    queryFn: () => base44.entities.IntelligenceProgram.list(),
  });

  const { data: assessments } = useQuery({
    queryKey: ["assessments", selectedProgram],
    queryFn: () => selectedProgram ? base44.entities.MaturityAssessment.filter({ program_id: selectedProgram }) : [],
    enabled: !!selectedProgram,
  });

  const currentAssessment = assessments?.[0];

  const assessMutation = useMutation({
    mutationFn: async (programId) => {
      const response = await base44.functions.invoke("assessMaturity", {
        program_id: programId,
        assessment_data: {
          has_policies: true,
          has_oversight_board: true,
          has_audit_program: true,
          has_formal_governance: true,
          has_defined_collection_plan: true,
          multiple_collection_sources: true,
          automated_collection: true,
          collection_validated: true,
          has_analysis_workflows: true,
          has_senior_analysts: true,
          uses_analysis_frameworks: true,
          produces_finished_intelligence: true,
          has_fusion_center: false,
          cross_domain_correlation: false,
          real_time_fusion: false,
          fusion_integrated: false,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      setShowAssessment(false);
    },
  });

  const getMaturityColor = (level) => {
    if (level === 1) return "#6b7280";
    if (level === 2) return "#ffa502";
    if (level === 3) return "#00d4ff";
    if (level === 4) return "#2ed573";
    return "#a855f7";
  };

  const getMaturityLabel = (level) => {
    const labels = ["", "Foundational", "Operational", "Integrated", "Predictive", "Adaptive"];
    return labels[level] || "Unknown";
  };

  const MaturityMeter = ({ score, label }) => (
    <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
      <p className="text-gray-500 text-sm mb-3">{label}</p>
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${(score / 5) * 100}%`, backgroundColor: getMaturityColor(score) }}
          />
        </div>
        <span className="text-xl font-bold" style={{ color: getMaturityColor(score) }}>
          {score}/5
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Maturity Dashboard</h1>
          <p className="text-gray-400 mt-2">Track your intelligence program's maturity across all domains</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Program Selector */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Select Program</p>
            <select
              value={selectedProgram || ""}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
            >
              <option value="">Choose a program...</option>
              {programs?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Overall Maturity */}
          {selectedProgram && currentAssessment && (
            <>
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                <p className="text-gray-500 text-sm mb-2">Overall Maturity</p>
                <p className="text-3xl font-bold" style={{ color: getMaturityColor(currentAssessment.overall_maturity) }}>
                  {currentAssessment.overall_maturity}/5
                </p>
                <p className="text-xs text-gray-400 mt-1">{getMaturityLabel(currentAssessment.overall_maturity)}</p>
              </div>

              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                <p className="text-gray-500 text-sm mb-2">Gaps Identified</p>
                <p className="text-2xl font-bold text-red-400">{currentAssessment.gaps?.length || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Needs remediation</p>
              </div>

              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                <Button
                  onClick={() => assessMutation.mutate(selectedProgram)}
                  disabled={assessMutation.isPending}
                  className="w-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                >
                  {assessMutation.isPending ? "Assessing..." : "Re-Assess"}
                </Button>
              </div>
            </>
          )}
        </div>

        {selectedProgram && currentAssessment ? (
          <div className="space-y-8">
            {/* Category Scores */}
            <div>
              <h3 className="text-xl font-bold mb-4">Category Maturity</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(currentAssessment.category_scores || {}).map(([category, score]) => (
                  <MaturityMeter key={category} score={score} label={category.replace(/_/g, " ").toUpperCase()} />
                ))}
              </div>
            </div>

            {/* Gaps */}
            {currentAssessment.gaps?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Identified Gaps</h3>
                <div className="space-y-3">
                  {currentAssessment.gaps?.map((gap, idx) => (
                    <div key={idx} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`w-5 h-5 mt-1 ${
                          gap.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <div className="flex-1">
                          <p className="font-bold capitalize">{gap.category.replace(/_/g, " ")}</p>
                          <p className="text-sm text-gray-400 mt-1">{gap.description}</p>
                          <p className="text-xs text-gray-500 mt-2">Remediation: {gap.remediation}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded capitalize ${
                          gap.severity === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {gap.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {currentAssessment.recommendations?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Next Steps</h3>
                <div className="space-y-3">
                  {currentAssessment.recommendations?.map((rec, idx) => (
                    <div key={idx} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-[#00d4ff] mt-1" />
                        <div className="flex-1">
                          <p className="font-bold">{rec.recommendation}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Timeline: {rec.timeline}</span>
                            <span>Module: {rec.asoint_module}</span>
                          </div>
                        </div>
                        <span className="text-xs bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-1 rounded">
                          Priority {rec.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestone */}
            {currentAssessment.next_milestone && (
              <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#2ed573]/10 border border-[#00d4ff]/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-[#00d4ff]" />
                  <h4 className="text-lg font-bold">Next Maturity Milestone</h4>
                </div>
                <p className="text-gray-300">{currentAssessment.next_milestone}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Select a program to view maturity assessment</p>
          </div>
        )}
      </div>
    </div>
  );
}