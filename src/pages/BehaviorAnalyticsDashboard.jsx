import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import BehaviorPatternViewer from "@/components/analytics/BehaviorPatternViewer";
import EngagementTrendChart from "@/components/analytics/EngagementTrendChart";
import VulnerabilityInsights from "@/components/analytics/VulnerabilityInsights";
import PatternSearchFilter from "@/components/analytics/PatternSearchFilter";

export default function BehaviorAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("patterns");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    targetType: "all",
    behaviorType: "all",
    severityLevel: "all",
    confidenceMin: 0,
  });

  const { data: patterns = [] } = useQuery({
    queryKey: ["behaviorPatterns"],
    queryFn: () => base44.entities.BehaviorPattern.list("-confidence_score", 100),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => base44.entities.SocialEngineeringCampaign.list("-start_date", 50),
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ["engagements"],
    queryFn: () => base44.entities.CampaignEngagement.list("-timestamp", 200),
  });

  const { data: targetProfiles = [] } = useQuery({
    queryKey: ["targetProfiles"],
    queryFn: () => base44.entities.TargetProfile.list("", 100),
  });

  // Apply filters and search
  const filteredPatterns = patterns.filter((pattern) => {
    const matchesSearch =
      searchQuery === "" ||
      pattern.pattern_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pattern.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedFilters.behaviorType === "all" ||
      pattern.pattern_type === selectedFilters.behaviorType;

    const matchesConfidence =
      (pattern.confidence_score || 0) >= selectedFilters.confidenceMin;

    return matchesSearch && matchesType && matchesConfidence;
  });

  const stats = {
    totalPatterns: patterns.length,
    highConfidencePatterns: patterns.filter((p) => (p.confidence_score || 0) > 80)
      .length,
    totalCampaigns: campaigns.length,
    successfulEngagements: engagements.filter((e) => e.success).length,
    totalEngagements: engagements.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Behavior Analytics Dashboard</h1>
        <p className="text-gray-400">Analyze target patterns, engagement trends, and exploitation opportunities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard title="Behavior Patterns" value={stats.totalPatterns} />
        <StatCard title="High Confidence" value={stats.highConfidencePatterns} color="green" />
        <StatCard title="Active Campaigns" value={stats.totalCampaigns} color="blue" />
        <StatCard title="Total Engagements" value={stats.totalEngagements} color="purple" />
        <StatCard
          title="Success Rate"
          value={`${Math.round((stats.successfulEngagements / stats.totalEngagements) * 100) || 0}%`}
          color="orange"
        />
      </div>

      {/* Search and Filter Bar */}
      <PatternSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        patterns={patterns}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <TabsList className="bg-slate-900/50 border-b border-slate-700/50">
          <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="trends">Engagement Trends</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="intelligence">Actionable Intelligence</TabsTrigger>
        </TabsList>

        {/* Behavior Patterns Tab */}
        <TabsContent value="patterns" className="p-6">
          <BehaviorPatternViewer
            patterns={filteredPatterns}
            targetProfiles={targetProfiles}
          />
        </TabsContent>

        {/* Engagement Trends Tab */}
        <TabsContent value="trends" className="p-6">
          <EngagementTrendChart
            engagements={engagements}
            campaigns={campaigns}
          />
        </TabsContent>

        {/* Vulnerabilities Tab */}
        <TabsContent value="vulnerabilities" className="p-6">
          <VulnerabilityInsights
            patterns={filteredPatterns}
            engagements={engagements}
          />
        </TabsContent>

        {/* Actionable Intelligence Tab */}
        <TabsContent value="intelligence" className="p-6">
          <ActionableIntelligence
            patterns={filteredPatterns}
            campaigns={campaigns}
            engagements={engagements}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, color = "cyan" }) {
  const colors = {
    cyan: "bg-cyan-900/20 border-cyan-500/20 text-cyan-400",
    green: "bg-green-900/20 border-green-500/20 text-green-400",
    blue: "bg-blue-900/20 border-blue-500/20 text-blue-400",
    purple: "bg-purple-900/20 border-purple-500/20 text-purple-400",
    orange: "bg-orange-900/20 border-orange-500/20 text-orange-400",
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <p className="text-xs text-gray-400 uppercase font-semibold">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ActionableIntelligence({ patterns, campaigns, engagements }) {
  // Group patterns by target and prioritize by impact
  const targetVulnerabilities = {};

  patterns.forEach((pattern) => {
    if (!targetVulnerabilities[pattern.target_profile_id]) {
      targetVulnerabilities[pattern.target_profile_id] = [];
    }
    targetVulnerabilities[pattern.target_profile_id].push(pattern);
  });

  const sortedTargets = Object.entries(targetVulnerabilities)
    .map(([targetId, patternList]) => ({
      targetId,
      patterns: patternList,
      avgConfidence:
        patternList.reduce((sum, p) => sum + (p.confidence_score || 0), 0) /
        patternList.length,
      totalExploitationOps: patternList.reduce(
        (sum, p) => sum + (p.observed_count || 0),
        0
      ),
    }))
    .sort((a, b) => b.avgConfidence - a.avgConfidence)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Priority Targets for Campaign Customization</h3>

      <div className="grid grid-cols-1 gap-4">
        {sortedTargets.map((target, idx) => {
          const primaryVulnerability = target.patterns.sort(
            (a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)
          )[0];

          return (
            <div key={target.targetId} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20">
                      Priority #{idx + 1}
                    </Badge>
                    <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20">
                      {target.patterns.length} vulnerabilities
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">Target ID: {target.targetId}</p>
                </div>
                <p className="text-2xl font-bold text-cyan-400">
                  {target.avgConfidence.toFixed(0)}%
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700/30">
                  <p className="text-xs text-gray-400 mb-1">Primary Vulnerability</p>
                  <p className="text-white font-semibold">
                    {primaryVulnerability.pattern_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {primaryVulnerability.exploitation_opportunity}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-gray-400">Observed Times</p>
                    <p className="text-cyan-400 font-bold">{target.totalExploitationOps}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-gray-400">Trigger Pattern</p>
                    <p className="text-green-400 font-bold">{primaryVulnerability.frequency}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}