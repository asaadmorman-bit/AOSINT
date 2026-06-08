import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, ChevronDown } from "lucide-react";

export default function PlaybookBuilder() {
  const [playbookData, setPlaybookData] = useState({
    playbook_name: "",
    description: "",
    playbook_type: "threat_hunt",
    trigger_type: "manual",
    workflow_steps: [],
  });
  const [newStep, setNewStep] = useState({
    step_name: "",
    step_type: "agent_task",
    agent_type: "",
    task_objective: "",
  });
  const [expandedSteps, setExpandedSteps] = useState({});

  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.AgentProfile.list("", 50),
  });

  const createPlaybookMutation = useMutation({
    mutationFn: () =>
      base44.entities.Playbook.create({
        ...playbookData,
        created_by: "builder@example.com",
        status: "draft",
        workflow_steps: playbookData.workflow_steps.map((step, idx) => ({
          ...step,
          step_id: step.step_id || `step_${idx}`,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playbooks"] });
      setPlaybookData({
        playbook_name: "",
        description: "",
        playbook_type: "threat_hunt",
        trigger_type: "manual",
        workflow_steps: [],
      });
    },
  });

  const addStep = () => {
    if (newStep.step_name) {
      setPlaybookData({
        ...playbookData,
        workflow_steps: [
          ...playbookData.workflow_steps,
          {
            ...newStep,
            step_id: `step_${playbookData.workflow_steps.length}`,
            timeout_seconds: 300,
            retry_count: 0,
            failure_action: "abort",
          },
        ],
      });
      setNewStep({
        step_name: "",
        step_type: "agent_task",
        agent_type: "",
        task_objective: "",
      });
    }
  };

  const removeStep = (idx) => {
    setPlaybookData({
      ...playbookData,
      workflow_steps: playbookData.workflow_steps.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Create New Playbook</h2>

      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
        {/* Playbook Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-semibold">
              Playbook Name
            </label>
            <input
              type="text"
              value={playbookData.playbook_name}
              onChange={(e) =>
                setPlaybookData({
                  ...playbookData,
                  playbook_name: e.target.value,
                })
              }
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-semibold">
              Type
            </label>
            <select
              value={playbookData.playbook_type}
              onChange={(e) =>
                setPlaybookData({
                  ...playbookData,
                  playbook_type: e.target.value,
                })
              }
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="threat_hunt">Threat Hunt</option>
              <option value="incident_response">Incident Response</option>
              <option value="investigation">Investigation</option>
              <option value="enrichment">Enrichment</option>
              <option value="containment">Containment</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2 font-semibold">
            Description
          </label>
          <textarea
            value={playbookData.description}
            onChange={(e) =>
              setPlaybookData({
                ...playbookData,
                description: e.target.value,
              })
            }
            rows="3"
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Workflow Steps */}
        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Steps</h3>

          {playbookData.workflow_steps.map((step, idx) => (
            <div
              key={idx}
              className="mb-3 bg-slate-800/50 border border-slate-700/30 rounded p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold">{step.step_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Type: {step.step_type}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setExpandedSteps({
                        ...expandedSteps,
                        [idx]: !expandedSteps[idx],
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition ${
                        expandedSteps[idx] ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    onClick={() => removeStep(idx)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {expandedSteps[idx] && (
                <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2 text-xs">
                  <div>
                    <p className="text-gray-400">Objective</p>
                    <p className="text-gray-200">{step.task_objective}</p>
                  </div>
                  {step.agent_type && (
                    <div>
                      <p className="text-gray-400">Agent</p>
                      <p className="text-gray-200">{step.agent_type}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400">Timeout</p>
                    <p className="text-gray-200">{step.timeout_seconds}s</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Step Form */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded p-4 mt-4">
            <h4 className="text-white font-semibold mb-3">Add New Step</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newStep.step_name}
                onChange={(e) =>
                  setNewStep({ ...newStep, step_name: e.target.value })
                }
                placeholder="Step name..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
              />

              <select
                value={newStep.step_type}
                onChange={(e) =>
                  setNewStep({ ...newStep, step_type: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
              >
                <option value="agent_task">Agent Task</option>
                <option value="data_enrichment">Data Enrichment</option>
                <option value="decision_gate">Decision Gate</option>
                <option value="notification">Notification</option>
              </select>

              {newStep.step_type === "agent_task" && (
                <select
                  value={newStep.agent_type}
                  onChange={(e) =>
                    setNewStep({ ...newStep, agent_type: e.target.value })
                  }
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">Select Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.agent_name}
                    </option>
                  ))}
                </select>
              )}

              <textarea
                value={newStep.task_objective}
                onChange={(e) =>
                  setNewStep({ ...newStep, task_objective: e.target.value })
                }
                placeholder="Objective..."
                rows="2"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
              />

              <Button
                onClick={addStep}
                disabled={!newStep.step_name}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={() => createPlaybookMutation.mutate()}
          disabled={
            createPlaybookMutation.isPending ||
            !playbookData.playbook_name ||
            playbookData.workflow_steps.length === 0
          }
          className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {createPlaybookMutation.isPending ? "Saving..." : "Create Playbook"}
        </Button>
      </div>
    </div>
  );
}