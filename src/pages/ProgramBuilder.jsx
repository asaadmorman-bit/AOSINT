import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ChevronRight, Check, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, label: "Program Type", icon: "🎯" },
  { id: 2, label: "Mission & Scope", icon: "📋" },
  { id: 3, label: "Domains", icon: "🌐" },
  { id: 4, label: "Stakeholders", icon: "👥" },
  { id: 5, label: "Governance", icon: "⚖️" },
  { id: 6, label: "Roles", icon: "🔑" },
  { id: 7, label: "Technology", icon: "⚙️" },
  { id: 8, label: "Review", icon: "✅" },
];

export default function ProgramBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    program_type: "enterprise",
    mission_statement: "",
    domain_coverage: [],
    stakeholders: [],
    governance_model: "hierarchical",
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenant } = useQuery({
    queryKey: ["my_tenant", user?.email],
    queryFn: () => user ? base44.entities.Tenant.filter({ owner_email: user.email }).then(r => r?.[0]) : null,
    enabled: !!user,
  });

  const createProgramMutation = useMutation({
    mutationFn: async () => {
      const program = await base44.entities.IntelligenceProgram.create({
        ...formData,
        tenant_id: tenant.id,
        status: "draft",
      });
      return program;
    },
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ["my_programs"] });
      window.location.href = createPageUrl(`ProgramBlueprint?program_id=${program.id}`);
    },
  });

  const generateBlueprintMutation = useMutation({
    mutationFn: async (programId) => {
      const response = await base44.functions.invoke("generateProgramBlueprint", {
        program_id: programId,
        program_data: formData,
      });
      return response.data;
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      createProgramMutation.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.program_type;
      case 2:
        return formData.name && formData.mission_statement;
      case 3:
        return formData.domain_coverage.length > 0;
      case 4:
        return formData.stakeholders.length > 0;
      case 5:
        return formData.governance_model;
      case 6:
        return true; // Optional step
      case 7:
        return true; // Optional step
      case 8:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold">Intelligence Program Builder</h1>
          <p className="text-gray-400 mt-2">Design your organization's intelligence program</p>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-white/5 px-8 py-6 bg-[#0d1220]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / STEPS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1">
            <div
              className="bg-[#00d4ff] h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Steps */}
          <div className="col-span-1">
            <div className="space-y-3">
              {STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentStep === step.id
                      ? "bg-[#00d4ff]/10 border border-[#00d4ff]/30"
                      : idx < currentStep - 1
                      ? "text-gray-500"
                      : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{step.label}</p>
                  </div>
                  {idx < currentStep - 1 && <Check className="w-4 h-4 text-green-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="col-span-2">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8">
              {currentStep === 1 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Select Program Type</h3>
                  <div className="space-y-3">
                    {["enterprise", "government", "public_safety", "protective_intelligence", "msp"].map(type => (
                      <label key={type} className="flex items-center gap-3 p-4 border border-white/5 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input
                          type="radio"
                          name="program_type"
                          value={type}
                          checked={formData.program_type === type}
                          onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 capitalize font-bold">{type.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Mission & Scope</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Program Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Corporate Intelligence Program"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Mission Statement</label>
                      <textarea
                        value={formData.mission_statement}
                        onChange={(e) => setFormData({ ...formData, mission_statement: e.target.value })}
                        placeholder="Define the purpose and goals of your intelligence program"
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white h-24 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Domain Coverage</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {["cyber", "physical", "influence", "ep", "leo", "public_safety"].map(domain => (
                      <label key={domain} className="flex items-center gap-2 p-3 border border-white/5 rounded hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.domain_coverage.includes(domain)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, domain_coverage: [...formData.domain_coverage, domain] });
                            } else {
                              setFormData({ ...formData, domain_coverage: formData.domain_coverage.filter(d => d !== domain) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="capitalize font-bold text-sm">{domain.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Key Stakeholders</h3>
                  <div className="space-y-3">
                    {formData.stakeholders.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={s.name}
                          onChange={(e) => {
                            const updated = [...formData.stakeholders];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, stakeholders: updated });
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Role"
                          value={s.role}
                          onChange={(e) => {
                            const updated = [...formData.stakeholders];
                            updated[idx].role = e.target.value;
                            setFormData({ ...formData, stakeholders: updated });
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, stakeholders: formData.stakeholders.filter((_, i) => i !== idx) });
                          }}
                          className="text-red-400"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => setFormData({ ...formData, stakeholders: [...formData.stakeholders, { name: "", role: "" }] })}
                      className="w-full bg-white/5 text-gray-400 hover:bg-white/10"
                    >
                      Add Stakeholder
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Governance Model</h3>
                  <div className="space-y-3">
                    {["hierarchical", "consensus", "federated"].map(model => (
                      <label key={model} className="flex items-center gap-3 p-4 border border-white/5 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input
                          type="radio"
                          name="governance_model"
                          value={model}
                          checked={formData.governance_model === model}
                          onChange={(e) => setFormData({ ...formData, governance_model: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 capitalize font-bold">{model}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Recommended Roles</h3>
                  <p className="text-gray-400 text-sm mb-4">Based on your program type and domains, we recommend:</p>
                  <div className="space-y-2 bg-white/5 p-4 rounded border border-white/10">
                    <p className="font-bold">• Intelligence Director</p>
                    <p className="font-bold">• Analysis Manager</p>
                    <p className="font-bold">• Senior Analyst</p>
                    <p className="font-bold">• Fusion Coordinator</p>
                    <p className="font-bold">• Data Engineer</p>
                  </div>
                </div>
              )}

              {currentStep === 7 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Recommended ASOINT Modules</h3>
                  <p className="text-gray-400 text-sm mb-4">Your program will integrate with:</p>
                  <div className="space-y-2 bg-white/5 p-4 rounded border border-white/10">
                    <p>✓ Fusion Center</p>
                    <p>✓ Scenario Engine</p>
                    <p>✓ Data Lake</p>
                    <p>✓ Knowledge Graph</p>
                    <p>✓ Compliance Engine</p>
                  </div>
                </div>
              )}

              {currentStep === 8 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Review Program Design</h3>
                  <div className="space-y-4 bg-white/5 p-4 rounded border border-white/10">
                    <div>
                      <p className="text-gray-500 text-sm">Program Name</p>
                      <p className="font-bold">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Type</p>
                      <p className="font-bold capitalize">{formData.program_type.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Domains</p>
                      <p className="font-bold">{formData.domain_coverage.join(", ")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid() || createProgramMutation.isPending}
                  className="flex-1 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                >
                  {currentStep === STEPS.length ? "Create Program" : "Next"} {createProgramMutation.isPending && "..."}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}