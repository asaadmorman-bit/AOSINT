/**
 * SOINT PARTNER PORTAL - INTEGRATION GUIDE
 * 
 * This file documents the Partner Portal architecture, entities, functions,
 * components, and integration patterns for extending the system.
 */

export const PARTNER_GUIDE = {
  // ============================================
  // ARCHITECTURE
  // ============================================

  CORE_ENTITIES: {
    Partner: {
      description: "Organization in the partner ecosystem",
      key_fields: ["partner_type", "tier", "status", "commission_rate_percent", "active_tenant_count", "ytd_revenue_usd"],
      partner_types: ["msp", "systems_integrator", "training", "technology", "government"],
      tiers: ["registered", "silver", "gold", "elite", "gov"],
    },
    PartnerApplication: {
      description: "Manage partner onboarding workflow",
      statuses: ["submitted", "under_review", "kyc_pending", "approved", "rejected"],
    },
    Deal: {
      description: "Track partner-registered opportunities",
      statuses: ["qualified", "in_progress", "approved", "closed_won", "closed_lost"],
    },
    PartnerCertification: {
      description: "Training & certification progress",
      cert_types: ["fundamentals", "fusion_center", "scenario_engine", "red_blue", "compliance", "agent_marketplace", "administrator"],
    },
    PartnerCommission: {
      description: "Revenue sharing & commission management",
      types: ["subscription", "addon", "usage", "msp_revenue_share"],
    },
    PartnerActivity: {
      description: "Audit trail of partner actions",
      activities: ["portal_login", "deal_registered", "deal_approved", "tenant_provisioned", "agent_activated", "addon_purchased", "training_completed", "certification_passed", "scenario_executed", "commission_paid"],
    },
  },

  // ============================================
  // BACKEND FUNCTIONS
  // ============================================

  BACKEND_FUNCTIONS: {
    submitPartnerApplication: {
      purpose: "Submit partner onboarding application",
      required_fields: ["company_name", "partner_type", "primary_contact_email"],
      tier_gating: "None (public)",
      creates: ["Partner", "PartnerApplication", "PartnerActivity"],
    },
    registerDeal: {
      purpose: "Partner registers customer opportunity",
      required_fields: ["partner_id", "opportunity_name", "customer_name"],
      tier_gating: "Silver+",
      creates: ["Deal", "PartnerActivity"],
    },
    approveDeal: {
      purpose: "SOINT admin approves deal & auto-provisions tenant",
      tier_gating: "Admin only",
      creates: ["Tenant", "Subscription", "TenantConfiguration", "PartnerActivity"],
      chains_to: ["createTenant"],
    },
    getPartnerAnalytics: {
      purpose: "Aggregate partner dashboard metrics",
      returns: ["deals", "commissions", "tenants", "certifications", "recent_activity"],
    },
  },

  // ============================================
  // FRONTEND PAGES & COMPONENTS
  // ============================================

  FRONTEND_STRUCTURE: {
    pages: {
      PartnerOnboarding: {
        path: "/partner-onboarding",
        description: "3-step guided application workflow",
        public: true,
      },
      PartnerPortal: {
        path: "/partner-portal",
        description: "Main partner dashboard",
        requires_auth: true,
        tabs: ["Dashboard", "Deal Pipeline", "Analytics", "Training & Certs", "Settings"],
      },
      PartnerAdmin: {
        path: "/partner-admin",
        description: "Internal SOINT administration",
        requires_admin: true,
        tabs: ["Applications", "Active Partners", "Deal Pipeline", "Commissions"],
      },
    },
    components: {
      partner_folder: [
        "PartnerDashboard",
        "DealManagement",
        "DealForm",
        "AnalyticsPanel",
        "CertificationCenter",
        "PartnerSettings",
      ],
    },
  },

  // ============================================
  // TIER CAPABILITIES MATRIX
  // ============================================

  TIER_CAPABILITIES: {
    registered: {
      name: "Registered",
      color: "#6b7280",
      features: ["Portal Access"],
    },
    silver: {
      name: "Silver",
      color: "#64748b",
      features: ["Deal Registration", "Co-selling", "Analytics", "Basic Training"],
    },
    gold: {
      name: "Gold",
      color: "#d97706",
      features: ["Full Deal Management", "Co-marketing Assets", "Advanced Training", "Partner Analytics"],
    },
    elite: {
      name: "Elite",
      color: "#a855f7",
      features: ["Priority Support", "Joint GTM", "Revenue Sharing", "Premium Agents"],
    },
    gov: {
      name: "Gov/CI",
      color: "#f59e0b",
      features: ["Sovereign Deploy", "Extended Audit", "Custom SLAs", "Classified Feeds"],
    },
  },

  // ============================================
  // INTEGRATION PATTERNS
  // ============================================

  INTEGRATION_PATTERNS: {
    MSP_TENANT_PROVISIONING: `
      // Partner (MSP) registers customer
      const deal = await registerDeal({
        partner_id: msp.id,
        customer_name: "Downstream Customer ABC",
        deal_type: "msp_resale",
        ...
      });

      // SOINT approves → auto-provisions tenant
      await approveDeal(deal.id);

      // Tenant is associated with partner for billing & support
    `,

    TIER_GATING: `
      const TIER_ORDER = ["registered", "silver", "gold", "elite", "gov"];
      const FEATURE_TIERS = {
        deal_registration: "silver",
        advanced_training: "gold",
        premium_support: "elite",
      };

      const canAccess = (partner, feature) => {
        return TIER_ORDER.indexOf(partner.tier) >= TIER_ORDER.indexOf(FEATURE_TIERS[feature]);
      };
    `,

    COMMISSION_CALCULATION: `
      const deal = await approveDeal(deal_id);
      const partner = await getPartner(deal.partner_id);

      const commission = {
        partner_id,
        commission_type: "subscription",
        gross_revenue_usd: deal.actual_arr_usd,
        commission_rate_percent: partner.commission_rate_percent,
        commission_amount_usd: (deal.actual_arr_usd * partner.commission_rate_percent) / 100,
        status: "accrued"
      };

      await base44.entities.PartnerCommission.create(commission);
    `,

    ACTIVITY_AUDIT: `
      await base44.entities.PartnerActivity.create({
        partner_id,
        activity_type: "deal_approved",
        actor_email: admin_email,
        resource_type: "Deal",
        resource_id: deal.id,
        details: { deal_id, customer, arr },
        occurred_at: new Date().toISOString()
      });
    `,

    TRAINING_TRACKING: `
      const cert = await base44.entities.PartnerCertification.create({
        partner_id,
        user_email: "partner_user@company.com",
        certification_type: "scenario_engine",
        status: "in_progress"
      });

      // On completion
      await base44.entities.PartnerCertification.update(cert.id, {
        status: "passed",
        passed_date: new Date().toISOString(),
        score: 95,
        expires_date: new Date(Date.now() + 365 * 86400000).toISOString()
      });
    `,
  },

  // ============================================
  // EXTENDING THE SYSTEM
  // ============================================

  EXTENSION_GUIDE: {
    NEW_TIER: [
      "1. Update Partner entity enum",
      "2. Add TIER_ORDER and TIER_META in components",
      "3. Update PartnerAdmin approval workflow",
      "4. Define tier benefits in PartnerDashboard",
      "5. Add tier-specific gating in relevant functions",
    ],

    NEW_DEAL_TYPE: [
      "1. Update Deal.deal_type enum",
      "2. Add type-specific fields to Deal entity",
      "3. Update deal registration form",
      "4. Add approval logic in approveDeal()",
      "5. Update AnalyticsPanel for new type",
    ],

    NEW_CERTIFICATION: [
      "1. Add cert type to PartnerCertification enum",
      "2. Define training modules in Training Portal",
      "3. Create certification requirement UI",
      "4. Add completion tracking",
      "5. Update badge/credential system",
    ],

    NEW_COMMISSION_TYPE: [
      "1. Update PartnerCommission.commission_type enum",
      "2. Create calculation logic based on type",
      "3. Add accrual in relevant functions",
      "4. Update AnalyticsPanel to display",
      "5. Add payment processing for type",
    ],

    AGENT_MARKETPLACE_INTEGRATION: `
      // When partner activates agent for customer
      const agentActivation = await base44.entities.AgentConfig.create({
        agent_id: "agent_xyz",
        tenant_id: customer_tenant_id,
        min_tier: "pro",
        assigned_teams: [customer_team_id],
        enabled_by: partner_admin_email
      });

      // Log activity
      await base44.entities.PartnerActivity.create({
        partner_id,
        activity_type: "agent_activated",
        resource_type: "Agent",
        resource_id: agentActivation.id,
        ...
      });
    `,
  },

  // ============================================
  // SECURITY & GOVERNANCE
  // ============================================

  SECURITY: {
    MULTI_TENANT_ISOLATION: "Partners can only view own deals, tenants, metrics. Tenant data strictly isolated at DB level.",
    AUDIT_LOGGING: "Every action logged to PartnerActivity with actor, timestamp, resource, outcome.",
    RBAC: {
      PartnerAdmin: ["Register deals", "View analytics", "Manage team"],
      PartnerUser: ["View training", "Submit certifications"],
      SointAdmin: ["Approve apps", "Approve deals", "Manage tiers", "Track commissions"],
      SointFinance: ["View statements", "Process payments"],
    },
    COMPLIANCE: [
      "KYC verification required",
      "Compliance checklist: DPA, CoC, Insurance, Security Assessment, MSA",
      "Partner certifications tracked (SOC2, ISO27001, etc.)",
    ],
  },

  // ============================================
  // ROADMAP
  // ============================================

  ROADMAP: {
    PHASE_1: [
      "✓ Partner application & onboarding",
      "✓ Deal registration & approval",
      "✓ Partner analytics",
      "✓ Training & certifications",
      "✓ Tier-based gating",
    ],
    PHASE_2: [
      "Co-selling workflows",
      "Co-marketing asset library",
      "MSP multi-tenant billing",
      "Commission payment automation",
      "Stripe Billing integration",
    ],
    PHASE_3: [
      "White-label partner portal",
      "Partner automation API",
      "Advanced analytics & forecasting",
      "Partner marketplace",
      "Technology partner integrations",
    ],
  },
};

export default PARTNER_GUIDE;