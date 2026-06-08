import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe, Flag, MapPin, Users, AlertTriangle, Target, Shield
} from "lucide-react";

const intelTypeIcons = {
  omg: "🏍️",
  terrorist: "🚨",
  hate_group: "⚠️",
  political_actor: "🎯",
  political_organization: "📋",
  social_disruptor: "⚡",
  criminal_organization: "🔓",
  gang_activity: "👥"
};

export default function MonitoringDashboard() {
  const { data: intelItems, isLoading } = useQuery({
    queryKey: ['lea_intelligence'],
    queryFn: () => base44.entities.LEAIntelligence.list('-last_updated', 200),
    initialData: [],
  });

  // Calculate statistics by geographic level
  const statsByLevel = useMemo(() => {
    const stats = {
      local: { total: 0, critical: 0, high: 0, threats: [] },
      state: { total: 0, critical: 0, high: 0, threats: [] },
      federal: { total: 0, critical: 0, high: 0, threats: [] },
      international: { total: 0, critical: 0, high: 0, threats: [] },
    };

    const typeStats = {};

    intelItems.forEach(item => {
      const level = item.geographic_level || 'federal';
      stats[level].total++;
      if (item.threat_level === 'critical') stats[level].critical++;
      if (item.threat_level === 'high') stats[level].high++;
      stats[level].threats.push(item);

      // Count by type
      if (!typeStats[item.intel_type]) {
        typeStats[item.intel_type] = 0;
      }
      typeStats[item.intel_type]++;
    });

    return { byLevel: stats, byType: typeStats };
  }, [intelItems]);

  const missionRelevant = useMemo(() => {
    return intelItems.filter(i => i.mission_related === true);
  }, [intelItems]);

  const omgsByStatus = useMemo(() => {
    return intelItems
      .filter(i => i.intel_type === 'omg')
      .reduce((acc, item) => {
        const status = item.enforcement_status || 'known_threat';
        if (!acc[status]) acc[status] = [];
        acc[status].push(item);
        return acc;
      }, {});
  }, [intelItems]);

  if (isLoading) {
    return <p className="text-gray-500">Loading monitoring data...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{intelItems.length}</p>
              <p className="text-xs text-gray-600 mt-2">Total Threats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{intelItems.filter(i => i.threat_level === 'critical').length}</p>
              <p className="text-xs text-gray-600 mt-2">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{missionRelevant.length}</p>
              <p className="text-xs text-gray-600 mt-2">Mission Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{intelItems.filter(i => i.intel_type === 'omg').length}</p>
              <p className="text-xs text-gray-600 mt-2">OMGs Tracked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{intelItems.filter(i => i.intel_type === 'hate_group').length}</p>
              <p className="text-xs text-gray-600 mt-2">Hate Groups</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" /> Monitoring by Geographic Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(statsByLevel.byLevel).map(([level, data]) => (
              <div key={level} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold capitalize text-lg">{level} Level</p>
                    <p className="text-sm text-gray-600">{data.total} active threats</p>
                  </div>
                  <Flag className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-semibold">{data.critical} Critical</span>
                    <span className="text-orange-600">{data.high} High</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="omg" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="omg">🏍️ Outlaw Motorcycle Gangs</TabsTrigger>
          <TabsTrigger value="hate">⚠️ Hate Groups</TabsTrigger>
          <TabsTrigger value="political">🎯 Political Actors</TabsTrigger>
          <TabsTrigger value="terrorist">🚨 Terrorist Orgs</TabsTrigger>
          <TabsTrigger value="missions">🎯 Mission Active</TabsTrigger>
        </TabsList>

        {/* OMG Tab */}
        <TabsContent value="omg" className="space-y-3">
          {Object.entries(omgsByStatus).map(([status, omgs]) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{status.replace(/_/g, ' ')}</CardTitle>
                <CardDescription>{omgs.length} organizations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {omgs.map(omg => (
                  <div key={omg.id} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{omg.entity_name}</p>
                        {omg.aliases && omg.aliases.length > 0 && (
                          <p className="text-xs text-gray-600">AKA: {omg.aliases.join(', ')}</p>
                        )}
                      </div>
                      <Badge className={`ml-2 ${omg.threat_level === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                        {omg.threat_level?.toUpperCase()}
                      </Badge>
                    </div>
                    {omg.law_enforcement_tags && omg.law_enforcement_tags.length > 0 && (
                      <div className="text-xs">
                        <p className="font-semibold text-gray-700 mb-1">📌 Law Enforcement Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {omg.law_enforcement_tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-600 flex justify-between pt-1 border-t">
                      <span>👥 {omg.estimated_membership?.toLocaleString() || 'Unknown'} members</span>
                      <span>📍 {omg.geographic_focus?.join(', ') || 'Nationwide'}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Hate Groups Tab */}
        <TabsContent value="hate" className="space-y-3">
          {intelItems.filter(i => i.intel_type === 'hate_group').length === 0 ? (
            <Alert>No hate groups in current intelligence</Alert>
          ) : (
            intelItems.filter(i => i.intel_type === 'hate_group').map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{item.entity_name}</p>
                        <p className="text-sm text-gray-600">{item.description?.substring(0, 100)}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">{item.threat_level?.toUpperCase()}</Badge>
                    </div>
                    {item.law_enforcement_tags?.length > 0 && (
                      <div className="text-xs flex flex-wrap gap-1 pt-2">
                        {item.law_enforcement_tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      Status: <Badge variant="outline">{item.enforcement_status?.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Political Tab */}
        <TabsContent value="political" className="space-y-3">
          {intelItems.filter(i => ['political_actor', 'political_organization'].includes(i.intel_type)).length === 0 ? (
            <Alert>No political actors in current intelligence</Alert>
          ) : (
            intelItems.filter(i => ['political_actor', 'political_organization'].includes(i.intel_type)).map(item => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{item.entity_name}</p>
                        <p className="text-xs text-gray-600 capitalize">{item.intel_type.replace('_', ' ')}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{item.threat_level?.toUpperCase()}</Badge>
                    </div>
                    {item.law_enforcement_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-xs pt-2">
                        {item.law_enforcement_tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Terrorist Tab */}
        <TabsContent value="terrorist" className="space-y-3">
          {intelItems.filter(i => i.intel_type === 'terrorist').length === 0 ? (
            <Alert>No terrorist organizations in current intelligence</Alert>
          ) : (
            intelItems.filter(i => i.intel_type === 'terrorist').map(item => (
              <Card key={item.id} className={item.threat_level === 'critical' ? 'border-red-300 bg-red-50' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{item.entity_name}</p>
                        <p className="text-sm text-gray-600">{item.description?.substring(0, 100)}</p>
                      </div>
                      <Badge className={item.threat_level === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-800'}>
                        {item.threat_level?.toUpperCase()}
                      </Badge>
                    </div>
                    {item.law_enforcement_tags?.length > 0 && (
                      <div className="text-xs flex flex-wrap gap-1">
                        {item.law_enforcement_tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Mission Active Tab */}
        <TabsContent value="missions" className="space-y-3">
          {missionRelevant.length === 0 ? (
            <Alert>No active missions linked to current intelligence</Alert>
          ) : (
            missionRelevant.map(item => (
              <Card key={item.id} className="border-purple-300 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-base">{item.entity_name}</CardTitle>
                  <CardDescription>{intelTypeIcons[item.intel_type]} {item.intel_type.replace(/_/g, ' ')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{item.operator_notes || item.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-purple-600">{item.enforcement_status?.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{item.geographic_level?.toUpperCase()}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}