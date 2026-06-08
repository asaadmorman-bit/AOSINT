import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Loader2, CheckCircle2, Circle, AlertCircle,
  User, Calendar, FileText, Clock
} from "lucide-react";

export default function InvestigationTaskBoard({ investigationId, collaborators, user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", assigned_to: "", priority: "medium", due_date: "" });
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['investigationTasks', investigationId],
    queryFn: () => base44.entities.InvestigationTask.filter(
      { investigation_id: investigationId },
      '-created_date',
      100
    ),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestigationTask.create({
      ...data,
      investigation_id: investigationId,
      assigned_by: user.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationTasks'] });
      setForm({ title: "", assigned_to: "", priority: "medium", due_date: "" });
      setShowForm(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => base44.entities.InvestigationTask.update(id, {
      status,
      completion_notes: notes,
      completed_at: status === "completed" ? new Date().toISOString() : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationTasks'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestigationTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationTasks'] });
    }
  });

  const statusColors = {
    pending: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    completed: "bg-green-500/20 text-green-300 border-green-500/30",
    blocked: "bg-red-500/20 text-red-300 border-red-500/30"
  };

  const priorityColors = {
    low: "bg-blue-500/10 text-blue-300",
    medium: "bg-yellow-500/10 text-yellow-300",
    high: "bg-orange-500/10 text-orange-300",
    critical: "bg-red-500/10 text-red-300"
  };

  const byStatus = {
    pending: tasks.filter(t => t.status === "pending"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    completed: tasks.filter(t => t.status === "completed"),
    blocked: tasks.filter(t => t.status === "blocked")
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" /> Tasks ({tasks.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Assign Task
        </Button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            className="text-xs h-8 bg-white/5 border-white/10"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="text-xs h-8 bg-white/5 border border-white/10 rounded-md text-white"
            >
              <option value="">Assign to...</option>
              {collaborators?.map(c => (
                <option key={c.user_email} value={c.user_email}>{c.user_name}</option>
              ))}
            </select>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="text-xs h-8 bg-white/5 border border-white/10 rounded-md text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="text-xs h-8 bg-white/5 border-white/10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.assigned_to || createMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-xs flex-1"
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-xs">No tasks assigned yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {["pending", "in_progress", "completed", "blocked"].map(status => (
            <div key={status} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-white mb-3 capitalize flex items-center gap-2">
                <Circle className={`w-2 h-2 ${statusColors[status]}`} /> {status.replace("_", " ")}
              </h4>
              <div className="space-y-2">
                {byStatus[status].map(task => (
                  <div key={task.id} className={`rounded-lg p-2.5 border text-xs space-y-1.5 ${statusColors[status]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white flex-1">{task.title}</p>
                      {user.email === task.assigned_by && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(task.id)}
                          className="h-5 w-5 p-0 hover:text-red-400"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5 opacity-60" />
                      <span className="opacity-80">{task.assigned_to?.split("@")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[9px] py-0 px-1.5 ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-[10px] opacity-70">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {status !== "completed" && status !== "blocked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          id: task.id,
                          status: status === "pending" ? "in_progress" : "completed"
                        })}
                        className="w-full mt-1 h-6 text-[10px]"
                        disabled={updateStatusMutation.isPending}
                      >
                        {status === "pending" ? "Start" : "Complete"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}