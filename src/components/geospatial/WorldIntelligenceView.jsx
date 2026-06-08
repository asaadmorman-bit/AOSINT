import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, AlertTriangle, Users, Zap, TrendingUp, Clock } from "lucide-react";

export default function WorldIntelligenceView() {
  const [selectedConflict, setSelectedConflict] = useState(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.filter({ status: "active" })
  });

  const { data: actors = [], isLoading: actorsLoading } = useQuery({
    queryKey: ['threatActors'],
    queryFn: () => base44.entities.ThreatActor.filter({ status: "active" })
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => base44.entities.OsintAlert.list('-triggered_at', 100)
  });

  const { data: leaIntel = [], isLoading: leaLoading } = useQuery({
    queryKey: ['leaIntelligence'],
    queryFn: () => base44.entities.LEAIntelligence.filter({ enforcement_status: "active_investigation" })
  });

  if (campaignsLoading || actorsLoading || alertsLoading || leaLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  // Group by target regions to identify conflicts/hot zones
  const conflictZones = {};
  campaigns.forEach(campaign => {
    campaign.target_regions?.forEach(region => {
      if (!conflictZones[region]) {
        conflictZones[region] = {
          region,
          campaigns: [],
          actors: [],
          recentAlerts: 0,
          leaInvestigations: 0,
          severity: 'medium'
        };
      }
      conflictZones[region].campaigns.push(campaign.name);
    });
  });

  actors.forEach(actor => {
    actor.target_regions?.forEach(region => {
      if (!conflictZones[region]) {
        conflictZones[region] = {
          region,
          campaigns: [],
          actors: [],
          recentAlerts: 0,
          leaInvestigations: 0,
          severity: 'medium'
        };
      }
      conflictZones[region].actors.push(actor.name);
    });
  });

  alerts.forEach(alert => {
    // Group alerts by target regions if available
    const region = alert.tags?.find(t => t.includes('region:'))?.replace('region:', '');
    if (region && conflictZones[region]) {
      conflictZones[region].recentAlerts++;
      if (alert.severity === 'critical') {
        conflictZones[region].severity = 'critical';
      } else if (alert.severity === 'high' && conflictZones[region].severity !== 'critical') {
        conflictZones[region].severity = 'high';
      }
    }
  });

  leaIntel.forEach(intel => {
    intel.geographic_focus?.forEach(region => {
      if (!conflictZones[region]) {
        conflictZones[region] = {
          region,
          campaigns: [],
          actors: [],
          recentAlerts: 0,
          leaInvestigations: 0,
          severity: 'medium'
        };
      }
      conflictZones[region].leaInvestigations++;
      if (intel.threat_level === 'critical') {
        conflictZones[region].severity = 'critical';
      }
    });
  });

  const sortedConflicts = Object.values(conflictZones)
    .sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 text-red-100 border-red-700';
      case 'high': return 'bg-orange-900 text-orange-100 border-orange-700';
      case 'medium': return 'bg-yellow-900 text-yellow-100 border-yellow-700';
      default: return 'bg-blue-900 text-blue-100 border-blue-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Zap className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-xl font-bold">World Intelligence View</h2>
        </div>
        <p className="text-sm text-gray-400">Global conflicts, campaigns, and active operations by region</p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-[#00d4ff]">{sortedConflicts.length}</div>
            <div className="text-xs text-gray-500 mt-1">Conflict Zones</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">{campaigns.length}</div>
            <div className="text-xs text-gray-500 mt-1">Active Campaigns</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-400">{actors.length}</div>
            <div className="text-xs text-gray-500 mt-1">Active Actors</div>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-400">{leaIntel.length}</div>
            <div className="text-xs text-gray-500 mt-1">LEA Investigations</div>
          </CardContent>
        </Card>
      </div>

      {/* Conflict Zones Map */}
      <Card className="bg-[#0d1220] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Global Conflict Zones & Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedConflicts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active conflicts detected</div>
          ) : (
            <div className="grid gap-3">
              {sortedConflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedConflict(selectedConflict?.region === conflict.region ? null : conflict)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getSeverityColor(conflict.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(conflict.severity)}
                      <h3 className="font-bold text-lg">{conflict.region}</h3>
                    </div>
                    <Badge className={`capitalize ${conflict.severity === 'critical' ? 'bg-red-700' : conflict.severity === 'high' ? 'bg-orange-700' : 'bg-yellow-700'}`}>
                      {conflict.severity}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-4 gap-2 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>{conflict.campaigns.length} campaigns</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{conflict.actors.length} actors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{conflict.recentAlerts} recent alerts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{conflict.leaInvestigations} investigations</span>
                    </div>
                  </div>

                  {selectedConflict?.region === conflict.region && (
                    <div className="mt-4 pt-4 border-t border-current/20 space-y-2">
                      {conflict.campaigns.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold opacity-75 mb-1">Campaigns:</p>
                          <div className="flex flex-wrap gap-1">
                            {conflict.campaigns.map((c, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {conflict.actors.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold opacity-75 mb-1">Threat Actors:</p>
                          <div className="flex flex-wrap gap-1">
                            {conflict.actors.map((a, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Global Actions */}
      <Card className="bg-[#0d1220] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00d4ff]" />
            Recent Global Actions (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.slice(0, 20).map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <Badge className={alert.severity === 'critical' ? 'bg-red-600' : alert.severity === 'high' ? 'bg-orange-600' : 'bg-yellow-600'}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{alert.description?.substring(0, 100)}...</p>
                <p className="text-xs text-gray-600 mt-1">{new Date(alert.triggered_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}