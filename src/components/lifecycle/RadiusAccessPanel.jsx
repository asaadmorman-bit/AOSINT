import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Lock, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const ACCESS_LEVELS = {
  level_0: { label: "Level 0", color: "#6b7280", description: "No access" },
  level_1: { label: "Level 1", color: "#ffa502", description: "View unclassified" },
  level_2: { label: "Level 2", color: "#00d4ff", description: "View/analyze unclassified" },
  level_3: { label: "Level 3", color: "#a855f7", description: "Secret level access" },
  level_4: { label: "Level 4", color: "#2ed573", description: "Top Secret access" },
  level_5: { label: "Level 5", color: "#ff4757", description: "Compartmented access" },
};

const ROLE_PERMISSIONS = {
  analyst: { can_view: true, can_validate: false, can_approve: false, can_modify: false },
  validator: { can_view: true, can_validate: true, can_approve: false, can_modify: false },
  auditor: { can_view: true, can_validate: false, can_approve: false, can_modify: false },
  operator: { can_view: true, can_validate: true, can_approve: true, can_modify: false },
  admin: { can_view: true, can_validate: true, can_approve: true, can_modify: true },
  compliance_officer: { can_view: true, can_validate: false, can_approve: false, can_modify: false },
  executive: { can_view: true, can_validate: false, can_approve: false, can_modify: false },
};

export default function RadiusAccessPanel() {
  const { data: accessControls = [] } = useQuery({
    queryKey: ["radius-access"],
    queryFn: () => base44.entities.RadiusAccessControl.list("-created_date"),
  });

  const [filterRole, setFilterRole] = useState("all");

  const filtered = filterRole === "all"
    ? accessControls
    : accessControls.filter(ac => ac.role === filterRole);

  const statusCounts = {
    active: accessControls.filter(ac => ac.status === 'active').length,
    suspended: accessControls.filter(ac => ac.status === 'suspended').length,
    expired: accessControls.filter(ac => ac.status === 'expired').length,
  };

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="font-bold">RADIUS Integration</span> manages access control across the model lifecycle platform. Users are assigned access levels (0-5) that determine what models, data classifications, and operations they can access. Each access tier requires appropriate security clearance and multi-factor authentication for sensitive operations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={CheckCircle2} label="Active Users" value={statusCounts.active} color="#2ed573" />
        <StatCard icon={Clock} label="Suspended" value={statusCounts.suspended} color="#ffa502" />
        <StatCard icon={AlertTriangle} label="Expired" value={statusCounts.expired} color="#ff4757" />
      </div>

      {/* Access Control Matrix */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Access Level Permissions Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-2 text-gray-500">Level</th>
                <th className="text-center p-2 text-gray-500">View</th>
                <th className="text-center p-2 text-gray-500">Validate</th>
                <th className="text-center p-2 text-gray-500">Approve</th>
                <th className="text-center p-2 text-gray-500">Modify Policy</th>
                <th className="text-center p-2 text-gray-500">MFA Required</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ACCESS_LEVELS).map(([key, level]) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2">
                    <Badge style={{ background: `${level.color}15`, color: level.color, borderColor: `${level.color}30` }}>
                      {level.label}
                    </Badge>
                  </td>
                  <td className="p-2 text-center">✓</td>
                  <td className="p-2 text-center">{key >= 'level_2' ? '✓' : '—'}</td>
                  <td className="p-2 text-center">{key >= 'level_3' ? '✓' : '—'}</td>
                  <td className="p-2 text-center">{key === 'level_5' ? '✓' : '—'}</td>
                  <td className="p-2 text-center">{key >= 'level_3' ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Active RADIUS Users</h3>
          <Button size="sm" className="h-7 text-[10px]">
            <Plus className="w-3 h-3 mr-1" />
            Add User
          </Button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-[10px] text-gray-500 p-4 rounded bg-black/20 text-center">
              No users configured
            </div>
          ) : (
            filtered.map(user => {
              const levelInfo = ACCESS_LEVELS[user.access_level];
              const isExpired = new Date(user.expiration_date) < new Date();

              return (
                <div key={user.id} className="bg-black/20 border border-white/5 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[11px] font-bold text-white">{user.username}</p>
                      <p className="text-[9px] text-gray-500">{user.organization}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge className="text-[9px]" style={{ background: `${levelInfo.color}15`, color: levelInfo.color, borderColor: `${levelInfo.color}30` }}>
                        {levelInfo.label}
                      </Badge>
                      <Badge className={isExpired ? "text-[9px] bg-red-500/10 text-red-400 border-red-500/20" : "text-[9px] bg-green-500/10 text-green-400 border-green-500/20"}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1 mb-2 text-[9px]">
                    {user.can_validate && <PermissionBadge text="Can Validate" />}
                    {user.can_approve_certification && <PermissionBadge text="Can Approve" />}
                    {user.can_view_reasoning_chains && <PermissionBadge text="View Reasoning" />}
                    {user.can_view_audit_logs && <PermissionBadge text="View Audit Logs" />}
                    {user.mfa_enabled && <PermissionBadge text="MFA Enabled" color="green" />}
                  </div>

                  {/* Clearance & Expiry */}
                  <div className="flex items-center justify-between text-[9px] pt-2 border-t border-white/5">
                    <span className="text-gray-500">
                      Clearance: <span className="text-white font-semibold capitalize">{user.clearance_level}</span>
                    </span>
                    <span className={isExpired ? "text-red-400" : "text-gray-500"}>
                      Expires: {new Date(user.expiration_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Role-Based Permissions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[10px]">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="bg-black/20 rounded p-3 border border-white/5">
              <p className="text-white font-semibold capitalize mb-2">{role.replace(/_/g, " ")}</p>
              <div className="space-y-1 text-gray-400">
                <div>{perms.can_view ? "✓" : "—"} View models & data</div>
                <div>{perms.can_validate ? "✓" : "—"} Validate models</div>
                <div>{perms.can_approve ? "✓" : "—"} Approve certification</div>
                <div>{perms.can_modify ? "✓" : "—"} Modify policies</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-3">
      <div className="p-2 rounded-lg w-fit mb-2" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function PermissionBadge({ text, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return <Badge className={`${colors[color]} text-[8px]`}>{text}</Badge>;
}