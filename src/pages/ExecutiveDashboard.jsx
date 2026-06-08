import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe2, AlertTriangle, Layers, Clock, ShieldAlert, MessageSquare,
  User, Server, HelpCircle, CheckSquare, Download, ChevronRight,
  TrendingUp, TrendingDown, Minus, Crown, Eye, Zap
} from "lucide-react";
import FragmentationIndex from "@/components/executive/FragmentationIndex.jsx";
import ConvergenceMap from "@/components/executive/ConvergenceMap.jsx";
import SectorHeatmap from "@/components/executive/SectorHeatmap.jsx";
import WarningTimeMonitor from "@/components/executive/WarningTimeMonitor.jsx";
import RansomwarePanel from "@/components/executive/RansomwarePanel.jsx";
import NarrativeTracker from "@/components/executive/NarrativeTracker.jsx";
import ExposureSummary from "@/components/executive/ExposureSummary.jsx";
import UnansweredSummary from "@/components/executive/UnansweredSummary.jsx";
import RecommendedActions from "@/components/executive/RecommendedActions.jsx";

const USER_TIER = "enterprise";

const TIER_META = {
  community: { label: "Community", color: "#6b7280" },
  pro: { label: "Pro", color: "#00d4ff" },
  enterprise: { label: "Enterprise", color: "#a855f7" },
  gov: { label: "Gov/CI", color: "#f59e0b" },
};

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];
function meetsMinTier(userTier, minTier) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}

function MetricCard({ label, value, trend, color = "#00d4ff", icon: Icon }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "#ff4757" : trend === "down" ? "#2ed573" : "#6b7280";
  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-white font-mono">{value}</p>
      </div>
      <TrendIcon className="w-4 h-4 shrink-0" style={{ color: trendColor }} />
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const tierColor = TIER_META[USER_TIER]?.color || "#6b7280";

  const { data: indicators = [] } = useQuery({
    queryKey: ["strategic_indicators"],
    queryFn: () => base44.entities.StrategicIndicator.list("-created_date", 50),
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["analytic_questions_exec"],
    queryFn: () => base44.entities.AnalyticQuestion.filter({ status: "unanswered" }, "-created_date", 20),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets_exec"],
    queryFn: () => base44.entities.Asset.list("-created_date", 30),
  });

  const { data: ransomware = [] } = useQuery({
    queryKey: ["ransomware_exec"],
    queryFn: () => base44.entities.RansomwareTracker.filter({ status: "active" }, "-last_activity", 10),
  });

  const { data: convergence = [] } = useQuery({
    queryKey: ["convergence_exec"],
    queryFn: () => base44.entities.ConvergenceNode.list("-created_date", 20),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["operational_events_exec"],
    queryFn: () => base44.entities.OperationalEvent.filter({ status: "active" }, "-created_date", 15),
  });

  const criticalEvents = events.filter(e => e.severity === "critical");
  const criticalAssets = assets.filter(a => a.criticality === "critical");
  const highConvergence = convergence.filter(c => (c.convergence_score || 0) >= 70);
  const fragmentationScore = indicators.filter(i => i.indicator_class === "fragmentation").reduce((sum, i) => sum + (i.score || 0), 0) / Math.max(indicators.filter(i => i.indicator_class === "fragmentation").length, 1);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Alert Banner */}
      {!alertDismissed && criticalEvents.length > 0 && (
        <div className="bg-[#ff4757]/10 border-b border-[#ff4757]/30 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#ff4757] shrink-0 animate-pulse" />
            <span className="text-sm font-semibold text-[#ff4757]">
              {criticalEvents.length} CRITICAL EVENT{criticalEvents.length > 1 ? "S" : ""} ACTIVE
            </span>
            <span className="text-xs text-gray-400">{criticalEvents[0]?.title}</span>
          </div>
          <button onClick={() => setAlertDismissed(true)} className="text-gray-500 hover:text-gray-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <Crown className="w-5 h-5 text-[#f59e0b]" />
            <h1 className="text-xl font-bold tracking-tight">SOINT Executive Dashboard</h1>
            <Badge className="text-[10px] px-2 py-0.5 font-bold" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}20` }}>
              {TIER_META[USER_TIER]?.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">Strategic command center — global risk, exposure & threat posture</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("BriefingEngine")}>
            <Button size="sm" className="h-8 text-xs bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/25 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export to Briefing
            </Button>
          </Link>
          <Link to={createPageUrl("ResearchHub")}>
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 text-gray-400 hover:text-white gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Researcher Mode
            </Button>
          </Link>
          <Link to={createPageUrl("OperatorMode")}>
            <Button size="sm" className="h-8 text-xs bg-[#ff4757]/15 text-[#ff4757] border border-[#ff4757]/20 hover:bg-[#ff4757]/25 gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Operator Mode
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <MetricCard label="Fragmentation Score" value={isNaN(fragmentationScore) ? "N/A" : fragmentationScore.toFixed(0)} trend="up" color="#ff4757" icon={Globe2} />
          <MetricCard label="Active Convergence" value={highConvergence.length} trend="up" color="#a855f7" icon={Layers} />
          <MetricCard label="Critical Assets" value={criticalAssets.length} trend={criticalAssets.length > 5 ? "up" : "down"} color="#ffa502" icon={Server} />
          <MetricCard label="Active Ransomware" value={ransomware.length} trend="up" color="#ff6b35" icon={ShieldAlert} />
          <MetricCard label="Intel Gaps" value={questions.length} trend="up" color="#00d4ff" icon={HelpCircle} />
          <MetricCard label="Critical Alerts" value={criticalEvents.length} trend={criticalEvents.length > 0 ? "up" : "stable"} color="#ff4757" icon={AlertTriangle} />
        </div>

        {/* Row 1: Fragmentation + Convergence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FragmentationIndex indicators={indicators} userTier={USER_TIER} />
          <ConvergenceMap convergence={convergence} events={events} userTier={USER_TIER} />
        </div>

        {/* Row 2: Sector Heatmap + Warning Time */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectorHeatmap assets={assets} events={events} userTier={USER_TIER} />
          <WarningTimeMonitor events={events} indicators={indicators} userTier={USER_TIER} />
        </div>

        {/* Row 3: Ransomware + Narratives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RansomwarePanel ransomware={ransomware} userTier={USER_TIER} />
          <NarrativeTracker userTier={USER_TIER} />
        </div>

        {/* Row 4: Exposure + Unanswered + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ExposureSummary assets={assets} userTier={USER_TIER} />
          <UnansweredSummary questions={questions} userTier={USER_TIER} />
          <RecommendedActions indicators={indicators} events={events} userTier={USER_TIER} />
        </div>
      </div>
    </div>
  );
}