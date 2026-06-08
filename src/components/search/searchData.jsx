/**
 * Global Search Index
 * Contains all searchable content across the platform
 */

export const SEARCH_INDEX = [
  // Pages
  {
    id: "page_home",
    title: "Homepage",
    description: "ASOSINT — The Future of Asaad & Shauntze's Open‑Sourced Intelligence",
    type: "page",
    page: "Homepage",
    priority: 1,
  },
  {
    id: "page_pricing",
    title: "Pricing",
    description: "View pricing tiers and subscription options",
    type: "page",
    page: "Pricing",
    priority: 1,
  },
  {
    id: "page_why_asoint",
    title: "Why ASOINT Exists",
    description: "Learn about the challenges ASOINT solves",
    type: "page",
    page: "WhyAsoint",
    priority: 1,
  },
  {
    id: "page_dashboard",
    title: "Dashboard",
    description: "Main command center for intelligence operations",
    type: "page",
    page: "Dashboard",
    priority: 2,
  },
  {
    id: "page_forum",
    title: "Community Forum",
    description: "Discuss with other ASOINT users",
    type: "page",
    page: "Forum",
    priority: 2,
  },

  // Modules
  {
    id: "module_observatory",
    title: "Global Threat Observatory",
    description: "Real-time, multi-domain threat intelligence and observations",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_fusion",
    title: "Fusion Center",
    description: "Unified intelligence analysis and correlation across domains",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_scenario",
    title: "Scenario Engine",
    description: "Strategic forecasting and threat escalation planning",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_redblue",
    title: "Red/Blue Cell Module",
    description: "Adversary simulation and defensive wargaming",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_compliance",
    title: "Compliance & Governance",
    description: "Policy, oversight, and regulatory alignment",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_training",
    title: "Training Portal",
    description: "Role-based learning and certification programs",
    type: "module",
    page: "Dashboard",
    priority: 3,
  },
  {
    id: "module_agents",
    title: "Agent Marketplace",
    description: "Specialized AI agents for threat analysis and forecasting",
    type: "module",
    page: "AgentMarketplace",
    priority: 3,
  },
  {
    id: "module_program",
    title: "Intelligence Program Builder",
    description: "Design full-spectrum intelligence operations and governance",
    type: "module",
    page: "ProgramBuilder",
    priority: 3,
  },

  // Resources
  {
    id: "resource_docs",
    title: "Documentation",
    description: "Complete API and user documentation",
    type: "resource",
    category: "docs",
    priority: 2,
  },
  {
    id: "resource_whitepaper",
    title: "ASOSINT Whitepaper",
    description: "Technical architecture and design principles",
    type: "resource",
    category: "whitepaper",
    priority: 2,
  },
  {
    id: "resource_case_study",
    title: "Case Studies",
    description: "Real-world deployments and results",
    type: "resource",
    category: "case_study",
    priority: 2,
  },
  {
    id: "resource_blog",
    title: "Blog",
    description: "Latest news, updates, and intelligence insights",
    type: "resource",
    category: "blog",
    priority: 2,
  },

  // Key Features
  {
    id: "feature_tier_gating",
    title: "Tier Gating",
    description: "Different subscription tiers unlock different modules and features",
    type: "feature",
    priority: 4,
  },
  {
    id: "feature_multi_domain",
    title: "Multi-Domain Intelligence",
    description: "Unified view of cyber, physical, influence, and geopolitical threats",
    type: "feature",
    priority: 4,
  },
  {
    id: "feature_real_time",
    title: "Real-Time Threat Intelligence",
    description: "Live threat feeds and indicator updates",
    type: "feature",
    priority: 4,
  },
  {
    id: "feature_api",
    title: "API Access",
    description: "Integrate ASOINT with your existing tools via REST API",
    type: "feature",
    priority: 4,
  },

  // Support
  {
    id: "support_community",
    title: "Community Support",
    description: "Get help from the community forum",
    type: "support",
    page: "Forum",
    priority: 2,
  },
  {
    id: "support_tickets",
    title: "Support Tickets",
    description: "Submit support tickets for paid tiers",
    type: "support",
    page: "Support",
    priority: 2,
  },
];

/**
 * Search the index with basic text matching and prioritization
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Array} Prioritized search results
 */
export function searchContent(query, limit = 8) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const queryTerms = normalizedQuery.split(/\s+/);

  const results = SEARCH_INDEX.map(item => {
    // Calculate relevance score
    let score = 0;

    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const allText = `${title} ${description}`;

    // Exact title match (highest priority)
    if (title === normalizedQuery) {
      score += 1000;
    }

    // Title contains query (high priority)
    if (title.includes(normalizedQuery)) {
      score += 500;
    }

    // Each term match in title
    queryTerms.forEach(term => {
      if (title.includes(term)) {
        score += 100;
      }
    });

    // Description contains query (medium priority)
    if (description.includes(normalizedQuery)) {
      score += 150;
    }

    // Each term match in description
    queryTerms.forEach(term => {
      if (description.includes(term)) {
        score += 25;
      }
    });

    // Apply type-based priority boost
    const typePriority = {
      page: 50,
      module: 40,
      resource: 30,
      feature: 20,
      support: 10,
    };
    score += (typePriority[item.type] || 0);

    // Apply item priority as tiebreaker
    score += item.priority * 5;

    return { ...item, score };
  })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

/**
 * Get type badge color
 */
export function getTypeBadgeColor(type) {
  const colors = {
    page: "#00d4ff",
    module: "#a855f7",
    resource: "#2ed573",
    feature: "#ffa502",
    support: "#ff4757",
  };
  return colors[type] || "#6b7280";
}

/**
 * Get type label
 */
export function getTypeLabel(type) {
  const labels = {
    page: "Page",
    module: "Module",
    resource: "Resource",
    feature: "Feature",
    support: "Support",
  };
  return labels[type] || type;
}