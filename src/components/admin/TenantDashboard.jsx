import React from "react";
import { Building2, Users, Package, Shield, BarChart3, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const TIER_COLORS = { community: "#6b7280", pro: "#00d4ff", enterprise: "#a855f7", gov: "#f59e0b" };
const ROLE_COLORS = {
  org_owner: "#ff4757", tenant_admin: "#00d4ff", cyber_operator: "#ffa502",
  physical_operator: "#2ed573", ep_intelligence: "#a855f7", law_enforcement: "#ff6b35"
};

export default function TenantDashboard({ tenantId }) {
  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => base44.entities.Tenant.filter({ id: tenantId }).then(r => r[0]),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", tenantId],
    queryFn: () => base44.entities.Subscription.filter({ tenant_id: tenantId }).then(r => r[0]),
  });

  const { data: config } = useQuery({
    queryKey: ["tenant_config", tenantId],
    queryFn: () => base44.entities.TenantConfiguration.filter({ tenant_id: tenantId }).then(r => r[0]),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["role_assignments", tenantId],
    queryFn: () => base44.entities.RoleAssignment.filter({ tenant_id: tenantId }),
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["addons", tenantId],
    queryFn: () => base44.entities.AddonSubscription.filter({ tenant_id: tenantId, status: "active" }),
  });

  if (!tenant || !subscription) return <div className="text-gray-600 py-8 text-center">Loading...</div>;

  const tierColor = TIER_COLORS[subscription.tier] || "#6b7280";
  const adminCount = roles.filter(r => ["org_owner", "tenant_admin"].includes(r.role)).length;

  return (
    <div className="space-y-6">
      {/* Tenant Info Card */}
      <div className="bg-[#0d1117] border rounded-2xl p-6" style={{ borderColor: `${tierColor}25` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5" style={{ color: tierColor }} />
              <h2 className="text-xl font-bold text-white">{tenant.name}</h2>
            </div>
            <p className="text-xs text-gray-500">{tenant.slug}</p>
            <p className="text-[10px] text-gray-600 mt-1">Owner: {tenant.owner_email}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold px-3 py-1 rounded-lg"
              style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}20` }}>
              {subscription.tier?.toUpperCase()}
            </span>
            <p className="text-xs text-gray-600 mt-2">Status: {subscription.status}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Users", value: roles.length, icon: Users, color: "#00d4ff" },
            { label: "Admins", value: adminCount, icon: Shield, color: "#a855f7" },
            { label: "Active Add-ons", value: addons.length, icon: Package, color: "#ffa502" },
            { label: "Billing Cycle", value: subscription.billing_cycle, icon: Clock, color: "#2ed573" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-black/30 rounded-lg p-3 flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-sm font-bold text-white">{typeof value === "number" ? value : value?.charAt(0).toUpperCase() + value?.slice(1)}</p>
                <p className="text-[9px] text-gray-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Subscription, Users, Compliance, Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscription Status */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Subscription
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Tier</span><span className="font-bold" style={{ color: tierColor }}>{subscription.tier}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">MRR</span><span className="font-mono text-white">${subscription.total_mrr_usd || 0}/mo</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cycle</span><span className="font-mono text-white">{subscription.billing_cycle}</span></div>
            {subscription.current_period_end && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Renews</span>
                <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Active Add-ons */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
            <Package className="w-3 h-3" /> Add-ons ({addons.length})
          </p>
          <div className="space-y-1.5">
            {addons.slice(0, 4).map(addon => (
              <div key={addon.id} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">{addon.addon_name}</span>
                <span className="font-mono text-[#2ed573]">${addon.price_monthly_usd}/mo</span>
              </div>
            ))}
            {addons.length === 0 && <p className="text-xs text-gray-600">No add-ons active</p>}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Roles
          </p>
          <div className="space-y-1.5">
            {["org_owner", "tenant_admin", "cyber_operator", "analyst"].map(role => {
              const count = roles.filter(r => r.role === role).length;
              if (count === 0) return null;
              return (
                <div key={role} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 capitalize">{role.replace(/_/g, " ")}</span>
                  <span className="font-bold px-2 py-0.5 rounded" style={{ background: `${ROLE_COLORS[role]}10`, color: ROLE_COLORS[role] }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Config */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Security
          </p>
          <div className="space-y-2 text-[10px]">
            <div className="flex items-center gap-2">
              {config?.identity_provider?.mfa_required ? (
                <CheckCircle2 className="w-3 h-3 text-[#2ed573]" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-[#ffa502]" />
              )}
              <span className="text-gray-400">MFA: {config?.identity_provider?.mfa_required ? "Enabled" : "Optional"}</span>
            </div>
            <div className="flex items-center gap-2">
              {config?.identity_provider?.sso_enabled ? (
                <CheckCircle2 className="w-3 h-3 text-[#2ed573]" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-[#ffa502]" />
              )}
              <span className="text-gray-400">SSO: {config?.identity_provider?.sso_enabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}