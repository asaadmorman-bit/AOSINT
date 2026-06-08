import React, { useState } from "react";
import { AGENT_CATALOG } from "./AgentCatalog.jsx";
import { Button } from "@/components/ui/button";
import { Settings, Play, Pause, Trash2, CheckCircle2, XCircle, Zap, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DeployedAgentsPanel({ configs, onConfigure, onToggle }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AgentConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent_configs"] }),
  });

  if (configs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🤖</div>
        <p className="text-gray-400 text-sm font-medium mb-2">No agents deployed yet</p>
        <p className="text-gray-600 text-xs">Head to the Discover tab to find and deploy specialized AI agents.</p>
      </div>
    );
  }

  const enabled = configs.filter(c => c.status === "enabled");
  const disabled = configs.filter(c => c.status !== "enabled");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Deployed", value: configs.length, color: "#a855f7", icon: Zap },
          { label: "Active", value: enabled.length, color: "#2ed573", icon: CheckCircle2 },
          { label: "Paused", value: disabled.length, color: "#6b7280", icon: XCircle },
          { label: "Teams Covered", value: [...new Set(configs.flatMap(c => c.assigned_teams || []))].length, color: "#00d4ff", icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-white">{value}</p>
              <p className="text-[9px] text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Agents */}
      {enabled.length > 0 && (
        <section>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" /> Active Agents
          </p>
          <div className="space-y-3">
            {enabled.map(cfg => <AgentRow key={cfg.id} cfg={cfg} onConfigure={onConfigure} onToggle={onToggle} onDelete={() => deleteMutation.mutate(cfg.id)} />)}
          </div>
        </section>
      )}

      {/* Paused Agents */}
      {disabled.length > 0 && (
        <section>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Paused Agents</p>
          <div className="space-y-3">
            {disabled.map(cfg => <AgentRow key={cfg.id} cfg={cfg} onConfigure={onConfigure} onToggle={onToggle} onDelete={() => deleteMutation.mutate(cfg.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function AgentRow({ cfg, onConfigure, onToggle, onDelete }) {
  const meta = AGENT_CATALOG.find(a => a.id === cfg.agent_id);
  const isEnabled = cfg.status === "enabled";

  return (
    <div className={`bg-[#0d1117] border rounded-xl p-4 flex items-center gap-4 ${isEnabled ? "border-[#2ed573]/15" : "border-white/5"}`}>
      <span className="text-2xl shrink-0">{meta?.icon || "🤖"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-white truncate">{cfg.agent_name}</p>
          {meta?.vendor_type === "core"
            ? <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20 font-bold shrink-0">NATIVE</span>
            : <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 font-bold shrink-0">VENDOR</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span>{meta?.vendor || "Unknown vendor"}</span>
          {cfg.assigned_teams?.length > 0 && (
            <span className="text-gray-700">Teams: {cfg.assigned_teams.join(", ")}</span>
          )}
          <span className="capitalize">{cfg.explainability_level} explainability</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
          isEnabled ? "bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20" : "bg-white/5 text-gray-500 border border-white/5"
        }`}>
          {isEnabled ? "Active" : "Paused"}
        </span>
        <Button variant="ghost" size="sm"
          onClick={() => onToggle(meta || { id: cfg.agent_id, name: cfg.agent_name, category: cfg.category, min_tier: cfg.min_tier, teams: cfg.assigned_teams }, cfg)}
          className="h-7 w-7 p-0 text-gray-500 hover:text-white">
          {isEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => onConfigure(meta || { id: cfg.agent_id, name: cfg.agent_name, icon: meta?.icon || "🤖" }, cfg)}
          className="h-7 w-7 p-0 text-gray-500 hover:text-[#a855f7]">
          <Settings className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}
          className="h-7 w-7 p-0 text-gray-700 hover:text-[#ff4757]">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}