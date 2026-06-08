import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Building2, AlertCircle } from "lucide-react";

export default function OrgSubServerManager({ parentServerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('organization');
  const [threatFocus, setThreatFocus] = useState([]);

  const createSubServerMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createOrganizationSubServers', data),
    onSuccess: () => {
      setShowForm(false);
      setOrgName('');
      setOrgType('organization');
      setThreatFocus([]);
      queryClient.invalidateQueries({ queryKey: ['org_sub_servers'] });
    }
  });

  const handleCreateSubServers = async () => {
    if (!orgName.trim()) {
      alert('Organization name is required');
      return;
    }

    const organizations = [{
      id: `org_${Date.now()}`,
      name: orgName,
      type: orgType,
      threat_focus: threatFocus.length > 0 ? threatFocus : ['threat_actors', 'vulnerabilities', 'campaigns']
    }];

    createSubServerMutation.mutate({
      parent_server_id: parentServerId,
      organizations
    });
  };

  const threatFocusOptions = [
    { value: 'threat_actors', label: 'Threat Actors' },
    { value: 'vulnerabilities', label: 'Vulnerabilities' },
    { value: 'campaigns', label: 'Campaigns' },
    { value: 'malware', label: 'Malware' },
    { value: 'incidents', label: 'Incidents' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Organization Sub-Servers
        </h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="w-3 h-3" />
          Create Org Server
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Create Organization Discord Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold block">Organization Name *</label>
              <Input
                placeholder="e.g., Acme Corp, Financial Sector"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Organization Type</label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              >
                <option value="organization">Organization</option>
                <option value="community">Community</option>
                <option value="sector">Sector</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Threat Focus Areas (optional)</label>
              <div className="flex flex-wrap gap-2">
                {threatFocusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setThreatFocus(prev =>
                        prev.includes(option.value)
                          ? prev.filter(v => v !== option.value)
                          : [...prev, option.value]
                      );
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      threatFocus.includes(option.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600">Channels will auto-organize threats by these categories</p>
            </div>

            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900">
                This creates a dedicated Discord server with severity-based channels (Critical/High/Medium/Low) + category channels (Threat Actors, Vulnerabilities, Incidents, Malware, Reports)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateSubServers}
                disabled={createSubServerMutation.isPending}
                className="flex-1"
              >
                {createSubServerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Building2 className="w-4 h-4 mr-2" />
                )}
                Create Organization Server
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-gray-600">
        <p className="font-semibold mb-2">How it works:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Each organization/community gets a dedicated Discord server</li>
          <li>Threats auto-organize by severity (Critical → High → Medium → Low)</li>
          <li>Category channels separate by threat type</li>
          <li>Teams see only threats relevant to their organization</li>
        </ul>
      </div>
    </div>
  );
}