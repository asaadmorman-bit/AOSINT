import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, TrendingUp, Target, AlertTriangle } from "lucide-react";

const HARDWARE_MATURITY = {
  prototype: { color: "#6b7280", label: "Prototype" },
  alpha: { color: "#ffa502", label: "Alpha" },
  beta: { color: "#00d4ff", label: "Beta" },
  production: { color: "#2ed573", label: "Production" },
  mature: { color: "#2ed573", label: "Mature" },
};

export default function DARPABenchmarkingHub({ benchmarks = [] }) {
  const [selectedVendor, setSelectedVendor] = useState("all");

  const filtered = selectedVendor === "all"
    ? benchmarks
    : benchmarks.filter(b => b.vendor === selectedVendor);

  const vendors = [...new Set(benchmarks.map(b => b.vendor))];

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="font-bold">DARPA Quantum Benchmarking Initiative (QBI)</span> evaluates quantum processors against standardized metrics: quantum volume, circuit layer operations, error rates, and qubit counts. These benchmarks enable vendor roadmap assessment and guide procurement decisions for nation-state quantum capabilities.
        </p>
      </div>

      {/* Filter */}
      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white w-60">
          <SelectValue placeholder="Filter by vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vendors</SelectItem>
          {vendors.map(vendor => (
            <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(bench => {
          const maturity = HARDWARE_MATURITY[bench.hardware_maturity];
          const progressPercent = Math.min((bench.qubit_count / 1000) * 100, 100);

          return (
            <div
              key={bench.id}
              className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{bench.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {bench.vendor} • {bench.quantum_platform}
                  </p>
                </div>
                <Badge className="text-[9px]" style={{ background: `${maturity.color}15`, color: maturity.color, borderColor: `${maturity.color}30` }}>
                  {maturity.label}
                </Badge>
              </div>

              {/* Qubit Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400">Physical Qubits</span>
                  <span className="text-[10px] font-bold text-white">{bench.qubit_count}</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#ffa502]" style={{ width: `${progressPercent}%` }} />
                </div>
                {bench.logical_qubits && (
                  <p className="text-[9px] text-gray-500 mt-1">
                    Logical qubits: <span className="text-white font-semibold">{bench.logical_qubits}</span>
                  </p>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {bench.quantum_volume_score && (
                  <Metric label="Quantum Volume" value={bench.quantum_volume_score} icon={<Zap className="w-3 h-3" />} />
                )}
                {bench.current_error_rate && (
                  <Metric label="Error Rate" value={`${(bench.current_error_rate * 100).toFixed(3)}%`} icon={<AlertTriangle className="w-3 h-3" />} />
                )}
                {bench.circuit_layer_operations && (
                  <Metric label="Circuit Layers" value={bench.circuit_layer_operations} icon={<Target className="w-3 h-3" />} />
                )}
                {bench.advantage_over_classical && (
                  <Metric label="Speedup Est." value={`${bench.advantage_over_classical}x`} icon={<TrendingUp className="w-3 h-3" />} />
                )}
              </div>

              {/* Roadmap & Projection */}
              {(bench.projected_1kq_logical_date || bench.utility_estimate_2026) && (
                <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Roadmap</p>
                  {bench.projected_1kq_logical_date && (
                    <p className="text-[9px] text-gray-300">
                      <span className="text-gray-500">1000 logical qubits by:</span> <span className="font-semibold">{bench.projected_1kq_logical_date}</span>
                    </p>
                  )}
                  {bench.utility_estimate_2026 && (
                    <p className="text-[9px] text-gray-300">
                      <span className="text-gray-500">2026 applications:</span> <span className="font-semibold">{bench.utility_estimate_2026}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Recommendation */}
              {bench.recommendation && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-[10px] text-green-400">
                  <span className="font-bold">Recommendation:</span> {bench.recommendation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="bg-black/20 rounded p-1.5 border border-white/5 flex items-start gap-2">
      <div className="text-gray-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-gray-500">{label}</p>
        <p className="text-gray-200 font-semibold">{value}</p>
      </div>
    </div>
  );
}