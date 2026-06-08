import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save } from "lucide-react";

export default function ActionCorrectionUI({ agentId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [correctionData, setCorrectionData] = useState({
    agent_id: agentId,
    task_id: "",
    original_action: "",
    correction_type: "false_positive",
    corrected_action: "",
    root_cause: "",
    severity: "medium",
    learning_points: [],
  });
  const [newLearningPoint, setNewLearningPoint] = useState("");

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["agentTasks", agentId],
    queryFn: () => base44.entities.AgentTask.filter({ agent_id: agentId, status: "completed" }, "-end_time", 20),
    enabled: !!agentId,
  });

  const submitCorrectionMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.ActionCorrection.create({
        ...correctionData,
        operator_id: me?.email,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionCorrections"] });
      setCorrectionData({
        agent_id: agentId,
        task_id: "",
        original_action: "",
        correction_type: "false_positive",
        corrected_action: "",
        root_cause: "",
        severity: "medium",
        learning_points: [],
      });
      setSelectedTask(null);
    },
  });

  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setCorrectionData({
      ...correctionData,
      task_id: task.id,
      original_action: task.autonomous_actions?.[0] || "",
    });
  };

  const addLearningPoint = () => {
    if (newLearningPoint.trim()) {
      setCorrectionData({
        ...correctionData,
        learning_points: [...correctionData.learning_points, newLearningPoint.trim()],
      });
      setNewLearningPoint("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Task Selection */}
        <div className="col-span-1">
          <h3 className="text-lg font-semibold text-white mb-3">Select Task to Correct</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className={`p-2 rounded cursor-pointer border transition ${
                  selectedTask?.id === task.id
                    ? "bg-cyan-900/30 border-cyan-500/30 text-cyan-300"
                    : "bg-black/20 border-white/10 text-gray-300 hover:border-cyan-500/20"
                }`}
              >
                <p className="text-xs font-semibold">{task.task_name}</p>
                <p className="text-[10px] text-gray-400">{task.target}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Correction Form */}
        <div className="col-span-2 bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          {selectedTask ? (
            <>
              <h3 className="text-lg font-semibold text-white">Task Details</h3>
              
              <div className="grid grid-cols-2 gap-3 p-3 bg-black/30 rounded border border-white/5">
                <div>
                  <p className="text-xs text-gray-400">Task</p>
                  <p className="text-white font-semibold">{selectedTask.task_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Objective</p>
                  <p className="text-white text-sm">{selectedTask.objective}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Original Action Taken</label>
                <textarea
                  value={correctionData.original_action}
                  onChange={(e) => setCorrectionData({ ...correctionData, original_action: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Error Type</label>
                  <select
                    value={correctionData.correction_type}
                    onChange={(e) => setCorrectionData({ ...correctionData, correction_type: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="false_positive">False Positive</option>
                    <option value="false_negative">False Negative</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="wrong_decision">Wrong Decision</option>
                    <option value="timing">Timing</option>
                    <option value="severity_misclassification">Severity Misclassification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Severity</label>
                  <select
                    value={correctionData.severity}
                    onChange={(e) => setCorrectionData({ ...correctionData, severity: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">What Should Have Been Done</label>
                <textarea
                  value={correctionData.corrected_action}
                  onChange={(e) => setCorrectionData({ ...correctionData, corrected_action: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm h-20"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Root Cause</label>
                <textarea
                  value={correctionData.root_cause}
                  onChange={(e) => setCorrectionData({ ...correctionData, root_cause: e.target.value })}
                  placeholder="Why did the agent make this mistake?"
                  className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm h-16"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Learning Points</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLearningPoint}
                    onChange={(e) => setNewLearningPoint(e.target.value)}
                    placeholder="Add a key learning point..."
                    className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
                  />
                  <Button onClick={addLearningPoint} size="sm" className="bg-purple-600">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {correctionData.learning_points.map((point, idx) => (
                    <Badge
                      key={idx}
                      className="bg-purple-900/30 text-purple-300 border-purple-500/20 cursor-pointer text-[8px]"
                      onClick={() =>
                        setCorrectionData({
                          ...correctionData,
                          learning_points: correctionData.learning_points.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      {point} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => submitCorrectionMutation.mutate()}
                disabled={
                  submitCorrectionMutation.isPending ||
                  !correctionData.corrected_action ||
                  !correctionData.root_cause
                }
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitCorrectionMutation.isPending ? "Saving..." : "Save Correction"}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a task to correct</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}