import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, AlertCircle, Zap, Settings } from "lucide-react";
import DataSourceManager from "@/components/osint/DataSourceManager";
import ValidationDashboard from "@/components/osint/ValidationDashboard";
import SDKIntegrationPanel from "@/components/osint/SDKIntegrationPanel";

export default function OsintIntegrationManager() {
  const [activeTab, setActiveTab] = useState("sources");
  const [showNewSourceForm, setShowNewSourceForm] = useState(false);

  const { data: dataSources = [] } = useQuery({
    queryKey: ["dataSources"],
    queryFn: () => base44.entities.DataSource.list("", 100),
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["dataValidations"],
    queryFn: () => base44.entities.DataValidation.list("-validation_timestamp", 100),
  });

  const { data: sdks = [] } = useQuery({
    queryKey: ["sdkCustomizations"],
    queryFn: () => base44.entities.SDKCustomization.filter({ status: "production" }),
  });

  const activeSources = dataSources.filter((s) => s.is_active);
  const healthySources = dataSources.filter((s) => s.processing_status === "healthy");
  const totalRecords = dataSources.reduce((sum, s) => sum + (s.records_ingested || 0), 0);
  const validationRate =
    validations.length > 0
      ? Math.round(
          (validations.filter((v) => v.confidence_level !== "unverified").length /
            validations.length) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">OSINT Integration Hub</h1>
        <p className="text-gray-400">
          Manage multi-source data ingestion with validation and SDK customization
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Active Sources"
          value={activeSources.length}
          color="cyan"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="Healthy Status"
          value={`${healthySources.length}/${dataSources.length}`}
          color="green"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          title="Records Ingested"
          value={totalRecords.toLocaleString()}
          color="blue"
          subtext="All time"
        />
        <StatCard
          title="Validation Rate"
          value={`${validationRate}%`}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <TabsList className="bg-slate-900/50 border-b border-slate-700/50">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="sdks">SDK Integrations</TabsTrigger>
        </TabsList>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Manage Data Sources</h2>
            <Button
              onClick={() => setShowNewSourceForm(!showNewSourceForm)}
              className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Source
            </Button>
          </div>
          <DataSourceManager
            sources={dataSources}
            showForm={showNewSourceForm}
            onFormClose={() => setShowNewSourceForm(false)}
          />
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="p-6">
          <ValidationDashboard validations={validations} sources={dataSources} />
        </TabsContent>

        {/* SDK Integration Tab */}
        <TabsContent value="sdks" className="p-6">
          <SDKIntegrationPanel sdks={sdks} dataSources={dataSources} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtext, color, icon }) {
  const colors = {
    cyan: "bg-cyan-900/20 border-cyan-500/20 text-cyan-400",
    green: "bg-green-900/20 border-green-500/20 text-green-400",
    blue: "bg-blue-900/20 border-blue-500/20 text-blue-400",
    purple: "bg-purple-900/20 border-purple-500/20 text-purple-400",
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