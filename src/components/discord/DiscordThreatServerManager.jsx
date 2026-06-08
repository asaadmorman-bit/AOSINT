import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Server, ExternalLink, Trash2, Settings, ChevronDown, ChevronUp } from "lucide-react";
import DiscordChannelMappingConfig from "@/components/discord/DiscordChannelMappingConfig";

export default function DiscordThreatServerManager() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedMappings, setExpandedMappings] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    organization_id: '',
    organization_name: '',
    server_type: 'organization_threat_intel',
    threat_focus: []
  });

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['discord_threat_servers'],
    queryFn: () => base44.entities.DiscordThreatServer.list('-created_at', 50),
    initialData: [],
  });

  const createServerMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createDiscordThreatServer', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discord_threat_servers'] });
      setShowCreateForm(false);
      setFormData({
        name: '',
        organization_id: '',
        organization_name: '',
        server_type: 'organization_threat_intel',
        threat_focus: []
      });
    }
  });

  const handleCreateServer = () => {
    if (!formData.name || !formData.organization_id) {
      alert('Name and Organization ID are required');
      return;
    }
    createServerMutation.mutate(formData);
  };

  const threatFocusOptions = [
    { value: 'threat_actors', label: 'Threat Actors' },
    { value: 'malware', label: 'Malware' },
    { value: 'vulnerabilities', label: 'Vulnerabilities' },
    { value: 'campaigns', label: 'Campaigns' },
    { value: 'geopolitical', label: 'Geopolitical' },
    { value: 'financial', label: 'Financial' }
  ];

  const toggleThreatFocus = (value) => {
    setFormData(prev => ({
      ...prev,
      threat_focus: prev.threat_focus.includes(value)
        ? prev.threat_focus.filter(f => f !== value)
        : [...prev.threat_focus, value]
    }));
  };

  if (isLoading) return <p className="text-gray-500">Loading Discord servers...</p>;

  const serverTypeColors = {
    organization_threat_intel: 'bg-blue-100 text-blue-800',
    individual_tracking: 'bg-purple-100 text-purple-800',
    sector_analysis: 'bg-green-100 text-green-800',
    campaign_monitoring: 'bg-orange-100 text-orange-800',
    custom: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Discord Threat Intelligence Servers</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Server
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Create New Threat Intelligence Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Server name (e.g., ACME Corp Threat Intel)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="Organization ID"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
            />
            <Input
              placeholder="Organization Name"
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
            />

            <div>
              <label className="text-sm font-semibold mb-2 block">Server Type</label>
              <select
                value={formData.server_type}
                onChange={(e) => setFormData({ ...formData, server_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="organization_threat_intel">Organization Threat Intel</option>
                <option value="individual_tracking">Individual Tracking</option>
                <option value="sector_analysis">Sector Analysis</option>
                <option value="campaign_monitoring">Campaign Monitoring</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Threat Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {threatFocusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleThreatFocus(option.value)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      formData.threat_focus.includes(option.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateServer}
                disabled={createServerMutation.isPending}
                className="flex-1"
              >
                {createServerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Server className="w-4 h-4 mr-2" />
                )}
                Create Server
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {servers.length === 0 ? (
        <Alert>
          <AlertDescription>No Discord threat servers created yet. Create one to get started.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {servers.map(server => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      {server.name}
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">{server.organization_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={server.discord_invite_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Open in Discord"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={serverTypeColors[server.server_type]}>
                    {server.server_type?.replace(/_/g, ' ')}
                  </Badge>
                  {server.is_active && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>

                {server.threat_focus && server.threat_focus.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Focus Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {server.threat_focus.map(focus => (
                        <Badge key={focus} variant="outline" className="text-xs">
                          {focus.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">Channels</p>
                    <p className="font-semibold text-lg">{server.channel_count || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">Dashboards</p>
                    <p className="font-semibold text-lg">{server.dashboard_ids?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">Last Update</p>
                    <p className="font-semibold text-xs">{server.last_threat_update ? new Date(server.last_threat_update).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => setExpandedMappings(prev => ({ ...prev, [server.id]: !prev[server.id] }))}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {expandedMappings[server.id] ? "Hide" : "Configure"} Channel Mappings
                  {expandedMappings[server.id] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </Button>
                {expandedMappings[server.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <DiscordChannelMappingConfig server={server} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}