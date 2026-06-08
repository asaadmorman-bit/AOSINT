import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radar, Database, Target, FileBarChart, Users, Eye, ShieldCheck, LayoutDashboard } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ThreatMap from "@/components/dashboard/ThreatMap";
import RecentIndicators from "@/components/dashboard/RecentIndicators";
import SituationalAwareness from "@/components/dashboard/SituationalAwareness";
import IntelPyramid from "@/components/dashboard/IntelPyramid";
import SpeedOfAction from "@/components/dashboard/SpeedOfAction";
import BelowThresholdMonitor from "@/components/dashboard/BelowThresholdMonitor";
import GoLaxyExposure from "@/components/dashboard/GoLaxyExposure";
import AgentTerminal from "@/components/agents/AgentTerminal";
import MetricsPanel from "@/components/dashboard/MetricsPanel";
import AIIntelBrief from "@/components/dashboard/AIIntelBrief";
import ScapStigDashboard from "@/components/dashboard/ScapStigDashboard";
import MobileFieldHome from "@/components/mobile/MobileFieldHome";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "scap", label: "SCAP / STIG", icon: ShieldCheck },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  const { data: feeds = [] } = useQuery({
    queryKey: ["feeds"],
    queryFn: () => base44.entities.ThreatFeed.list(),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 100),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => base44.entities.RiskAssessment.list("-created_date", 5),
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: () => base44.entities.Entity.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["op_events"],
    queryFn: () => base44.entities.OperationalEvent.list("-created_date", 50),
  });

  const activeFeeds = feeds.filter(f => f.status === "active").length;
  const totalIndicatorsCount = feeds.reduce((sum, f) => sum + (f.indicators_count || 0), 0);
  const criticalIndicators = indicators.filter(i => i.severity === "critical" || i.severity === "high").length;
  const latestAssessment = assessments[0];
  const threatScore = latestAssessment?.overall_risk_score || Math.min(100, Math.round((criticalIndicators / Math.max(indicators.length, 1)) * 100 + 30));

  // Mobile: show field home layout
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return <MobileFieldHome user={user} />;
  }

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#111827] border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "scap" ? (
        <ScapStigDashboard />
      ) : (
      <div className="space-y-5">
      {/* AI Intel Brief */}
      <AIIntelBrief indicators={indicators} feeds={feeds} events={events} assets={assets} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard title="Active Feeds" value={activeFeeds} icon={Radar} color="#00d4ff" />
        <StatCard title="Indicators" value={totalIndicatorsCount} icon={Database} color="#a855f7" />
        <StatCard title="Assets" value={assets.length} icon={Target} color="#2ed573" />
        <StatCard title="Assessments" value={assessments.length} icon={FileBarChart} color="#ffa502" />
        <StatCard title="Entities" value={entities.length} icon={Users} color="#ff6b35" />
        <StatCard title="Critical/High" value={criticalIndicators} icon={Eye} color="#ff4757" />
      </div>

      {/* Main Grid: Situational Awareness + Pyramid + Agent Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SA + Below Threshold */}
        <div className="space-y-5">
          <SituationalAwareness score={threatScore} />
          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <BelowThresholdMonitor />
          </div>
        </div>

        {/* Intel Pyramid + Speed of Action */}
        <div className="space-y-5">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <IntelPyramid />
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Speed of Action — Adversary vs Defender</p>
            <SpeedOfAction />
          </div>
        </div>

        {/* AI Agent Terminal */}
        <div className="h-[500px] lg:h-auto">
          <AgentTerminal />
        </div>
      </div>

      {/* GoLaxy + Threat Map + Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <GoLaxyExposure />
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Threat Category Distribution</p>
          <ThreatMap indicators={indicators} />
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Recent Intelligence</p>
          <RecentIndicators indicators={indicators} />
        </div>
      </div>

      {/* Metrics Panel */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <MetricsPanel indicators={indicators} assets={assets} feeds={feeds} events={events} />
      </div>
      </div>
      )}
    </div>
  );
}