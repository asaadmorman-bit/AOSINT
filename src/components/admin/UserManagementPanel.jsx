import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Loader2, Users } from "lucide-react";

const ROLES = [
  "org_owner", "tenant_admin", "cyber_operator", "physical_operator",
  "ep_intelligence", "law_enforcement", "analyst", "executive",
  "compliance_officer", "training_manager", "read_only_auditor"
];

const ROLE_COLORS = {
  org_owner: "#ff4757", tenant_admin: "#00d4ff", cyber_operator: "#ffa502",
  physical_operator: "#2ed573", ep_intelligence: "#a855f7", law_enforcement: "#ff6b35",
  analyst: "#00d4ff", executive: "#a855f7", compliance_officer: "#ffa502",
  training_manager: "#2ed573", read_only_auditor: "#6b7280"
};

export default function UserManagementPanel({ tenantId }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["role_assignments", tenantId],
    queryFn: () => base44.entities.RoleAssignment.filter({ tenant_id: tenantId, is_active: true }),
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (email) => {
      setInviting(true);
      // First invite user via SDK
      await base44.users.inviteUser(email.trim(), inviteRole === "org_owner" ? "admin" : "user");

      // Then create role assignment
      return base44.entities.RoleAssignment.create({
        tenant_id: tenantId,
        user_email: email.trim(),
        role: inviteRole,
        assigned_by: "admin",
        assigned_at: new Date().toISOString(),
        is_active: true,
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteRole("analyst");
      setInviting(false);
      queryClient.invalidateQueries({ queryKey: ["role_assignments", tenantId] });
    },
    onError: () => setInviting(false),
  });

  const removeRoleMutation = useMutation({
    mutationFn: (roleId) => base44.entities.RoleAssignment.update(roleId, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role_assignments", tenantId] }),
  });

  return (
    <div className="space-y-4">
      {/* Invite Form */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> Invite User
        </p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (inviteEmail.trim()) assignRoleMutation.mutate(inviteEmail);
        }} className="flex gap-2 flex-wrap">
          <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="user@organization.com" type="email"
            className="flex-1 h-8 bg-black/30 border-white/10 text-sm min-w-0" />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="h-8 px-2 rounded-lg bg-black/30 border border-white/10 text-xs text-gray-300">
            {ROLES.map(r => (
              <option key={r} value={r} className="bg-[#0d1117]">{r.replace(/_/g, " ")}</option>
            ))}
          </select>
          <Button type="submit" disabled={inviting || !inviteEmail.trim()}
            className="h-8 px-3 text-xs bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1">
            {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Invite
          </Button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Team Members ({roles.length})
        </p>
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-xs text-gray-600 py-4 text-center">No users yet</p>
          ) : (
            roles.map(role => (
              <div key={role.id} className="flex items-center gap-3 py-2 border-b border-white/3 last:border-0">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {(role.user_name || role.user_email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{role.user_name || role.user_email}</p>
                  <p className="text-[9px] text-gray-600">{role.user_email}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded font-bold shrink-0"
                  style={{ background: `${ROLE_COLORS[role.role] || "#6b7280"}10`, color: ROLE_COLORS[role.role] || "#9ca3af" }}>
                  {role.role.replace(/_/g, " ")}
                </span>
                <button onClick={() => removeRoleMutation.mutate(role.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-[#ff4757] hover:bg-[#ff4757]/10 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}