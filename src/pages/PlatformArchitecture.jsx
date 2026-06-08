import React, { useState } from "react";
import { BookOpen, Layers, Shield, Database, Network, Zap, Lock, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAYERS = [
  {
    id: 1,
    name: "Identity & Access Layer",
    subtitle: "Zero Trust Architecture",
    icon: Lock,
    color: "#ff4757",
    components: [
      "ASOSINT Identity Provider (IdP)",
      "Multi-tenant RBAC & ABAC",
      "Tier gating engine",
      "Device trust scoring",
      "Session isolation",
      "Audit logging",
    ],
    features: [
      "Per-request authentication",
      "Per-tenant encryption keys",
      "Role-based module access",
      "Attribute-based data access",
      "Partner federation (SAML/OIDC)",
      "Government enclave mode",
    ],
  },
  {
    id: 2,
    name: "Multi-Tenant Core Platform",
    subtitle: "Tenant Management & Provisioning",
    icon: Layers,
    color: "#00d4ff",
    components: [
      "Tenant provisioning service",
      "Tenant configuration registry",
      "Billing & subscription engine",
      "Feature flag service",
      "Usage metering",
      "Multi-tenant API gateway",
    ],
    features: [
      "Tenant isolation",
      "Per-tenant rate limiting",
      "Per-tenant data partitioning",
      "Per-tenant encryption",
      "Per-tenant audit trails",
    ],
  },
  {
    id: 3,
    name: "Intelligence Fabric Layer",
    subtitle: "Multi-Domain Signal Fusion",
    icon: Network,
    color: "#a855f7",
    components: [
      "Signal ingestion engine",
      "Verification & enrichment engine",
      "Correlation engine",
      "Narrative clustering engine",
      "Scenario modeling engine",
      "Threat convergence engine",
    ],
    features: [
      "Multi-domain signal fusion",
      "Narrative propagation detection",
      "Early-warning indicators",
      "Sector exposure scoring",
      "Cross-domain escalation modeling",
    ],
  },
  {
    id: 4,
    name: "Data & Analytics Layer",
    subtitle: "Data Lake & Knowledge Graph",
    icon: Database,
    color: "#2ed573",
    components: [
      "ASOSINT Data Lake",
      "ASOSINT Knowledge Graph",
      "ASOSINT Analytics Engine",
      "ASOSINT Search Engine",
      "ASOSINT Data Retention Manager",
    ],
    features: [
      "Structured + unstructured ingestion",
      "Entity resolution",
      "Relationship mapping",
      "Time-series analytics",
      "Multi-domain correlation",
      "Export to Executive Briefing Engine",
    ],
  },
  {
    id: 5,
    name: "Application Modules Layer",
    subtitle: "ASOSINT Module Ecosystem",
    icon: Zap,
    color: "#ffa502",
    components: [
      "Global Threat Observatory",
      "Fusion Center",
      "Scenario Engine",
      "Red/Blue Cell Module",
      "Compliance & Governance Engine",
      "Training Portal & Certification Engine",
    ],
    features: [
      "Real-time threat intelligence",
      "Multi-domain analysis",
      "Scenario forecasting",
      "Red/Blue operational integration",
      "Compliance management",
      "Training & certification",
    ],
  },
  {
    id: 6,
    name: "Integration & Partner Ecosystem",
    subtitle: "APIs, Marketplace & Federation",
    icon: Network,
    color: "#00d4ff",
    components: [
      "Partner Portal",
      "API gateway",
      "Webhooks",
      "SDKs",
      "Marketplace connectors",
    ],
    features: [
      "MSP multi-tenant management",
      "Integrator onboarding",
      "Government partner enclaves",
      "Third-party data ingestion",
      "App Store for ASOSINT extensions",
    ],
  },
  {
    id: 7,
    name: "Governance, Compliance & Observability",
    subtitle: "Audit, Monitoring & RMF",
    icon: Shield,
    color: "#ff4757",
    components: [
      "Compliance & Governance Engine",
      "Audit logging",
      "SIEM integration",
      "Monitoring dashboards",
      "RMF/NIST/ISO mapping",
      "Policy lifecycle management",
    ],
    features: [
      "Immutable evidence trails",
      "Control traceability",
      "Automated compliance workflows",
      "Real-time monitoring",
      "Alerting & anomaly detection",
    ],
  },
];

const MODULES = [
  {
    name: "ASOSINT Global Threat Observatory",
    purpose: "Real-time global risk intelligence",
    features: [
      "Global risk dashboard",
      "Multi-domain threat map",
      "Fragmentation & convergence indices",
      "Narrative propagation monitor",
      "Sector exposure scoring",
    ],
  },
  {
    name: "ASOSINT Fusion Center",
    purpose: "Intelligence analysis & correlation",
    features: [
      "Signal triage workflows",
      "Verification processes",
      "Analyst workbench",
      "Cross-domain correlation",
      "Case management",
    ],
  },
  {
    name: "ASOSINT Scenario Engine",
    purpose: "Strategic forecasting & planning",
    features: [
      "High-level forecasting",
      "Escalation modeling",
      "Red/Blue Cell integration",
      "After-action reporting",
      "Strategic implications",
    ],
  },
  {
    name: "ASOSINT Certification Engine",
    purpose: "Role-based training & validation",
    features: [
      "Multi-level certifications",
      "Hands-on labs",
      "Exams & assessments",
      "Digital badging",
      "Partner certification program",
    ],
  },
  {
    name: "ASOSINT Intelligence Program Builder",
    purpose: "Program design & governance",
    features: [
      "Program design wizard",
      "Governance templates",
      "Maturity modeling",
      "Escalation matrix builder",
      "Training path generator",
    ],
  },
  {
    name: "ASOSINT Executive Briefing Engine",
    purpose: "Automated intelligence reporting",
    features: [
      "Auto-generated briefs",
      "Risk summaries",
      "Scenario implications",
      "Export to PDF/HTML",
      "Scheduled delivery",
    ],
  },
];

export default function PlatformArchitecture() {
  const [expandedLayer, setExpandedLayer] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl font-black text-white">ASOSINT Platform Architecture</h1>
          </div>
          <p className="text-gray-400 max-w-3xl">
            A unified, defensively oriented intelligence ecosystem integrating cyber, physical, influence, geopolitical, and protective intelligence into a single operational fabric. Built by Emerging Defense Solutions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission */}
        <section className="mb-16 bg-[#111827] border border-white/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Platform Purpose & Mission</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-white mb-3">Built By</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                  <span><strong>Asaad Morman</strong> — Marine Corps veteran, enterprise architect, cybersecurity engineer</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                  <span><strong>Shauntze Morman</strong> — 20+ year public safety leader, Security+ & CASP certified</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3">Serves</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                  <span>Enterprise security teams</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                  <span>Government & critical infrastructure</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                  <span>Public safety & emergency response</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                  <span>MSPs, integrators & community orgs</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Architecture Layers */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">7-Layer Architecture</h2>
          <div className="space-y-4">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isExpanded = expandedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                  className="w-full text-left"
                >
                  <div
                    className={`border rounded-lg p-6 transition-all ${
                      isExpanded
                        ? `border-[#00d4ff] bg-[#00d4ff]/10`
                        : `border-white/5 bg-[#111827] hover:border-white/10`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${layer.color}20` }}
                        >
                          <Icon className="w-6 h-6" style={{ color: layer.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{layer.name}</h3>
                          <p className="text-sm text-gray-400">{layer.subtitle}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Components</h4>
                          <ul className="space-y-2">
                            {layer.components.map((comp, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <span
                                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                  style={{ background: layer.color }}
                                />
                                {comp}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Features</h4>
                          <ul className="space-y-2">
                            {layer.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                                {feat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Module Ecosystem */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Application Modules</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {MODULES.map((module, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors">
                <h3 className="font-bold text-white mb-2">{module.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{module.purpose}</p>
                <ul className="space-y-2">
                  {module.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="w-1 h-1 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-16 grid md:grid-cols-2 gap-8">
          <div className="bg-[#111827] border border-white/5 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Frontend Stack</h3>
            <ul className="space-y-3">
              {[
                { label: "Framework", value: "React or Next.js" },
                { label: "Language", value: "TypeScript" },
                { label: "Styling", value: "Tailwind CSS" },
                { label: "Theme", value: "Dark mode default" },
                { label: "Components", value: "Design system with role-based UI" },
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-start">
                  <span className="text-sm text-gray-400 font-bold">{item.label}</span>
                  <span className="text-sm text-gray-300">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Backend Stack</h3>
            <ul className="space-y-3">
              {[
                { label: "Services", value: "Node.js or Python microservices" },
                { label: "Architecture", value: "Event-driven + stateless" },
                { label: "Database", value: "PostgreSQL + ElasticSearch" },
                { label: "Orchestration", value: "Kubernetes" },
                { label: "Deployment", value: "Canary releases via CI/CD" },
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-start">
                  <span className="text-sm text-gray-400 font-bold">{item.label}</span>
                  <span className="text-sm text-gray-300">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Quality & Testing */}
        <section className="mb-16 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-8">Quality Assurance & Testing</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">Testing Requirements</h3>
              <ul className="space-y-2">
                {[
                  "Unit tests (>80% coverage)",
                  "Integration tests (API & data flows)",
                  "Load tests (10K+ concurrent users)",
                  "Security tests (OWASP + SAST)",
                  "UAT automation (16-scenario suite)",
                ].map((test, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
                    {test}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">CI/CD Pipeline</h3>
              <ul className="space-y-2">
                {[
                  "GitHub Actions / GitLab CI",
                  "Automated testing on every commit",
                  "Security scanning (Snyk, Trivy)",
                  "Container builds & registry",
                  "Automated canary releases",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Support */}
        <div className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center">
          <BookOpen className="w-8 h-8 text-[#00d4ff] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Documentation & Support</h3>
          <p className="text-gray-400 mb-6">
            Full technical specifications, integration guides, and deployment documentation available. For questions:
          </p>
          <a href="mailto:info@eds-360.com" className="inline-flex items-center gap-2 text-[#00d4ff] font-bold hover:underline">
            info@eds-360.com
          </a>
        </div>
      </div>
    </div>
  );
}