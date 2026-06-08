import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Zap, Search, Globe2, Building2, Users, AlertCircle } from "lucide-react";

export default function DiscordServerOrchestrator() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    server_name: '',
    server_type: 'organization',
    organization_name: '',
    description: '',
    discord_server_id: ''
  });

  const createServerMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createOrganizedDiscordServer', data),
    onSuccess: () => {
      setFormData({ server_name: '', server_type: 'organization', organization_name: '', description: '', discord_server_id: '' });
      setShowCreateForm(false);
      alert('Discord server configured successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  });

  const searchMutation = useMutation({
    mutationFn: (query) => base44.functions.invoke('searchDiscordThreats', { query })
  });

  const { data: servers } = useQuery({
    queryKey: ['discord_servers'],
    queryFn: () => base44.entities.DiscordThreatServer.filter({ created_by: base44.auth.me()?.email }, '-created_at', 20)
  });

  const handleCreateServer = () => {
    if (!formData.server_name.trim()) {
      alert('Server name is required');
      return;
    }
    if (!formData.discord_server_id.trim()) {
      alert('Discord Server ID is required. Right-click your server in Discord > Copy Server ID (enable Developer Mode in Discord settings first).');
      return;
    }
    createServerMutation.mutate(formData);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate({ query: searchQuery });
    }
  };

  const serverIcons = {
    organization: '🏢',
    sector: '📊',
    geographic: '🌍',
    threat_actor: '👾'
  };

  const serverLabels = {
    organization: 'Organization',
    sector: 'Sector',
    geographic: 'Geographic',
    threat_actor: 'Threat Actor'
  };

  return (
    <div className="space-y-6">
      {/* Create Server Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Create Threat Intelligence Discord Server
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              New Server
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Server Name *</label>
                <Input
                  placeholder="e.g., APT28 Monitoring, Healthcare Sector"
                  value={formData.server_name}
                  onChange={(e) => setFormData({...formData, server_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Server Type *</label>
                <select
                  value={formData.server_type}
                  onChange={(e) => setFormData({...formData, server_type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="organization">Organization Threat Intel</option>
                  <option value="sector">Sector-Focused (Finance, Healthcare, etc.)</option>
                  <option value="geographic">Geographic Region</option>
                  <option value="threat_actor">Specific Threat Actor</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Organization/Entity Name</label>
                <Input
                  placeholder="e.g., Acme Corp, Eastern Europe, APT28"
                  value={formData.organization_name}
                  onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Discord Server ID *</label>
                <Input
                  placeholder="e.g., 123456789012345678"
                  value={formData.discord_server_id}
                  onChange={(e) => setFormData({...formData, discord_server_id: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Enable Developer Mode in Discord settings, then right-click your server → Copy Server ID. The bot must be invited to this server first.</p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Description (optional)</label>
                <Input
                  placeholder="Custom description for this server"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="bg-white rounded-lg p-3 text-xs text-gray-700 space-y-1">
                <p className="font-semibold">This will configure your server with:</p>
                <p>• Threat-focused channels (alerts, general, resources)</p>
                <p>• Type-specific channels (threat actors, vulnerabilities, campaigns, etc.)</p>
                <p>• Automatic threat routing by agent</p>
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
                    <Zap className="w-4 h-4 mr-2" />
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-600" />
            Search Threat Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Search across all Discord channels and threat intelligence, with automatic correlations.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Search by threat actor, indicator, campaign, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={searchMutation.isPending}
              variant="outline"
              className="gap-2"
            >
              {searchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchMutation.data && (
            <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
              <p className="font-semibold">Search Results:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>OSINT Alerts: {searchMutation.data.results?.osint_alerts || 0}</div>
                <div>LEA Intelligence: {searchMutation.data.results?.lea_intelligence || 0}</div>
                <div>Threat Actors: {searchMutation.data.results?.threat_actors || 0}</div>
                <div>Discord Messages: {searchMutation.data.results?.discord_messages || 0}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Servers */}
      {servers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Your Threat Intelligence Servers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {servers.map(server => (
              <div key={server.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <span>{serverIcons[server.server_type] || '🎯'}</span>
                      {server.name}
                    </p>
                    <p className="text-xs text-gray-600">{server.description}</p>
                  </div>
                  <Badge variant="outline">{serverLabels[server.server_type]}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {server.threat_focus?.map(focus => (
                    <Badge key={focus} variant="secondary" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                </div>
                <a
                  href={`https://discord.com/channels/${server.discord_server_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View in Discord
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-green-600" />
            Agent-Driven Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">🤖 Discord Server Creator Agent</p>
            <p className="text-gray-700">Automatically creates Discord servers with threat-focused channel structure</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">📌 Discord Threat Organizer Agent</p>
            <p className="text-gray-700">Routes incoming threats to appropriate channels by actor, sector, geography</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">🔍 Discord Search & Correlator Agent</p>
            <p className="text-gray-700">Provides holistic search across Discord + threat intelligence with automatic correlation</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">🚨 Discord Alert Rule Engine Agent</p>
            <p className="text-gray-700">Evaluates threats against custom rules and sends real-time alerts to designated Discord channels</p>
          </div>
          <p className="text-xs text-gray-600 pt-2 border-t">
            All agents work together to organize threats intelligently, surface relationships, prevent information silos, and ensure critical alerts reach your team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}