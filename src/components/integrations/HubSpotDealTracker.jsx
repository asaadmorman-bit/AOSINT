import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, ExternalLink, RefreshCw, BarChart3, TrendingDown, Zap, Lightbulb } from "lucide-react";
import FollowUpTaskSuggestions from "./FollowUpTaskSuggestions";

export default function HubSpotDealTracker() {
  const queryClient = useQueryClient();

  const { data: deals, isLoading } = useQuery({
    queryKey: ['hubspot_threat_deals'],
    queryFn: () => base44.entities.HubSpotThreatDeal.list('-last_activity', 100),
    initialData: [],
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ['deal_forecasts'],
    queryFn: () => base44.entities.DealForecast.list('-forecast_date', 100),
    initialData: [],
  });

  const { data: followUpTasks = [] } = useQuery({
    queryKey: ['follow_up_tasks'],
    queryFn: () => base44.entities.FollowUpTask.list('-created_at', 100),
    initialData: [],
  });

  const generateTasksMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('generateFollowUpTasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_tasks'] });
    }
  });

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncHubSpotDealUpdates', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot_threat_deals'] });
    }
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    return {
      total: deals.length,
      active: deals.filter(d => !['won', 'lost'].includes(d.deal_stage)).length,
      won: deals.filter(d => d.deal_stage === 'won').length,
      lost: deals.filter(d => d.deal_stage === 'lost').length,
      totalValue: deals.reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      avgValue: deals.length ? deals.reduce((sum, d) => sum + (d.deal_amount || 0), 0) / deals.length : 0,
      winRate: deals.length ? Math.round((deals.filter(d => d.deal_stage === 'won').length / deals.length) * 100) : 0
    };
  }, [deals]);

  const stageBreakdown = useMemo(() => {
    const stages = {};
    deals.forEach(d => {
      const stage = d.deal_stage || 'unknown';
      stages[stage] = (stages[stage] || 0) + 1;
    });
    return stages;
  }, [deals]);

  const severityBreakdown = useMemo(() => {
    const severity = {};
    deals.forEach(d => {
      severity[d.threat_severity] = (severity[d.threat_severity] || 0) + 1;
    });
    return severity;
  }, [deals]);

  const forecastMap = useMemo(() => {
    const map = {};
    forecasts.forEach(f => {
      map[f.deal_id] = f;
    });
    return map;
  }, [forecasts]);

  const avgWinProbability = useMemo(() => {
    const withForecasts = forecasts.filter(f => f.win_probability);
    return withForecasts.length ? Math.round(withForecasts.reduce((sum, f) => sum + f.win_probability, 0) / withForecasts.length) : 0;
  }, [forecasts]);

  const projectedValue = useMemo(() => {
    return forecasts.reduce((sum, f) => sum + (f.estimated_value || 0), 0);
  }, [forecasts]);

  const stageColors = {
    negotiation: 'bg-blue-100 text-blue-800',
    presentation_scheduled: 'bg-purple-100 text-purple-800',
    qualified_to_buy: 'bg-green-100 text-green-800',
    decision_pending: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  if (isLoading) return <p className="text-gray-500">Loading deal tracking data...</p>;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
       <Card>
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-blue-600">{metrics.total}</p>
             <p className="text-xs text-gray-600 mt-1">Total Deals</p>
           </div>
         </CardContent>
       </Card>
       <Card>
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-green-600">{metrics.active}</p>
             <p className="text-xs text-gray-600 mt-1">Active Deals</p>
           </div>
         </CardContent>
       </Card>
       <Card>
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-purple-600">${(metrics.totalValue / 1000).toFixed(0)}K</p>
             <p className="text-xs text-gray-600 mt-1">Current Value</p>
           </div>
         </CardContent>
       </Card>
       <Card>
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-blue-600">{metrics.winRate}%</p>
             <p className="text-xs text-gray-600 mt-1">Historical Win Rate</p>
           </div>
         </CardContent>
       </Card>
       <Card className="border-amber-200 bg-amber-50">
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-amber-600">{avgWinProbability}%</p>
             <p className="text-xs text-amber-700 mt-1">AI Forecast Win Prob</p>
           </div>
         </CardContent>
       </Card>
       <Card className="border-green-200 bg-green-50">
         <CardContent className="pt-6">
           <div className="text-center">
             <p className="text-2xl font-bold text-green-600">${(projectedValue / 1000).toFixed(0)}K</p>
             <p className="text-xs text-green-700 mt-1">Projected Value</p>
           </div>
         </CardContent>
       </Card>
      </div>

      {/* Sync Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Deal Sync Status</CardTitle>
            <Button
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync with HubSpot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-900">Last synced: {deals[0]?.last_activity ? new Date(deals[0].last_activity).toLocaleString() : 'Never'}</p>
        </CardContent>
      </Card>

      {/* Stage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Deal Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(stageBreakdown).map(([stage, count]) => (
            <div key={stage}>
              <div className="flex items-center justify-between mb-1">
                <Badge className={stageColors[stage] || 'bg-gray-100 text-gray-800'}>
                  {stage?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm font-semibold">{count} deals</span>
              </div>
              <Progress value={(count / metrics.total) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Threat Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deals by Threat Severity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(severityBreakdown).map(([severity, count]) => (
            <div key={severity}>
              <div className="flex items-center justify-between mb-1">
                <Badge className={severityColors[severity] || 'bg-gray-100 text-gray-800'}>
                  {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
                </Badge>
                <span className="text-sm font-semibold">{count} deals</span>
              </div>
              <Progress value={(count / metrics.total) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Deals List with Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle>All Tracked Deals with AI Forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <Alert>
              <AlertDescription>No deals tracked yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {deals.map(deal => {
                const forecast = forecastMap[deal.id];
                return (
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
                        title="Open in HubSpot"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={severityColors[deal.threat_severity]}>
                        {deal.threat_severity}
                      </Badge>
                      <Badge className={stageColors[deal.deal_stage]}>
                        {deal.deal_stage?.replace(/_/g, ' ')}
                      </Badge>
                      {deal.deal_amount && (
                        <Badge className="bg-green-100 text-green-800">
                          ${deal.deal_amount.toLocaleString()}
                        </Badge>
                      )}
                      {forecast && (
                        <>
                          <Badge className={forecast.win_probability > 60 ? 'bg-green-100 text-green-800' : forecast.win_probability > 35 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                            {forecast.win_probability}% Win Prob
                          </Badge>
                          {forecast.trend === 'improving' && (
                            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Improving
                            </Badge>
                          )}
                          {forecast.trend === 'declining' && (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" /> Declining
                            </Badge>
                          )}
                        </>
                      )}
                    </div>

                    {forecast && (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2 space-y-1">
                          <p className="text-xs text-blue-900"><span className="font-semibold">Forecast:</span> {forecast.forecast_analysis?.substring(0, 150)}...</p>
                          {forecast.estimated_value && (
                            <p className="text-xs text-blue-900"><span className="font-semibold">Est. Value:</span> ${forecast.estimated_value.toLocaleString()}</p>
                          )}
                          {forecast.recommended_actions?.length > 0 && (
                            <p className="text-xs text-blue-900"><span className="font-semibold">Action:</span> {forecast.recommended_actions[0]}</p>
                          )}
                          {(forecast.trend === 'declining' || forecast.win_probability < 40) && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => generateTasksMutation.mutate({ dealId: deal.id, dealData: deal, forecastData: forecast })}
                              disabled={generateTasksMutation.isPending}
                              className="text-xs h-6 mt-2"
                            >
                              {generateTasksMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Lightbulb className="w-3 h-3 mr-1" />
                              )}
                              Generate Follow-up Tasks
                            </Button>
                          )}
                        </div>
                        <FollowUpTaskSuggestions deal={deal} forecast={forecast} followUpTasks={followUpTasks} />
                      </>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Last activity: {new Date(deal.last_activity).toLocaleDateString()}</span>
                      {deal.follow_up_required && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Follow-up needed</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}