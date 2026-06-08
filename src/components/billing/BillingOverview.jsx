import React from "react";
import { Crown, Zap, Users, Calendar, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIER_META = {
  community: { label: "Community", color: "#6b7280", price: 0 },
  pro: { label: "Pro", color: "#00d4ff", price: 99 },
  enterprise: { label: "Enterprise", color: "#a855f7", price: 499 },
  gov: { label: "Gov/CI", color: "#f59e0b", price: null },
};

const TIER_FEATURES = {
  community: ["Limited dashboards", "Limited ingestion", "Community forum", "Basic indicators"],
  pro: ["Full ingestion (rate-limited)", "Core agents", "Researcher Mode", "Scenario Engine", "Seat-based teams"],
  enterprise: ["All modules included", "All core & advanced agents", "Unlimited ingestion (fair use)", "Sovereign-like features", "Compliance Engine", "Training Portal"],
  gov: ["All Enterprise features", "Sovereign deployment", "Extended retention", "Advanced audit logging", "Classified feed placeholders", "Custom SLA & pricing"],
};

export default function BillingOverview({ subscription, addons, usageSummary }) {
  if (!subscription) return (
    <div className="text-center py-16 text-gray-600">
      <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No subscription found</p>
    </div>
  );

  const tier = subscription.tier || "community";
  const tierMeta = TIER_META[tier];
  const features = TIER_FEATURES[tier] || [];
  const daysLeft = subscription.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end) - new Date()) / 86400000))
    : null;

  return (
    <div className="space-y-4">
      {/* Main card */}
      <div className="bg-[#0d1117] border rounded-2xl p-6 relative overflow-hidden"
        style={{ borderColor: `${tierMeta.color}25` }}>
        <div className="absolute inset-0 opacity-3 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${tierMeta.color}20, transparent 60%)` }} />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${tierMeta.color}15`, color: tierMeta.color, border: `1px solid ${tierMeta.color}20` }}>
                {tierMeta.label.toUpperCase()}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                subscription.status === "active" ? "bg-[#2ed573]/10 text-[#2ed573]" :
                subscription.status === "trial" ? "bg-[#ffa502]/10 text-[#ffa502]" :
                "bg-[#ff4757]/10 text-[#ff4757]"
              }`}>{subscription.status?.toUpperCase()}</span>
            </div>
            <p className="text-2xl font-black text-white">{subscription.tenant_name || "Your Organization"}</p>
            <p className="text-xs text-gray-500 mt-0.5">{subscription.owner_email}</p>
          </div>
          <div className="text-right">
            {tierMeta.price !== null ? (
              <>
                <p className="text-3xl font-black text-white">
                  ${(subscription.total_mrr_usd || tierMeta.price).toLocaleString()}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <p className="text-[10px] text-gray-600">{subscription.billing_cycle === "annual" ? "billed annually" : "billed monthly"}</p>
              </>
            ) : (
              <p className="text-lg font-bold" style={{ color: tierMeta.color }}>Custom Pricing</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Seats", value: `${subscription.seat_count || 1} / ${subscription.max_seats || 1}`, icon: Users, color: "#00d4ff" },
            { label: "Add-ons Active", value: addons?.filter(a => a.status === "active").length || 0, icon: Zap, color: "#a855f7" },
            { label: "Days Left", value: daysLeft ?? "—", icon: Calendar, color: "#ffa502" },
            { label: "MRR", value: `$${(subscription.total_mrr_usd || 0).toLocaleString()}`, icon: TrendingUp, color: "#2ed573" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-black/30 rounded-xl p-3 flex items-center gap-2.5">
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-sm font-bold font-mono text-white">{value}</p>
                <p className="text-[9px] text-gray-600">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features included */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Included in {tierMeta.label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: tierMeta.color }} />
              {f}
            </div>
          ))}
        </div>
        {tier !== "gov" && (
          <Link to={createPageUrl("Pricing")}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: tierMeta.color }}>
            View upgrade options <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Compliance */}
      {subscription.compliance_frameworks?.length > 0 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Compliance Frameworks</p>
          <div className="flex flex-wrap gap-2">
            {subscription.compliance_frameworks.map(f => (
              <span key={f} className="text-[10px] px-2 py-1 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] font-bold">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}