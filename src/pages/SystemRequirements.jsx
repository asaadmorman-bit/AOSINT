import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Network, Shield, Zap, Target, Brain } from "lucide-react";
import InfrastructureMatrix from "@/components/sysreq/InfrastructureMatrix";
import HighAssuranceAIPanel from "@/components/sysreq/HighAssuranceAIPanel";
import DARPABenchmarkingHub from "@/components/sysreq/DARPABenchmarkingHub";
import DWaveIntegration from "@/components/sysreq/DWaveIntegration";

export default function SystemRequirements() {
  const { data: infrastructure = [] } = useQuery({
    queryKey: ["infrastructure-requirements"],
    queryFn: () => base44.entities.InfrastructureRequirement.list("-created_date"),
  });

  const { data: aiTasks = [] } = useQuery({
    queryKey: ["high-assurance-ai"],
    queryFn: () => base44.entities.HighAssuranceAITask.list("-created_date"),
  });

  const { data: benchmarks = [] } = useQuery({
    queryKey: ["darpa-benchmarks"],
    queryFn: () => base44.entities.DARPABenchmark.list("-created_date"),
  });

  const dapraBenchmarked = infrastructure.filter(i => i.darpa_benchmarked).length;
  const dWaveCompatible = infrastructure.filter(i => i.d_wave_compatible).length;
  const highAssuranceOps = aiTasks.filter(a => a.assurance_level === "very_high").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-5 h-5 text-[#00d4ff]" />
            <h1 className="text-lg font-bold text-white">System Requirements & Infrastructure</h1>
          </div>
          <p className="text-xs text-gray-500">
            LLM hardware, high-assurance AI/ML, DARPA quantum benchmarking, and D-Wave integration
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20">
            {infrastructure.length} Configs
          </Badge>
          <Badge className="bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20">
            {aiTasks.length} HA-AI Tasks
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            {benchmarks.length} Benchmarks
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="DARPA Benchmarked" value={dapraBenchmarked} color="#ffa502" />
        <StatCard icon={Cpu} label="D-Wave Compatible" value={dWaveCompatible} color="#a855f7" />
        <StatCard icon={Shield} label="Very High Assurance" value={highAssuranceOps} color="#2ed573" />
        <StatCard icon={Target} label="Total Requirements" value={infrastructure.length} color="#00d4ff" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="infrastructure">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="infrastructure" className="gap-1.5">
            <Server className="w-3 h-3" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="high-assurance" className="gap-1.5">
            <Shield className="w-3 h-3" />
            High-Assurance AI/ML
          </TabsTrigger>
          <TabsTrigger value="darpa" className="gap-1.5">
            <Zap className="w-3 h-3" />
            DARPA Benchmarking
          </TabsTrigger>
          <TabsTrigger value="dwave" className="gap-1.5">
            <Target className="w-3 h-3" />
            D-Wave Quantum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="mt-5">
          <InfrastructureMatrix infrastructure={infrastructure} />
        </TabsContent>

        <TabsContent value="high-assurance" className="mt-5">
          <HighAssuranceAIPanel aiTasks={aiTasks} />
        </TabsContent>

        <TabsContent value="darpa" className="mt-5">
          <DARPABenchmarkingHub benchmarks={benchmarks} />
        </TabsContent>

        <TabsContent value="dwave" className="mt-5">
          <DWaveIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
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