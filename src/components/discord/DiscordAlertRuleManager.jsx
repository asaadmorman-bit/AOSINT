import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Bell, AlertCircle, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function DiscordAlertRuleManager() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    target_channel_id: '',
    target_server_id: '',
    threat_actors: '',
    sectors: '',
    severities: ['high', 'critical'],
    geographic: ''
  });

  const queryClient = useQueryClient();

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createDiscordAlertRule', {
      rule_name: data.rule_name,
      target_channel_id: data.target_channel_id,
      target_server_id: data.target_server_id,
      threat_filters: {
        threat_actors: data.threat_actors.split(',').filter(t => t.trim()),
        sectors: data.sectors.split(',').filter(t => t.trim()),
        severities: data.severities,
        geographic: data.geographic.split(',').filter(t => t.trim())
      },
      enabled: true
    }),
    onSuccess: () => {
      setFormData({
        rule_name: '',
        target_channel_id: '',
        target_server_id: '',
        threat_actors: '',
        sectors: '',
        severities: ['high', 'critical'],
        geographic: ''
      });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['alert_rules'] });
      alert('Alert rule created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const { data: rules } = useQuery({
    queryKey: ['alert_rules'],
    queryFn: () => base44.entities.AlertRule.filter({ rule_type: 'discord_alert' }, '-created_date', 50)
  });

  const handleCreateRule = () => {
    if (!formData.rule_name.trim() || !formData.target_channel_id.trim()) {
      alert('Rule name and Discord channel ID are required');
      return;
    }

    const hasFilters = 
      formData.threat_actors.trim() ||
      formData.sectors.trim() ||
      formData.geographic.trim() ||
      formData.severities.length > 0;

    if (!hasFilters) {
      alert('At least one filter is required');
      return;
    }

    createRuleMutation.mutate(formData);
  };

  const toggleSeverity = (sev) => {
    setFormData(prev => ({
      ...prev,
      severities: prev.severities.includes(sev)
        ? prev.severities.filter(s => s !== sev)
        : [...prev.severities, sev]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Create Rule Section */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-600" />
            Create Custom Alert Rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Set up rules to automatically route threats to Discord channels based on threat attributes.
          </p>

          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              New Alert Rule
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Rule Name *</label>
                <Input
                  placeholder="e.g., APT28 Critical Alerts, Finance Sector High Severity"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Discord Channel ID *</label>
                <Input
                  placeholder="Paste your Discord channel ID here"
                  value={formData.target_channel_id}
                  onChange={(e) => setFormData({...formData, target_channel_id: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Discord Server ID</label>
                <Input
                  placeholder="Optional: Discord server ID for reference"
                  value={formData.target_server_id}
                  onChange={(e) => setFormData({...formData, target_server_id: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Threat Actors (comma-separated)</label>
                <Input
                  placeholder="e.g., APT28, Lazarus Group, Wizard Spider"
                  value={formData.threat_actors}
                  onChange={(e) => setFormData({...formData, threat_actors: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Sectors (comma-separated)</label>
                <Input
                  placeholder="e.g., Financial, Healthcare, Government"
                  value={formData.sectors}
                  onChange={(e) => setFormData({...formData, sectors: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Geographic Focus (comma-separated)</label>
                <Input
                  placeholder="e.g., Eastern Europe, North America, Asia Pacific"
                  value={formData.geographic}
                  onChange={(e) => setFormData({...formData, geographic: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Alert on Severity Level</label>
                <div className="flex gap-2 flex-wrap">
                  {['low', 'medium', 'high', 'critical'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => toggleSeverity(sev)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                        formData.severities.includes(sev)
                          ? 'bg-red-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700'
                      }`}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 text-xs text-gray-700 border border-gray-200">
                <p className="font-semibold mb-1">How it works:</p>
                <p>• Incoming threats are matched against your rules</p>
                <p>• If a threat matches the threat actors, sectors, or geographic focus, it triggers this rule</p>
                <p>• Matching threats are sent to your Discord channel immediately</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRule}
                  disabled={createRuleMutation.isPending}
                  className="flex-1"
                >
                  {createRuleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Create Rule
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

      {/* Active Rules */}
      {rules?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Active Alert Rules ({rules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map(rule => {
              const filters = JSON.parse(rule.filters || '{}');
              return (
                <div key={rule.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{rule.name}</p>
                      <p className="text-xs text-gray-600">Channel: {rule.target_channel_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-xs">
                        {rule.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 text-xs">
                    {filters.threat_actors?.length > 0 && (
                      <Badge variant="outline">
                        Actors: {filters.threat_actors.length}
                      </Badge>
                    )}
                    {filters.sectors?.length > 0 && (
                      <Badge variant="outline">
                        Sectors: {filters.sectors.length}
                      </Badge>
                    )}
                    {filters.severities?.length > 0 && (
                      <Badge variant="outline">
                        Severity: {filters.severities.join(', ')}
                      </Badge>
                    )}
                    {filters.geographic?.length > 0 && (
                      <Badge variant="outline">
                        Geo: {filters.geographic.length}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Threat Enrichment from Discord</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-700">
          <p>When threat alerts appear in your Discord channels, you can:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Enrich Threat</strong> - Get detailed analysis and context</li>
            <li><strong>Search Related</strong> - Find connected threats and campaigns</li>
            <li><strong>Correlate</strong> - Identify shared threat actors or sectors</li>
          </ul>
          <p className="pt-2 border-t">All commands are executed directly from Discord message buttons.</p>
        </CardContent>
      </Card>
    </div>
  );
}