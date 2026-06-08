import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { meetsMinTier, TIER_META } from "@/components/shared/tierCapabilities";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  FlaskConical, Shield, Network, Bug, BarChart3,
  Clock, BookOpen, Zap, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TTPExplorer from "@/components/research/TTPExplorer";
import ConvergenceExplorer from "@/components/research/ConvergenceExplorer";
import VulnerabilityPanel from "@/components/research/VulnerabilityPanel";
import ThreatTimeline from "@/components/research/ThreatTimeline";
import ResearchWorkspace from "@/components/research/ResearchWorkspace";
import ResearchHubStats from "@/components/research/ResearchHubStats";

const USER_TIER = "pro"; // In production, pull from auth context

const TABS = [
  { key: "ttp",         label: "TTP Explorer",      icon: Shield,     minTier: "pro" },
  { key: "convergence", label: "Convergence Map",   icon: Network,    minTier: "enterprise" },
  { key: "vuln",        label: "Vulnerability",     icon: Bug,        minTier: "pro" },
  { key: "timeline",    label: "Threat Timeline",   icon: Clock,      minTier: "enterprise" },
  { key: "workspace",   label: "Analyst Workspace", icon: BookOpen,   minTier: "pro" },
];

export default function ResearchHub() {
  const [activeTab, setActiveTab] = useState("ttp");
  const canAccess = meetsMinTier(USER_TIER, "pro");

  // Fetch all research data up front
  const { data: ttpClusters = [] } = useQuery({
    queryKey: ["ttp_clusters"],
    queryFn: () => base44.entities.TTPCluster.list("-created_date", 100),
    enabled: canAccess,
  });
  const { data: convergenceNodes = [] } = useQuery({
    queryKey: ["convergence_nodes"],
    queryFn: () => base44.entities.ConvergenceNode.list("-created_date", 100),
    enabled: meetsMinTier(USER_TIER, "enterprise"),
  });
  const { data: exposureTrends = [] } = useQuery({
    queryKey: ["exposure_trends"],
    queryFn: () => base44.entities.ExposureTrend.list("-created_date", 100),
    enabled: canAccess,
  });
  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["timeline_events"],
    queryFn: () => base44.entities.TimelineEvent.list("-occurred_at", 200),
    enabled: meetsMinTier(USER_TIER, "enterprise"),
  });
  const { data: researchTopics = [] } = useQuery({
    queryKey: ["research_topics"],
    queryFn: () => base44.entities.ResearchTopic.list("-created_date", 100),
    enabled: canAccess,
  });
  const { data: researchNotes = [] } = useQuery({
    queryKey: ["research_notes"],
    queryFn: () => base44.entities.ResearchNote.list("-created_date", 100),
    enabled: canAccess,
  });

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-12 text-center max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center mx-auto mb-5">
            <FlaskConical className="w-8 h-8 text-[#00d4ff]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Researcher Mode</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            A professional-grade analytic environment for studying TTP evolution, cross-domain threats, 
            and global fragmentation patterns. Requires Pro tier or above.
          </p>
          <Link to={createPageUrl("Pricing")}>
            <Button className="bg-[#00d4ff] text-black font-bold hover:bg-[#00bfe6] gap-2 px-6">
              <Zap className="w-4 h-4" /> Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-[#00d4ff]" />
            </div>
            <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Researcher Mode</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${TIER_META[USER_TIER]?.color}20`, color: TIER_META[USER_TIER]?.color }}>
              {TIER_META[USER_TIER]?.badge}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Multi-domain analytic environment aligned with the 2026 State of Security report
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <ResearchHubStats
        ttpClusters={ttpClusters}
        convergenceNodes={convergenceNodes}
        exposureTrends={exposureTrends}
        timelineEvents={timelineEvents}
        researchTopics={researchTopics}
      />

      {/* Tabs */}
      <div className="bg-[#0d1220] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-0 border-b border-white/5 px-4 overflow-x-auto">
          {TABS.map(tab => {
            const locked = !meetsMinTier(USER_TIER, tab.minTier);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => !locked && setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  locked ? "text-gray-600 cursor-not-allowed border-transparent" :
                  isActive ? "text-[#00d4ff] border-[#00d4ff]" : "text-gray-500 hover:text-gray-300 border-transparent"
                }`}
              >
                {locked ? <Lock className="w-3 h-3" /> : <tab.icon className="w-3.5 h-3.5" />}
                {tab.label}
                {locked && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7] font-bold">
                    {tab.minTier.toUpperCase()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === "ttp" && (
            <TTPExplorer clusters={ttpClusters} userTier={USER_TIER} />
          )}
          {activeTab === "convergence" && meetsMinTier(USER_TIER, "enterprise") && (
            <ConvergenceExplorer nodes={convergenceNodes} userTier={USER_TIER} />
          )}
          {activeTab === "vuln" && (
            <VulnerabilityPanel trends={exposureTrends} userTier={USER_TIER} />
          )}
          {activeTab === "timeline" && meetsMinTier(USER_TIER, "enterprise") && (
            <ThreatTimeline events={timelineEvents} userTier={USER_TIER} />
          )}
          {activeTab === "workspace" && (
            <ResearchWorkspace
              topics={researchTopics}
              notes={researchNotes}
              userTier={USER_TIER}
            />
          )}
        </div>
      </div>

      {/* Enterprise upgrade teaser for pro users */}
      {USER_TIER === "pro" && (
        <div className="bg-gradient-to-r from-[#a855f7]/5 to-[#00d4ff]/5 border border-[#a855f7]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Unlock Full Researcher Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Convergence Map, Multi-Domain Timeline, Peer Review, and SIEM integrations — Enterprise tier</p>
          </div>
          <Link to={createPageUrl("Pricing")} className="shrink-0">
            <Button size="sm" className="bg-[#a855f7] text-white hover:bg-[#9333ea] gap-2 font-semibold">
              <Zap className="w-3.5 h-3.5" /> Upgrade to Enterprise
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}