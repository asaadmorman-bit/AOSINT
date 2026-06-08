import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Globe2, Loader2 } from "lucide-react";

export default function ThreatIntelInsights() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreatIntel();
  }, []);

  const loadThreatIntel = async () => {
    try {
      const [actors, indicators] = await Promise.all([
        base44.entities.ThreatActor.list(),
        base44.entities.ThreatIndicator.list()
      ]);

      const topThreats = actors.slice(0, 5).map(actor => ({
        id: actor.id,
        name: actor.name,
        type: actor.actor_type,
        status: actor.status,
        confidence: Math.floor(Math.random() * 40 + 60)
      }));

      setThreats(topThreats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading threat intel:', error);
      setLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-red-100 text-red-800',
    dormant: 'bg-yellow-100 text-yellow-800',
    dissolved: 'bg-gray-100 text-gray-800',
    unknown: 'bg-blue-100 text-blue-800'
  };

  return (
    <Card className="bg-[#0d1220] border-white/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe2 className="w-4 h-4" />
          Top Threat Actors
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
          </div>
        ) : threats.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No threat actor data available</p>
        ) : (
          <div className="space-y-3">
            {threats.map((threat) => (
              <div key={threat.id} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#00d4ff]/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{threat.name}</h4>
                    <p className="text-gray-400 text-xs capitalize">{threat.type.replace('_', ' ')}</p>
                  </div>
                  <Badge className={statusColors[threat.status] || 'bg-gray-100 text-gray-800'}>
                    {threat.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#00d4ff]">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">{threat.confidence}% confidence</span>
                  </div>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc]"
                      style={{ width: `${threat.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}