/**
 * SOINT Billing Utilities (Shared)
 * Helper functions for:
 * - Tier capabilities
 * - Feature requirements
 * - Tier ordering
 */

export const TIER_META = {
  community: {
    name: "Community",
    color: "#6b7280",
    price_monthly: 0,
    price_annual: 0,
    seats_included: 1,
    max_seats: 1,
    ingestion_limit: 1000,
    api_limit: 500,
  },
  pro: {
    name: "Pro",
    color: "#00d4ff",
    price_monthly: 99,
    price_annual: 990,
    seats_included: 5,
    max_seats: 25,
    ingestion_limit: 50000,
    api_limit: 10000,
  },
  enterprise: {
    name: "Enterprise",
    color: "#a855f7",
    price_monthly: 499,
    price_annual: 4990,
    seats_included: 25,
    max_seats: Infinity,
    ingestion_limit: Infinity,
    api_limit: Infinity,
  },
  gov: {
    name: "Gov/CI",
    color: "#f59e0b",
    price_monthly: null,
    seats_included: Infinity,
    max_seats: Infinity,
    ingestion_limit: Infinity,
    api_limit: Infinity,
  },
};

export const FEATURE_MIN_TIERS = {
  // Modules
  researcher_mode: "pro",
  scenario_engine: "pro",
  red_blue_cell: "pro",
  compliance_engine: "pro",
  training_portal: "pro",
  data_lake: "pro",
  knowledge_graph: "enterprise",
  briefing_engine: "pro",
  fusion_center: "enterprise",
  // Dashboards
  operator_mode: "pro",
  executive_dashboard: "pro",
  // Agents
  "agent:core": "pro",
  "agent:advanced": "enterprise",
  "agent:premium": "enterprise",
};

export const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

export function meetsMinTier(userTier, requiredTier) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export function getMinTierForFeature(feature) {
  return FEATURE_MIN_TIERS[feature] || "pro";
}