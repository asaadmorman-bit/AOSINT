import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Server, Key, RefreshCw, Check, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RadiusManagement() {
  const [configs, setConfigs] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [rotatingId, setRotatingId] = useState(null);

  const [formData, setFormData] = useState({
    config_name: "",
    server_address: "",
    server_port: 1812,
    accounting_port: 1813,
    timeout_seconds: 5,
    retries: 3,
    authentication_type: "PAP",
  });

  const [keyData, setKeyData] = useState({
    key_name: "",
    key_type: "shared_secret",
    key_value: "",
  });

  // Load configurations and keys
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configData, keyData] = await Promise.all([
          base44.entities.RadiusConfig.list(),
          base44.entities.RadiusKeyManagement.list(),
        ]);
        setConfigs(configData);
        setKeys(keyData);
      } catch (error) {
        toast.error("Failed to load RADIUS data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateConfig = async () => {
    if (!formData.config_name || !formData.server_address) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const config = await base44.entities.RadiusConfig.create({
        ...formData,
        created_by: (await base44.auth.me()).email,
        created_at: new Date().toISOString(),
        shared_secret_id: keys[0]?.id || "",
      });

      setConfigs([...configs, config]);
      setFormData({
        config_name: "",
        server_address: "",
        server_port: 1812,
        accounting_port: 1813,
        timeout_seconds: 5,
        retries: 3,
        authentication_type: "PAP",
      });
      setShowNewConfig(false);
      toast.success("RADIUS configuration created");
    } catch (error) {
      toast.error("Failed to create configuration");
    }
  };

  const handleCreateKey = async () => {
    if (!keyData.key_name || !keyData.key_value) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const key = await base44.entities.RadiusKeyManagement.create({
        key_name: keyData.key_name,
        key_type: keyData.key_type,
        encrypted_value: keyData.key_value,
        key_hash: btoa(keyData.key_value).substring(0, 32),
        created_by: (await base44.auth.me()).email,
        created_at: new Date().toISOString(),
      });

      setKeys([...keys, key]);
      setKeyData({ key_name: "", key_type: "shared_secret", key_value: "" });
      setShowNewKey(false);
      toast.success("Key created successfully");
    } catch (error) {
      toast.error("Failed to create key");
    }
  };

  const handleTestConnection = async (configId) => {
    setTestingId(configId);
    try {
      const response = await base44.functions.invoke("testRadiusConnection", {
        radius_config_id: configId,
      });

      if (response.data.success) {
        const updated = configs.map(c =>
          c.id === configId ? { ...c, status: "healthy", status_message: response.data.message } : c
        );
        setConfigs(updated);
        toast.success("Connection test passed");
      }
    } catch (error) {
      toast.error("Connection test failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleRotateKey = async (keyId) => {
    setRotatingId(keyId);
    try {
      await base44.functions.invoke("rotateRadiusKey", {
        key_management_id: keyId,
      });

      toast.success("Key rotated successfully");
      // Reload keys
      const updated = await base44.entities.RadiusKeyManagement.list();
      setKeys(updated);
    } catch (error) {
      toast.error("Key rotation failed");
    } finally {
      setRotatingId(null);
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm("Delete this RADIUS configuration?")) return;

    try {
      await base44.asServiceRole.entities.RadiusConfig.delete(configId);
      setConfigs(configs.filter(c => c.id !== configId));
      toast.success("Configuration deleted");
    } catch (error) {
      toast.error("Failed to delete configuration");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* RADIUS Servers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="text-lg font-semibold">RADIUS Servers</h3>
          </div>
          <Button size="sm" onClick={() => setShowNewConfig(!showNewConfig)}>
            <Plus className="w-4 h-4 mr-1" /> Add Server
          </Button>
        </div>

        {showNewConfig && (
          <div className="border border-white/10 rounded-lg p-4 mb-4 space-y-3">
            <input
              placeholder="Configuration name"
              value={formData.config_name}
              onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Server address (IP or hostname)"
              value={formData.server_address}
              onChange={(e) => setFormData({ ...formData, server_address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Auth port"
                value={formData.server_port}
                onChange={(e) => setFormData({ ...formData, server_port: parseInt(e.target.value) })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Accounting port"
                value={formData.accounting_port}
                onChange={(e) => setFormData({ ...formData, accounting_port: parseInt(e.target.value) })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewConfig(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateConfig}>
                Create
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {configs.map((config) => (
            <div key={config.id} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{config.config_name}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {config.server_address}:{config.server_port}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {config.status === "healthy" && (
                      <div className="flex items-center gap-1 text-[#2ed573] text-xs">
                        <Check className="w-3 h-3" /> Healthy
                      </div>
                    )}
                    {config.status === "unreachable" && (
                      <div className="flex items-center gap-1 text-[#ff4757] text-xs">
                        <AlertCircle className="w-3 h-3" /> Unreachable
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(config.id)}
                    disabled={testingId === config.id}
                  >
                    {testingId === config.id ? "Testing..." : "Test"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#ff4757] hover:bg-[#ff4757]/10"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="text-lg font-semibold">Shared Secrets & Keys</h3>
          </div>
          <Button size="sm" onClick={() => setShowNewKey(!showNewKey)}>
            <Plus className="w-4 h-4 mr-1" /> Add Key
          </Button>
        </div>

        {showNewKey && (
          <div className="border border-white/10 rounded-lg p-4 mb-4 space-y-3">
            <input
              placeholder="Key name"
              value={keyData.key_name}
              onChange={(e) => setKeyData({ ...keyData, key_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Secret value"
              value={keyData.key_value}
              onChange={(e) => setKeyData({ ...keyData, key_value: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm h-20"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewKey(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateKey}>
                Create
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{key.key_name}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Type: {key.key_type} | Active: {key.is_active ? "Yes" : "No"}
                  </p>
                  {key.last_rotated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last rotated: {new Date(key.last_rotated).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotateKey(key.id)}
                  disabled={rotatingId === key.id || !key.is_active}
                >
                  {rotatingId === key.id ? "Rotating..." : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}