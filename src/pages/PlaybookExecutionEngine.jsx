import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Plus, Zap, Clock, Sparkles } from "lucide-react";
import PlaybookBuilder from "@/components/playbooks/PlaybookBuilder";
import PlaybookExecutor from "@/components/playbooks/PlaybookExecutor";
import PlaybookLibrary from "@/components/playbooks/PlaybookLibrary";
import ExecutionMonitor from "@/components/playbooks/ExecutionMonitor";
import PlaybookSuggestionEngine from "@/components/playbooks/PlaybookSuggestionEngine";

export default function PlaybookExecutionEngine() {
  const [activeTab, setActiveTab] = useState("library");
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);

  const { data: playbooks = [] } = useQuery({
    queryKey: ["playbooks"],
    queryFn: () => base44.entities.Playbook.filter({ status: "active" }),
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["playbookExecutions"],
    queryFn: () => base44.entities.PlaybookExecution.list("-start_time", 50),
    refetchInterval: 5000,
  });

  const recentExecutions = executions.slice(0, 5);
  const activeExecutions = executions.filter((e) => e.status === "running");
  const successRate =
    executions.length > 0
      ? Math.round(
          (executions.filter((e) => e.success).length / executions.length) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Playbook Execution Engine</h1>
        <p className="text-gray-400">Define, automate, and trigger threat hunting workflows</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Active Playbooks"
          value={playbooks.length}
          icon={<Zap className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Executions"
          value={executions.length}
          subtext="All time"
          icon={<Play className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Running Now"
          value={activeExecutions.length}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          color="green"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <TabsList className="bg-slate-900/50 border-b border-slate-700/50">
          <TabsTrigger value="library">Playbook Library</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="executor">Executor</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Active Playbooks</h2>
            <Button
              onClick={() => setActiveTab("builder")}
              className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Playbook
            </Button>
          </div>
          <PlaybookLibrary
            playbooks={playbooks}
            onSelect={(pb) => {
              setSelectedPlaybook(pb);
              setActiveTab("executor");
            }}
          />
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="p-6">
          <PlaybookBuilder />
        </TabsContent>

        {/* Executor Tab */}
        <TabsContent value="executor" className="p-6">
          {selectedPlaybook ? (
            <PlaybookExecutor playbook={selectedPlaybook} />
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Select a playbook from the library to execute</p>
            </div>
          )}
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="p-6">
          <ExecutionMonitor executions={executions} />
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="p-6">
          <PlaybookSuggestionEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtext, icon, color }) {
  const colors = {
    cyan: "bg-cyan-900/20 border-cyan-500/20 text-cyan-400",
    blue: "bg-blue-900/20 border-blue-500/20 text-blue-400",
    orange: "bg-orange-900/20 border-orange-500/20 text-orange-400",
    green: "bg-green-900/20 border-green-500/20 text-green-400",
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase font-semibold">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}