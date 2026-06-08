import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Bot, Activity, ShieldCheck, Store, Upload, BarChart3, Settings } from "lucide-react";
import AgentCatalog from "@/components/marketplace/AgentCatalog.jsx";
import AgentConfigPanel from "@/components/marketplace/AgentConfigPanel.jsx";
import AgentAuditViewer from "@/components/marketplace/AgentAuditViewer.jsx";
import AgentActivityDashboard from "@/components/marketplace/AgentActivityDashboard.jsx";
import VendorPublishPanel from "@/components/marketplace/VendorPublishPanel.jsx";
import DeployedAgentsPanel from "@/components/marketplace/DeployedAgentsPanel.jsx";

const USER_TIER = "enterprise";
const TIER_META = {
  pro: { label: "Pro", color: "#00d4ff" },
  enterprise: { label: "Enterprise", color: "#a855f7" },
  gov: { label: "Gov/CI", color: "#f59e0b" },
};

const TABS = [
  { id: "discover", label: "Discover", icon: Store },
  { id: "deployed", label: "My Agents", icon: Settings },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "audit", label: "Audit Log", icon: ShieldCheck },
  { id: "publish", label: "Publish Agent", icon: Upload },
];

export default function AgentMarketplace() {
  const [tab, setTab] = useState("discover");
  const [configuring, setConfiguring] = useState(null);
  const queryClient = useQueryClient();
  const tierColor = TIER_META[USER_TIER]?.color || "#6b7280";

  const { data: configs = [] } = useQuery({
    queryKey: ["agent_configs"],
    queryFn: () => base44.entities.AgentConfig.list("-created_date", 100),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ agent, config }) => {
      if (config) {
        return base44.entities.AgentConfig.update(config.id, {
          status: config.status === "enabled" ? "disabled" : "enabled"
        });
      } else {
        return base44.entities.AgentConfig.create({
          agent_id: agent.id,
          agent_name: agent.name,
          category: agent.category,
          min_tier: agent.min_tier,
          status: "enabled",
          human_in_loop: true,
          verification_required: true,
          explainability_level: "standard",
          audit_retention_days: 90,
          assigned_teams: agent.teams || [],
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent_configs"] }),
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const { agent, config } = configuring;
      if (config) {
        return base44.entities.AgentConfig.update(config.id, formData);
      } else {
        return base44.entities.AgentConfig.create({
          agent_id: agent.id,
          agent_name: agent.name,
          category: agent.category,
          min_tier: agent.min_tier,
          status: "disabled",
          ...formData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent_configs"] });
      setConfiguring(null);
    },
  });

  const enabledCount = configs.filter(c => c.status === "enabled").length;

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <Bot className="w-5 h-5 text-[#a855f7]" />
            <h1 className="text-xl font-bold tracking-tight">AI Agent Marketplace</h1>
            <Badge className="text-[10px] px-2 py-0.5 font-bold" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}20` }}>
              {TIER_META[USER_TIER]?.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">Discover, deploy, and manage specialized intelligence AI agents — built by ASOSINT and vetted vendors</p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-[#2ed573]">{enabledCount}</p>
            <p className="text-[9px] text-gray-600">Active Agents</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-[#a855f7]">{configs.length}</p>
            <p className="text-[9px] text-gray-600">Deployed</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
        </div>
      </div>

      {/* Safety banner */}
      <div className="bg-[#2ed573]/5 border-b border-[#2ed573]/10 px-6 py-2 flex items-center gap-3">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2ed573] shrink-0" />
        <p className="text-[10px] text-gray-500">
          All agents operate under strict human oversight. No offensive actions, no exploit guidance, no sensitive targeting. Human-in-the-loop enforced on all deployments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? "border-[#a855f7] text-[#a855f7]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === "deployed" && configs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#a855f7]/20 text-[#a855f7]">{configs.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "discover" && (
          <AgentCatalog
            configs={configs}
            userTier={USER_TIER}
            onConfigure={(agent, config) => setConfiguring({ agent, config })}
            onToggle={(agent, config) => toggleMutation.mutate({ agent, config })}
            onDeploy={() => setTab("deployed")}
          />
        )}
        {tab === "deployed" && (
          <DeployedAgentsPanel
            configs={configs}
            onConfigure={(agent, config) => setConfiguring({ agent, config })}
            onToggle={(agent, config) => toggleMutation.mutate({ agent, config })}
          />
        )}
        {tab === "activity" && <AgentActivityDashboard configs={configs} />}
        {tab === "audit" && <AgentAuditViewer agentId={null} />}
        {tab === "publish" && <VendorPublishPanel />}
      </div>

      {configuring && (
        <AgentConfigPanel
          agent={configuring.agent}
          config={configuring.config}
          saving={saveMutation.isPending}
          onSave={(form) => saveMutation.mutate(form)}
          onClose={() => setConfiguring(null)}
        />
      )}
    </div>
  );
}