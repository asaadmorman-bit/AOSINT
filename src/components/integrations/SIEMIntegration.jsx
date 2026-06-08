import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Trash2, Plus } from "lucide-react";

export default function SIEMIntegration() {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    siem_type: "splunk",
    endpoint_url: "",
    event_index: "",
    threat_intel_index: "",
    send_threat_intelligence: true,
    send_alerts: true,
    ingest_siem_alerts: true,
    bidirectional_sync: true
  });

  const { data: siemConfigs, isLoading } = useQuery({
    queryKey: ['siem_configurations'],
    queryFn: () => base44.entities.SIEMConfiguration.list('-created_date', 20),
    initialData: [],
  });

  const { data: ingestedAlerts } = useQuery({
    queryKey: ['siem_alert_ingestion'],
    queryFn: () => base44.entities.SIEMAlertIngestion.list('-ingestion_timestamp', 50),
    initialData: [],
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.SIEMConfiguration.create({
      ...data,
      created_date: new Date().toISOString(),
      sync_status: 'never_synced'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siem_configurations'] });
      setShowNewForm(false);
      setNewConfig({
        name: "",
        siem_type: "splunk",
        endpoint_url: "",
        event_index: "",
        threat_intel_index: "",
        send_threat_intelligence: true,
        send_alerts: true,
        ingest_siem_alerts: true,
        bidirectional_sync: true
      });
    }
  });

  const syncMutation = useMutation({
    mutationFn: (siemConfigId) => base44.functions.invoke('ingestFromSIEM', {
      siemConfigId,
      timeRange: 24
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siem_alert_ingestion'] });
      queryClient.invalidateQueries({ queryKey: ['siem_configurations'] });
    }
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id) => base44.entities.SIEMConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siem_configurations'] });
    }
  });

  const statusColors = {
    healthy: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    never_synced: 'bg-gray-100 text-gray-800'
  };

  if (isLoading) return <p className="text-gray-500">Loading SIEM configurations...</p>;

  return (
    <div className="space-y-6">
      {/* Existing Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SIEM Integrations</CardTitle>
            <Button onClick={() => setShowNewForm(!showNewForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add SIEM
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {siemConfigs.length === 0 && !showNewForm && (
            <Alert>
              <AlertDescription>No SIEM integrations configured. Add one to enable bi-directional synchronization.</AlertDescription>
            </Alert>
          )}

          {siemConfigs.map(config => (
            <div key={config.id} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{config.name}</p>
                    <Badge className="text-xs uppercase">{config.siem_type}</Badge>
                    <Badge className={`text-xs ${statusColors[config.sync_status] || statusColors.never_synced}`}>
                      {config.sync_status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{config.endpoint_url}</p>
                  {config.status_message && (
                    <p className="text-xs text-gray-500 mt-1">{config.status_message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {config.bidirectional_sync && '↔ Bidirectional'} 
                    {config.send_threat_intelligence && ' • Sends Threat Intel'}
                    {config.send_alerts && ' • Sends Alerts'}
                    {config.ingest_siem_alerts && ' • Ingests Alerts'}
                  </p>
                </div>
                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncMutation.mutate(config.id)}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" /> Sync
                      </>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteConfigMutation.mutate(config.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* New Configuration Form */}
      {showNewForm && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Add SIEM Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Configuration Name"
                value={newConfig.name}
                onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
              />
              <select
                value={newConfig.siem_type}
                onChange={(e) => setNewConfig(prev => ({ ...prev, siem_type: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              >
                <option value="splunk">Splunk</option>
                <option value="elastic">Elasticsearch</option>
                <option value="qradar">IBM QRadar</option>
                <option value="microsoft_sentinel">Microsoft Sentinel</option>
                <option value="sumo_logic">Sumo Logic</option>
                <option value="arcsight">ArcSight</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <Input
              placeholder="SIEM Endpoint URL (e.g., https://splunk.example.com:8088)"
              value={newConfig.endpoint_url}
              onChange={(e) => setNewConfig(prev => ({ ...prev, endpoint_url: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Events Index/Dataset"
                value={newConfig.event_index}
                onChange={(e) => setNewConfig(prev => ({ ...prev, event_index: e.target.value }))}
              />
              <Input
                placeholder="Threat Intel Index"
                value={newConfig.threat_intel_index}
                onChange={(e) => setNewConfig(prev => ({ ...prev, threat_intel_index: e.target.value }))}
              />
            </div>

            <Alert className="bg-white border-blue-200">
              <AlertDescription className="text-sm">
                <strong>API Key Setup:</strong> Set environment variable <code>SIEM_{newConfig.siem_type.toUpperCase()}_API_KEY</code> with your SIEM API credentials.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newConfig.bidirectional_sync}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, bidirectional_sync: e.target.checked }))}
                />
                <span className="text-sm">Enable Bidirectional Sync</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newConfig.send_threat_intelligence}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, send_threat_intelligence: e.target.checked }))}
                />
                <span className="text-sm">Send Threat Intelligence</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newConfig.send_alerts}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, send_alerts: e.target.checked }))}
                />
                <span className="text-sm">Send ASOSINT Alerts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newConfig.ingest_siem_alerts}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, ingest_siem_alerts: e.target.checked }))}
                />
                <span className="text-sm">Ingest SIEM Alerts</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => createConfigMutation.mutate(newConfig)} className="flex-1">
                Add SIEM Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ingested Alerts Summary */}
      {ingestedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recently Ingested SIEM Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ingestedAlerts.slice(0, 10).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium truncate">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.siem_type} • {new Date(alert.ingestion_timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {alert.severity}
                    </Badge>
                    {alert.correlated_asosint_alerts?.length > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{alert.correlated_asosint_alerts.length} correlated</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}