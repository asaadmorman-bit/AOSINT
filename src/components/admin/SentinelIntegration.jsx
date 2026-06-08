import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Plus, Trash2, Zap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SentinelIntegration() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const [formData, setFormData] = useState({
    config_name: "",
    api_endpoint: "",
    organization_id: "",
    api_key: "",
  });

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const data = await base44.entities.IzuluSentinelConfig.list();
        setConfigs(data);
      } catch (error) {
        toast.error("Failed to load Sentinel configurations");
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, []);

  const handleCreate = async () => {
    if (!formData.config_name || !formData.api_endpoint || !formData.organization_id) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const config = await base44.entities.IzuluSentinelConfig.create({
        ...formData,
        created_by: (await base44.auth.me()).email,
        created_at: new Date().toISOString(),
      });

      setConfigs([...configs, config]);
      setFormData({
        config_name: "",
        api_endpoint: "",
        organization_id: "",
        api_key: "",
      });
      setShowNewConfig(false);
      toast.success("Sentinel configuration created");
    } catch (error) {
      toast.error("Failed to create configuration");
    }
  };

  const handleSync = async (configId) => {
    setSyncingId(configId);
    try {
      const config = configs.find(c => c.id === configId);
      const response = await base44.functions.invoke("syncWithSentinel", {
        sentinel_config_id: configId,
        protection_team_id: config.protection_teams?.[0]?.team_id,
        assessment_data: { status: "routine_check" },
        route_data: { recommendation: "safe" },
        threat_level: "moderate",
        client_location: { country: "United States" },
      });

      if (response.data.success) {
        const updated = configs.map(c =>
          c.id === configId ? { ...c, last_sync: new Date().toISOString(), status: "connected" } : c
        );
        setConfigs(updated);
        toast.success("Sentinel sync completed");
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (configId) => {
    if (!window.confirm("Delete this Sentinel configuration?")) return;

    try {
      await base44.asServiceRole.entities.IzuluSentinelConfig.delete(configId);
      setConfigs(configs.filter(c => c.id !== configId));
      toast.success("Configuration deleted");
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00d4ff]" />
          <h3 className="text-lg font-semibold">Izulu Sentinel Integration</h3>
        </div>
        <Button size="sm" onClick={() => setShowNewConfig(!showNewConfig)}>
          <Plus className="w-4 h-4 mr-1" /> Add Configuration
        </Button>
      </div>

      {showNewConfig && (
        <div className="border border-white/10 rounded-lg p-4 space-y-3">
          <input
            placeholder="Configuration name"
            value={formData.config_name}
            onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="API Endpoint (e.g., api.izulusentinel.com)"
            value={formData.api_endpoint}
            onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Organization ID"
            value={formData.organization_id}
            onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="API Key"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewConfig(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {configs.map((config) => (
          <div key={config.id} className="border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{config.config_name}</h4>
                <p className="text-xs text-gray-400 mt-1">{config.api_endpoint}</p>
              </div>
              <div className="flex items-center gap-2">
                {config.status === "connected" ? (
                  <div className="flex items-center gap-1 text-[#2ed573] text-xs">
                    <CheckCircle className="w-3 h-3" /> Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[#ffa502] text-xs">
                    <AlertCircle className="w-3 h-3" /> Disconnected
                  </div>
                )}
              </div>
            </div>

            {config.last_sync && (
              <p className="text-xs text-gray-500 mb-3">
                Last sync: {new Date(config.last_sync).toLocaleString()}
              </p>
            )}

            <div className="space-y-2 mb-3 text-xs text-gray-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.data_sync_enabled} readOnly /> Real-time data sync
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.route_planning_enabled} readOnly /> Route planning recommendations
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.geopolitical_analysis} readOnly /> Geopolitical analysis
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.environmental_alerts} readOnly /> Environmental alerts
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.pattern_of_life} readOnly /> Pattern of life analysis
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={config.debrief_enabled} readOnly /> Post-operation debriefs
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(config.id)}
                disabled={syncingId === config.id}
              >
                {syncingId === config.id ? "Syncing..." : <Zap className="w-4 h-4 mr-1" />}
                {syncingId !== config.id && "Sync Now"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#ff4757] hover:bg-[#ff4757]/10"
                onClick={() => handleDelete(config.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && !loading && (
        <div className="border border-white/10 rounded-lg p-8 text-center text-gray-500">
          No Sentinel configurations. Add one to enable executive protection integration.
        </div>
      )}
    </div>
  );
}