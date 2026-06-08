import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, BarChart3, Users, Package, FileText, GitCompare, Shield, Loader2 } from "lucide-react";
import BillingOverview from "@/components/billing/BillingOverview.jsx";
import AddonCatalog from "@/components/billing/AddonCatalog.jsx";
import UsageDashboard from "@/components/billing/UsageDashboard.jsx";
import SeatManagement from "@/components/billing/SeatManagement.jsx";
import InvoiceHistory from "@/components/billing/InvoiceHistory.jsx";
import TierComparison from "@/components/billing/TierComparison.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: CreditCard },
  { id: "addons", label: "Add-ons", icon: Package },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "seats", label: "Seats", icon: Users },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "compare", label: "Compare Tiers", icon: GitCompare },
];

// Simulated tenant — in production this comes from auth context
const MOCK_SUBSCRIPTION = {
  tenant_name: "SOINT Demo Organization",
  owner_email: "admin@soint.io",
  tier: "enterprise",
  status: "active",
  billing_cycle: "annual",
  seat_count: 8,
  max_seats: 25,
  monthly_price_usd: 499,
  annual_price_usd: 4990,
  addon_cost_usd: 187,
  seat_cost_usd: 0,
  total_mrr_usd: 686,
  current_period_start: new Date(Date.now() - 15 * 86400000).toISOString(),
  current_period_end: new Date(Date.now() + 15 * 86400000).toISOString(),
  compliance_frameworks: ["SOC2", "FedRAMP-Moderate"],
  sovereign_deployment: false,
  payment_method: "card_ending_4242",
};

export default function BillingPortal() {
  const [tab, setTab] = useState("overview");
  const [addonLoading, setAddonLoading] = useState(null);
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => base44.entities.Subscription.list("-created_date", 1),
  });

  const { data: addons = [] } = useQuery({
    queryKey: ["addon_subscriptions"],
    queryFn: () => base44.entities.AddonSubscription.list("-created_date", 100),
  });

  const { data: usageEvents = [] } = useQuery({
    queryKey: ["usage_events"],
    queryFn: () => base44.entities.UsageEvent.list("-created_date", 500),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Invoice.list("-created_date", 50),
  });

  const subscription = subscriptions[0] || MOCK_SUBSCRIPTION;
  const currentTier = subscription.tier || "enterprise";

  const addonMutation = useMutation({
    mutationFn: async ({ addon, activate }) => {
      setAddonLoading(addon.id);
      if (activate) {
        return base44.entities.AddonSubscription.create({
          tenant_id: subscription.tenant_id || "demo",
          addon_id: addon.id,
          addon_name: addon.name,
          category: addon.category,
          status: "active",
          price_monthly_usd: addon.price,
          activated_at: new Date().toISOString(),
          min_tier_required: addon.min_tier,
          activated_by: "admin",
        });
      } else {
        const existing = addons.find(a => a.addon_id === addon.id);
        if (existing) return base44.entities.AddonSubscription.update(existing.id, { status: "cancelled" });
      }
    },
    onSuccess: () => {
      setAddonLoading(null);
      queryClient.invalidateQueries({ queryKey: ["addon_subscriptions"] });
    },
    onError: () => setAddonLoading(null),
  });

  const activeCount = addons.filter(a => a.status === "active").length;
  const addonMrr = addons.filter(a => a.status === "active").reduce((s, a) => s + (a.price_monthly_usd || 0), 0);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <CreditCard className="w-5 h-5 text-[#00d4ff]" />
            <h1 className="text-xl font-bold tracking-tight">Billing & Subscription</h1>
          </div>
          <p className="text-xs text-gray-500">Manage your SOINT subscription, add-ons, usage, and team seats</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-bold font-mono text-[#a855f7]">{activeCount}</p>
            <p className="text-[9px] text-gray-600">Add-ons</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold font-mono text-[#ffa502]">${(addonMrr + (subscription.monthly_price_usd || 0)).toLocaleString()}/mo</p>
            <p className="text-[9px] text-gray-600">Total MRR</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#2ed573]">
            <Shield className="w-3 h-3" /> Secure & Audited
          </div>
        </div>
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

      <div className="p-6 max-w-6xl">
        {tab === "overview" && (
          <BillingOverview
            subscription={subscription}
            addons={addons}
            usageSummary={usageEvents}
          />
        )}
        {tab === "addons" && (
          <AddonCatalog
            activeAddons={addons}
            userTier={currentTier}
            loading={addonLoading}
            onActivate={(addon) => addonMutation.mutate({ addon, activate: true })}
            onDeactivate={(addon) => addonMutation.mutate({ addon, activate: false })}
          />
        )}
        {tab === "usage" && (
          <UsageDashboard events={usageEvents} tier={currentTier} />
        )}
        {tab === "seats" && (
          <SeatManagement
            subscription={subscription}
            onInvite={() => queryClient.invalidateQueries({ queryKey: ["users_list"] })}
          />
        )}
        {tab === "invoices" && (
          <InvoiceHistory invoices={invoices} />
        )}
        {tab === "compare" && (
          <div className="space-y-4">
            <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5 overflow-x-auto">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4">Full Feature Comparison</p>
              <TierComparison currentTier={currentTier} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}