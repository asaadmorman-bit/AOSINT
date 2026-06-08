import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Target } from "lucide-react";

const THREAT_COLORS = {
  critical: '#ff0000',
  high: '#ff6600',
  medium: '#ffaa00',
  low: '#0066ff'
};

export default function RegionalThreatAssessment() {
  const { data: customAreas } = useQuery({
    queryKey: ['custom_geographic_areas'],
    queryFn: () => base44.entities.CustomGeographicArea.list('-created_date', 50),
    initialData: [],
  });

  const { data: heatmaps } = useQuery({
    queryKey: ['threat_heatmaps_all'],
    queryFn: () => base44.entities.ThreatHeatmap.list('-generated_date', 100),
    initialData: [],
  });

  const { data: leaIntel } = useQuery({
    queryKey: ['lea_intelligence'],
    queryFn: () => base44.entities.LEAIntelligence.list('-last_updated', 200),
    initialData: [],
  });

  // Analyze threat distribution by region
  const regionalAnalysis = useMemo(() => {
    const analysis = {};

    customAreas.forEach(area => {
      const relevantHeatmaps = heatmaps.filter(h => h.geographic_area_id === area.id);
      const totalDataPoints = relevantHeatmaps.reduce((sum, h) => sum + (h.threat_data_points?.length || 0), 0);
      const clusters = relevantHeatmaps.flatMap(h => h.activity_clusters || []);

      const threatDistribution = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      relevantHeatmaps.forEach(h => {
        h.threat_data_points?.forEach(point => {
          threatDistribution[point.threat_level] = (threatDistribution[point.threat_level] || 0) + 1;
        });
      });

      analysis[area.id] = {
        name: area.name,
        totalActivities: totalDataPoints,
        clusterCount: clusters.length,
        threatDistribution,
        avgIntensity: relevantHeatmaps.reduce((sum, h) => {
          const avg = h.threat_data_points?.reduce((s, p) => s + p.intensity, 0) / (h.threat_data_points?.length || 1);
          return sum + (avg || 0);
        }, 0) / (relevantHeatmaps.length || 1),
        highestThreat: Object.entries(threatDistribution).find(([k, v]) => v > 0)?.[0] || 'none'
      };
    });

    return analysis;
  }, [customAreas, heatmaps]);

  // Threat trend analysis
  const threatTrends = useMemo(() => {
    const trends = {};
    const now = new Date();

    for (let i = 30; i >= 0; i -= 5) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();

      trends[dateStr] = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      heatmaps.forEach(h => {
        h.threat_data_points?.forEach(point => {
          const pointDate = new Date(point.timestamp);
          if (pointDate.toLocaleDateString() === dateStr) {
            trends[dateStr][point.threat_level] += 1;
          }
        });
      });
    }

    return Object.entries(trends).map(([date, counts]) => ({
      date,
      ...counts
    }));
  }, [heatmaps]);

  // Top threats by entity type
  const topThreats = useMemo(() => {
    const threats = {};

    leaIntel.slice(0, 30).forEach(item => {
      const key = item.entity_name || item.title;
      threats[key] = {
        name: key,
        count: (threats[key]?.count || 0) + 1,
        level: item.threat_level,
        type: item.intel_type
      };
    });

    return Object.values(threats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [leaIntel]);

  return (
    <div className="space-y-6">
      {/* Regional Threat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(regionalAnalysis).map(([id, data]) => (
          <Card key={id}>
            <CardContent className="pt-6 space-y-3">
              <p className="font-semibold text-sm truncate">{data.name}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span className="font-semibold">{data.totalActivities}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clusters:</span>
                  <span className="font-semibold">{data.clusterCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Threat Level:</span>
                  <Badge className="text-xs" style={{ backgroundColor: THREAT_COLORS[data.highestThreat] }}>
                    {data.highestThreat}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Threat Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Threat Timeline (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="critical" stroke={THREAT_COLORS.critical} strokeWidth={2} />
              <Line type="monotone" dataKey="high" stroke={THREAT_COLORS.high} strokeWidth={2} />
              <Line type="monotone" dataKey="medium" stroke={THREAT_COLORS.medium} strokeWidth={2} />
              <Line type="monotone" dataKey="low" stroke={THREAT_COLORS.low} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Threat Distribution by Region */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Distribution by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(regionalAnalysis).map(([id, data]) => ({
              name: data.name.split(' ').slice(0, 2).join(' '),
              critical: data.threatDistribution.critical,
              high: data.threatDistribution.high,
              medium: data.threatDistribution.medium,
              low: data.threatDistribution.low
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill={THREAT_COLORS.critical} />
              <Bar dataKey="high" stackId="a" fill={THREAT_COLORS.high} />
              <Bar dataKey="medium" stackId="a" fill={THREAT_COLORS.medium} />
              <Bar dataKey="low" stackId="a" fill={THREAT_COLORS.low} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Threat Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Top Threat Entities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topThreats.map((threat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{threat.name}</p>
                  <p className="text-xs text-gray-600">{threat.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold px-2 py-1 bg-gray-100 rounded">
                    {threat.count}
                  </span>
                  <Badge style={{ backgroundColor: THREAT_COLORS[threat.level] }} className="text-xs">
                    {threat.level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}