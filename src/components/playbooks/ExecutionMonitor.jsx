import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

export default function ExecutionMonitor({ executions }) {
  const running = executions.filter((e) => e.status === "running");
  const completed = executions.filter((e) => e.status === "completed");
  const failed = executions.filter((e) => e.status === "failed");

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <p className="text-xs text-gray-400 font-semibold">Running</p>
          </div>
          <p className="text-3xl font-bold text-blue-400">{running.length}</p>
        </div>

        <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-xs text-gray-400 font-semibold">Completed</p>
          </div>
          <p className="text-3xl font-bold text-green-400">{completed.length}</p>
        </div>

        <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-xs text-gray-400 font-semibold">Failed</p>
          </div>
          <p className="text-3xl font-bold text-red-400">{failed.length}</p>
        </div>
      </div>

      {/* Execution List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Recent Executions</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {executions.map((execution) => (
            <div
              key={execution.id}
              className={`border rounded-lg p-3 ${
                execution.status === "running"
                  ? "bg-blue-900/10 border-blue-500/20"
                  : execution.success
                  ? "bg-green-900/10 border-green-500/20"
                  : "bg-red-900/10 border-red-500/20"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white font-semibold">{execution.execution_name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Started: {new Date(execution.start_time).toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={`text-[8px] ${
                    execution.status === "running"
                      ? "bg-blue-900/30 text-blue-300 border-blue-500/20"
                      : execution.success
                      ? "bg-green-900/30 text-green-300 border-green-500/20"
                      : "bg-red-900/30 text-red-300 border-red-500/20"
                  }`}
                >
                  {execution.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-800/30 p-2 rounded">
                  <p className="text-gray-400">Duration</p>
                  <p className="text-gray-300 font-semibold">
                    {execution.total_duration_seconds || "-"}s
                  </p>
                </div>
                <div className="bg-slate-800/30 p-2 rounded">
                  <p className="text-gray-400">Tasks</p>
                  <p className="text-gray-300 font-semibold">
                    {execution.tasks_executed || 0}
                  </p>
                </div>
                <div className="bg-slate-800/30 p-2 rounded">
                  <p className="text-gray-400">Progress</p>
                  <p className="text-gray-300 font-semibold">
                    {execution.progress_percentage || 0}%
                  </p>
                </div>
              </div>

              {execution.status === "running" && (
                <div className="mt-2 w-full bg-slate-800/50 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${execution.progress_percentage || 0}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}