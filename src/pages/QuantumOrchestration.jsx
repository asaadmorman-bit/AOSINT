import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, PlayCircle, TrendingUp, BarChart3, Zap, Target, Settings, Brain, Wand2, GitBranch } from "lucide-react";
import QuantumJobQueue from "@/components/quantum/QuantumJobQueue";
import ResourceAllocationDashboard from "@/components/quantum/ResourceAllocationDashboard";
import QuantumPerformanceAnalytics from "@/components/quantum/QuantumPerformanceAnalytics";
import AlgorithmExecutionPanel from "@/components/quantum/AlgorithmExecutionPanel";
import DARPABenchmarkResults from "@/components/quantum/DARPABenchmarkResults";
import AIBenchmarkAnalysis from "@/components/quantum/AIBenchmarkAnalysis";
import QuantumAlgorithmAssistant from "@/components/quantum/QuantumAlgorithmAssistant";
import HybridWorkflowBuilder from "@/components/quantum/HybridWorkflowBuilder";
import HybridPipelineExecutor from "@/components/quantum/HybridPipelineExecutor";

export default function QuantumOrchestration() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["quantum-jobs"],
    queryFn: () => base44.entities.QuantumOrchestrationJob.list("-created_date"),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["quantum-resources"],
    queryFn: () => base44.entities.QuantumResourcePool.list(),
  });

  const { data: comparisons = [] } = useQuery({
    queryKey: ["quantum-comparisons"],
    queryFn: () => base44.entities.QuantumPerformanceComparison.list("-created_date"),
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ["hybrid-pipelines"],
    queryFn: () => base44.entities.HybridPipeline.list("-created_date"),
  });

  const orchestrateMutation = useMutation({
    mutationFn: (params) => base44.functions.invoke('orchestrateQuantumJob', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quantum-jobs"] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (params) => base44.functions.invoke('executeQuantumAlgorithm', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quantum-jobs"] });
    },
  });

  const compareMutation = useMutation({
    mutationFn: (jobId) => base44.functions.invoke('compareQuantumClassical', { orchestrationJobId: jobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quantum-comparisons"] });
    },
  });

  const savePipelineMutation = useMutation({
    mutationFn: (pipelineData) => base44.entities.HybridPipeline.create(pipelineData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hybrid-pipelines"] });
      setShowNewPipelineDialog(false);
    },
  });

  const jobStats = {
    queued: jobs.filter(j => j.status === 'queued').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  const resourcesHealthy = resources.filter(r => r.status === 'available').length;
  const avgQubitUtilization = resources.length > 0 
    ? Math.round(resources.reduce((sum, r) => sum + ((r.total_qubits - r.available_qubits) / r.total_qubits * 100), 0) / resources.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-[#a855f7]" />
            <h1 className="text-lg font-bold text-white">Quantum Orchestration Layer</h1>
          </div>
          <p className="text-xs text-gray-500">
            Job queuing, resource allocation, hybrid execution, and DARPA benchmarking
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" />
          Submit Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Target} label="Queued" value={jobStats.queued} color="#ffa502" />
        <StatCard icon={PlayCircle} label="Running" value={jobStats.running} color="#00d4ff" />
        <StatCard icon={TrendingUp} label="Completed" value={jobStats.completed} color="#2ed573" />
        <StatCard icon={BarChart3} label="Resources" value={resourcesHealthy} color="#a855f7" />
        <StatCard icon={Settings} label="Avg Utilization" value={`${avgQubitUtilization}%`} color="#ff4757" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="queue" className="gap-1.5">
            <Target className="w-3 h-3" />
            Job Queue
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5">
            <Zap className="w-3 h-3" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="execution" className="gap-1.5">
            <PlayCircle className="w-3 h-3" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="gap-1.5">
            <BarChart3 className="w-3 h-3" />
            DARPA
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="gap-1.5">
            <Brain className="w-3 h-3" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-1.5">
            <Wand2 className="w-3 h-3" />
            Algorithm Assistant
          </TabsTrigger>
          <TabsTrigger value="hybrid" className="gap-1.5">
            <GitBranch className="w-3 h-3" />
            Hybrid Workflows
          </TabsTrigger>
          </TabsList>

        <TabsContent value="queue" className="mt-5">
          <QuantumJobQueue 
            jobs={jobs} 
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            onOrchestrate={(params) => orchestrateMutation.mutate(params)}
            onExecute={(jobId) => executeMutation.mutate({ orchestrationJobId: jobId, algorithmType: selectedJob?.algorithm_type })}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-5">
          <ResourceAllocationDashboard resources={resources} />
        </TabsContent>

        <TabsContent value="execution" className="mt-5">
          <AlgorithmExecutionPanel 
            selectedJob={selectedJob}
            onExecute={(jobId) => executeMutation.mutate({ orchestrationJobId: jobId, algorithmType: selectedJob?.algorithm_type })}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-5">
          <QuantumPerformanceAnalytics 
            jobs={jobs}
            comparisons={comparisons}
            onCompare={(jobId) => compareMutation.mutate(jobId)}
          />
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-5">
          <DARPABenchmarkResults jobs={jobs} />
        </TabsContent>

        <TabsContent value="ai-analysis" className="mt-5">
          <AIBenchmarkAnalysis />
        </TabsContent>

        <TabsContent value="assistant" className="mt-5">
          <QuantumAlgorithmAssistant />
        </TabsContent>

        <TabsContent value="hybrid" className="mt-5">
          <div className="space-y-5">
            {!showNewPipelineDialog ? (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Quantum-Classical Hybrid Workflows</h2>
                  <p className="text-sm text-gray-400 mt-1">Chain quantum and classical computations with automatic data flow management</p>
                </div>
                <Button 
                  onClick={() => setShowNewPipelineDialog(true)}
                  className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4" />
                  New Workflow
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowNewPipelineDialog(false)}
                variant="outline"
                size="sm"
              >
                Back to Workflows
              </Button>
            )}

            {showNewPipelineDialog ? (
              <HybridWorkflowBuilder 
                onSave={(pipelineData) => savePipelineMutation.mutate(pipelineData)}
              />
            ) : (
              <div className="space-y-4">
                {pipelines.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-600 rounded-lg">
                    <GitBranch className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No hybrid workflows created yet</p>
                  </div>
                ) : (
                  pipelines.map(pipeline => (
                    <div key={pipeline.id} className="border border-slate-600/50 rounded-lg p-4 cursor-pointer hover:border-cyan-500/50 transition-all" onClick={() => setSelectedPipeline(pipeline.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-white">{pipeline.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{pipeline.pipeline_type.replace(/_/g, ' ')}</p>
                        </div>
                        <Badge>{pipeline.status}</Badge>
                      </div>
                      {selectedPipeline === pipeline.id && <HybridPipelineExecutor pipelineId={pipeline.id} pipeline={pipeline} />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
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