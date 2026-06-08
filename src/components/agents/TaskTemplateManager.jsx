import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Trash2, BookOpen } from "lucide-react";

export default function TaskTemplateManager({ agentId, onTaskCreate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [templateData, setTemplateData] = useState({
    template_name: "",
    task_type: "hunt",
    steps: [{ step_number: 1, action: "", parameters: "{}", success_criteria: "" }],
  });

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["agentTaskTemplates"],
    queryFn: () => base44.entities.AgentTaskTemplate.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.AgentTaskTemplate.create(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentTaskTemplates"] });
      setShowCreate(false);
      setTemplateData({
        template_name: "",
        task_type: "hunt",
        steps: [{ step_number: 1, action: "", parameters: "{}", success_criteria: "" }],
      });
    },
  });

  const addStep = () => {
    setTemplateData({
      ...templateData,
      steps: [...templateData.steps, {
        step_number: templateData.steps.length + 1,
        action: "",
        parameters: "{}",
        success_criteria: "",
      }],
    });
  };

  const updateStep = (idx, field, value) => {
    const updated = [...templateData.steps];
    updated[idx] = { ...updated[idx], [field]: value };
    setTemplateData({ ...templateData, steps: updated });
  };

  const removeStep = (idx) => {
    setTemplateData({
      ...templateData,
      steps: templateData.steps.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Task Templates
        </h3>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Template
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Template Name</label>
            <input
              type="text"
              value={templateData.template_name}
              onChange={(e) => setTemplateData({ ...templateData, template_name: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Task Type</label>
            <select
              value={templateData.task_type}
              onChange={(e) => setTemplateData({ ...templateData, task_type: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              <option value="hunt">Threat Hunt</option>
              <option value="analyze">Analysis</option>
              <option value="monitor">Monitoring</option>
              <option value="respond">Incident Response</option>
              <option value="investigate">Investigation</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-400">Task Steps</label>
              <Button onClick={addStep} size="sm" variant="outline">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {templateData.steps.map((step, idx) => (
              <div key={idx} className="bg-black/20 border border-white/10 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Step {step.step_number}</p>
                  <Button
                    onClick={() => removeStep(idx)}
                    size="sm"
                    variant="outline"
                    className="text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <input
                  type="text"
                  value={step.action}
                  onChange={(e) => updateStep(idx, 'action', e.target.value)}
                  placeholder="Action to perform"
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                />
                <input
                  type="text"
                  value={step.success_criteria}
                  onChange={(e) => updateStep(idx, 'success_criteria', e.target.value)}
                  placeholder="Success criteria"
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !templateData.template_name}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Template
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid gap-2">
        {templates.map((template) => (
          <div key={template.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-semibold text-sm">{template.template_name}</p>
                <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20 mt-1 text-[8px]">
                  {template.task_type}
                </Badge>
              </div>
              <Button
                onClick={() => onTaskCreate?.(template.id)}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Play className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">{template.steps?.length || 0} steps</p>
          </div>
        ))}
      </div>

      {templates.length === 0 && !showCreate && (
        <p className="text-xs text-gray-500 text-center py-4">No task templates yet. Create one to get started.</p>
      )}
    </div>
  );
}