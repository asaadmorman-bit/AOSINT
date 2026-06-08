import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";

const STATUS_COLORS = {
  queued: { color: "#ffa502", icon: Clock },
  running: { color: "#00d4ff", icon: PlayCircle },
  completed: { color: "#2ed573", icon: CheckCircle2 },
  failed: { color: "#ff4757", icon: AlertTriangle },
  cancelled: { color: "#6b7280", icon: AlertTriangle },
};

const ALGORITHM_NAMES = {
  cryptanalysis: "🔐 Cryptanalysis",
  network_optimization: "🔗 Network Optimization",
  resource_allocation: "📊 Resource Allocation",
  pattern_search: "🔍 Pattern Search",
  threat_simulation: "⚠️ Threat Simulation",
  hybrid_vqe: "🧬 Variational VQE",
};

export default function QuantumJobQueue({ jobs = [], selectedJob, onSelectJob, onExecute, onCompare }) {
  const sortedJobs = [...jobs].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (jobs.length === 0) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-xs">No quantum jobs submitted</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedJobs.map(job => {
        const statusInfo = STATUS_COLORS[job.status];
        const StatusIcon = statusInfo.icon;
        const algoName = ALGORITHM_NAMES[job.algorithm_type] || job.algorithm_type;
        const isSelected = selectedJob?.id === job.id;

        return (
          <div
            key={job.id}
            onClick={() => onSelectJob(job)}
            className={`bg-[#111827] border rounded-xl p-4 cursor-pointer transition-all ${
              isSelected ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-white/5 hover:border-white/10'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg" style={{ background: `${statusInfo.color}15` }}>
                  <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white">{algoName}</span>
                    <Badge className="text-[8px]" style={{ background: `${statusInfo.color}20`, color: statusInfo.color, borderColor: `${statusInfo.color}30` }}>
                      {job.status}
                    </Badge>
                    {job.priority !== 'normal' && (
                      <Badge className="text-[8px] bg-red-500/10 text-red-400 border-red-500/20">
                        {job.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{job.use_case}</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-gray-500">
                <p>Position: <span className="text-white font-semibold">#{job.queue_position}</span></p>
                <p>ID: <span className="text-white font-mono">{job.job_id}</span></p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 mb-3 text-[10px]">
              <Metric label="Problem Size" value={job.problem_size?.toLocaleString()} />
              <Metric label="Qubits" value={job.qubits_required} />
              <Metric label="Est. Runtime" value={`${job.estimated_runtime_seconds}s`} />
              <Metric label="Backend" value={job.quantum_backend?.replace(/_/g, " ")} />
            </div>

            {/* Timeline */}
            {(job.submission_time || job.start_time || job.completion_time) && (
              <div className="text-[9px] p-2 rounded bg-black/20 border border-white/5 mb-3">
                <div className="flex gap-2 text-gray-500">
                  {job.submission_time && (
                    <span>
                      Submitted: <span className="text-gray-300">{new Date(job.submission_time).toLocaleTimeString()}</span>
                    </span>
                  )}
                  {job.start_time && (
                    <span>
                      Started: <span className="text-gray-300">{new Date(job.start_time).toLocaleTimeString()}</span>
                    </span>
                  )}
                  {job.completion_time && (
                    <span>
                      Completed: <span className="text-gray-300">{new Date(job.completion_time).toLocaleTimeString()}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {job.status === 'queued' && (
                <Button
                  size="sm"
                  className="text-[10px] h-7 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExecute(job.id);
                  }}
                >
                  <PlayCircle className="w-3 h-3 mr-1" />
                  Execute
                </Button>
              )}
              {job.status === 'completed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompare(job.id);
                  }}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Compare
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-black/20 rounded p-1.5 border border-white/5">
      <p className="text-gray-500">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}