import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe2, Clock, Network, AlertCircle } from 'lucide-react';
import ThreatMap from '@/components/visualization/ThreatMap';
import ThreatTimeline from '@/components/visualization/ThreatTimeline';
import ThreatNetworkGraph from '@/components/visualization/ThreatNetworkGraph';

export default function ThreatIntelligenceVisualization() {
  const [activeTab, setActiveTab] = useState('map');

  // Fetch all threat data
  const { data: threatActors = [] } = useQuery({
    queryKey: ['threat-actors'],
    queryFn: () => base44.entities.ThreatActor.list('-last_active', 50),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-last_activity', 30),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ['indicators'],
    queryFn: () => base44.entities.ThreatIndicator.list('-created_date', 100),
  });

  const { data: osintAlerts = [] } = useQuery({
    queryKey: ['osint-alerts'],
    queryFn: () => base44.entities.OsintAlert.list('-triggered_at', 50),
  });

  const threatTimelines = [
    ...osintAlerts.map(a => ({
      id: a.id,
      title: a.title,
      timestamp: new Date(a.triggered_at),
      severity: a.severity,
      type: 'alert',
    })),
    ...campaigns.map(c => ({
      id: c.id,
      title: c.name,
      timestamp: new Date(c.last_activity || c.first_observed),
      severity: c.campaign_type,
      type: 'campaign',
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Threat Intelligence Visualization</h1>
          <p className="text-gray-400">Interactive maps, timelines, and network graphs showing threat landscape</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#0d1220] border border-white/5 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Globe2 className="w-4 h-4" /> Global Map
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="w-4 h-4" /> Relationships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card className="bg-[#0d1220] border border-white/5 p-4">
              <ThreatMap threatActors={threatActors} campaigns={campaigns} />
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card className="bg-[#0d1220] border border-white/5 p-4">
              <ThreatTimeline events={threatTimelines} />
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card className="bg-[#0d1220] border border-white/5 p-4">
              <ThreatNetworkGraph threatActors={threatActors} campaigns={campaigns} indicators={indicators} />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-[#0d1220] border border-white/5 p-4 flex items-center gap-3">
            <Skull className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Threat Actors</p>
              <p className="text-2xl font-bold">{threatActors.length}</p>
            </div>
          </Card>
          <Card className="bg-[#0d1220] border border-white/5 p-4 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
          </Card>
          <Card className="bg-[#0d1220] border border-white/5 p-4 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Indicators</p>
              <p className="text-2xl font-bold">{indicators.length}</p>
            </div>
          </Card>
          <Card className="bg-[#0d1220] border border-white/5 p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Recent Events</p>
              <p className="text-2xl font-bold">{threatTimelines.length}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Skull, Database } from 'lucide-react';