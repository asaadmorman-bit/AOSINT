import React, { useState } from "react";
import { Shield, Layers, Database, Network, Zap, Lock, CheckCircle2, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLUEPRINT_SECTIONS = [
  {
    id: 1,
    title: "Identity & Access Layer",
    subtitle: "Zero Trust Architecture",
    icon: Lock,
    color: "#ff4757",
    description: "Per-request authentication, multi-tenant RBAC/ABAC, device trust scoring, and partner federation.",
    components: [
      { name: "ASOSINT Identity Provider (IdP)", desc: "Centralized auth with SAML/OIDC federation" },
      { name: "Multi-tenant RBAC & ABAC", desc: "Role and attribute-based access control per tenant" },
      { name: "Tier Gating Engine", desc: "Community/Pro/Enterprise/Gov tier access control" },
      { name: "Device Trust Scoring", desc: "Continuous device posture validation" },
      { name: "Session Isolation", desc: "Per-session encryption and audit trails" },
      { name: "JIT Privilege Elevation", desc: "Just-in-time escalation with approval workflows" },
    ],
    principles: [
      "Never trust, always verify",
      "Assume breach",
      "Enforce least privilege",
      "Validate every request",
      "Encrypt everything",
      "Monitor continuously",
    ],
  },
  {
    id: 2,
    title: "Multi-Tenant Core Platform",
    subtitle: "Tenant Provisioning & Management",
    icon: Layers,
    color: "#00d4ff",
    description: "Tenant provisioning, billing, feature flags, and per-tenant isolation at compute, network, and data layers.",
    components: [
      { name: "Tenant Provisioning Service", desc: "Automated tenant lifecycle from creation to archival" },
      { name: "Tenant Configuration Registry", desc: "Per-tenant settings, branding, and feature flags" },
      { name: "Billing & Subscription Engine", desc: "Usage metering, invoice generation, tier management" },
      { name: "Feature Flag Service", desc: "Canary releases and per-tenant feature control" },
      { name: "Multi-Tenant API Gateway", desc: "Rate limiting, routing, and request isolation" },
      { name: "Per-Tenant Encryption Manager", desc: "Key rotation and data encryption per tenant" },
    ],
    lifecycle: [
      "Provision tenant with tier assignment",
      "Configure modules and integrations",
      "Monitor usage and performance",
      "Manage billing and renewals",
      "Archive or deactivate on end-of-life",
    ],
  },
  {
    id: 3,
    title: "Intelligence Fabric Layer",
    subtitle: "Multi-Domain Signal Fusion & Analytics",
    icon: Network,
    color: "#a855f7",
    description: "The analytical core that transforms raw signals into structured intelligence through correlation, enrichment, and narrative analysis.",
    components: [
      { name: "Signal Ingestion Engine", desc: "Multi-format ingestion: cyber, physical, influence, geopolitical" },
      { name: "Normalization & Enrichment", desc: "Entity resolution, metadata tagging, data quality scoring" },
      { name: "Correlation Engine", desc: "Cross-domain pattern detection and event linking" },
      { name: "Narrative Clustering", desc: "Influence operation detection and information cascade modeling" },
      { name: "Escalation Modeling", desc: "Probabilistic pathway analysis and scenario logic" },
      { name: "Threat Convergence Engine", desc: "Multi-domain risk aggregation and convergence scoring" },
    ],
    capabilities: [
      "Ingests signals from all domains",
      "Detects cross-domain patterns",
      "Clusters narratives automatically",
      "Models escalation pathways",
      "Identifies early-warning indicators",
      "Supports real-time decision-making",
    ],
  },
  {
    id: 4,
    title: "Data & Analytics Layer",
    subtitle: "Data Lake, Knowledge Graph & Analytics",
    icon: Database,
    color: "#2ed573",
    description: "Long-term multi-format storage, semantic entity/relationship modeling, and computational analytics engine.",
    subsections: [
      {
        name: "Data Lake",
        desc: "Schema-on-read, multi-format storage with immutable audit trails",
        stores: [
          "OSINT feeds and threat intelligence",
          "Partner data and integrations",
          "Internal telemetry and metrics",
          "Narrative clusters and analysis",
          "Threat indicators and TTPs",
          "Geospatial layers and basemaps",
          "Time-series events and timelines",
        ],
        features: ["Tiered retention", "Per-tenant encryption", "Immutable audit log", "Schema flexibility"],
      },
      {
        name: "Knowledge Graph",
        desc: "Semantic layer for entities, relationships, and contextual understanding",
        models: [
          "People, organizations, infrastructure",
          "Events, narratives, indicators",
          "Influence pathways and behaviors",
          "Temporal and geospatial connections",
        ],
        capabilities: ["Entity resolution", "Relationship inference", "Cross-domain linking", "Contextual enrichment"],
      },
      {
        name: "Analytics Engine",
        desc: "Computational layer for insights, scoring, and predictive modeling",
        functions: [
          "Risk scoring (multi-domain aggregation)",
          "Anomaly detection (statistical + behavioral)",
          "Narrative propagation modeling",
          "Sector exposure analysis",
          "Time-series forecasting",
          "Convergence & fragmentation indices",
        ],
        modes: ["Real-time streaming", "Batch processing", "Predictive analytics"],
      },
    ],
  },
  {
    id: 5,
    title: "Application Modules Layer",
    subtitle: "User-Facing Intelligence Tools",
    icon: Zap,
    color: "#ffa502",
    description: "Specialized interfaces that translate intelligence capabilities into practical tools for analysts, executives, and partners.",
    modules: [
      {
        name: "ASOSINT Global Threat Observatory",
        purpose: "Global risk and narrative awareness",
        features: ["Real-time threat map", "Fragmentation index", "Convergence scoring", "Early-warning indicators"],
      },
      {
        name: "ASOSINT Fusion Center",
        purpose: "Analyst workflows and signal triage",
        features: ["Signal triage interface", "Verification workflows", "Correlation explorer", "Case management"],
      },
      {
        name: "ASOSINT Scenario Engine",
        purpose: "Escalation modeling and forecasting",
        features: ["Scenario builder", "Red/Blue integration", "After-action reporting", "Implications analysis"],
      },
      {
        name: "ASOSINT Red/Blue Cell Module",
        purpose: "Adversarial simulation and planning",
        features: ["Playbook library", "Simulation runner", "Defense gap analysis", "Capability modeling"],
      },
      {
        name: "ASOSINT Certification Engine",
        purpose: "Role-based training and validation",
        features: ["Multi-level certs", "Hands-on labs", "Exams & assessments", "Digital badging"],
      },
      {
        name: "ASOSINT Executive Briefing Engine",
        purpose: "Decision-grade summaries",
        features: ["Auto-generated briefs", "Risk summaries", "Scenario implications", "PDF/HTML export"],
      },
      {
        name: "ASOSINT Compliance & Governance Engine",
        purpose: "Policy and audit alignment",
        features: ["Control mapping", "Compliance workflows", "Audit evidence", "Policy management"],
      },
      {
        name: "ASOSINT Partner Portal",
        purpose: "Ecosystem and integrations",
        features: ["MSP management", "API documentation", "Revenue dashboard", "Support portal"],
      },
    ],
  },
  {
    id: 6,
    title: "Integration & Partner Ecosystem",
    subtitle: "APIs, Connectors & Marketplace",
    icon: Network,
    color: "#00d4ff",
    description: "External connectivity layer enabling ASOSINT to integrate with security, intelligence, and operational ecosystems.",
    components: [
      { name: "API Gateway", desc: "RESTful + GraphQL endpoints with rate limiting and authentication" },
      { name: "Webhooks", desc: "Event-driven integrations with signature verification" },
      { name: "SDKs", desc: "Python, JavaScript/TypeScript, Go, Java SDKs" },
      { name: "Data Connectors", desc: "Pre-built connectors for SIEM, threat intel, cloud platforms" },
      { name: "Marketplace Extensions", desc: "Third-party apps and integrations" },
      { name: "MSP Management", desc: "Multi-tenant control plane for managed service providers" },
    ],
    capabilities: [
      "Multi-domain data ingestion",
      "Real-time event streaming",
      "Tenant isolation in integrations",
      "Revenue sharing for partners",
      "Government partner enclaves",
    ],
  },
  {
    id: 7,
    title: "Governance, Compliance & Observability",
    subtitle: "Audit, Monitoring & Regulatory Alignment",
    icon: Shield,
    color: "#ff4757",
    description: "Platform trustworthiness, auditability, and alignment with enterprise and government frameworks.",
    components: [
      { name: "Immutable Audit Logging", desc: "Per-request, per-tenant, cryptographically signed logs" },
      { name: "SIEM Integration", desc: "Real-time security event export to Splunk, ELK, QRadar" },
      { name: "Monitoring Dashboards", desc: "Platform health, performance, and security metrics" },
      { name: "Compliance Mapping", desc: "NIST, ISO 27001, RMF, FedRAMP alignment" },
      { name: "Policy Lifecycle Management", desc: "Version control, approval workflows, enforcement" },
      { name: "Data Retention Controls", desc: "Tenant-specific and regulatory-driven retention policies" },
    ],
    capabilities: [
      "Immutable evidence trails for audits",
      "Control traceability and testing",
      "Automated compliance workflows",
      "Real-time security monitoring",
      "Alerting on anomalies and violations",
    ],
  },
];

export default function MasterBlueprint() {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-16 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl font-black text-white">ASOSINT Master Blueprint</h1>
          </div>
          <p className="text-gray-400 max-w-3xl mb-6">
            A unified, defensively oriented intelligence ecosystem integrating cyber, physical, influence, geopolitical, and protective intelligence. Built by Asaad & Shauntze Morman for Emerging Defense Solutions.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="px-3 py-1.5 rounded-full bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-xs font-bold text-[#00d4ff]">
              Production-Grade
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#a855f7]/20 border border-[#a855f7]/30 text-xs font-bold text-[#a855f7]">
              Multi-Tenant
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#2ed573]/20 border border-[#2ed573]/30 text-xs font-bold text-[#2ed573]">
              Zero-Trust
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#ff4757]/20 border border-[#ff4757]/30 text-xs font-bold text-[#ff4757]">
              Government-Ready
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Mission */}
        <section className="mb-20 bg-[#111827] border border-white/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Mission & Purpose</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-white mb-3 text-lg">Mission</h3>
              <p className="text-gray-300 mb-4">
                Provide a unified intelligence platform that fuses multi-domain signals, detects early-warning indicators, maps narrative propagation, models escalation pathways, and supports real-time decision-making to strengthen community and organizational resilience.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3 text-lg">Purpose</h3>
              <p className="text-gray-300">
                Give people the intelligence foundation they deserve — whether they are analysts, dispatchers, cyber defenders, EP teams, executives, or community leaders facing fragmented threat landscapes, information overload, and accelerating threat convergence.
              </p>
            </div>
          </div>
        </section>

        {/* 7 Layers */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8">7-Layer Architecture</h2>
          <div className="space-y-6">
            {BLUEPRINT_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full text-left"
                >
                  <div
                    className={`border rounded-lg p-6 transition-all ${
                      isExpanded
                        ? `border-[#00d4ff] bg-[#00d4ff]/10`
                        : `border-white/5 bg-[#111827] hover:border-white/10`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${section.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: section.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{section.title}</h3>
                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${section.color}20`, color: section.color }}>
                              Layer {section.id}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{section.subtitle}</p>
                          <p className="text-sm text-gray-300 mt-2">{section.description}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="mt-8 pt-8 border-t border-white/10 space-y-8">
                        {/* Components */}
                        {section.components && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Key Components</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {section.components.map((comp, i) => (
                                <div key={i} className="bg-white/5 rounded-lg p-4">
                                  <p className="font-bold text-white text-sm mb-1">{comp.name}</p>
                                  <p className="text-xs text-gray-400">{comp.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Principles/Lifecycle */}
                        {section.principles && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Zero Trust Principles</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {section.principles.map((p, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-300">{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.lifecycle && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Tenant Lifecycle</h4>
                            <div className="space-y-2">
                              {section.lifecycle.map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                  </span>
                                  <span className="text-sm text-gray-300 pt-0.5">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.capabilities && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Capabilities</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {section.capabilities.map((cap, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: section.color }} />
                                  <span className="text-sm text-gray-300">{cap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Subsections for Data & Analytics */}
                        {section.subsections && (
                          <div className="space-y-6">
                            {section.subsections.map((sub, i) => (
                              <div key={i} className="bg-white/5 rounded-lg p-6">
                                <h4 className="font-bold text-white mb-2 text-base">{sub.name}</h4>
                                <p className="text-sm text-gray-400 mb-4">{sub.desc}</p>
                                {sub.stores && (
                                  <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Stores</p>
                                    <ul className="space-y-2">
                                      {sub.stores.map((item, j) => (
                                        <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                                          <span className="w-1 h-1 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {sub.features && (
                                  <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Features</p>
                                    <ul className="space-y-1">
                                      {sub.features.map((item, j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                                          <CheckCircle2 className="w-3 h-3 text-[#2ed573]" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {sub.models && (
                                  <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Models</p>
                                    <ul className="space-y-1">
                                      {sub.models.map((item, j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                                          <span className="w-1 h-1 rounded-full bg-[#a855f7]" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {sub.capabilities && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Capabilities</p>
                                    <ul className="space-y-1">
                                      {sub.capabilities.map((item, j) => (
                                        <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                                          <CheckCircle2 className="w-3 h-3 text-[#2ed573]" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {sub.functions && (
                                  <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Functions</p>
                                    <ul className="space-y-1">
                                      {sub.functions.map((item, j) => (
                                        <li key={j} className="text-xs text-gray-300 flex items-start gap-2">
                                          <span className="w-1 h-1 rounded-full bg-[#ffa502] mt-1.5 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {sub.modes && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Modes</p>
                                    <ul className="space-y-1">
                                      {sub.modes.map((item, j) => (
                                        <li key={j} className="text-xs text-gray-300 flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Modules for Application Layer */}
                        {section.modules && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Key Modules</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {section.modules.map((mod, i) => (
                                <div key={i} className="bg-white/5 rounded-lg p-4">
                                  <p className="font-bold text-white text-sm mb-1">{mod.name}</p>
                                  <p className="text-xs text-gray-400 mb-3">{mod.purpose}</p>
                                  <div className="space-y-1">
                                    {mod.features.map((feat, j) => (
                                      <p key={j} className="text-xs text-gray-300 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-[#00d4ff]" />
                                        {feat}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Platform Principles */}
        <section className="mb-20 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Platform Design Principles</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Modular", desc: "Independent, composable components" },
              { title: "Stateless", desc: "Horizontal scaling without session affinity" },
              { title: "API-First", desc: "All functionality exposed via APIs" },
              { title: "Multi-Tenant", desc: "True isolation at all layers" },
              { title: "Zero-Trust", desc: "Verify every request, assume breach" },
              { title: "Secure by Design", desc: "Encryption, audit, compliance built-in" },
              { title: "Scalable", desc: "Grow from startup to enterprise" },
              { title: "Observable", desc: "Full visibility into system behavior" },
            ].map((principle, i) => (
              <div key={i} className="text-center">
                <h4 className="font-bold text-white mb-2">{principle.title}</h4>
                <p className="text-sm text-gray-400">{principle.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Support */}
        <section className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">ASOSINT by EDS</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            For detailed implementation guides, API references, deployment instructions, and partner integration support:
          </p>
          <a href="mailto:info@eds-360.com" className="inline-flex items-center gap-2 text-[#00d4ff] font-bold hover:underline text-lg">
            info@eds-360.com
          </a>
        </section>
      </div>
    </div>
  );
}