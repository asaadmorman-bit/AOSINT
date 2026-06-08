import React from "react";
import { AGENT_CATALOG } from "./AgentCatalog.jsx";
import { CheckCircle2, XCircle, Zap, Shield } from "lucide-react";

export default function AgentActivityDashboard({ configs }) {
  const enabled = configs.filter(c => c.status === "enabled");
  const disabled = configs.filter(c => c.status === "disabled");
  const totalActions = configs.reduce((s, c) => s + (c.actions_today || 0), 0);
  const totalAlerts = configs.reduce((s, c) => s + (c.alerts_routed || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Enabled Agents", value: enabled.length, color: "#2ed573", icon: CheckCircle2 },
          { label: "Disabled", value: disabled.length, color: "#6b7280", icon: XCircle },
          { label: "Actions Today", value: totalActions, color: "#00d4ff", icon: Zap },
          { label: "Alerts Routed", value: totalAlerts, color: "#a855f7", icon: Shield },
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

      {/* Active agents */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Active Agents</p>
        {enabled.length === 0 && (
          <p className="text-xs text-gray-600 py-6 text-center">No agents enabled yet</p>
        )}
        {enabled.map((cfg, i) => {
          const meta = AGENT_CATALOG.find(a => a.id === cfg.agent_id);
          return (
            <div key={cfg.id || i} className="flex items-center gap-3 p-3 bg-[#0d1117] border border-[#2ed573]/15 rounded-xl">
              <span className="text-lg shrink-0">{meta?.icon || "🤖"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{cfg.agent_name}</p>
                <p className="text-[9px] text-gray-600">{cfg.assigned_teams?.join(", ") || "No teams assigned"}</p>
              </div>
              <div className="flex items-center gap-3 text-right shrink-0">
                <div>
                  <p className="text-xs font-bold font-mono text-[#00d4ff]">{cfg.actions_today || 0}</p>
                  <p className="text-[9px] text-gray-700">actions</p>
                </div>
                <div>
                  <p className="text-xs font-bold font-mono text-[#a855f7]">{cfg.alerts_routed || 0}</p>
                  <p className="text-[9px] text-gray-700">routed</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Collaboration map */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Agent Collaboration Rules</p>
        <div className="space-y-1.5 text-[11px]">
          {[
            ["Fusion Center", "Scenario Engine", "signal → forecast"],
            ["Scenario Engine", "Red/Blue Cell", "forecast → planning"],
            ["Researcher Mode", "Question Lab", "evidence → gaps"],
            ["Operator Mode", "Fusion Center", "field → verification"],
            ["Executive Dashboard", "Briefing Engine", "strategic → summary"],
            ["Compliance Agent", "Governance Engine", "controls → readiness"],
            ["Training Agent", "Scenario Engine", "training → exercises"],
          ].map(([from, to, label], i) => (
            <div key={i} className="flex items-center gap-2 text-gray-500">
              <span className="text-[#a855f7] font-medium">{from}</span>
              <span className="text-gray-700">→</span>
              <span className="text-[#00d4ff] font-medium">{to}</span>
              <span className="text-gray-700 text-[9px]">({label})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}