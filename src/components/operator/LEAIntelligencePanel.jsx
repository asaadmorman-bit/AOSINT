import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle, RefreshCw, MapPin, Users, Zap, AlertCircle, Shield
} from "lucide-react";

const threatLevelColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const intelTypeIcons = {
  omg: "🏍️",
  terrorist: "🚨",
  social_disruptor: "⚡",
  gang_activity: "👥",
  criminal_organization: "🔓"
};

export default function LEAIntelligencePanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: intelItems, isLoading, refetch } = useQuery({
    queryKey: ['lea_intelligence'],
    queryFn: () => base44.entities.LEAIntelligence.list('-last_updated', 50),
    initialData: [],
  });

  const handleRefreshIntelligence = async () => {
    setIsRefreshing(true);
    try {
      await base44.functions.invoke('fetchLEAIntelligence');
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Law Enforcement Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = intelItems.filter(i => i.threat_level === 'critical').length;
  const highCount = intelItems.filter(i => i.threat_level === 'high').length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-sm text-gray-600 mt-2">Critical Threats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{highCount}</p>
              <p className="text-sm text-gray-600 mt-2">High Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{intelItems.length}</p>
              <p className="text-sm text-gray-600 mt-2">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Button
              size="sm"
              onClick={handleRefreshIntelligence}
              disabled={isRefreshing}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Items */}
      <div className="space-y-3">
        {intelItems.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No law enforcement intelligence loaded. Click "Refresh" to fetch current data.</AlertDescription>
          </Alert>
        ) : (
          intelItems.map(item => (
            <Card key={item.id} className={item.threat_level === 'critical' ? 'border-red-300 bg-red-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{intelTypeIcons[item.intel_type]}</span>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge className={threatLevelColors[item.threat_level]}>
                        {item.threat_level?.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>{item.entity_name}</CardDescription>
                  </div>
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p className="text-sm text-gray-700">{item.description}</p>
                )}

                {item.aliases && item.aliases.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Known Aliases:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.aliases.map((alias, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {item.geographic_focus && item.geographic_focus.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" /> Geographic Focus
                      </p>
                      <p className="text-sm">{item.geographic_focus.join(', ')}</p>
                    </div>
                  )}

                  {item.estimated_membership && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1">
                        <Users className="w-3 h-3" /> Estimated Membership
                      </p>
                      <p className="text-sm">{item.estimated_membership.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {item.known_activities && item.known_activities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-2">
                      <Zap className="w-3 h-3" /> Known Activities
                    </p>
                    <ul className="text-sm space-y-1">
                      {item.known_activities.slice(0, 3).map((activity, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                      {item.known_activities.length > 3 && (
                        <li className="text-gray-500 italic">+{item.known_activities.length - 3} more activities</li>
                      )}
                    </ul>
                  </div>
                )}

                {item.operator_notes && (
                  <Alert className="bg-blue-50">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>Operator Notes:</strong> {item.operator_notes}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Source: {item.source_agency?.toUpperCase()} | Updated: {new Date(item.last_updated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}