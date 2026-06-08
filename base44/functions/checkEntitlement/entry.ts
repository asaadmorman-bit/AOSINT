import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Entitlement Check Function
 * Validates if a user/tenant has access to a feature based on:
 * - Subscription tier
 * - Active add-ons
 * - Usage limits
 * - Seat count
 * - Compliance frameworks
 */

const TIER_CAPABILITIES = {
  community: {
    dashboards: ["threat_feeds", "indicators"],
    ingestion_limit: 1000, // MB/month
    api_calls: 500,
    graph_queries: 100,
    seats: 1,
    modules: [],
    agents: [],
  },
  pro: {
    dashboards: ["threat_feeds", "indicators", "operator_mode", "executive_dashboard"],
    ingestion_limit: 50000,
    api_calls: 10000,
    graph_queries: 5000,
    seats: 5,
    modules: ["data_lake"],
    agents: ["core"],
  },
  enterprise: {
    dashboards: ["threat_feeds", "indicators", "operator_mode", "executive_dashboard", "fusion_center"],
    ingestion_limit: Infinity,
    api_calls: Infinity,
    graph_queries: Infinity,
    seats: Infinity,
    modules: ["data_lake", "knowledge_graph", "scenario_engine", "briefing_engine", "compliance_engine"],
    agents: ["core", "advanced"],
  },
  gov: {
    dashboards: ["all"],
    ingestion_limit: Infinity,
    api_calls: Infinity,
    graph_queries: Infinity,
    seats: Infinity,
    modules: ["all"],
    agents: ["all"],
  },
};

const ADDON_MAP = {
  researcher_mode: "researcher_mode",
  scenario_engine: "scenario_engine",
  red_blue_cell: "red_blue_cell",
  compliance_engine: "compliance_engine",
  training_portal: "training_portal",
  narrative_intel_agent: "agent:narrative_intel",
  ransomware_ecosystem_agent: "agent:ransomware",
  regional_fragmentation_agent: "agent:fragmentation",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tenant_id, feature, module, event_type, quantity } = body;

    if (!tenant_id || !feature) {
      return Response.json({ error: "Missing tenant_id or feature" }, { status: 400 });
    }

    // All tiers removed — everyone has full access
    return Response.json({ allowed: true, tier: "all_access", feature }, { status: 200 });
  } catch (error) {
    console.error("Entitlement check error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});