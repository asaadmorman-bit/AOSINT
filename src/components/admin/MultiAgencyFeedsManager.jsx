import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const PUSH_SPEEDS = {
  slow: { label: "Slow (4h)", minutes: 240 },
  normal: { label: "Normal (1h)", minutes: 60 },
  fast: { label: "Fast (15min)", minutes: 15 },
  realtime: { label: "Real-time (5min)", minutes: 5 }
};

export default function MultiAgencyFeedsManager() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ['govFeeds'],
    queryFn: () => base44.entities.FeedChannel.filter({ category: "gov" })
  });

  const { data: discordServers = [] } = useQuery({
    queryKey: ['discordServers'],
    queryFn: () => base44.asServiceRole.entities.DiscordThreatServer.filter({ is_active: true })
  });

  const updateFeedMutation = useMutation({
    mutationFn: ({ feedId, data }) => base44.entities.FeedChannel.update(feedId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['govFeeds'] });
    }
  });

  const syncFeedsMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncMultiAgencyFeedsToDiscord'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['govFeeds'] });
    }
  });

  const handleToggleAutoPush = (feed) => {
    updateFeedMutation.mutate({
      feedId: feed.id,
      data: { auto_push_enabled: !feed.auto_push_enabled }
    });
  };

  const handleChangePushSpeed = (feed, speed) => {
    updateFeedMutation.mutate({
      feedId: feed.id,
      data: { push_speed: speed }
    });
  };

  const handleSyncNow = () => {
    syncFeedsMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Multi-Agency Feeds Configuration
        </h2>
        <p className="text-sm text-gray-600">Configure and manage government and allied intelligence feeds for Discord integration</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{feeds.length}</div>
            <div className="text-xs text-gray-600 mt-1">Active Feeds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{feeds.filter(f => f.auto_push_enabled).length}</div>
            <div className="text-xs text-gray-600 mt-1">Auto-Push Enabled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">{discordServers.length}</div>
            <div className="text-xs text-gray-600 mt-1">Discord Servers Connected</div>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={handleSyncNow}
        disabled={syncFeedsMutation.isPending}
        className="bg-blue-600 hover:bg-blue-700 w-full"
      >
        {syncFeedsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {syncFeedsMutation.isPending ? 'Syncing...' : 'Sync All Feeds to Discord'}
      </Button>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : feeds.length === 0 ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900">No feeds configured</p>
                  <p className="text-sm text-yellow-800 mt-1">Multi-agency feeds will appear here once created.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          feeds.map(feed => (
            <Card key={feed.id} className={feed.auto_push_enabled ? "border-green-200 bg-green-50" : "border-gray-200"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {feed.auto_push_enabled && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {feed.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{feed.description}</p>
                  </div>
                  <Badge className={feed.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {feed.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Auto-Push to Discord</label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feed.auto_push_enabled}
                        onCheckedChange={() => handleToggleAutoPush(feed)}
                      />
                      <span className="text-sm text-gray-600">{feed.auto_push_enabled ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Push Speed</label>
                    <Select value={feed.push_speed || "normal"} onValueChange={(speed) => handleChangePushSpeed(feed, speed)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (4 hours)</SelectItem>
                        <SelectItem value="normal">Normal (1 hour)</SelectItem>
                        <SelectItem value="fast">Fast (15 minutes)</SelectItem>
                        <SelectItem value="realtime">Real-time (5 minutes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Severity Filter</label>
                  <div className="flex gap-2 flex-wrap">
                    {["critical", "high", "medium", "low", "info"].map(sev => (
                      <Badge
                        key={sev}
                        variant={feed.push_severity_filter?.includes(sev) ? "default" : "outline"}
                        className={feed.push_severity_filter?.includes(sev) ? (
                          sev === "critical" ? "bg-red-600" : sev === "high" ? "bg-orange-600" : "bg-yellow-600"
                        ) : ""}
                      >
                        {sev}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Feed Slug:</strong> {feed.slug}</p>
                  <p><strong>Push Frequency:</strong> Every {feed.push_frequency_minutes} minutes</p>
                  <p><strong>Push Duration:</strong> {feed.push_duration_hours === 0 ? "Indefinite" : `${feed.push_duration_hours} hours`}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}