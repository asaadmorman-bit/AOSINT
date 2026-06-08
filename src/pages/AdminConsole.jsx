import React, { useState } from "react";
import { Settings, Users, Lock, Palette, BarChart3, FileText, Shield, Bell } from "lucide-react";
import AdminGuard from "@/components/auth/AdminGuard.jsx";
import AdminOverview from "@/components/admin/AdminOverview.jsx";
import UserManagementPanel from "@/components/admin/UserManagementPanel.jsx";
import RolePermissionEditor from "@/components/admin/RolePermissionEditor.jsx";
import BrandingSettings from "@/components/admin/BrandingSettings.jsx";
import SecuritySettings from "@/components/admin/SecuritySettings.jsx";
import ComplianceDashboard from "@/components/admin/ComplianceDashboard.jsx";
import MFAManagement from "@/components/security/MFAManagement.jsx";
import RadiusManagement from "@/components/admin/RadiusManagement.jsx";
import LDAPIntegration from "@/components/admin/LDAPIntegration.jsx";
import SentinelIntegration from "@/components/admin/SentinelIntegration.jsx";
import NotificationSettings from "@/components/notifications/NotificationSettings.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Lock },
  { id: "security", label: "Security", icon: Shield },
  { id: "mfa", label: "MFA Management", icon: Lock },
  { id: "radius", label: "RADIUS Integration", icon: Shield },
  { id: "ldap", label: "LDAP/AD Integration", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sentinel", label: "Sentinel Integration", icon: Shield },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "compliance", label: "Compliance", icon: FileText },
];

// Mock tenant ID — in production from auth context
const DEMO_TENANT_ID = "tenant_demo_001";

function AdminConsoleContent() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3 mb-0.5">
          <Settings className="w-5 h-5 text-[#00d4ff]" />
          <h1 className="text-xl font-bold tracking-tight">Tenant Administration Console</h1>
        </div>
        <p className="text-xs text-gray-500">Manage organization settings, users, roles, security, and compliance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {tab === "overview" && <AdminOverview />}
        {tab === "users" && <UserManagementPanel tenantId={DEMO_TENANT_ID} />}
        {tab === "roles" && <RolePermissionEditor />}
        {tab === "security" && <SecuritySettings tenantId={DEMO_TENANT_ID} />}
        {tab === "mfa" && <MFAManagement />}
        {tab === "radius" && <RadiusManagement />}
        {tab === "ldap" && <LDAPIntegration />}
        {tab === "notifications" && <NotificationSettings />}
        {tab === "sentinel" && <SentinelIntegration />}
        {tab === "branding" && <BrandingSettings tenantId={DEMO_TENANT_ID} />}
        {tab === "compliance" && <ComplianceDashboard tenantId={DEMO_TENANT_ID} />}
      </div>
    </div>
  );
}

export default function AdminConsole() {
  return <AdminGuard><AdminConsoleContent /></AdminGuard>;
}