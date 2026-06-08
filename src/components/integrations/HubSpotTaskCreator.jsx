import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export default function HubSpotTaskCreator({ alert, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskDetails, setTaskDetails] = useState({
    title: alert?.title || "",
    description: alert?.description || "",
    priority: alert?.severity || "medium",
    dueDate: ""
  });

  const createTaskMutation = useMutation({
    mutationFn: (params) => base44.functions.invoke('createHubSpotTask', params),
    onSuccess: (response) => {
      if (onSuccess) onSuccess(response.data);
      setIsOpen(false);
    }
  });

  const handleCreateTask = async () => {
    if (!taskDetails.title) {
      alert("Task title is required");
      return;
    }

    await createTaskMutation.mutateAsync({
      alertId: alert?.id,
      alertType: alert?.type || 'osint_alert',
      title: taskDetails.title,
      description: taskDetails.description,
      priority: taskDetails.priority,
      dueDate: taskDetails.dueDate
    });
  };

  if (!isOpen && !alert) {
    return null;
  }

  return (
    <div className="space-y-3">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          Create HubSpot Task
        </Button>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Create HubSpot Task</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={createTaskMutation.isPending}
            >
              ✕
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Task Title</label>
              <Input
                placeholder="Task title"
                value={taskDetails.title}
                onChange={(e) => setTaskDetails(prev => ({ ...prev, title: e.target.value }))}
                disabled={createTaskMutation.isPending}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Description</label>
              <textarea
                placeholder="Task description"
                value={taskDetails.description}
                onChange={(e) => setTaskDetails(prev => ({ ...prev, description: e.target.value }))}
                disabled={createTaskMutation.isPending}
                className="w-full px-3 py-2 border rounded text-sm"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1">Priority</label>
                <select
                  value={taskDetails.priority}
                  onChange={(e) => setTaskDetails(prev => ({ ...prev, priority: e.target.value }))}
                  disabled={createTaskMutation.isPending}
                  className="w-full px-2 py-2 border rounded text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Due Date</label>
                <Input
                  type="date"
                  value={taskDetails.dueDate}
                  onChange={(e) => setTaskDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                  disabled={createTaskMutation.isPending}
                />
              </div>
            </div>
          </div>

          {createTaskMutation.isError && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {createTaskMutation.error?.message || "Failed to create task"}
              </AlertDescription>
            </Alert>
          )}

          {createTaskMutation.data && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm flex items-center gap-2">
                Task created in HubSpot
                <a
                  href={createTaskMutation.data.hubspot_task_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending || !taskDetails.title}
              className="flex-1"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createTaskMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}