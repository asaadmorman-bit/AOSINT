/**
 * SOINT PUBLIC MARKETPLACE & APP STORE - INTEGRATION GUIDE
 * 
 * This guide documents the complete Marketplace architecture, including:
 * - Content types and categories
 * - Developer onboarding workflow
 * - Billing models and entitlements
 * - Installation & management
 * - Security & governance
 * - Extension points
 */

export const MARKETPLACE_GUIDE = {
  // ============================================
  // CORE ENTITIES
  // ============================================

  ENTITIES: {
    App: {
      description: "Marketplace application",
      key_fields: [
        "app_id", "name", "category", "developer_id", "status",
        "tier_required", "pricing_model", "permissions_required"
      ],
      statuses: ["draft", "submitted", "under_review", "approved", "published", "deprecated", "rejected"],
      categories: [
        "integration_connector",
        "analytics_extension",
        "agent_plugin",
        "dashboard_visualization",
        "scenario_template",
        "playbook",
        "compliance_pack",
        "training_module"
      ],
    },

    Developer: {
      description: "App publisher/developer",
      key_fields: ["user_email", "display_name", "status", "tier", "verified"],
      tiers: ["individual", "partner", "enterprise", "government"],
    },

    AppInstallation: {
      description: "App installed on a tenant",
      key_fields: ["app_id", "tenant_id", "status", "version", "configuration"],
      statuses: ["active", "disabled", "suspended", "uninstalled"],
    },

    MarketplaceTransaction: {
      description: "Billing transaction for app",
      types: ["purchase", "subscription_renewal", "usage_charge", "refund", "revenue_share"],
    },

    AppReview: {
      description: "User review (Enterprise+ only)",
      note: "Only enterprise tier or higher can leave reviews",
    },

    AppAuditLog: {
      description: "Audit trail for all app actions",
    },
  },

  // ============================================
  // CONTENT CATEGORIES
  // ============================================

  CATEGORIES: {
    INTEGRATIONS_CONNECTORS: {
      description: "Third-party system integrations",
      examples: [
        "SIEM connectors (Splunk, Sentinel, etc)",
        "SOAR/EDR connectors (CrowdStrike, Palo Alto, etc)",
        "Threat intel feeds (Shodan, Censys, etc)",
        "Physical security feeds",
        "Narrative monitoring feeds",
        "Geopolitical feeds",
        "Social media connectors",
      ],
    },

    ANALYTICS_EXTENSIONS: {
      description: "Custom analytics & models",
      examples: [
        "Fragmentation models",
        "Convergence models",
        "Exposure models",
        "Narrative clustering",
        "Sector-specific analytics",
        "Regional risk models",
      ],
    },

    AGENT_PLUGINS: {
      description: "Specialized agents",
      examples: [
        "Sector agents (Energy, Finance, Healthcare, Gov)",
        "Regional agents",
        "Narrative intelligence agents",
        "Supply chain agents",
        "EP/LEO agents",
      ],
    },

    DASHBOARDS: {
      description: "Custom visualizations & dashboards",
      examples: [
        "Executive dashboards",
        "Sector dashboards",
        "Regional dashboards",
        "Fusion Center extensions",
        "Operator Mode extensions",
      ],
    },

    SCENARIOS: {
      description: "Scenario Engine templates",
      examples: [
        "Fragmentation scenarios",
        "Convergence scenarios",
        "Narrative escalation scenarios",
        "Sector exposure scenarios",
      ],
    },

    PLAYBOOKS: {
      description: "Red/Blue Cell planning templates",
      examples: [
        "Defensive planning templates",
        "Crisis response playbooks",
        "Cross-domain coordination templates",
      ],
    },

    COMPLIANCE_PACKS: {
      description: "Compliance & governance mappings",
      examples: [
        "NIST mappings",
        "ISO mappings",
        "CIS mappings",
        "CJIS mappings",
        "FedRAMP mappings",
        "Sector-specific compliance",
      ],
    },

    TRAINING_MODULES: {
      description: "Training & certification content",
      examples: [
        "Cyber training",
        "Physical security training",
        "EP training",
        "LEO training",
        "Narrative analysis training",
        "Scenario-based training",
      ],
    },
  },

  // ============================================
  // DEVELOPER WORKFLOW
  // ============================================

  DEVELOPER_WORKFLOW: [
    "1. Register as developer (auto-creates Developer profile)",
    "2. Developer account pending approval by SOINT admin",
    "3. Once approved, create new app submission",
    "4. Provide metadata: name, description, category, pricing, permissions",
    "5. App enters 'submitted' status",
    "6. SOINT security team reviews (5-7 business days)",
    "7. Automated security scanning + manual review",
    "8. App approved/rejected with feedback",
    "9. On approval, app published to Marketplace",
    "10. Developers can update versions, track installs/revenue",
  ],

  // ============================================
  // BILLING MODELS
  // ============================================

  BILLING_MODELS: {
    FREE: {
      description: "No cost to install/use",
      example: "Open-source connectors, community training",
    },

    ONE_TIME_PURCHASE: {
      description: "Pay once to install",
      example: "$99 for dashboard template",
      billing_model: "One-time charge when installed",
    },

    SUBSCRIPTION: {
      description: "Monthly/annual recurring charge",
      example: "$29/month for premium feed",
      billing_model: "Subscription_renewal transaction monthly",
      note: "Automatically renewed",
    },

    USAGE_BASED: {
      description: "Pay by usage (API calls, data volume, etc)",
      example: "$0.001 per API call",
      billing_model: "usage_charge transaction based on meter",
      integration: "App reports usage to Marketplace API",
    },

    REVENUE_SHARE: {
      description: "Partner revenue share (for MSPs)",
      example: "Partner gets 30% of customer subscriptions",
      billing_model: "revenue_share transaction monthly",
      integration: "Calculated based on customer subscription tiers",
    },
  },

  // ============================================
  // ENTITLEMENT & PERMISSIONS
  // ============================================

  ENTITLEMENTS: {
    TIER_BASED: "App requires minimum tier (community, pro, enterprise, gov)",
    ADDON_BASED: "App requires specific add-on subscription",
    SEAT_BASED: "Min seat count for installation",
    USAGE_LIMITS: "API calls/month, data ingestion/month, concurrent instances",
    PERMISSION_REQUIRED: "App needs specific permissions (read_indicators, write_reports, etc)",
  },

  TIER_ACCESS: {
    community: [
      "Free apps",
      "Basic integrations",
    ],
    pro: [
      "Subscription apps",
      "Premium feeds",
      "Basic analytics",
    ],
    enterprise: [
      "All above",
      "Advanced analytics",
      "Premium agents",
      "Compliance packs",
      "Custom scenarios",
    ],
    gov: [
      "All above",
      "Sovereign deployment",
      "Custom SLAs",
      "Classified feeds",
    ],
  },

  // ============================================
  // BACKEND FUNCTIONS
  // ============================================

  BACKEND_FUNCTIONS: {
    submitMarketplaceApp: {
      purpose: "Developer submits new app",
      input: ["app_id", "name", "category", "pricing_model", "permissions_required"],
      output: ["app_id", "status", "message"],
      creates: ["App", "AppAuditLog"],
    },

    installApp: {
      purpose: "Tenant installs app",
      input: ["app_id", "tenant_id", "configuration"],
      validation: ["tier_required", "existing_installation"],
      output: ["installation_id", "api_key", "status"],
      creates: ["AppInstallation", "AppAuditLog", "MarketplaceTransaction (if paid)"],
    },

    checkMarketplaceEntitlement: {
      purpose: "Check if tenant entitled to use app",
      input: ["app_id", "tenant_id"],
      checks: ["tier", "installation_status", "usage_limits", "billing_status"],
      output: ["entitled: true/false", "reason_if_not"],
    },
  },

  // ============================================
  // FRONTEND PAGES
  // ============================================

  PAGES: {
    Marketplace: {
      path: "/marketplace",
      description: "App store home - browse, search, filter apps",
      features: ["Search", "Category filter", "Sort (popular/newest/rating)", "App cards with ratings"],
    },

    MarketplaceAppDetail: {
      path: "/marketplace-app-detail?app_id=:app_id",
      description: "App detail page",
      features: ["App description", "Permissions required", "Pricing info", "Reviews", "Install button"],
    },

    DeveloperDashboard: {
      path: "/developer-dashboard",
      description: "Developer portal",
      features: ["App management", "Submit new app", "Revenue tracking", "Installation stats"],
    },

    MyApps: {
      path: "/my-apps",
      description: "Tenant's installed apps",
      features: ["List of installed apps", "Health status", "Usage metrics", "Uninstall option"],
    },
  },

  // ============================================
  // SECURITY & GOVERNANCE
  // ============================================

  SECURITY: {
    MULTI_TENANT_ISOLATION: "Each app installation is isolated per tenant",
    API_KEY_MANAGEMENT: "Each installation gets unique API key",
    AUDIT_LOGGING: "All app actions logged to AppAuditLog",
    PERMISSION_ENFORCEMENT: "Apps only get permissions they request",
    BILLING_PROTECTION: "Failed payments disable app automatically",
    SANDBOX_TESTING: "All apps tested in sandbox before publish",
    SECURITY_REVIEW: "All apps undergo manual security review",
    COMPLIANCE_MAPPING: "Apps document compliance frameworks (SOC2, ISO, etc)",
  },

  // ============================================
  // MONITORING & HEALTH CHECKS
  // ============================================

  HEALTH_CHECKS: [
    "App API response time",
    "App error rate",
    "App data freshness",
    "Usage trending",
    "Billing reconciliation",
    "Permission audits",
  ],

  // ============================================
  // EXTENDING THE MARKETPLACE
  // ============================================

  EXTENSIONS: {
    ADD_NEW_CATEGORY: [
      "1. Update App.category enum",
      "2. Update CATEGORIES in MarketplaceGuide",
      "3. Add category to filter options in Marketplace page",
      "4. Define category-specific metadata schema",
      "5. Add security/compliance requirements for category",
    ],

    ADD_NEW_PRICING_MODEL: [
      "1. Update App.pricing_model enum",
      "2. Update MarketplaceTransaction.transaction_type enum",
      "3. Create calculation logic in billing service",
      "4. Update transaction creation in installApp",
      "5. Add payout logic for developers",
    ],

    ADD_NEW_ENTITLEMENT_TYPE: [
      "1. Update App entity with new entitlement field",
      "2. Add validation in installApp function",
      "3. Update checkMarketplaceEntitlement logic",
      "4. Add entitlement check in app initialization",
      "5. Document in integration guide",
    ],

    INTEGRATE_WITH_BILLING: `
      // When app installed
      await base44.entities.MarketplaceTransaction.create({
        app_id,
        tenant_id,
        developer_id: app.developer_id,
        transaction_type: app.pricing_model === 'subscription' ? 'subscription_renewal' : 'purchase',
        amount_usd: app.price_usd,
        status: 'pending'
      });

      // Billing service processes transaction
      // On success: MarketplaceTransaction.status = 'completed'
      // On failure: AppInstallation.billing_status = 'past_due'
      // App disabled after X days past due
    `,

    INTEGRATE_WITH_AGENTS: `
      // When agent plugin installed
      const app = await base44.entities.App.filter({
        app_id,
        category: 'agent_plugin'
      });

      // Register agent with Agent Marketplace
      await base44.agents.registerMarketplaceAgent({
        agent_id: app.app_id,
        tenant_id,
        installation_id: installation.id,
        min_tier: app.tier_required
      });

      // Agent now available in tenant's Agent Marketplace
    `,

    INTEGRATE_WITH_SCENARIOS: `
      // When scenario template installed
      const app = await base44.entities.App.filter({
        app_id,
        category: 'scenario_template'
      });

      // Import template into Scenario Engine
      await base44.scenarios.importTemplate({
        tenant_id,
        template_url: app.metadata.template_url,
        template_name: app.name,
        installation_id: installation.id
      });
    `,
  },

  // ============================================
  // ROADMAP
  // ============================================

  ROADMAP: {
    PHASE_1: [
      "✓ App submission & approval workflow",
      "✓ App installation & management",
      "✓ Basic billing integration (one-time, subscription)",
      "✓ Marketplace browsing & search",
      "✓ Developer dashboard",
      "✓ Entitlement checking",
    ],

    PHASE_2: [
      "✓ Usage-based billing",
      "✓ App reviews (Enterprise+ only)",
      "✓ Revenue share for partners",
      "✓ App analytics for developers",
      "✓ Category-specific schemas",
      "✓ App versioning & updates",
    ],

    PHASE_3: [
      "App marketplace API for partners",
      "White-label marketplace",
      "Advanced app analytics",
      "App recommendation engine",
      "Developer reputation system",
      "Automated compliance scanning",
      "App sandboxing improvements",
    ],
  },
};

export default MARKETPLACE_GUIDE;