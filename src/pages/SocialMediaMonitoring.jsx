import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Plus, Radio, Calendar, Search, AlertTriangle, TrendingUp,
  CheckCircle2, XCircle, Clock, Shield, Eye, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ConnectAccountDialog from "@/components/social-monitoring/ConnectAccountDialog";
import CreateCampaignDialog from "@/components/social-monitoring/CreateCampaignDialog";
import CampaignCard from "@/components/social-monitoring/CampaignCard";
import AccountCard from "@/components/social-monitoring/AccountCard";

const PLATFORM_ICONS = {
  linkedin: "💼",
  twitter: "🐦",
  facebook: "📘",
  instagram: "📷",
  tiktok: "🎵",
  discord: "💬"
};

export default function SocialMediaMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["socialMediaAccounts"],
    queryFn: () => base44.entities.SocialMediaAccount.list(),
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["monitoringCampaigns"],
    queryFn: () => base44.entities.MonitoringCampaign.list(),
  });

  const { data: findings = [] } = useQuery({
    queryKey: ["socialMediaFindings"],
    queryFn: () => base44.entities.SocialMediaFinding.list("-created_date", 50),
  });

  const connectedAccounts = accounts.filter(a => a.connection_status === "connected");
  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const recentFindings = findings.filter(f => {
    const age = Date.now() - new Date(f.created_date).getTime();
    return age < 24 * 60 * 60 * 1000; // Last 24 hours
  });

  const threatFindings = findings.filter(f => 
    f.threat_level && !["none", "low"].includes(f.threat_level)
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 lg:w-7 lg:h-7 text-[#00d4ff]" />
            Social Media Monitoring
          </h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1">
            Track and analyze social media accounts with authorized API access
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowConnectDialog(true)}
            variant="outline"
            className="flex-1 sm:flex-none border-[#00d4ff]/20 hover:border-[#00d4ff]/40"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
          <Button
            onClick={() => setShowCreateCampaign(true)}
            className="flex-1 sm:flex-none bg-[#00d4ff] hover:bg-[#00d4ff]/80 text-black"
          >
            <Radio className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "Connected Accounts", value: connectedAccounts.length, icon: CheckCircle2, color: "#2ed573" },
          { label: "Active Campaigns", value: activeCampaigns.length, icon: Radio, color: "#00d4ff" },
          { label: "Findings (24h)", value: recentFindings.length, icon: Search, color: "#ffa502" },
          { label: "Threats Detected", value: threatFindings.length, icon: AlertTriangle, color: "#ff4757" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#0d1220] border-white/5">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                >
                  <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[9px] lg:text-xs text-gray-600">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="bg-[#0d1220] border border-white/5 w-full sm:w-auto">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {campaigns.length} total campaign{campaigns.length !== 1 ? "s" : ""}
            </p>
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-[#0d1220] border-white/5"
            />
          </div>

          {campaignsLoading ? (
            <div className="text-center py-12 text-gray-500">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <Card className="bg-[#0d1220] border-white/5">
              <CardContent className="py-12 text-center">
                <Radio className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No monitoring campaigns yet</p>
                <Button onClick={() => setShowCreateCampaign(true)} className="bg-[#00d4ff] text-black">
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {campaigns
                .filter(c => 
                  c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} accounts={accounts} />
                ))}
            </div>
          )}
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {connectedAccounts.length} of {accounts.length} account{accounts.length !== 1 ? "s" : ""} connected
            </p>
          </div>

          {accountsLoading ? (
            <div className="text-center py-12 text-gray-500">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <Card className="bg-[#0d1220] border-white/5">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No social media accounts connected</p>
                <Button onClick={() => setShowConnectDialog(true)} className="bg-[#00d4ff] text-black">
                  Connect Your First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {findings.length} total finding{findings.length !== 1 ? "s" : ""}
            </p>
          </div>

          {findings.length === 0 ? (
            <Card className="bg-[#0d1220] border-white/5">
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No findings yet. Start a monitoring campaign to collect data.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {findings.slice(0, 50).map((finding) => {
                const account = accounts.find(a => a.id === finding.account_id);
                return (
                  <Card key={finding.id} className="bg-[#0d1220] border-white/5 hover:border-white/10 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{PLATFORM_ICONS[finding.platform]}</span>
                            <Badge variant="outline" className="text-xs">
                              {finding.content_type}
                            </Badge>
                            {finding.threat_level && finding.threat_level !== "none" && (
                              <Badge
                                className={`text-xs ${
                                  finding.threat_level === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                  finding.threat_level === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                  "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                }`}
                              >
                                {finding.threat_level}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                            {finding.content_text}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{account?.account_name || "Unknown Account"}</span>
                            <span>•</span>
                            <span>{new Date(finding.posted_at || finding.created_date).toLocaleDateString()}</span>
                            {finding.sentiment && finding.sentiment !== "unknown" && (
                              <>
                                <span>•</span>
                                <span className={
                                  finding.sentiment === "positive" ? "text-green-500" :
                                  finding.sentiment === "negative" ? "text-red-500" :
                                  "text-gray-500"
                                }>
                                  {finding.sentiment}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {finding.content_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(finding.content_url, "_blank")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <Card className="bg-[#0d1220] border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00d4ff]" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Coming soon: sentiment trends, engagement metrics, and threat analytics</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-gray-500">
              <TrendingUp className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="mb-2">Advanced analytics will be available here</p>
              <p className="text-sm">Track sentiment over time, engagement patterns, and threat intelligence insights</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConnectAccountDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
      <CreateCampaignDialog
        open={showCreateCampaign}
        onOpenChange={setShowCreateCampaign}
        accounts={accounts}
      />
    </div>
  );
}