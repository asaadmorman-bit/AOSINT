/**
 * SOINT Module Integration Examples
 * Copy & adapt these patterns to integrate billing into your modules.
 */

/**
 * INTEGRATION PATTERN 1: Dashboard Access
 * Use before rendering a dashboard/module.
 *
 * Example in a React component:
 * 
 * const { data: subscription } = useQuery({...});
 * const canAccessScenarios = meetsMinTier(subscription?.tier, "pro") &&
 *   (subscription?.active_addons?.includes("scenario_engine") || subscription?.tier === "enterprise");
 *
 * if (!canAccessScenarios) {
 *   return <TierGate feature="Scenario Engine" minTier="pro" userTier={subscription?.tier} />;
 * }
 */

/**
 * INTEGRATION PATTERN 2: Usage Tracking
 * Track billable events as they happen.
 *
 * Example: After a threat feed ingests data:
 * 
 * const handleFeedIngestion = async (feedId, sizeInMB) => {
 *   // ... perform ingestion ...
 *   await base44.functions.invoke("trackBillingEvent", {
 *     tenant_id: currentTenant.id,
 *     event_type: "feed_ingestion",
 *     module: "threat_feeds",
 *     quantity: sizeInMB,
 *     metadata: { feed_id: feedId },
 *   });
 * };
 */

/**
 * INTEGRATION PATTERN 3: Entitlement Checks
 * Check before allowing action.
 *
 * Example: Before running a scenario:
 * 
 * const handleScenarioRun = async (scenarioId) => {
 *   const check = await base44.functions.invoke("checkEntitlement", {
 *     tenant_id: currentTenant.id,
 *     feature: "module",
 *     module: "scenario_engine",
 *   });
 *
 *   if (!check.data.allowed) {
 *     showUpgradePrompt(check.data.reason);
 *     return;
 *   }
 *
 *   // ... run scenario ...
 * };
 */

/**
 * INTEGRATION PATTERN 4: Agent Marketplace
 * Check agent entitlements before allowing use.
 *
 * Example in AgentMarketplace:
 * 
 * const canUseAgent = (agent, subscription) => {
 *   if (agent.tier === "core") return subscription.tier !== "community";
 *   if (agent.tier === "advanced") return subscription.tier === "enterprise" || subscription.tier === "gov";
 *   if (agent.tier === "premium") return subscription.tier === "enterprise" || subscription.tier === "gov";
 *   return false;
 * };
 *
 * // Or use add-ons:
 * const addonActive = subscription.active_addons?.includes(agent.addon_id);
 * return subscription.tier !== "community" && (canUseAgent(agent) || addonActive);
 */

/**
 * INTEGRATION PATTERN 5: Seat-based Access
 * Enforce seat limits for team members.
 *
 * Example in SeatManagement:
 * 
 * const canAddSeat = (subscription) => {
 *   const tierMeta = TIER_META[subscription.tier];
 *   return subscription.seat_count < tierMeta.max_seats;
 * };
 *
 * if (!canAddSeat(subscription)) {
 *   return <p>Seat limit reached. Upgrade or add seat capacity.</p>;
 * }
 */

/**
 * INTEGRATION PATTERN 6: Usage Limits
 * Enforce per-tier usage limits.
 *
 * Example before API call:
 * 
 * const canMakeAPICall = (subscription, thisMonth) => {
 *   const limit = TIER_META[subscription.tier].api_limit;
 *   return thisMonth < limit || limit === Infinity;
 * };
 *
 * if (!canMakeAPICall(sub, monthlyCount)) {
 *   return <TierGate feature="API Calls" minTier="pro" />;
 * }
 */

/**
 * INTEGRATION PATTERN 7: Compliance Framework
 * Gate compliance features by tier.
 *
 * Example: Before enabling SOC2 reporting:
 * 
 * const canEnableSOC2 = (subscription) => {
 *   return meetsMinTier(subscription.tier, "pro");
 * };
 *
 * const canEnableFedRAMP = (subscription) => {
 *   return meetsMinTier(subscription.tier, "enterprise");
 * };
 */

/**
 * INTEGRATION PATTERN 8: Audit Logging
 * Log all entitlement decisions for compliance.
 *
 * Example in a backend function:
 * 
 * const checkResult = await base44.functions.invoke("checkEntitlement", {...});
 * await base44.asServiceRole.entities.AuditLog.create({
 *   actor_email: user.email,
 *   action: "entitlement_check",
 *   resource_type: "scenario_engine",
 *   resource_id: scenarioId,
 *   details: `Scenario access: ${checkResult.data.allowed}`,
 *   outcome: checkResult.data.allowed ? "success" : "blocked",
 *   severity: "info",
 * });
 */

export default {
  patterns: [
    "Dashboard Access",
    "Usage Tracking",
    "Entitlement Checks",
    "Agent Marketplace",
    "Seat-based Access",
    "Usage Limits",
    "Compliance Framework",
    "Audit Logging",
  ],
};