import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AlgorithmExecutionPanel({ selectedJob, onExecute }) {
  if (!selectedJob) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-xs">Select a job from the queue to execute</p>
      </div>
    );
  }

  const isExecutable = selectedJob.status === 'queued' || selectedJob.status === 'running';

  return (
    <div className="space-y-4">
      {/* Job Summary */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Execution Configuration</h3>
        
        <div className="space-y-3 text-[10px]">
          <Detail label="Algorithm" value={selectedJob.algorithm_type?.replace(/_/g, " ")} />
          <Detail label="Use Case" value={selectedJob.use_case} />
          <Detail label="Execution Type" value={selectedJob.execution_type?.replace(/_/g, " ")} />
          <Detail label="Backend" value={selectedJob.quantum_backend?.replace(/_/g, " ")} />
          <Detail label="Problem Size" value={selectedJob.problem_size?.toLocaleString()} />
          <Detail label="Qubits Required" value={selectedJob.qubits_required} />
          <Detail label="Est. Runtime" value={`${selectedJob.estimated_runtime_seconds}s`} />
        </div>
      </div>

      {/* Execution Status */}
      {selectedJob.status === 'completed' ? (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-bold text-green-400">Execution Completed</h3>
          </div>
          <p className="text-[10px] text-green-300">
            Completed at {new Date(selectedJob.completion_time).toLocaleString()}
          </p>
          <p className="text-[10px] text-green-300 mt-2">
            Actual runtime: {selectedJob.actual_runtime_seconds}s
          </p>
        </div>
      ) : selectedJob.status === 'running' ? (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-5 h-5 text-blue-400 animate-spin" />
            <h3 className="text-sm font-bold text-blue-400">Execution In Progress</h3>
          </div>
          <p className="text-[10px] text-blue-300">
            Started at {new Date(selectedJob.start_time).toLocaleString()}
          </p>
          <div className="mt-3 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      ) : (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
          <h3 className="text-sm font-bold text-orange-400 mb-2">Ready to Execute</h3>
          <p className="text-[10px] text-orange-300 mb-4">
            This job is queued and ready for execution on {selectedJob.quantum_backend?.replace(/_/g, " ")}
          </p>
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!isExecutable}
            onClick={() => onExecute(selectedJob.id)}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Execute Now
          </Button>
        </div>
      )}

      {/* Resource Allocation */}
      {selectedJob.resource_allocation && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">Resource Allocation</h3>
          <div className="space-y-2 text-[10px]">
            {JSON.parse(selectedJob.resource_allocation) && Object.entries(JSON.parse(selectedJob.resource_allocation)).map(([key, value]) => (
              <div key={key} className="flex justify-between p-2 rounded bg-black/20 border border-white/5">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-white font-semibold">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Details */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Algorithm Details</h3>
        <div className="space-y-2 text-[10px] text-gray-400">
          {selectedJob.algorithm_type === 'cryptanalysis' && (
            <>
              <p>• Shor-like factorization circuit</p>
              <p>• Quantum Fourier Transform depth optimization</p>
              <p>• Target: Factor {selectedJob.problem_size}-bit numbers</p>
            </>
          )}
          {selectedJob.algorithm_type === 'network_optimization' && (
            <>
              <p>• Quantum Approximate Optimization Algorithm (QAOA)</p>
              <p>• MaxCut problem formulation</p>
              <p>• Network size: {selectedJob.problem_size} nodes</p>
            </>
          )}
          {selectedJob.algorithm_type === 'resource_allocation' && (
            <>
              <p>• Combinatorial optimization via quantum annealing</p>
              <p>• D-Wave Leap/Advantage compatible</p>
              <p>• Resource constraints: {selectedJob.problem_size} variables</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between p-2 rounded bg-black/20 border border-white/5">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-semibold">{value || "—"}</span>
    </div>
  );
}