import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, RefreshCw, Mail, TrendingUp } from "lucide-react";

export default function HubSpotThreatDealsManager() {
  const queryClient = useQueryClient();

  const { data: threatDeals, isLoading: dealsLoading } = useQuery({
    queryKey: ['hubspot_threat_deals'],
    queryFn: () => base44.entities.HubSpotThreatDeal.list('-synced_at', 50),
    initialData: [],
  });

  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['hubspot_inquiries'],
    queryFn: () => base44.entities.HubSpotInquiry.list('-inquiry_received_at', 30),
    initialData: [],
  });

  const monitorMutation = useMutation({
    mutationFn: () => base44.functions.invoke('monitorHubSpotInquiries', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot_inquiries'] });
    }
  });

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  const stageColors = {
    negotiation: 'bg-blue-100 text-blue-800',
    presentation_scheduled: 'bg-purple-100 text-purple-800',
    qualified_to_buy: 'bg-green-100 text-green-800',
    decision_pending: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    acknowledged: 'bg-yellow-100 text-yellow-800',
    responded: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800'
  };

  const newInquiries = inquiries.filter(i => i.status === 'new').length;
  const respondedInquiries = inquiries.filter(i => i.response_sent).length;
  const openDeals = threatDeals.filter(d => !['won', 'lost'].includes(d.deal_stage)).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{threatDeals.length}</p>
              <p className="text-xs text-gray-600 mt-1">Total Threat Deals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{openDeals}</p>
              <p className="text-xs text-gray-600 mt-1">Active Deals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{respondedInquiries}</p>
              <p className="text-xs text-gray-600 mt-1">Inquiries Responded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiries Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>HubSpot Inquiries</CardTitle>
              {newInquiries > 0 && (
                <Badge className="bg-red-100 text-red-800">{newInquiries} new</Badge>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => monitorMutation.mutate()}
              disabled={monitorMutation.isPending}
            >
              {monitorMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" /> Monitor Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <Alert>
              <AlertDescription>No inquiries yet. Enable HubSpot monitoring to sync contacts.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {inquiries.slice(0, 10).map(inquiry => (
                <div key={inquiry.id} className="border rounded-lg p-3 hover:bg-gray-50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{inquiry.contact_name}</p>
                      <p className="text-xs text-gray-600">{inquiry.contact_email} • {inquiry.company_name}</p>
                    </div>
                    <Badge className={statusColors[inquiry.status] || 'bg-gray-100 text-gray-800'}>
                      {inquiry.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700">{inquiry.inquiry_message?.slice(0, 100)}...</p>

                  {inquiry.generated_response && (
                    <div className="bg-blue-50 p-2 rounded text-xs border border-blue-200">
                      <p className="font-semibold mb-1">AI Response:</p>
                      <p>{inquiry.generated_response}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!inquiry.response_sent && inquiry.generated_response && (
                      <Button size="sm" variant="outline" className="text-xs gap-1">
                        <Mail className="w-3 h-3" /> Send Response
                      </Button>
                    )}
                    {inquiry.response_sent && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        ✓ Response sent
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threat Deals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Threat-Based Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {threatDeals.length === 0 ? (
            <Alert>
              <AlertDescription>No deals created yet. New threats will automatically create deals.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {threatDeals.slice(0, 15).map(deal => (
                <div key={deal.id} className="border rounded-lg p-3 hover:bg-gray-50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{deal.deal_name}</p>
                      <p className="text-xs text-gray-600">{deal.threat_title}</p>
                    </div>
                    <a
                      href={deal.hubspot_deal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={severityColors[deal.threat_severity]}>
                      {deal.threat_severity}
                    </Badge>
                    <Badge className={stageColors[deal.deal_stage] || 'bg-gray-100 text-gray-800'}>
                      {deal.deal_stage?.replace(/_/g, ' ')}
                    </Badge>
                    {deal.deal_amount && (
                      <Badge className="bg-green-100 text-green-800">
                        ${deal.deal_amount.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  {deal.follow_up_required && (
                    <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                      <TrendingUp className="w-3 h-3" />
                      Follow-up required
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}