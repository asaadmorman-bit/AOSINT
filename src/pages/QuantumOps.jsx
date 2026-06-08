import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, Lock, Network, Brain, Target, Search, Plus } from "lucide-react";
import QuantumProblemLauncher from "@/components/quantum/QuantumProblemLauncher";
import QuantumTaskList from "@/components/quantum/QuantumTaskList";
import QuantumTaskDetail from "@/components/quantum/QuantumTaskDetail";
import QuantumUseCases from "@/components/quantum/QuantumUseCases";

export default function QuantumOps() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["quantum-tasks"],
    queryFn: () => base44.entities.QuantumTask.list("-created_date"),
    refetchInterval: 5000,
  });

  const runningTasks = tasks.filter(t => t.status === "running");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-purple-500" />
            <h1 className="text-lg font-bold text-white">Quantum Operations</h1>
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
              QUANTUM-READY
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Quantum computing for cryptanalysis, optimization, simulation, and advanced pattern detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {runningTasks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-lg px-3 py-1.5">
              <Loader2 className="w-3.5 h-3.5 text-[#a855f7] animate-spin" />
              <span className="text-xs font-bold text-[#a855f7]">{runningTasks.length} Running</span>
            </div>
          )}
          {completedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#2ed573]/10 border border-[#2ed573]/20 rounded-lg px-3 py-1.5">
              <span className="text-xs text-[#2ed573]">{completedTasks.length} Complete</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="tasks" className="gap-1.5">
            <Zap className="w-3 h-3" />
            Quantum Tasks
          </TabsTrigger>
          <TabsTrigger value="launch" className="gap-1.5">
            <Plus className="w-3 h-3" />
            Launch Problem
          </TabsTrigger>
          <TabsTrigger value="usecases" className="gap-1.5">
            <Target className="w-3 h-3" />
            Strategic Use Cases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <QuantumTaskList
                tasks={tasks}
                isLoading={isLoading}
                selectedTask={selectedTask}
                onSelect={setSelectedTask}
              />
            </div>
            <div className="lg:col-span-3">
              {selectedTask ? (
                <QuantumTaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
              ) : (
                <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <Zap className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Select a quantum task to view results</p>
                    <p className="text-gray-600 text-xs mt-1">Launch new quantum problems to solve nation-state challenges</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="launch" className="mt-5">
          <QuantumProblemLauncher onTaskCreated={() => setActiveTab("tasks")} />
        </TabsContent>

        <TabsContent value="usecases" className="mt-5">
          <QuantumUseCases />
        </TabsContent>
      </Tabs>
    </div>
  );
}