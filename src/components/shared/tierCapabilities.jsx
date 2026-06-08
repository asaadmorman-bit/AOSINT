// SOINT Global Tier Capabilities — single source of truth for all feature gating

export const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

export const TIER_META = {
  community: {
    label: "Community",
    color: "#6b7280",
    accent: "#9ca3af",
    price: "Free Forever",
    badge: "FREE",
    maxAssets: 25,
    dataRetentionDays: 7,
    supportSLA: "Community Forum",
  },
  pro: {
    label: "Pro",
    color: "#00d4ff",
    accent: "#00bfe6",
    price: "$79–$149/user/mo",
    badge: "PRO",
    maxAssets: 250,
    dataRetentionDays: 90,
    supportSLA: "48–72 hr Email SLA",
  },
  enterprise: {
    label: "Enterprise",
    color: "#a855f7",
    accent: "#9333ea",
    price: "$1,200–$3,500/mo",
    badge: "ENTERPRISE",
    maxAssets: Infinity,
    dataRetentionDays: 365,
    supportSLA: "24 hr Priority SLA",
  },
  gov: {
    label: "Gov / CI",
    color: "#f59e0b",
    accent: "#d97706",
    price: "$5,000–$25,000/mo",
    badge: "GOV/CI",
    maxAssets: Infinity,
    dataRetentionDays: 1095,
    supportSLA: "Dedicated Analyst",
  },
};

export const CAPABILITIES = {
  basicOsintFeeds: ["community", "pro", "enterprise", "gov"],
  fullOsintFeeds: ["pro", "enterprise", "gov"],
  customFeedIngestion: ["gov"],
  darkWebMonitoring: ["enterprise", "gov"],
  digitalAssetDiscovery: ["pro", "enterprise", "gov"],
  physicalAssetDiscovery: ["enterprise", "gov"],
  unlimitedAssets: ["enterprise", "gov"],
  basicRiskScoring: ["community", "pro", "enterprise", "gov"],
  dailyRiskScoring: ["pro", "enterprise", "gov"],
  continuousMonitoring: ["enterprise", "gov"],
  weeklyReports: ["community", "pro", "enterprise", "gov"],
  dailyReports: ["pro", "enterprise", "gov"],
  executiveBriefings: ["gov"],
  customDashboards: ["enterprise", "gov"],
  complianceMapping: ["enterprise", "gov"],
  remediationPlaybooks: ["enterprise", "gov"],
  basicRemediation: ["pro", "enterprise", "gov"],
  apiAccess: ["pro", "enterprise", "gov"],
  fullApiAccess: ["enterprise", "gov"],
  siemIntegrations: ["pro", "enterprise", "gov"],
  fullIntegrations: ["enterprise", "gov"],
  multiTeamAdmin: ["enterprise", "gov"],
  adminConsole: ["enterprise", "gov"],
  auditLogs: ["enterprise", "gov"],
  advancedAuditLogs: ["gov"],
  emailSupport: ["pro", "enterprise", "gov"],
  prioritySupport: ["enterprise", "gov"],
  dedicatedSupport: ["gov"],
  supportTicketing: ["pro", "enterprise", "gov"],
  forumAccess: ["community", "pro", "enterprise", "gov"],
  forumPrivateMessages: ["pro", "enterprise", "gov"],
  forumAttachments: ["pro", "enterprise", "gov"],
  sovereignDeployment: ["gov"],
  executiveReportingSuite: ["gov"],
  complianceDocPackage: ["gov"],
};

// All tiers removed during beta — everyone has full access
export function hasCapability(userTier, capability) {
  return true;
}

export function meetsMinTier(userTier, minTier) {
  return true;
}

export function getMinTierForCapability(capability) {
  const allowed = CAPABILITIES[capability] || [];
  if (allowed.length === 0) return "enterprise";
  const minIdx = Math.min(...allowed.map(t => TIER_ORDER.indexOf(t)));
  return TIER_ORDER[minIdx] || "enterprise";
}