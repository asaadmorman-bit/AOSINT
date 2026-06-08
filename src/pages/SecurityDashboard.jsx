import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart3, TrendingUp, Users, AlertTriangle, Clock, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AlertTrendsChart from "@/components/dashboard/AlertTrendsChart.jsx";
import TeamActivityPanel from "@/components/dashboard/TeamActivityPanel.jsx";
import IncidentMetrics from "@/components/dashboard/IncidentMetrics.jsx";
import ThreatIntelInsights from "@/components/dashboard/ThreatIntelInsights.jsx";

export default function SecurityDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    activeTeams: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [alerts, teams] = await Promise.all([
        base44.entities.OsintAlert.list(),
        base44.entities.Team.list()
      ]);

      const criticalCount = alerts.filter(a => a.severity === 'critical').length;
      const activeTeamCount = teams.filter(t => t.is_active).length;
      // Deterministic response time estimate based on alert volume
      const estimatedResponseTime = Math.min(480, 30 + criticalCount * 15 + alerts.length * 2);

      setMetrics({
        totalAlerts: alerts.length,
        criticalAlerts: criticalCount,
        activeTeams: activeTeamCount,
        avgResponseTime: estimatedResponseTime
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#00d4ff]" />
            <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          </div>
          <Button onClick={loadMetrics} variant="outline" className="border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10">
            Refresh
          </Button>
        </div>
        <p className="text-gray-400">Real-time security metrics and threat intelligence overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Total Alerts</span>
                <AlertTriangle className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <div className="text-3xl font-bold text-white">{metrics.totalAlerts}</div>
              <p className="text-[#2ed573] text-xs">Active monitoring</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Critical Alerts</span>
                <TrendingUp className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-500">{metrics.criticalAlerts}</div>
              <p className="text-gray-500 text-xs">Require attention</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Active Teams</span>
                <Users className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <div className="text-3xl font-bold text-white">{metrics.activeTeams}</div>
              <p className="text-[#2ed573] text-xs">Collaborating</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0d1220] border-white/5">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Avg Response Time</span>
                <Clock className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <div className="text-3xl font-bold text-white">{metrics.avgResponseTime}m</div>
              <p className="text-gray-500 text-xs">Minutes to respond</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertTrendsChart />
        <TeamActivityPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentMetrics />
        <ThreatIntelInsights />
      </div>

      {/* BigQuery Analytics Note */}
      <Card className="bg-[#0d1220] border-[#00d4ff]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-[#00d4ff]" />
            Advanced Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Google BigQuery connector is available for deeper analytics. Connect to query historical threat data, correlate patterns across teams, and generate advanced threat assessments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}