import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Plus, Pause, Play, Trash2, Edit, ChevronDown, Calendar,
  CheckCircle2, XCircle, TrendingUp
} from "lucide-react";

export default function JobSchedulerPanel() {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const queryClient = useQueryClient();

  const { data: scheduledJobs = [], isLoading } = useQuery({
    queryKey: ["scheduledJobs", filterStatus],
    queryFn: () =>
      base44.entities.ScheduledQuantumJob.filter(
        { status: filterStatus },
        "-next_execution_time",
        100
      ),
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData) =>
      base44.entities.ScheduledQuantumJob.create(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledJobs"] });
      setShowForm(false);
    },
  });

  const toggleJobMutation = useMutation({
    mutationFn: ({ id, newStatus }) =>
      base44.entities.ScheduledQuantumJob.update(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledJobs"] });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id) =>
      base44.entities.ScheduledQuantumJob.update(id, { status: "archived" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledJobs"] });
    },
  });

  const handleCreateJob = (formData) => {
    const jobData = {
      ...formData,
      next_execution_time: new Date(formData.scheduled_start_time).toISOString(),
    };
    createJobMutation.mutate(jobData);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading scheduled jobs...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Job Scheduler
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Schedule Job
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2">
        {["active", "paused", "completed", "archived"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              filterStatus === status
                ? "bg-cyan-600/50 text-cyan-100 border border-cyan-500/30"
                : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            {status} ({scheduledJobs.filter((j) => j.status === status).length})
          </button>
        ))}
      </div>

      {/* Create Job Form */}
      {showForm && (
        <ScheduleJobForm
          onSubmit={handleCreateJob}
          onCancel={() => setShowForm(false)}
          isLoading={createJobMutation.isPending}
        />
      )}

      {/* Scheduled Jobs List */}
      <div className="space-y-2">
        {scheduledJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No {filterStatus} scheduled jobs
          </div>
        ) : (
          scheduledJobs.map((job) => {
            const isExpanded = expandedId === job.id;
            const nextExecTime = new Date(job.next_execution_time);
            const timeUntilExec = nextExecTime - new Date();
            const hoursUntil = Math.floor(timeUntilExec / (1000 * 60 * 60));
            const minutesUntil = Math.floor(
              (timeUntilExec % (1000 * 60 * 60)) / (1000 * 60)
            );

            return (
              <div
                key={job.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{job.job_name}</h4>
                      <Badge
                        className={`text-[8px] ${
                          job.status === "active"
                            ? "bg-green-900/20 text-green-300 border-green-500/20"
                            : "bg-yellow-900/20 text-yellow-300 border-yellow-500/20"
                        }`}
                      >
                        {job.status}
                      </Badge>
                      <Badge className="text-[8px] bg-cyan-900/20 text-cyan-300 border-cyan-500/20">
                        {job.schedule_type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {job.algorithm_type.replace(/_/g, " ")} •{" "}
                      {job.execution_type.replace(/_/g, " ")}
                    </p>
                  </div>

                  {/* Next Execution Info */}
                  <div className="text-right text-[10px]">
                    <p className="text-cyan-400 font-semibold">
                      {hoursUntil}h {minutesUntil}m
                    </p>
                    <p className="text-gray-500">
                      {nextExecTime.toLocaleDateString()} {nextExecTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-3 text-[9px]">
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Executions</p>
                    <p className="text-white font-semibold">{job.execution_count || 0}</p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" /> Success
                    </p>
                    <p className="text-green-400 font-semibold">
                      {job.success_count || 0}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" /> Failed
                    </p>
                    <p className="text-red-400 font-semibold">
                      {job.failure_count || 0}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-gray-500">Avg Cost</p>
                    <p className="text-yellow-400 font-semibold">
                      ${(job.avg_cost_usd || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Expand Details */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  className="text-[9px] text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-2"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  {isExpanded ? "Hide" : "Show"} Details
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="bg-black/20 rounded p-2 mb-3 space-y-2 text-[9px]">
                    {job.last_execution_time && (
                      <p className="text-gray-400">
                        Last Run:{" "}
                        <span className="text-white">
                          {new Date(job.last_execution_time).toLocaleString()}
                        </span>
                      </p>
                    )}
                    {job.avg_runtime_seconds && (
                      <p className="text-gray-400">
                        Avg Runtime:{" "}
                        <span className="text-white">
                          {job.avg_runtime_seconds.toFixed(0)}s
                        </span>
                      </p>
                    )}
                    {job.notes && (
                      <p className="text-gray-400">
                        Notes: <span className="text-white">{job.notes}</span>
                      </p>
                    )}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {job.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="text-[7px] bg-white/10 text-gray-300 border-white/20"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {job.status === "active" ? (
                    <Button
                      size="xs"
                      onClick={() =>
                        toggleJobMutation.mutate({
                          id: job.id,
                          newStatus: "paused",
                        })
                      }
                      className="text-[9px] bg-yellow-600/50 hover:bg-yellow-600"
                    >
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                  ) : job.status === "paused" ? (
                    <Button
                      size="xs"
                      onClick={() =>
                        toggleJobMutation.mutate({
                          id: job.id,
                          newStatus: "active",
                        })
                      }
                      className="text-[9px] bg-green-600/50 hover:bg-green-600"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Resume
                    </Button>
                  ) : null}
                  <Button
                    size="xs"
                    onClick={() => deleteJobMutation.mutate(job.id)}
                    className="text-[9px] bg-red-600/50 hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Archive
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ScheduleJobForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    job_name: "",
    schedule_type: "one_time",
    scheduled_start_time: new Date().toISOString().split("T")[0],
    algorithm_type: "cryptanalysis",
    execution_type: "quantum_only",
    quantum_backend: "simulator",
    priority: "normal",
    qubits_required: 100,
    problem_size: 1000,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      <h4 className="font-semibold text-white mb-3">Schedule New Job</h4>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Job name"
          value={formData.job_name}
          onChange={(e) =>
            setFormData({ ...formData, job_name: e.target.value })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm placeholder-gray-500"
        />

        <select
          value={formData.schedule_type}
          onChange={(e) =>
            setFormData({ ...formData, schedule_type: e.target.value })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
        >
          <option value="one_time">One Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        <input
          type="datetime-local"
          value={formData.scheduled_start_time}
          onChange={(e) =>
            setFormData({
              ...formData,
              scheduled_start_time: e.target.value,
            })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
        />

        <select
          value={formData.algorithm_type}
          onChange={(e) =>
            setFormData({ ...formData, algorithm_type: e.target.value })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
        >
          <option value="cryptanalysis">Cryptanalysis</option>
          <option value="network_optimization">Network Optimization</option>
          <option value="resource_allocation">Resource Allocation</option>
          <option value="pattern_search">Pattern Search</option>
          <option value="threat_simulation">Threat Simulation</option>
          <option value="hybrid_vqe">Hybrid VQE</option>
        </select>

        <select
          value={formData.quantum_backend}
          onChange={(e) =>
            setFormData({ ...formData, quantum_backend: e.target.value })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
        >
          <option value="simulator">Simulator</option>
          <option value="ibm_quantum">IBM Quantum</option>
          <option value="dwave_leap">D-Wave Leap</option>
          <option value="rigetti">Rigetti</option>
          <option value="ionq">IonQ</option>
        </select>

        <select
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: e.target.value })
          }
          className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
        >
          <option value="low">Low Priority</option>
          <option value="normal">Normal Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical Priority</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !formData.job_name}
          className="bg-cyan-600 hover:bg-cyan-700 text-white flex-1"
        >
          {isLoading ? "Scheduling..." : "Schedule Job"}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}