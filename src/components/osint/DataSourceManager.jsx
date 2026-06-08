import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Trash2 } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function DataSourceManager({ sources, showForm, onFormClose }) {
  const [newSource, setNewSource] = useState({
    source_name: "",
    source_type: "forensic_tool",
    tool_category: "custom",
    connection_type: "api",
    authentication_method: "api_key",
    ingestion_frequency: "daily",
    is_active: true,
  });

  const queryClient = useQueryClient();

  const createSourceMutation = useMutation({
    mutationFn: () => base44.entities.DataSource.create(newSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      setNewSource({
        source_name: "",
        source_type: "forensic_tool",
        tool_category: "custom",
        connection_type: "api",
        authentication_method: "api_key",
        ingestion_frequency: "daily",
        is_active: true,
      });
      onFormClose();
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "delayed":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "errors":
      case "offline":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* New Source Form */}
      {showForm && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Add New Data Source</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">
                Source Name
              </label>
              <input
                type="text"
                value={newSource.source_name}
                onChange={(e) =>
                  setNewSource({ ...newSource, source_name: e.target.value })
                }
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Source Type</label>
              <MobileSelect
                value={newSource.source_type}
                onValueChange={(v) => setNewSource({ ...newSource, source_type: v })}
                placeholder="Source Type"
                options={[
                  { value: "forensic_tool", label: "Forensic Tool" },
                  { value: "social_media", label: "Social Media" },
                  { value: "law_enforcement", label: "Law Enforcement" },
                  { value: "international_partner", label: "International Partner" },
                  { value: "adversary_intel", label: "Adversary Intel" },
                  { value: "proprietary_sdk", label: "Proprietary SDK" },
                  { value: "api_integration", label: "API Integration" },
                  { value: "manual_feed", label: "Manual Feed" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Tool Category</label>
              <MobileSelect
                value={newSource.tool_category}
                onValueChange={(v) => setNewSource({ ...newSource, tool_category: v })}
                placeholder="Tool Category"
                options={[
                  { value: "encase", label: "EnCase" },
                  { value: "cellebrite", label: "Cellebrite" },
                  { value: "armitage", label: "Armitage" },
                  { value: "social_media", label: "Social Media" },
                  { value: "open_source", label: "Open Source" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Connection Type</label>
              <MobileSelect
                value={newSource.connection_type}
                onValueChange={(v) => setNewSource({ ...newSource, connection_type: v })}
                placeholder="Connection Type"
                options={[
                  { value: "api", label: "API" },
                  { value: "direct_integration", label: "Direct Integration" },
                  { value: "file_import", label: "File Import" },
                  { value: "webhook", label: "Webhook" },
                  { value: "sdkintegration", label: "SDK Integration" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Ingestion Frequency</label>
              <MobileSelect
                value={newSource.ingestion_frequency}
                onValueChange={(v) => setNewSource({ ...newSource, ingestion_frequency: v })}
                placeholder="Ingestion Frequency"
                options={[
                  { value: "real_time", label: "Real Time" },
                  { value: "hourly", label: "Hourly" },
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "event_triggered", label: "Event Triggered" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Authentication</label>
              <MobileSelect
                value={newSource.authentication_method}
                onValueChange={(v) => setNewSource({ ...newSource, authentication_method: v })}
                placeholder="Authentication"
                options={[
                  { value: "api_key", label: "API Key" },
                  { value: "oauth2", label: "OAuth 2.0" },
                  { value: "basic_auth", label: "Basic Auth" },
                  { value: "client_cert", label: "Client Certificate" },
                  { value: "none", label: "None" },
                ]}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createSourceMutation.mutate()}
              disabled={createSourceMutation.isPending || !newSource.source_name}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Create Source
            </Button>
            <Button onClick={onFormClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="grid grid-cols-1 gap-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(source.processing_status)}
                  <h3 className="text-lg font-semibold text-white">
                    {source.source_name}
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Last ingestion:{" "}
                  {source.last_ingestion
                    ? new Date(source.last_ingestion).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-cyan-900/30 text-cyan-300 border-cyan-500/20 text-[8px]">
                  {source.source_type}
                </Badge>
                <Badge
                  className={`text-[8px] ${
                    source.processing_status === "healthy"
                      ? "bg-green-900/30 text-green-300 border-green-500/20"
                      : source.processing_status === "errors"
                      ? "bg-red-900/30 text-red-300 border-red-500/20"
                      : "bg-yellow-900/30 text-yellow-300 border-yellow-500/20"
                  }`}
                >
                  {source.processing_status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3 text-xs">
              <div className="bg-slate-800/50 p-2 rounded">
                <p className="text-gray-400">Connection</p>
                <p className="text-white font-semibold">
                  {source.connection_type}
                </p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <p className="text-gray-400">Frequency</p>
                <p className="text-white font-semibold">
                  {source.ingestion_frequency}
                </p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <p className="text-gray-400">Records</p>
                <p className="text-cyan-400 font-semibold">
                  {source.records_ingested || 0}
                </p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <p className="text-gray-400">Validation</p>
                <p className={`font-semibold ${source.validation_enabled ? "text-green-400" : "text-gray-400"}`}>
                  {source.validation_enabled ? "On" : "Off"}
                </p>
              </div>
            </div>

            {source.error_log && (
              <div className="bg-red-900/10 border border-red-500/20 rounded p-2 mb-3">
                <p className="text-xs text-red-300">{source.error_log}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Configure
              </Button>
              <Button size="sm" variant="outline">
                Test
              </Button>
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          No data sources configured. Click "Add Source" to begin.
        </div>
      )}
    </div>
  );
}