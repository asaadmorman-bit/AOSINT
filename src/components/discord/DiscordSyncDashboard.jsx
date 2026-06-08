import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, CheckCircle2, AlertCircle, Loader2, RefreshCw, Server, MessageSquare } from "lucide-react";

export default function DiscordSyncDashboard() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStats, setSyncStats] = useState({
    servers_synced: 0,
    threats_pushed: 0,
    timestamp: null
  });

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('initiateDiscordSync', {});
      setSyncStats(response.data);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Check automation status
    const checkStatus = async () => {
      try {
        // Fetch recent DiscordToastMessages to infer sync activity
        const recentMessages = await base44.entities.DiscordToastMessage.filter(
          {},
          '-posted_at',
          5
        );
        if (recentMessages.length > 0) {
          setLastSync(new Date(recentMessages[0].posted_at));
        }
      } catch (e) {
        console.error('Error checking sync status:', e);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Discord Threat Intel Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Servers Synced</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{syncStats.servers_synced || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-purple-100">
              <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Threats Pushed</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{syncStats.threats_pushed || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Last Sync</div>
              <div className="text-sm font-semibold text-green-600 mt-1">
                {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-yellow-100">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-900">Automations Active</h4>
                <p className="text-xs text-yellow-800 mt-1">
                  Threats are syncing every 15 minutes automatically. New OSINT alerts and LEA intelligence trigger immediate pushes to Discord.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={triggerSync}
              disabled={syncing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trigger Manual Sync
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              View Discord Servers
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-semibold text-gray-700 uppercase">Sync Pipeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Threats collected from OSINT & LEA sources</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Pushed to appropriate Discord channels by threat type</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Filtered to dashboards based on subscriptions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">Daily limits enforced per dashboard</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}