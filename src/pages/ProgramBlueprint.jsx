import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, Eye, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProgramBlueprint() {
  const [activeTab, setActiveTab] = useState("charter");

  const params = new URLSearchParams(window.location.search);
  const programId = params.get("program_id");

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => base44.entities.IntelligenceProgram.filter({ id: programId }).then(r => r?.[0]),
  });

  const { data: blueprint } = useQuery({
    queryKey: ["blueprint", program?.blueprint_id],
    queryFn: () => program?.blueprint_id ? base44.entities.ProgramBlueprint.filter({ id: program.blueprint_id }).then(r => r?.[0]) : null,
    enabled: !!program?.blueprint_id,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const doc = `
# Intelligence Program Blueprint: ${program.name}

## Program Charter
${blueprint?.charter?.mission_statement}

### Governance Structure
${blueprint?.charter?.governance_structure}

## Operational Playbooks
${blueprint?.operational_playbooks?.map(pb => `### ${pb.name}
${pb.description}
**Workflow:** ${pb.workflow}
**Tools:** ${pb.tools_required?.join(", ")}
`).join("\n")}

## Escalation Matrix
${JSON.stringify(blueprint?.escalation_matrix, null, 2)}

## Fusion Center Integration
- Data Sources: ${blueprint?.fusion_center_plan?.data_sources?.join(", ")}
- Verification: ${blueprint?.fusion_center_plan?.verification_layers}
- Analyst Workflows: ${blueprint?.fusion_center_plan?.analyst_workflows}

## Compliance Framework
- Frameworks: ${blueprint?.compliance_plan?.frameworks?.join(", ")}
- Audit Schedule: ${blueprint?.compliance_plan?.audit_schedule}

Generated: ${new Date().toLocaleString()}
      `;
      
      const blob = new Blob([doc], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blueprint-${program.name}.md`;
      a.click();
    },
  });

  if (!program) return <div className="text-center py-12">Loading...</div>;
  if (!blueprint) return <div className="text-center py-12">Blueprint not generated yet</div>;

  const tabs = [
    { id: "charter", label: "Charter" },
    { id: "playbooks", label: "Playbooks" },
    { id: "escalation", label: "Escalation" },
    { id: "fusion", label: "Fusion Center" },
    { id: "compliance", label: "Compliance" },
  ];

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{program.name}</h1>
              <p className="text-gray-400 mt-2">{program.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => exportMutation.mutate()}
                className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Type: <span className="capitalize text-white">{program.program_type}</span></span>
            <span className="text-sm text-gray-500">Status: <span className="capitalize text-white">{program.status}</span></span>
            <span className="text-sm text-gray-500">Maturity: <span className="text-[#00d4ff]">Level {program.maturity_level}/5</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-8 bg-[#0d1220] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#00d4ff] text-[#00d4ff]"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {activeTab === "charter" && (
          <div className="space-y-6">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Mission Statement</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{blueprint.charter?.mission_statement}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3">Scope</h3>
                <p className="text-gray-300 text-sm">{blueprint.charter?.scope}</p>
              </div>

              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3">Governance Structure</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{blueprint.charter?.governance_structure}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "playbooks" && (
          <div className="space-y-4">
            {blueprint.operational_playbooks?.map((pb, idx) => (
              <div key={idx} className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">{pb.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{pb.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Workflow</p>
                    <p className="text-white">{pb.workflow}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tools Required</p>
                    <p className="text-white">{pb.tools_required?.join(", ")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "escalation" && (
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6">Escalation Matrix</h3>
            <div className="space-y-4">
              {blueprint.escalation_matrix?.levels?.map((level, idx) => (
                <div key={idx} className="border-l-4 border-[#00d4ff] pl-4 py-2">
                  <p className="font-bold">Level {level.level}: {level.name}</p>
                  <p className="text-sm text-gray-400">Escalate after: {level.escalate_after}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "fusion" && (
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3">Data Sources</h3>
              <ul className="space-y-2">
                {blueprint.fusion_center_plan?.data_sources?.map((source, idx) => (
                  <li key={idx} className="text-gray-300">✓ {source}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3">Analyst Workflows</h3>
              <p className="text-gray-300">{blueprint.fusion_center_plan?.analyst_workflows}</p>
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Frameworks</h3>
              <div className="grid grid-cols-3 gap-2">
                {blueprint.compliance_plan?.frameworks?.map((fw, idx) => (
                  <div key={idx} className="bg-white/5 px-3 py-2 rounded text-sm">{fw}</div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3">Audit Schedule</h3>
              <p className="text-gray-300">{blueprint.compliance_plan?.audit_schedule}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}