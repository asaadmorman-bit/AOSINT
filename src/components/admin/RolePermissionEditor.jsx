import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Save, Loader2 } from "lucide-react";

const ROLE_PERMISSIONS = {
  org_owner: [
    "user_management", "role_management", "subscription_view", "subscription_edit",
    "addon_activate", "agent_activate", "audit_view", "compliance_view",
    "branding_edit", "identity_edit", "data_export", "scenario_create",
    "scenario_execute", "red_blue_access", "fusion_center_access", "training_admin"
  ],
  tenant_admin: [
    "user_management", "role_management", "subscription_view", "addon_activate",
    "agent_activate", "audit_view", "compliance_view", "branding_edit",
    "scenario_create", "red_blue_access", "training_admin"
  ],
  cyber_operator: [
    "scenario_create", "scenario_execute", "audit_view", "agent_activate",
    "red_blue_access", "fusion_center_access"
  ],
  physical_operator: [
    "scenario_create", "scenario_execute", "audit_view", "fusion_center_access"
  ],
  ep_intelligence: [
    "scenario_create", "scenario_execute", "audit_view", "data_export"
  ],
  law_enforcement: [
    "audit_view", "compliance_view", "data_export", "fusion_center_access"
  ],
  analyst: [
    "scenario_create", "audit_view", "data_export"
  ],
  executive: [
    "audit_view", "subscription_view", "compliance_view", "scenario_create"
  ],
  compliance_officer: [
    "audit_view", "compliance_view", "subscription_view", "data_export"
  ],
  training_manager: [
    "training_admin", "user_management", "audit_view"
  ],
  read_only_auditor: [
    "audit_view", "compliance_view"
  ]
};

const ALL_PERMISSIONS = [
  "user_management", "role_management", "subscription_view", "subscription_edit",
  "addon_activate", "agent_activate", "audit_view", "compliance_view",
  "branding_edit", "identity_edit", "data_export", "scenario_create",
  "scenario_execute", "red_blue_access", "fusion_center_access", "training_admin"
];

const PERMISSION_DESCRIPTIONS = {
  user_management: "Invite, remove, and manage team members",
  role_management: "Assign and modify user roles",
  subscription_view: "View subscription and billing details",
  subscription_edit: "Upgrade/downgrade tiers and manage billing",
  addon_activate: "Activate and deactivate add-ons",
  agent_activate: "Activate and configure agents",
  audit_view: "View audit logs and compliance records",
  compliance_view: "View compliance dashboards and controls",
  branding_edit: "Customize branding and white-labeling",
  identity_edit: "Configure SSO and identity providers",
  data_export: "Export data and create backups",
  scenario_create: "Create and design scenarios",
  scenario_execute: "Execute and manage scenarios",
  red_blue_access: "Access Red/Blue Cell module",
  fusion_center_access: "Access Fusion Center",
  training_admin: "Manage training portal and courses"
};

export default function RolePermissionEditor() {
  const [selectedRole, setSelectedRole] = useState("analyst");
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState(ROLE_PERMISSIONS[selectedRole] || []);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPermissions(ROLE_PERMISSIONS[role] || []);
  };

  const togglePermission = (perm) => {
    setPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // In production, save to role_permissions table or update Role entity
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* Role Selector */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Select Role</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.keys(ROLE_PERMISSIONS).map(role => (
            <button key={role}
              onClick={() => handleRoleChange(role)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors capitalize ${
                selectedRole === role
                  ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
              }`}>
              {role.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Permissions
          </p>
          <span className="text-[9px] text-gray-600">{permissions.length} of {ALL_PERMISSIONS.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_PERMISSIONS.map(perm => (
            <div key={perm}
              onClick={() => togglePermission(perm)}
              className="bg-black/30 rounded-lg p-3 cursor-pointer border transition-colors"
              style={{
                borderColor: permissions.includes(perm) ? "#00d4ff30" : "transparent",
                backgroundColor: permissions.includes(perm) ? "#00d4ff08" : "rgb(0, 0, 0, 0.3)"
              }}>
              <div className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                  permissions.includes(perm)
                    ? "bg-[#00d4ff] border-[#00d4ff]"
                    : "border-gray-600"
                }`}>
                  {permissions.includes(perm) && (
                    <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white capitalize">{perm.replace(/_/g, " ")}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{PERMISSION_DESCRIPTIONS[perm]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}
          className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1 px-4 py-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}