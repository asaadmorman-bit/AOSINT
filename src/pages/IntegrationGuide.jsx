import React, { useState } from "react";
import { Network, Code, Shield, Zap, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const INTEGRATION_TYPES = [
  {
    name: "API Integration",
    icon: Code,
    description: "RESTful API + GraphQL endpoints for data ingestion, querying, and automation",
    endpoints: [
      "Signal Ingestion API",
      "Threat Intelligence Query API",
      "Scenario API",
      "Briefing Generation API",
      "Tenant Management API",
    ],
    authentication: "OAuth 2.0 + API Keys",
    rateLimit: "1000 req/min per tenant",
  },
  {
    name: "Data Connectors",
    icon: Zap,
    description: "Pre-built connectors for third-party threat intelligence, SIEM, and data sources",
    endpoints: [
      "OSINT Feed Connectors",
      "SIEM Integration (Splunk, ELK, QRadar)",
      "Threat Intel Feeds (MISP, OpenCTI)",
      "Cloud Platform Connectors (AWS, Azure, GCP)",
      "EDR/XDR Platform Integrations",
    ],
    authentication: "API Key + Webhook Secrets",
    rateLimit: "Per-connector configuration",
  },
  {
    name: "Partner Portal",
    icon: Users,
    description: "MSP multi-tenant management, integrator onboarding, and revenue sharing",
    endpoints: [
      "Partner tenant provisioning",
      "Usage reporting",
      "Revenue dashboard",
      "Support ticketing",
      "Documentation & training",
    ],
    authentication: "SAML/OIDC + SSO",
    rateLimit: "Enterprise-grade",
  },
  {
    name: "Government Enclaves",
    icon: Shield,
    description: "Secure, isolated environments for government and critical infrastructure partners",
    endpoints: [
      "Sovereign node deployment",
      "Air-gapped operation support",
      "FedRAMP alignment",
      "NIST RMF compliance",
      "Custom data classifications",
    ],
    authentication: "Government PKI + MFA",
    rateLimit: "Custom per agency",
  },
];

const SDK_LANGUAGES = [
  { name: "Python", status: "Available", features: ["Full SDK", "CLI tools", "Jupyter notebooks"] },
  { name: "JavaScript / TypeScript", status: "Available", features: ["Node.js SDK", "React hooks", "Browser SDK"] },
  { name: "Go", status: "Available", features: ["Full SDK", "CLI tools", "gRPC support"] },
  { name: "Java", status: "Planned Q2 2026", features: ["Spring Boot integration", "Maven support"] },
];

export default function IntegrationGuide() {
  const [expandedType, setExpandedType] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Network className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-4xl font-black text-white">ASOSINT Integration Guide</h1>
          </div>
          <p className="text-gray-400 max-w-3xl">
            Build on the ASOSINT platform. RESTful APIs, SDKs, pre-built connectors, and partner ecosystem integration options.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Integration Types */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Integration Types</h2>
          <div className="space-y-4">
            {INTEGRATION_TYPES.map((type, i) => {
              const Icon = type.icon;
              const isExpanded = expandedType === i;
              return (
                <button
                  key={i}
                  onClick={() => setExpandedType(isExpanded ? null : i)}
                  className="w-full text-left"
                >
                  <div
                    className={`border rounded-lg p-6 transition-all ${
                      isExpanded
                        ? "border-[#00d4ff] bg-[#00d4ff]/10"
                        : "border-white/5 bg-[#111827] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Icon className="w-6 h-6 text-[#00d4ff] flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-lg font-bold text-white">{type.name}</h3>
                          <p className="text-sm text-gray-400">{type.description}</p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-3 gap-8">
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Endpoints</h4>
                          <ul className="space-y-2">
                            {type.endpoints.map((endpoint, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                                {endpoint}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Security</h4>
                          <p className="text-sm text-gray-300 mb-4">{type.authentication}</p>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Rate Limits</h4>
                          <p className="text-sm text-gray-300">{type.rateLimit}</p>
                        </div>
                        <div className="bg-white/5 rounded p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Getting Started</p>
                          <Button size="sm" className="w-full bg-[#00d4ff] text-black text-xs font-bold">
                            View Documentation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SDKs */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">SDKs & Libraries</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {SDK_LANGUAGES.map((sdk, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <h3 className="font-bold text-white mb-2">{sdk.name}</h3>
                <p className={`text-xs font-bold mb-4 ${sdk.status === "Available" ? "text-[#2ed573]" : "text-[#ffa502]"}`}>
                  {sdk.status}
                </p>
                <ul className="space-y-2">
                  {sdk.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3 h-3 text-[#2ed573] flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Data Connectors */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">Pre-Built Data Connectors</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { category: "Threat Intelligence", connectors: ["MISP", "OpenCTI", "AlienVault OTX", "Shodan", "GreyNoise"] },
              { category: "SIEM & Analytics", connectors: ["Splunk", "Elasticsearch", "Sumo Logic", "QRadar", "ArcSight"] },
              { category: "Cloud Platforms", connectors: ["AWS", "Azure", "Google Cloud", "Kubernetes", "Docker"] },
              { category: "Endpoint & Detection", connectors: ["CrowdStrike", "Microsoft Defender", "SentinelOne", "Palo Alto XDR"] },
            ].map((group, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <h3 className="font-bold text-white mb-4">{group.category}</h3>
                <div className="space-y-2">
                  {group.connectors.map((connector, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-white/5">
                      <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      {connector}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Webhook Events */}
        <section className="mb-16 bg-[#111827] border border-white/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Webhook Events</h2>
          <p className="text-gray-400 mb-6">
            Subscribe to real-time events from ASOSINT. Webhooks are delivered with cryptographic signatures for security.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-white mb-4">Signal Events</h3>
              <ul className="space-y-2">
                {["signal.ingested", "signal.verified", "signal.enriched", "signal.correlated"].map((event, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                    {event}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Intelligence Events</h3>
              <ul className="space-y-2">
                {["narrative.detected", "threat.escalated", "brief.generated", "alert.triggered"].map((event, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="mb-16 bg-gradient-to-r from-[#ff4757]/10 to-[#a855f7]/10 border border-[#ff4757]/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Security & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">API Security</h3>
              <ul className="space-y-2">
                {[
                  "OAuth 2.0 for authorization",
                  "API key + secret authentication",
                  "Webhook signature verification (HMAC-SHA256)",
                  "Rate limiting per API key",
                  "IP whitelisting available",
                  "TLS 1.2+ encryption required",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Compliance</h3>
              <ul className="space-y-2">
                {[
                  "SOC 2 Type II certified",
                  "FedRAMP compliance (Government tier)",
                  "NIST RMF alignment",
                  "GDPR & data residency support",
                  "Audit logging for all API calls",
                  "Data encryption in transit & at rest",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-[#2ed573] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Support & Resources */}
        <section className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Integration Support</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Developer documentation, code samples, and integration templates available. Our partner success team is ready to help with custom integrations and enterprise deployments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-[#00d4ff] text-black font-bold">View API Docs</Button>
            <a href="mailto:info@eds-360.com">
              <Button variant="outline" className="border-white/20 w-full sm:w-auto">
                Contact Integration Team
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}