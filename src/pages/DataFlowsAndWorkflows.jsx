import React, { useState } from "react";
import { ArrowRight, Users, Database, Zap, Shield, CheckCircle2, ChevronDown } from "lucide-react";

const DATA_FLOW_STAGES = [
  {
    stage: 1,
    name: "Ingestion & Normalization",
    icon: "📥",
    description: "Signals enter through streaming and batch pipelines",
    details: [
      "Multi-format signal ingestion (cyber, physical, influence, geopolitical)",
      "Unified schema normalization",
      "Metadata tagging and source validation",
      "Timestamp alignment and data quality scoring",
      "Streaming and batch processing support",
    ],
    output: "Normalized signal dataset",
  },
  {
    stage: 2,
    name: "Enrichment & Correlation",
    icon: "🔗",
    description: "Cross-domain pattern detection and context addition",
    details: [
      "Geospatial context enrichment",
      "Entity attribute population",
      "Cross-source metadata linking",
      "Domain-specific correlation logic",
      "Pattern detection across domains",
      "Cyber ↔ Physical ↔ Influence connections",
    ],
    output: "Enriched, correlated event dataset",
  },
  {
    stage: 3,
    name: "Knowledge Graph Integration",
    icon: "🕸️",
    description: "Semantic layer with entities and relationships",
    details: [
      "Entity resolution across sources",
      "Relationship inference using graph algorithms",
      "Temporal connection mapping",
      "Geospatial relationship establishment",
      "Cross-domain entity linking",
      "Influence pathway inference",
    ],
    output: "Semantic knowledge graph",
  },
  {
    stage: 4,
    name: "Analytics & Scoring",
    icon: "📊",
    description: "Insights, risk scores, and predictive modeling",
    details: [
      "Multi-domain risk scoring",
      "Anomaly detection (statistical + behavioral)",
      "Narrative propagation modeling",
      "Sector exposure analysis",
      "Time-series forecasting",
      "Convergence & fragmentation indices",
    ],
    output: "Analytics outputs and dashboards",
  },
  {
    stage: 5,
    name: "Module Consumption",
    icon: "⚙️",
    description: "Modules use outputs to support user workflows",
    details: [
      "Global Threat Observatory visualization",
      "Fusion Center triage and investigation",
      "Scenario Engine escalation modeling",
      "Red/Blue Cell adversarial simulation",
      "Compliance Engine control mapping",
      "Executive Briefing generation",
    ],
    output: "User-facing intelligence products",
  },
  {
    stage: 6,
    name: "Storage & Retention",
    icon: "💾",
    description: "Tiered storage with retention policies",
    details: [
      "Raw data in Data Lake (immutable audit trail)",
      "Enriched data in optimized storage",
      "Analytical results cached for performance",
      "Knowledge graph in graph database",
      "Tiered retention by tenant level",
      "Per-tenant encryption with rotation",
    ],
    output: "Persistent, auditable data repository",
  },
];

const MODULE_INTERACTIONS = [
  {
    module: "ASOSINT Global Threat Observatory",
    purpose: "Global risk and narrative awareness",
    inputs: ["Analytics engine outputs", "Knowledge graph data", "Real-time signals"],
    outputs: ["Global threat map", "Narrative clusters", "Sector exposure", "Early-warning indicators"],
    integrations: ["Feeds to Executive Briefing Engine", "Provides context to Scenario Engine"],
  },
  {
    module: "ASOSINT Fusion Center",
    purpose: "Analyst triage and investigation",
    inputs: ["Correlated events", "Knowledge graph context", "Enriched signals"],
    outputs: ["Verified intelligence", "Case investigations", "Analyst reports"],
    integrations: ["Consumes Intelligence Fabric outputs", "Pushes findings to knowledge graph"],
  },
  {
    module: "ASOSINT Scenario Engine",
    purpose: "Escalation modeling and forecasting",
    inputs: ["Graph relationships", "Historical patterns", "Analytics outputs"],
    outputs: ["Scenario models", "Escalation pathways", "Implications analysis"],
    integrations: ["Uses Red/Blue Cell tactics", "Feeds to Executive Briefing Engine"],
  },
  {
    module: "ASOSINT Red/Blue Cell Module",
    purpose: "Adversarial simulation and planning",
    inputs: ["Scenario models", "Threat actor profiles", "Defense capabilities"],
    outputs: ["Attack simulations", "Defense gaps", "Capability assessments"],
    integrations: ["Consumes Scenario Engine outputs", "Informs compliance mappings"],
  },
  {
    module: "ASOSINT Compliance & Governance Engine",
    purpose: "Policy alignment and audit",
    inputs: ["Audit logs", "Access patterns", "Data retention metadata"],
    outputs: ["Compliance reports", "Control mappings", "Policy enforcement"],
    integrations: ["Monitors all layers", "Feeds to observability dashboards"],
  },
  {
    module: "ASOSINT Executive Briefing Engine",
    purpose: "Decision-grade intelligence summaries",
    inputs: ["Analytics outputs", "Scenario results", "Narrative clusters"],
    outputs: ["Automated briefs", "Risk summaries", "Strategic recommendations"],
    integrations: ["Synthesizes from Global Observatory", "Uses Scenario Engine insights"],
  },
  {
    module: "ASOSINT Partner Portal & Marketplace",
    purpose: "Ecosystem management and integrations",
    inputs: ["Partner connectors", "Third-party data", "Extension requests"],
    outputs: ["Integration management", "Revenue sharing", "Extension deployment"],
    integrations: ["API gateway", "SDKs", "Tenant configuration"],
  },
];

const ROLE_WORKFLOWS = [
  {
    role: "Analysts",
    icon: Users,
    color: "#00d4ff",
    description: "Triage, investigation, and intelligence reporting",
    responsibilities: [
      "Review and triage incoming signals",
      "Investigate correlations across domains",
      "Develop intelligence products",
      "Update knowledge graph with findings",
      "Generate analyst reports and briefings",
    ],
    primaryModules: [
      "Fusion Center (main workspace)",
      "Global Threat Observatory (situational awareness)",
      "Scenario Engine (implications analysis)",
    ],
    dataFlowFocus: "Ingestion → Enrichment → Correlation → Knowledge Graph → Module consumption",
    keyMetrics: ["Case resolution time", "Investigation accuracy", "Report timeliness"],
  },
  {
    role: "Engineers",
    icon: Zap,
    color: "#2ed573",
    description: "System integration, data pipelines, and operations",
    responsibilities: [
      "Design and maintain data ingestion pipelines",
      "Configure tenant environments and settings",
      "Manage API integrations and connectors",
      "Monitor system health and performance",
      "Support third-party integrations",
    ],
    primaryModules: [
      "API Gateway & SDKs",
      "Partner Portal (integration management)",
      "Compliance Engine (audit monitoring)",
    ],
    dataFlowFocus: "Ingestion infrastructure → Normalization → Storage architecture",
    keyMetrics: ["Pipeline uptime", "Data quality scores", "Integration success rate"],
  },
  {
    role: "Architects",
    icon: Shield,
    color: "#a855f7",
    description: "System design, optimization, and strategic planning",
    responsibilities: [
      "Design multi-module workflows",
      "Map data flow dependencies",
      "Optimize performance and scalability",
      "Plan multi-tenant isolation strategies",
      "Review governance and compliance frameworks",
    ],
    primaryModules: [
      "Master Blueprint documentation",
      "Governance & Compliance Engine",
      "All layers (architectural view)",
    ],
    dataFlowFocus: "End-to-end data lineage → Cross-module dependencies → Multi-tenant isolation",
    keyMetrics: ["System latency", "Scalability", "Compliance alignment"],
  },
  {
    role: "Leadership",
    icon: Users,
    color: "#ffa502",
    description: "Strategic decision-making and risk management",
    responsibilities: [
      "Review high-level risk assessments",
      "Make resource allocation decisions",
      "Assess scenario implications",
      "Monitor organizational resilience",
      "Plan strategic initiatives",
    ],
    primaryModules: [
      "Executive Briefing Engine (primary)",
      "Global Threat Observatory (dashboards)",
      "Scenario Engine (strategic planning)",
    ],
    dataFlowFocus: "Analytics outputs → Briefing generation → Executive summary",
    keyMetrics: ["Risk scores", "Scenario coverage", "Decision impact"],
  },
  {
    role: "Partners",
    icon: Users,
    color: "#ff4757",
    description: "Integration, certification, and ecosystem participation",
    responsibilities: [
      "Onboard data sources and tools",
      "Develop and certify extensions",
      "Manage revenue sharing arrangements",
      "Support mutual customer success",
      "Contribute to ecosystem",
    ],
    primaryModules: [
      "Partner Portal (primary)",
      "Marketplace (extension management)",
      "API Gateway & SDKs (integration)",
    ],
    dataFlowFocus: "Third-party data → Ingestion pipelines → Module integration",
    keyMetrics: ["Partner uptime", "Integration adoption", "Revenue impact"],
  },
];

export default function DataFlowsAndWorkflows() {
  const [expandedStage, setExpandedStage] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-4">ASOSINT Data Flows & Workflows</h1>
          <p className="text-gray-400 max-w-3xl">
            How information moves through ASOSINT, how modules collaborate, and how different user roles experience the platform.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* DATA FLOWS */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-12">Data Flow Pipeline</h2>
          <p className="text-gray-400 mb-8">Raw signals progress through 6 stages, each adding structure, context, and value:</p>

          <div className="space-y-4">
            {DATA_FLOW_STAGES.map((flow, i) => (
              <button
                key={i}
                onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                className="w-full text-left"
              >
                <div className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{flow.icon}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#00d4ff]/20 text-[#00d4ff]">
                            Stage {flow.stage}
                          </span>
                          <h3 className="text-lg font-bold text-white">{flow.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{flow.description}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedStage === i ? "rotate-180" : ""}`} />
                  </div>

                  {expandedStage === i && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Process Details</h4>
                      <ul className="space-y-2 mb-6">
                        {flow.details.map((detail, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Output</p>
                        <p className="text-sm text-gray-300 font-mono">{flow.output}</p>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Visual flow */}
          <div className="mt-12 bg-[#111827] border border-white/5 rounded-lg p-8">
            <p className="text-sm font-bold text-gray-400 uppercase mb-6">Data Flow Progression</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {["Raw Signals", "Normalized", "Enriched", "Correlated", "Knowledge Graph", "Analytics", "Modules", "Storage"].map((stage, i) => (
                <React.Fragment key={i}>
                  <div className="px-3 py-1.5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] font-mono text-xs font-bold">
                    {stage}
                  </div>
                  {i < 7 && <ArrowRight className="w-4 h-4 text-gray-600" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* MODULE INTERACTIONS */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Module Interactions</h2>
          <p className="text-gray-400 mb-8">Modules are independent but interconnected, sharing intelligence through the fabric and analytics layers:</p>

          <div className="grid gap-6">
            {MODULE_INTERACTIONS.map((mod, i) => (
              <button
                key={i}
                onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                className="w-full text-left"
              >
                <div className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{mod.module}</h3>
                      <p className="text-sm text-gray-400">{mod.purpose}</p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${expandedModule === i ? "rotate-180" : ""}`} />
                  </div>

                  {expandedModule === i && (
                    <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Inputs</h4>
                        <ul className="space-y-2">
                          {mod.inputs.map((input, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="w-1 h-1 rounded-full bg-[#2ed573] mt-1.5" />
                              {input}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Outputs</h4>
                        <ul className="space-y-2">
                          {mod.outputs.map((output, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="w-1 h-1 rounded-full bg-[#ffa502] mt-1.5" />
                              {output}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Module Integrations</h4>
                        <p className="text-sm text-gray-300">{mod.integrations.join(" • ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ROLE-SPECIFIC WORKFLOWS */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">Role-Specific Workflows</h2>
          <p className="text-gray-400 mb-8">Different user roles interact with ASOSINT in distinct ways:</p>

          <div className="grid gap-6">
            {ROLE_WORKFLOWS.map((role, i) => {
              const Icon = role.icon;
              return (
                <button
                  key={i}
                  onClick={() => setExpandedRole(expandedRole === i ? null : i)}
                  className="w-full text-left"
                >
                  <div className={`border rounded-lg p-6 transition-all ${expandedRole === i ? "border-[#00d4ff] bg-[#00d4ff]/10" : "border-white/5 bg-[#111827] hover:border-white/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${role.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: role.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{role.role}</h3>
                          <p className="text-sm text-gray-400">{role.description}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${expandedRole === i ? "rotate-180" : ""}`} />
                    </div>

                    {expandedRole === i && (
                      <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Responsibilities</h4>
                          <ul className="space-y-2">
                            {role.responsibilities.map((resp, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                                {resp}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Primary Modules</h4>
                          <ul className="space-y-2">
                            {role.primaryModules.map((mod, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: role.color }} />
                                {mod}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Data Flow Focus</p>
                          <p className="text-sm text-gray-300 font-mono">{role.dataFlowFocus}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Key Metrics</h4>
                          <div className="flex flex-wrap gap-2">
                            {role.keyMetrics.map((metric, j) => (
                              <span key={j} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/10">
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Additional Depth */}
        <section className="bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Additional Depth Areas</h2>
          <p className="text-gray-400 mb-6">
            These foundational flows support deeper modeling and operational readiness:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "End-to-end data lineage tracking",
              "Cross-module dependency mapping",
              "Role-based access patterns",
              "Multi-tenant data isolation flows",
              "Integration lifecycle diagrams",
              "Scenario modeling logic",
              "Narrative propagation algorithms",
              "Escalation pathway analysis",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Support */}
        <section className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Implementation Support</h2>
          <p className="text-gray-400 mb-6">
            For detailed data lineage diagrams, role-based access matrices, and workflow automation guides:
          </p>
          <a href="mailto:info@eds-360.com" className="inline-flex items-center gap-2 text-[#00d4ff] font-bold hover:underline">
            info@eds-360.com
          </a>
        </section>
      </div>
    </div>
  );
}