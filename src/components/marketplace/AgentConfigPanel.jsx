import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Save, Shield, Users, Bell, Eye, Loader2 } from "lucide-react";

const TEAMS = ["cyber", "physical", "ep", "leo", "leadership", "analyst"];
const TEAM_COLORS = {
  cyber: "#00d4ff", physical: "#ffa502", ep: "#2ed573",
  leo: "#f59e0b", leadership: "#a855f7", analyst: "#ff6b35"
};

export default function AgentConfigPanel({ agent, config, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    human_in_loop: config?.human_in_loop ?? true,
    verification_required: config?.verification_required ?? true,
    explainability_level: config?.explainability_level ?? "standard",
    escalation_target: config?.escalation_target ?? "",
    audit_retention_days: config?.audit_retention_days ?? 90,
    assigned_teams: config?.assigned_teams ?? [],
  });

  function toggleTeam(team) {
    setForm(p => ({
      ...p,
      assigned_teams: p.assigned_teams.includes(team)
        ? p.assigned_teams.filter(t => t !== team)
        : [...p.assigned_teams, team]
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">{agent.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{agent.name}</p>
              <p className="text-[10px] text-gray-500">Agent Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Safety Settings — always on */}
          <div className="bg-[#ff4757]/5 border border-[#ff4757]/15 rounded-xl p-3">
            <p className="text-[10px] text-[#ff4757] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Safety Controls (Enforced)
            </p>
            <div className="space-y-1.5">
              {[
                "Never simulate offensive actions",
                "No exploit or tactical guidance",
                "Human oversight enforced at all times",
                "Audit logging mandatory",
                "RBAC strictly enforced",
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] shrink-0" />
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Human-in-the-loop */}
          <div className="space-y-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Human Oversight</p>
            <Toggle label="Human-in-the-loop required" value={form.human_in_loop}
              onChange={v => setForm(p => ({ ...p, human_in_loop: v }))} />
            <Toggle label="Verification required before routing" value={form.verification_required}
              onChange={v => setForm(p => ({ ...p, verification_required: v }))} />
          </div>

          {/* Explainability */}
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Explainability Level</p>
            <div className="flex gap-2">
              {["minimal", "standard", "verbose"].map(lvl => (
                <button key={lvl} onClick={() => setForm(p => ({ ...p, explainability_level: lvl }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    form.explainability_level === lvl
                      ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30"
                      : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
                  }`}>{lvl}</button>
              ))}
            </div>
          </div>

          {/* Escalation */}
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Escalation Target</p>
            <Input value={form.escalation_target}
              onChange={e => setForm(p => ({ ...p, escalation_target: e.target.value }))}
              placeholder="e.g. team-lead@org.com or Slack #alerts"
              className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
          </div>

          {/* Assigned Teams */}
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Assigned Teams
            </p>
            <div className="flex flex-wrap gap-2">
              {TEAMS.map(team => (
                <button key={team} onClick={() => toggleTeam(team)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                    form.assigned_teams.includes(team)
                      ? "border font-bold"
                      : "bg-white/5 text-gray-600 border border-white/5"
                  }`}
                  style={form.assigned_teams.includes(team) ? {
                    background: `${TEAM_COLORS[team]}15`,
                    color: TEAM_COLORS[team],
                    borderColor: `${TEAM_COLORS[team]}30`
                  } : {}}>
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Retention */}
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Audit Retention (days)</p>
            <div className="flex gap-2">
              {[30, 60, 90, 180, 365].map(days => (
                <button key={days} onClick={() => setForm(p => ({ ...p, audit_retention_days: days }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                    form.audit_retention_days === days
                      ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                      : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
                  }`}>{days}d</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-white/5">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-gray-500 h-9">Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 h-9 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/30 gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Config
          </Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors relative ${value ? "bg-[#2ed573]" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-5.5" : "left-0.5"}`}
          style={{ left: value ? "22px" : "2px" }} />
      </button>
    </div>
  );
}