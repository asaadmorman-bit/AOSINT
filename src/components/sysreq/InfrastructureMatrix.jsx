import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Lock, CheckCircle2 } from "lucide-react";

const CATEGORY_ICON = {
  gpu_compute: Cpu,
  cpu_compute: Server,
  storage: HardDrive,
  network: Network,
  os_kernel: Shield,
  memory: Cpu,
  cooling: Zap,
  power_management: Zap,
};

const CATEGORY_LABELS = {
  gpu_compute: "GPU Compute",
  cpu_compute: "CPU Compute",
  storage: "Storage",
  network: "Network",
  os_kernel: "OS/Kernel",
  memory: "Memory",
  cooling: "Cooling",
  power_management: "Power",
};

export default function InfrastructureMatrix({ infrastructure = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = selectedCategory === "all"
    ? infrastructure
    : infrastructure.filter(i => i.component_category === selectedCategory);

  const categories = [...new Set(infrastructure.map(i => i.component_category))];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(item => {
          const Icon = CATEGORY_ICON[item.component_category];
          const specs = item.specs || {};

          return (
            <div
              key={item.id}
              className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#00d4ff]/10">
                  <Icon className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <p className="text-[10px] text-gray-500">
                    {item.vendor} {item.model}
                  </p>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {specs.compute_power_tflops && (
                  <Spec label="Compute" value={`${specs.compute_power_tflops} TFLOPS`} />
                )}
                {specs.memory_gb && (
                  <Spec label="Memory" value={`${specs.memory_gb} GB`} />
                )}
                {specs.memory_bandwidth_gbps && (
                  <Spec label="Memory BW" value={`${specs.memory_bandwidth_gbps} GB/s`} />
                )}
                {specs.tdp_watts && (
                  <Spec label="TDP" value={`${specs.tdp_watts}W`} />
                )}
                {specs.tensor_cores && (
                  <Spec label="Tensor Cores" value={specs.tensor_cores} />
                )}
                {specs.cost_usd && (
                  <Spec label="Cost" value={`$${specs.cost_usd.toLocaleString()}`} />
                )}
              </div>

              {/* Certifications */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {item.darpa_benchmarked && (
                  <Badge className="text-[9px] bg-[#ffa502]/10 text-[#ffa502] border-[#ffa502]/20">
                    DARPA QBI
                  </Badge>
                )}
                {item.d_wave_compatible && (
                  <Badge className="text-[9px] bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20">
                    D-Wave Ready
                  </Badge>
                )}
                {item.xprize_validated && (
                  <Badge className="text-[9px] bg-[#2ed573]/10 text-[#2ed573] border-[#2ed573]/20">
                    XPRIZE
                  </Badge>
                )}
                {item.high_assurance_certified && (
                  <Badge className="text-[9px] bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20">
                    {item.cc_eal_level?.toUpperCase()}
                  </Badge>
                )}
                {item.fips_140_3 && (
                  <Badge className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20">
                    FIPS 140-3
                  </Badge>
                )}
              </div>

              {/* Deployment Tier */}
              {item.deployment_tier && (
                <div className="text-[10px] p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-gray-500">Tier: </span>
                  <span className="text-white capitalize font-semibold">{item.deployment_tier}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="bg-black/20 rounded p-1.5 border border-white/5">
      <p className="text-gray-500">{label}</p>
      <p className="text-gray-200 font-semibold">{value}</p>
    </div>
  );
}