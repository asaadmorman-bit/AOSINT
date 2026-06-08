import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap, AlertTriangle, Shield, Users, MessageSquare, Clock,
  Layers, BookOpen, Plus, RefreshCw, Filter, Search,
  ChevronRight, Radio, Lock, Crown
} from "lucide-react";
import LiveThreatFeed from "@/components/operator/LiveThreatFeed.jsx";
import AssetAlerts from "@/components/operator/AssetAlerts.jsx";
import ThreatActorWatchboard from "@/components/operator/ThreatActorWatchboard.jsx";
import OperatorTimeline from "@/components/operator/OperatorTimeline.jsx";
import CrossDomainCorrelation from "@/components/operator/CrossDomainCorrelation.jsx";
import OperatorPlaybooks from "@/components/operator/OperatorPlaybooks.jsx";
import FieldCapture from "@/components/operator/FieldCapture.jsx";
import EntityThreatLookup from "@/components/operator/EntityThreatLookup";

const USER_TIER = "enterprise";
const TIER_ORDER = ["community", "pro", "enterprise", "gov"];
function meetsMinTier(userTier, minTier) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}

const TIER_META = {
  community: { label: "Community", color: "#6b7280" },
  pro: { label: "Pro", color: "#00d4ff" },
  enterprise: { label: "Enterprise", color: "#a855f7" },
  gov: { label: "Gov/CI", color: "#f59e0b" },
};

export default function OperatorMode() {
  const [activeTab, setActiveTab] = useState("feed");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const queryClient = useQueryClient();
  const tierColor = TIER_META[USER_TIER]?.color || "#6b7280";

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["op_events"],
    queryFn: () => base44.entities.OperationalEvent.list("-created_date", 50),
    refetchInterval: 30000,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["op_assets"],
    queryFn: () => base44.entities.Asset.filter({ criticality: "critical" }, "-last_assessment", 20),
  });

  const { data: actors = [] } = useQuery({
    queryKey: ["op_actors"],
    queryFn: () => base44.entities.ThreatActor.list("-updated_date", 20),
  });

  const { data: fieldReports = [] } = useQuery({
    queryKey: ["op_field_reports"],
    queryFn: () => base44.entities.FieldReport.list("-created_date", 20),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["op_events"] });
    setLastRefresh(new Date());
  };

  const criticalCount = events.filter(e => e.severity === "critical" && e.status === "active").length;
  const activeCount = events.filter(e => e.status === "active").length;
  const crossDomainCount = events.filter(e => e.is_cross_domain).length;

  const TABS = [
    { id: "feed", label: "Live Feed", icon: Radio, count: activeCount },
    { id: "assets", label: "Asset Alerts", icon: Shield, minTier: "pro" },
    { id: "actors", label: "Actor Watch", icon: Users, minTier: "pro" },
    { id: "entity_lookup", label: "Entity Lookup", icon: Search, minTier: "pro" },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "correlation", label: "Cross-Domain", icon: Layers, count: crossDomainCount, minTier: "enterprise" },
    { id: "field", label: "Field Capture", icon: Plus, minTier: "pro" },
    { id: "playbooks", label: "Playbooks", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Alert strip */}
      {criticalCount > 0 && (
        <div className="bg-[#ff4757]/10 border-b border-[#ff4757]/30 px-4 py-2 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-[#ff4757] animate-pulse shrink-0" />
          <span className="font-bold text-[#ff4757]">{criticalCount} CRITICAL</span>
          <span className="text-gray-400 text-xs truncate">{events.find(e => e.severity === "critical")?.title}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff4757]/15 border border-[#ff4757]/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#ff4757]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Operator Mode</h1>
              <Badge className="text-[9px] px-1.5 py-0.5 font-bold" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}20` }}>
                {TIER_META[USER_TIER]?.label}
              </Badge>
            </div>
            <p className="text-[10px] text-gray-500">Tactical real-time interface</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-mono hidden sm:block">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button size="sm" variant="ghost" onClick={handleRefresh} className="h-7 w-7 p-0 text-gray-400 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Link to={createPageUrl("ExecutiveDashboard")}>
            <Button size="sm" className="h-7 text-xs bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 gap-1 hidden sm:flex">
              <Crown className="w-3 h-3" /> Executive View
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="border-b border-white/5 px-4 py-2 flex items-center gap-4 overflow-x-auto">
        {[
          { label: "Active Events", value: activeCount, color: "#ff4757" },
          { label: "Critical", value: criticalCount, color: "#ff4757" },
          { label: "Cross-Domain", value: crossDomainCount, color: "#a855f7" },
          { label: "Field Reports", value: fieldReports.length, color: "#2ed573" },
          { label: "Watched Actors", value: actors.length, color: "#00d4ff" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold font-mono" style={{ color }}>{value}</span>
            <span className="text-[10px] text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="border-b border-white/5 px-4 flex items-center gap-1 overflow-x-auto">
        {TABS.map(tab => {
          const locked = tab.minTier && !meetsMinTier(USER_TIER, tab.minTier);
          return (
            <button key={tab.id}
              onClick={() => !locked && setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#ff4757] text-[#ff4757]"
                  : locked
                    ? "border-transparent text-gray-700 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              {locked ? <Lock className="w-3 h-3" /> : <tab.icon className="w-3 h-3" />}
              {tab.label}
              {tab.count > 0 && !locked && (
                <span className="text-[9px] bg-[#ff4757]/20 text-[#ff4757] px-1 rounded font-mono">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar for feed */}
      {activeTab === "feed" && (
        <div className="px-4 py-2.5 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events, actors, regions..."
              className="h-8 pl-8 bg-[#0d1117] border-white/5 text-sm text-white placeholder:text-gray-700" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === "feed" && <LiveThreatFeed events={events} search={search} loading={eventsLoading} userTier={USER_TIER} />}
        {activeTab === "assets" && <AssetAlerts assets={assets} events={events} userTier={USER_TIER} />}
        {activeTab === "actors" && <ThreatActorWatchboard actors={actors} events={events} userTier={USER_TIER} />}
        {activeTab === "entity_lookup" && <EntityThreatLookup userTier={USER_TIER} />}
        {activeTab === "timeline" && <OperatorTimeline events={events} fieldReports={fieldReports} userTier={USER_TIER} />}
        {activeTab === "correlation" && <CrossDomainCorrelation events={events} userTier={USER_TIER} />}
        {activeTab === "field" && <FieldCapture fieldReports={fieldReports} userTier={USER_TIER} />}
        {activeTab === "playbooks" && <OperatorPlaybooks userTier={USER_TIER} />}
      </div>
    </div>
  );
}