import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, Crown, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TierServerManager() {
  const [creating, setCreating] = useState(false);
  const [creationResult, setCreationResult] = useState(null);
  const [discordServerId, setDiscordServerId] = useState('');

  const createTierServersMutation = useMutation({
    mutationFn: (serverId) => base44.functions.invoke('createTierSpecificServers', { discord_server_id: serverId }),
    onSuccess: (response) => {
      setCreationResult(response.data);
      setCreating(false);
    },
    onError: (error) => {
      console.error('Error creating tier channels:', error);
      alert(`Error: ${error.message}`);
      setCreating(false);
    }
  });

  const handleCreateTierServers = async () => {
    if (!discordServerId.trim()) {
      alert('Please enter your Discord Server ID');
      return;
    }
    setCreating(true);
    createTierServersMutation.mutate(discordServerId);
  };

  const tiers = [
    {
      name: 'Community',
      icon: '🌍',
      color: 'blue',
      features: ['Threat Actors', 'Public Vulnerabilities'],
      dailyLimit: 50,
      description: 'Public threat intelligence'
    },
    {
      name: 'Pro',
      icon: '⭐',
      color: 'purple',
      features: ['Threat Actors', 'All Vulnerabilities', 'Campaigns', 'Malware'],
      dailyLimit: 200,
      description: 'Professional threat intel'
    },
    {
      name: 'Enterprise',
      icon: '👑',
      color: 'amber',
      features: ['Everything in Pro', 'Incidents', 'LEA Intelligence'],
      dailyLimit: 1000,
      description: 'Full threat intel with LEA data'
    },
    {
      name: 'Gov/CI',
      icon: '🛡️',
      color: 'red',
      features: ['Everything in Enterprise', 'Critical Infrastructure Threats'],
      dailyLimit: 5000,
      description: 'Government & critical infrastructure'
    }
  ];

  const colorMap = {
    blue: 'border-blue-200 bg-blue-50',
    purple: 'border-purple-200 bg-purple-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50'
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-600" />
            Subscription Tier Discord Servers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Organize your Discord server by subscription tier. Creates dedicated channels for each tier so users only see threats they're entitled to.
          </p>

          {!creationResult ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-2">Discord Server ID *</label>
                <Input
                  placeholder="Enter your Discord Server ID (e.g., 123456789)"
                  value={discordServerId}
                  onChange={(e) => setDiscordServerId(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Right-click your server name → Copy Server ID (enable Developer Mode first)
                </p>
              </div>
              <Button
                onClick={handleCreateTierServers}
                disabled={creating || !discordServerId.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Tier Categories...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Tier Categories in Discord
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-green-300 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Tier categories created in Discord!</span>
              </div>
              {creationResult.tiers?.map(tier => (
                <div key={tier.tier} className="text-sm border-t pt-2">
                  <p className="font-semibold text-gray-900">{tier.tier} Tier</p>
                  <p className="text-xs text-gray-600">Channels Created: {tier.channels_created}</p>
                  <p className="text-xs text-gray-600">Daily Limit: {tier.max_threats_daily} threats</p>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setCreationResult(null)}
              >
                Create Another Set
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map(tier => (
          <Card key={tier.name} className={`border ${colorMap[tier.color]}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.icon}</span>
                  <div>
                    <CardTitle className="text-base">{tier.name} Tier</CardTitle>
                    <p className="text-xs text-gray-600 mt-1">{tier.description}</p>
                  </div>
                </div>
                <Badge variant="outline">{tier.dailyLimit}/day</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Threat Intelligence Access:</p>
                {tier.features.map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg p-2.5 text-xs space-y-1">
                <p className="font-semibold text-gray-900">Discord Channels:</p>
                {tier.name === 'Community' && (
                  <>
                    <p className="text-gray-600">• Critical Alerts</p>
                    <p className="text-gray-600">• Threat Actors</p>
                  </>
                )}
                {tier.name === 'Pro' && (
                  <>
                    <p className="text-gray-600">• Critical Alerts</p>
                    <p className="text-gray-600">• Threat Actors</p>
                    <p className="text-gray-600">• Vulnerabilities</p>
                    <p className="text-gray-600">• Campaigns, Malware, Reports</p>
                  </>
                )}
                {tier.name === 'Enterprise' && (
                  <>
                    <p className="text-gray-600">• Everything in Pro +</p>
                    <p className="text-gray-600">• Incidents</p>
                    <p className="text-gray-600">• LEA Intelligence</p>
                  </>
                )}
                {tier.name === 'Gov/CI' && (
                  <>
                    <p className="text-gray-600">• Everything in Enterprise +</p>
                    <p className="text-gray-600">• Critical Infrastructure Threats</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            How Tier Separation Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-gray-700">
            <span className="font-semibold">1. Separate Servers:</span> Each tier has its own dedicated Discord server with tier-appropriate channels
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">2. Access Control:</span> Threats are routed based on subscription level - users only see what they can access
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">3. Ingestion Limits:</span> Each tier has daily threat limits to prevent over-flooding
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">4. Tier Channels:</span> Each tier server includes critical-alerts, threat-actors, and other channels relevant to their level
          </p>
        </CardContent>
      </Card>
    </div>
  );
}