import React from "react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DARPABenchmarkResults({ jobs = [] }) {
  const { data: benchmarks = [] } = useQuery({
    queryKey: ["darpa-quantum-benchmarks"],
    queryFn: () => base44.entities.DARPAQuantumBenchmark.list("-created_date"),
  });

  if (benchmarks.length === 0) {
    return (
      <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-xs">No DARPA benchmarks executed yet</p>
      </div>
    );
  }

  const certifiedCount = benchmarks.filter(b => b.certification_level === 'certified').length;
  const provisionalCount = benchmarks.filter(b => b.certification_level === 'provisional').length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card label="Certified" value={certifiedCount} color="#2ed573" />
        <Card label="Provisional" value={provisionalCount} color="#ffa502" />
        <Card label="Avg DARPA Score" value={benchmarks.length > 0 ? `${(benchmarks.reduce((sum, b) => sum + b.darpa_benchmark_score, 0) / benchmarks.length).toFixed(0)}` : "—"} color="#a855f7" />
      </div>

      {/* Benchmark Results */}
      <div className="space-y-3">
        {benchmarks.map(benchmark => {
          const certIcon = benchmark.certification_level === 'certified' ? CheckCircle2 : AlertTriangle;
          const certColor = benchmark.certification_level === 'certified' ? '#2ed573' : '#ffa502';

          return (
            <div key={benchmark.id} className="bg-[#111827] border border-white/5 rounded-xl p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{benchmark.benchmark_name}</h3>
                    <Badge className="text-[8px]" style={{ background: `${certColor}20`, color: certColor, borderColor: `${certColor}30` }}>
                      {benchmark.certification_level}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {benchmark.backend_tested} • {benchmark.benchmark_standard?.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right text-sm font-black text-white">
                  {benchmark.darpa_benchmark_score.toFixed(0)}/100
                </div>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
                <Metric label="Quantum Score" value={benchmark.metric_quantum_score?.toFixed(1)} />
                <Metric label="Classical Score" value={benchmark.metric_classical_score?.toFixed(1)} />
                <Metric label="Relative Performance" value={`${benchmark.relative_performance?.toFixed(1)}x`} />
                <Metric label="Advantage" value={benchmark.advantage_demonstrated ? '✓ Yes' : '✗ No'} />
              </div>

              {/* Key Findings */}
              {benchmark.scalability_projection && (
                <div className="text-[10px] p-2 rounded bg-black/20 border border-white/5 mb-3">
                  <p className="text-gray-400"><span className="font-bold text-white">Scalability:</span> {benchmark.scalability_projection}</p>
                </div>
              )}

              {/* Recommendations */}
              {benchmark.recommendations?.length > 0 && (
                <div className="text-[9px] p-2 rounded bg-blue-500/5 border border-blue-500/20">
                  <p className="text-blue-400 font-bold mb-1">Recommendations:</p>
                  <ul className="text-blue-300 space-y-0.5">
                    {benchmark.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-black/40 rounded p-1.5 border border-white/5">
      <p className="text-gray-500 text-[9px]">{label}</p>
      <p className="text-white font-semibold text-[10px]">{value || "—"}</p>
    </div>
  );
}