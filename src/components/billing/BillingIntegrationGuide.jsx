/**
 * SOINT BILLING INTEGRATION GUIDE
 * 
 * This guide shows how to integrate the billing system into your modules.
 * Copy & adapt these patterns for your use case.
 */

// ============================================
// 1. DASHBOARD/MODULE ACCESS CONTROL
// ============================================

import React from "react";
import { meetsMinTier } from "@/functions/billingUtils";
import TierGate from "@/components/shared/TierGate";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function ScenarioEngineExample({ tenantId }) {
  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => base44.entities.Subscription.filter({ tenant_id: tenantId }).then(r => r[0]),
  });

  if (!subscription) return <div>Loading...</div>;

  // Check if tier allows module
  const hasTierAccess = meetsMinTier(subscription.tier, "pro");

  // Check if add-on is active
  const hasAddonAccess = subscription.active_addons?.includes("scenario_engine");

  const canAccess = hasTierAccess && (hasAddonAccess || subscription.tier === "enterprise");

  if (!canAccess) {
    return (
      <TierGate
        feature="Scenario Engine"
        description="Run defensive scenarios and forecast threats"
        minTier="pro"
        userTier={subscription.tier}
      />
    );
  }

  // Show module
  return <div>Scenario Engine content...</div>;
}

// ============================================
// 2. USAGE TRACKING
// ============================================

async function handleFeedIngestion(feedId, sizeInMB, currentTenant) {
  // Perform ingestion... (ingestFeed is a placeholder for your actual ingestion logic)
  const ingestResult = { source: "feed" };

  // Track for billing
  await base44.functions.invoke("trackBillingEvent", {
    tenant_id: currentTenant.id,
    event_type: "feed_ingestion",
    module: "threat_feeds",
    quantity: sizeInMB,
    metadata: {
      feed_id: feedId,
      source: ingestResult.source,
    },
  });

  console.log("Feed ingested and usage tracked");
}

// ============================================
// 3. ENTITLEMENT CHECKS BEFORE ACTION
// ============================================

async function handleScenarioRun(scenarioId, currentTenant, navigateTo, showAlert, runScenario) {
  // Check entitlement first
  const check = await base44.functions.invoke("checkEntitlement", {
    tenant_id: currentTenant.id,
    feature: "module",
    module: "scenario_engine",
  });

  if (!check.data.allowed) {
    showAlert({
      title: "Feature Unavailable",
      message: check.data.reason,
      action: "Upgrade to " + check.data.addon_required,
      onAction: () => navigateTo("BillingPortal"),
    });
    return;
  }

  // Proceed with scenario
  const result = await runScenario(scenarioId);

  // Track usage
  await base44.functions.invoke("trackBillingEvent", {
    tenant_id: currentTenant.id,
    event_type: "scenario_run",
    module: "scenario_engine",
    quantity: 1,
    metadata: {
      scenario_id: scenarioId,
      compute_hours: result.computeTime / 3600,
    },
  });
}

// ============================================
// 4. AGENT MARKETPLACE INTEGRATION
// ============================================

function AgentCard({ agent, subscription }) {
  // Determine if user can use agent
  const canUseAgent = () => {
    // Premium agents require enterprise
    if (agent.tier === "premium") {
      return meetsMinTier(subscription.tier, "enterprise");
    }

    // Advanced agents require enterprise or add-on
    if (agent.tier === "advanced") {
      const hasAddon = subscription.active_addons?.includes(agent.addon_id);
      return meetsMinTier(subscription.tier, "enterprise") || hasAddon;
    }

    // Core agents available in pro+
    return meetsMinTier(subscription.tier, "pro");
  };

  if (!canUseAgent()) {
    return (
      <div className="opacity-50 cursor-not-allowed">
        <div className="badge">Upgrade Required</div>
        {agent.addon_id && (
          <button onClick={() => window.location.href = "/BillingPortal?tab=addons"}>
            Add {agent.name} (${agent.price}/mo)
          </button>
        )}
      </div>
    );
  }

  return <div>Agent available - use it</div>;
}

// ============================================
// 5. SEAT MANAGEMENT
// ============================================

function InviteForm() {
  return <div>Invite form placeholder</div>;
}

function TeamInviteForm({ subscription }) {
  const TIER_SEATS = {
    community: 1,
    pro: 5,
    enterprise: Infinity,
    gov: Infinity,
  };

  const maxSeats = TIER_SEATS[subscription.tier];
  const canAddMore = subscription.seat_count < maxSeats;

  if (!canAddMore) {
    return (
      <div className="alert warning">
        <p>You've reached the seat limit for {subscription.tier} tier</p>
        <button onClick={() => window.location.href = "/BillingPortal?tab=addons&suggest=extra_seats_10"}>
          Add 10 Extra Seats ($90/mo)
        </button>
      </div>
    );
  }

  return <InviteForm />;
}

// ============================================
// 6. USAGE LIMITS
// ============================================

async function beforeAPICall(endpoint, currentTenant, subscription) {
  // getMonthlyAPIUsage: placeholder — replace with your actual usage fetch
  const monthlyUsage = 0;
  const TIER_LIMITS = {
    community: 500,
    pro: 10000,
    enterprise: Infinity,
    gov: Infinity,
  };

  const limit = subscription ? TIER_LIMITS[subscription.tier] : Infinity;

  if (limit !== Infinity && monthlyUsage >= limit) {
    return {
      blocked: true,
      reason: "API limit reached for this month",
      limit,
      current: monthlyUsage,
      upgrade: "pro",
    };
  }

  // Track API call
  await base44.functions.invoke("trackBillingEvent", {
    tenant_id: currentTenant?.id,
    event_type: "api_call",
    module: "api",
    quantity: 1,
  });

  return { blocked: false };
}

// ============================================
// 7. COMPLIANCE FRAMEWORK GATING
// ============================================

function CompliancePanel({ subscription }) {
  const frameworks = [
    { id: "soc2", name: "SOC 2", minTier: "pro" },
    { id: "fedramp", name: "FedRAMP", minTier: "enterprise" },
    { id: "cjis", name: "CJIS", minTier: "gov" },
  ];

  return (
    <div>
      {frameworks.map(fw => {
        const available = meetsMinTier(subscription.tier, fw.minTier);
        return (
          <div key={fw.id} className={available ? "" : "opacity-50"}>
            <h3>{fw.name}</h3>
            {!available && (
              <p>Requires {fw.minTier} tier. Upgrade to enable.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 8. INVOICE & BILLING STATUS
// ============================================

function BillingStatus({ subscription }) {
  const daysLeft = Math.ceil(
    (new Date(subscription.current_period_end) - new Date()) / 86400000
  );

  return (
    <div>
      <p>Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
      <p>Amount: ${subscription.total_mrr_usd}/month</p>
      {daysLeft < 7 && (
        <alert>Renews in {daysLeft} days</alert>
      )}
    </div>
  );
}

export default {
  guide: "SOINT Billing Integration Patterns",
  patterns: [
    "Dashboard Access Control",
    "Usage Tracking",
    "Entitlement Checks",
    "Agent Marketplace",
    "Seat Management",
    "Usage Limits",
    "Compliance Frameworks",
    "Billing Status",
  ],
};