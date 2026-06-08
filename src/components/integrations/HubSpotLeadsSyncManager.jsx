import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink } from "lucide-react";

export default function HubSpotLeadsSyncManager() {
  const { data: syncedLeads, isLoading } = useQuery({
    queryKey: ['hubspot_lead_syncs'],
    queryFn: () => base44.entities.HubSpotLeadSync.list('-synced_at', 100),
    initialData: [],
  });

  const threatLevelColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  const leadTypeColors = {
    osint_entity: 'bg-blue-100 text-blue-800',
    threat_actor: 'bg-red-100 text-red-800',
    threat_indicator: 'bg-orange-100 text-orange-800',
    organization: 'bg-green-100 text-green-800',
    person: 'bg-purple-100 text-purple-800'
  };

  const statusIcons = {
    synced: '✓',
    updated: '↻',
    failed: '✗'
  };

  const tierColors = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-yellow-100 text-yellow-800',
    cold: 'bg-blue-100 text-blue-800',
    unscored: 'bg-gray-100 text-gray-800'
  };

  if (isLoading) return <p className="text-gray-500">Loading synced leads...</p>;

  const failedCount = syncedLeads.filter(l => l.status === 'failed').length;
  const successCount = syncedLeads.filter(l => l.status === 'synced').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{syncedLeads.length}</p>
              <p className="text-xs text-gray-600 mt-1">Total Synced Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{successCount}</p>
              <p className="text-xs text-gray-600 mt-1">Successfully Synced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{failedCount}</p>
              <p className="text-xs text-gray-600 mt-1">Failed Syncs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synced Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>ASOSINT Leads Synced to HubSpot</CardTitle>
        </CardHeader>
        <CardContent>
          {syncedLeads.length === 0 ? (
            <Alert>
              <AlertDescription>No leads synced yet. New ASOSINT leads will appear here when synced to HubSpot.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {syncedLeads.map(lead => (
                <div key={lead.id} className="border rounded-lg p-3 hover:bg-gray-50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{lead.lead_name}</p>
                        <span className="text-lg">{statusIcons[lead.status]}</span>
                      </div>
                      {lead.lead_email && <p className="text-xs text-gray-600">{lead.lead_email}</p>}
                      {lead.lead_company && <p className="text-xs text-gray-600">{lead.lead_company}</p>}
                    </div>
                    {lead.hubspot_contact_url && (
                      <a
                        href={lead.hubspot_contact_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={leadTypeColors[lead.lead_type] || 'bg-gray-100 text-gray-800'}>
                      {lead.lead_type?.replace(/_/g, ' ')}
                    </Badge>
                    {lead.threat_level && (
                      <Badge className={threatLevelColors[lead.threat_level]}>
                        {lead.threat_level}
                      </Badge>
                    )}
                    {lead.ai_lead_tier && (
                      <Badge className={tierColors[lead.ai_lead_tier]}>
                        {lead.ai_lead_tier === 'hot' ? '🔥' : lead.ai_lead_tier === 'warm' ? '⚡' : '❄️'} {lead.ai_lead_tier}
                      </Badge>
                    )}
                    {lead.lead_score && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Score: {lead.lead_score}
                      </Badge>
                    )}
                  </div>

                  {lead.lead_description && (
                    <p className="text-xs text-gray-700 line-clamp-2">{lead.lead_description}</p>
                  )}

                  {lead.ai_score_justification && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      <p className="text-xs text-blue-900"><span className="font-semibold">AI Assessment:</span> {lead.ai_score_justification}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Synced {new Date(lead.synced_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}