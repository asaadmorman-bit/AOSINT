import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Network, Lock, Users, Zap, Plus, Trash2, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LDAPIntegration() {
  const [configs, setConfigs] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [showNewMapping, setShowNewMapping] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);

  const [formData, setFormData] = useState({
    config_name: "",
    backend_type: "active_directory",
    server_type: "windows_server_2022",
    server_address: "",
    server_port: 389,
    use_ssl: true,
    bind_dn: "",
    bind_password: "",
    base_dn: "",
    group_dn: "",
    sync_enabled: false,
  });

  const [mappingData, setMappingData] = useState({
    ldap_group_name: "",
    role_name: "user",
    features_enabled: [],
  });

  // Load configurations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configData, mappingData] = await Promise.all([
          base44.entities.LDAPConfiguration.list(),
          base44.entities.LDAPGroupMapping.list(),
        ]);
        setConfigs(configData);
        setMappings(mappingData);
      } catch (error) {
        toast.error("Failed to load LDAP data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateConfig = async () => {
    if (!formData.config_name || !formData.server_address || !formData.base_dn) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const config = await base44.entities.LDAPConfiguration.create({
        ...formData,
        created_by: (await base44.auth.me()).email,
        created_at: new Date().toISOString(),
      });

      setConfigs([...configs, config]);
      setFormData({
        config_name: "",
        backend_type: "active_directory",
        server_type: "windows_server_2022",
        server_address: "",
        server_port: 389,
        use_ssl: true,
        bind_dn: "",
        bind_password: "",
        base_dn: "",
        group_dn: "",
        sync_enabled: false,
      });
      setShowNewConfig(false);
      toast.success("LDAP configuration created");
    } catch (error) {
      toast.error("Failed to create configuration");
    }
  };

  const handleTestConnection = async (configId) => {
    setTestingId(configId);
    try {
      const response = await base44.functions.invoke("testLDAPConnection", {
        ldap_config_id: configId,
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

  const handleSyncUsers = async (configId) => {
    setSyncingId(configId);
    try {
      const response = await base44.functions.invoke("syncLDAPUsers", {
        ldap_config_id: configId,
      });

      toast.success(`Synced ${response.data.total} users`);
      const updated = configs.map(c =>
        c.id === configId ? { ...c, last_sync: new Date().toISOString() } : c
      );
      setConfigs(updated);
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const handleCreateMapping = async () => {
    if (!selectedConfig || !mappingData.ldap_group_name || !mappingData.role_name) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const mapping = await base44.entities.LDAPGroupMapping.create({
        ldap_config_id: selectedConfig.id,
        ...mappingData,
        created_at: new Date().toISOString(),
      });

      setMappings([...mappings, mapping]);
      setMappingData({
        ldap_group_name: "",
        role_name: "user",
        features_enabled: [],
      });
      setShowNewMapping(false);
      toast.success("Group mapping created");
    } catch (error) {
      toast.error("Failed to create mapping");
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!window.confirm("Delete this LDAP configuration?")) return;

    try {
      await base44.asServiceRole.entities.LDAPConfiguration.delete(configId);
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
      {/* LDAP Configurations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="text-lg font-semibold">LDAP/Active Directory</h3>
          </div>
          <Button size="sm" onClick={() => setShowNewConfig(!showNewConfig)}>
            <Plus className="w-4 h-4 mr-1" /> Add Configuration
          </Button>
        </div>

        {showNewConfig && (
          <div className="border border-white/10 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Configuration name"
                value={formData.config_name}
                onChange={(e) => setFormData({ ...formData, config_name: e.target.value })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />
              <select
                value={formData.backend_type}
                onChange={(e) => setFormData({ ...formData, backend_type: e.target.value })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="active_directory">Active Directory</option>
                <option value="ldap">LDAP</option>
                <option value="openldap">OpenLDAP</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.server_type}
                onChange={(e) => setFormData({ ...formData, server_type: e.target.value })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="windows_server_2019">Windows Server 2019</option>
                <option value="windows_server_2022">Windows Server 2022</option>
                <option value="windows_server_2025">Windows Server 2025</option>
                <option value="linux">Linux</option>
              </select>
              <input
                placeholder="Server address"
                value={formData.server_address}
                onChange={(e) => setFormData({ ...formData, server_address: e.target.value })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Port"
                value={formData.server_port}
                onChange={(e) => setFormData({ ...formData, server_port: parseInt(e.target.value) })}
                className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.use_ssl}
                  onChange={(e) => setFormData({ ...formData, use_ssl: e.target.checked })}
                />
                Use SSL/TLS
              </label>
            </div>

            <input
              placeholder="Bind DN"
              value={formData.bind_dn}
              onChange={(e) => setFormData({ ...formData, bind_dn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />

            <input
              type="password"
              placeholder="Bind password"
              value={formData.bind_password}
              onChange={(e) => setFormData({ ...formData, bind_password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />

            <input
              placeholder="Base DN (e.g., DC=company,DC=com)"
              value={formData.base_dn}
              onChange={(e) => setFormData({ ...formData, base_dn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />

            <input
              placeholder="Group DN (e.g., OU=Groups,DC=company,DC=com)"
              value={formData.group_dn}
              onChange={(e) => setFormData({ ...formData, group_dn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />

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
                    {config.backend_type.replace(/_/g, " ")} • {config.server_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{config.server_address}:{config.server_port}</p>
                  {config.status === "healthy" && (
                    <div className="flex items-center gap-1 text-[#2ed573] text-xs mt-2">
                      <Check className="w-3 h-3" /> Healthy
                    </div>
                  )}
                  {config.status === "error" && (
                    <div className="flex items-center gap-1 text-[#ff4757] text-xs mt-2">
                      <AlertCircle className="w-3 h-3" /> Error
                    </div>
                  )}
                  {config.last_sync && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last sync: {new Date(config.last_sync).toLocaleDateString()}
                    </p>
                  )}
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
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncUsers(config.id)}
                    disabled={syncingId === config.id}
                  >
                    {syncingId === config.id ? "Syncing..." : <Zap className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(config);
                      setShowNewMapping(true);
                    }}
                  >
                    <Users className="w-4 h-4" />
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

      {/* Group Mappings */}
      {selectedConfig && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00d4ff]" />
              <h3 className="text-lg font-semibold">Group Role Mappings - {selectedConfig.config_name}</h3>
            </div>
            <Button size="sm" onClick={() => setShowNewMapping(!showNewMapping)}>
              <Plus className="w-4 h-4 mr-1" /> Add Mapping
            </Button>
          </div>

          {showNewMapping && selectedConfig && (
            <div className="border border-white/10 rounded-lg p-4 mb-4 space-y-3">
              <input
                placeholder="LDAP group name/DN"
                value={mappingData.ldap_group_name}
                onChange={(e) => setMappingData({ ...mappingData, ldap_group_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              />

              <select
                value={mappingData.role_name}
                onChange={(e) => setMappingData({ ...mappingData, role_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="user">User</option>
                <option value="analyst">Analyst</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowNewMapping(false); setSelectedConfig(null); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateMapping}>
                  Create Mapping
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {mappings
              .filter(m => m.ldap_config_id === selectedConfig.id)
              .map((mapping) => (
                <div key={mapping.id} className="border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{mapping.ldap_group_name}</h4>
                      <p className="text-xs text-gray-400 mt-1">Role: {mapping.role_name}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}