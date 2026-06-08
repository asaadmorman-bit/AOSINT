import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function QuantumPerformanceAnalytics({ jobs = [], comparisons = [], onCompare }) {
  const completedJobs = jobs.filter(j => j.status === 'completed');

  const performanceData = completedJobs.map((job, i) => {
    const comparison = comparisons.find(c => c.orchestration_job_id === job.id);
    return {
      name: job.algorithm_type?.substring(0, 10),
      problemSize: job.problem_size,
      quantumQuality: comparison?.quantum_solution_quality || 0,
      classicalQuality: comparison?.classical_solution_quality || 0,
      speedup: comparison?.speedup_factor || 1,
      cost: comparison?.total_cost_quantum_usd || 0,
    };
  });

  const advantageData = comparisons.map(c => ({
    speedup: c.speedup_factor,
    quality_improvement: ((c.quantum_solution_quality - c.classical_solution_quality) / c.classical_solution_quality) * 100,
    darpa_score: c.darpa_benchmark_score,
  }));

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon={CheckCircle2} label="Completed" value={completedJobs.length} color="#2ed573" />
        <SummaryCard icon={TrendingUp} label="Avg Speedup" value={comparisons.length > 0 ? `${(comparisons.reduce((sum, c) => sum + c.speedup_factor, 0) / comparisons.length).toFixed(1)}x`  : "—"} color="#a855f7" />
        <SummaryCard icon={AlertTriangle} label="Advantage Rate" value={comparisons.length > 0 ? `${Math.round(comparisons.filter(c => c.advantage_achieved).length / comparisons.length * 100)}%` : "—"} color="#ffa502" />
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Quality Comparison: Quantum vs Classical</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Legend />
              <Bar dataKey="quantumQuality" fill="#a855f7" name="Quantum Quality" />
              <Bar dataKey="classicalQuality" fill="#ffa502" name="Classical Quality" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Advantage Analysis */}
      {advantageData.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Quantum Advantage Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="speedup" name="Speedup Factor" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis type="number" dataKey="quality_improvement" name="Quality Improvement %" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Scatter name="Executions" data={advantageData} fill="#a855f7" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Results */}
      {comparisons.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white">Quantum vs Classical Comparisons</h3>
          {comparisons.map(comparison => (
            <div key={comparison.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white">Job {comparison.orchestration_job_id?.substring(0, 12)}</p>
                    <Badge className={`text-[8px] ${comparison.advantage_achieved ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {comparison.advantage_magnitude}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">{comparison.findings_summary}</p>
                </div>
                <div className="text-right text-[10px]">
                  <p className="text-white font-semibold">{comparison.speedup_factor.toFixed(1)}x Speedup</p>
                  <p className="text-gray-500">DARPA Score: {comparison.darpa_benchmark_score.toFixed(0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px] mb-3">
                <Metric label="Quantum Time" value={`${comparison.quantum_runtime_seconds.toFixed(1)}s`} />
                <Metric label="Classical Time" value={`${comparison.classical_runtime_seconds.toFixed(1)}s`} />
                <Metric label="Quantum Quality" value={`${comparison.quantum_solution_quality.toFixed(1)}%`} />
                <Metric label="Classical Quality" value={`${comparison.classical_solution_quality.toFixed(1)}%`} />
              </div>

              <div className="text-[9px] p-2 rounded bg-black/20 border border-white/5">
                {comparison.recommendations?.length > 0 && (
                  <div>
                    <p className="text-gray-400 font-semibold mb-1">Recommendations:</p>
                    <ul className="text-gray-500 space-y-0.5">
                      {comparison.recommendations.map((rec, i) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-xs">No performance comparisons yet</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <div className="p-2 rounded-lg w-fit mb-2" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-black/40 rounded p-1.5 border border-white/5">
      <p className="text-gray-500 text-[9px]">{label}</p>
      <p className="text-white font-semibold text-[10px]">{value}</p>
    </div>
  );
}