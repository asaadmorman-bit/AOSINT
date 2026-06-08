import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock, Shield, Zap, Target, Brain } from "lucide-react";
import ModelLifecycleOverview from "@/components/lifecycle/ModelLifecycleOverview";
import ModelAssuranceDashboard from "@/components/lifecycle/ModelAssuranceDashboard";
import ModelMonitoringDashboard from "@/components/lifecycle/ModelMonitoringDashboard";
import RadiusAccessPanel from "@/components/lifecycle/RadiusAccessPanel";
import ModelValidationTracker from "@/components/lifecycle/ModelValidationTracker";

export default function ModelLifecycleManagement() {
  const [selectedModel, setSelectedModel] = useState(null);
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["model-lifecycle"],
    queryFn: () => base44.entities.ModelLifecycle.list("-created_date"),
  });

  const validateMutation = useMutation({
    mutationFn: (modelId) => 
      base44.functions.invoke('validateModelDARPA', { modelLifecycleId: modelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-lifecycle"] });
    },
  });

  const monitorMutation = useMutation({
    mutationFn: (modelId) => 
      base44.functions.invoke('monitorModelDrift', { modelLifecycleId: modelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model-lifecycle"] });
    },
  });

  const statusCounts = {
    certified: models.filter(m => m.certification_status === 'certified').length,
    conditional: models.filter(m => m.certification_status === 'conditional').length,
    operational: models.filter(m => m.lifecycle_stage === 'operational').length,
    critical_risk: models.filter(m => m.operational_risk_score > 70).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-[#a855f7]" />
            <h1 className="text-lg font-bold text-white">Model Lifecycle Management</h1>
          </div>
          <p className="text-xs text-gray-500">
            DARPA validation, drift monitoring, adversarial detection, and RADIUS access control
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-1" />
          New Model
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle2} label="Certified" value={statusCounts.certified} color="#2ed573" />
        <StatCard icon={Clock} label="Conditional" value={statusCounts.conditional} color="#ffa502" />
        <StatCard icon={Zap} label="Operational" value={statusCounts.operational} color="#00d4ff" />
        <StatCard icon={AlertTriangle} label="Critical Risk" value={statusCounts.critical_risk} color="#ff4757" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="overview" className="gap-1.5">
            <Shield className="w-3 h-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assurance" className="gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Assurance Levels
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-1.5">
            <Zap className="w-3 h-3" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-1.5">
            <Target className="w-3 h-3" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <Brain className="w-3 h-3" />
            RADIUS Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <ModelLifecycleOverview 
            models={models} 
            onSelectModel={setSelectedModel}
            onValidate={(id) => validateMutation.mutate(id)}
            onMonitor={(id) => monitorMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="assurance" className="mt-5">
          <ModelAssuranceDashboard models={models} />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-5">
          <ModelMonitoringDashboard models={models} selectedModel={selectedModel} />
        </TabsContent>

        <TabsContent value="validation" className="mt-5">
          <ModelValidationTracker models={models} />
        </TabsContent>

        <TabsContent value="access" className="mt-5">
          <RadiusAccessPanel />
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