import React, { useState } from "react";
import { ArrowRight, Network, Zap, CheckCircle2, ChevronDown, AlertCircle, TrendingUp } from "lucide-react";

const LINEAGE_STAGES = [
  {
    stage: "Ingestion",
    icon: "📡",
    description: "Signals originate from multiple sources",
    sources: [
      { name: "Cyber Telemetry", examples: "EDR, SIEM, network flow, threat feeds" },
      { name: "Physical Sensors", examples: "IoT, facility systems, geolocation data" },
      { name: "Public Safety Feeds", examples: "Dispatch systems, incident reports, 911 data" },
      { name: "OSINT Sources", examples: "Web scraping, social media, news feeds, dark web" },
      { name: "Partner Integrations", examples: "Third-party data, ecosystem connectors" },
      { name: "Narrative Streams", examples: "Information operations, influence campaigns, messaging" },
    ],
    metadata: ["Source origin", "Timestamp", "Trust level", "Confidence score", "Collection method"],
    auditability: "Raw signal preserved with source tag",
  },
  {
    stage: "Normalization",
    icon: "🔄",
    description: "Raw signals converted to unified schema",
    operations: [
      "Field mapping to standard schema",
      "Type coercion and validation",
      "Metadata enrichment with collection context",
      "Timestamp alignment to UTC",
      "Data quality scoring",
      "Duplication detection",
    ],
    metadata: ["Normalization timestamp", "Schema version", "Quality metrics", "Original source reference"],
    auditability: "Mapping rules and transformations logged",
  },
  {
    stage: "Enrichment",
    icon: "✨",
    description: "Signals augmented with context and attributes",
    operations: [
      "Geospatial context (country, region, coordinates)",
      "Entity attribute population (organization, person, facility)",
      "Cross-source metadata linking",
      "Historical context lookup",
      "Threat actor association",
      "Sector and industry classification",
    ],
    sources: [
      "MaxMind geolocation database",
      "WHOIS and DNS records",
      "Entity databases and taxonomies",
      "Historical signal patterns",
      "Known threat actor profiles",
    ],
    auditability: "Enrichment sources and timestamps recorded",
  },
  {
    stage: "Correlation",
    icon: "🔗",
    description: "Cross-domain pattern detection and linking",
    logic: [
      "Temporal correlation (events within time window)",
      "Geospatial correlation (co-location analysis)",
      "Entity correlation (shared infrastructure, accounts, people)",
      "Behavioral correlation (pattern matching)",
      "Domain-specific correlation (cyber ↔ physical ↔ influence)",
    ],
    algorithms: [
      "Hash-based matching (IPs, domains, hashes)",
      "Graph traversal for entity relationships",
      "Statistical anomaly detection",
      "Machine learning pattern recognition",
      "Domain-expert rulesets",
    ],
    auditability: "Correlation rules applied and match scores recorded",
  },
  {
    stage: "Knowledge Graph Integration",
    icon: "🕸️",
    description: "Semantic layer creation with entities and relationships",
    operations: [
      "Entity resolution across sources",
      "Duplicate entity consolidation",
      "Relationship inference using graph algorithms",
      "Temporal connection mapping",
      "Geospatial relationship establishment",
      "Influence pathway inference",
    ],
    storage: "Property graph database with versioning",
    auditability: "Entity updates and relationship inferences logged",
  },
  {
    stage: "Analytics",
    icon: "📊",
    description: "Insights, risk scores, and predictive models",
    operations: [
      "Multi-domain risk aggregation",
      "Anomaly detection (statistical + behavioral)",
      "Narrative propagation modeling",
      "Sector exposure analysis",
      "Time-series forecasting",
      "Convergence & fragmentation indices",
    ],
    outputs: [
      "Risk scores (0-100 scale per dimension)",
      "Anomaly flags with confidence intervals",
      "Narrative cluster identification",
      "Sector heat maps",
      "Predictive alerts",
    ],
    auditability: "Algorithm versions and input datasets recorded",
  },
  {
    stage: "Module Consumption",
    icon: "⚙️",
    description: "Modules use outputs for user workflows",
    modules: [
      { name: "Fusion Center", use: "Triage and investigate correlations" },
      { name: "Global Threat Observatory", use: "Display risk dashboards and narrative clusters" },
      { name: "Scenario Engine", use: "Model escalation pathways using graph context" },
      { name: "Red/Blue Cell", use: "Simulate adversarial behaviors using patterns" },
      { name: "Executive Briefing Engine", use: "Generate decision summaries" },
    ],
    auditability: "Module access and data consumption logged",
  },
  {
    stage: "Storage & Retention",
    icon: "💾",
    description: "Tiered storage with compliance and audit",
    layers: [
      { name: "Raw Data Lake", retention: "Per-tenant tier (7 days - 3 years)", encryption: "Per-tenant keys" },
      { name: "Enriched Data", retention: "Per-tenant tier (30 days - 2 years)", encryption: "Per-tenant keys" },
      { name: "Knowledge Graph", retention: "Per-tenant tier (1 year - unlimited)", encryption: "Per-tenant keys" },
      { name: "Analytics Results", retention: "Per-tenant tier (30 days - 1 year)", encryption: "Cached for performance" },
    ],
    auditability: "Immutable audit log of all storage operations",
  },
];

const MODULE_DEPENDENCIES = [
  {
    module: "ASOSINT Global Threat Observatory",
    dependsOn: [
      { module: "Analytics Engine", criticality: "high", reason: "Risk scores and anomaly detections" },
      { module: "Knowledge Graph", criticality: "high", reason: "Entity and relationship context" },
      { module: "Intelligence Fabric", criticality: "medium", reason: "Real-time signal updates" },
    ],
    providesTo: [
      { module: "Executive Briefing Engine", reason: "Threat summaries and narratives" },
      { module: "Scenario Engine", reason: "Global context for forecasting" },
    ],
    criticalityLevel: "HIGH",
  },
  {
    module: "ASOSINT Fusion Center",
    dependsOn: [
      { module: "Intelligence Fabric", criticality: "high", reason: "Correlation results" },
      { module: "Knowledge Graph", criticality: "high", reason: "Entity and relationship lookups" },
      { module: "Compliance Engine", criticality: "medium", reason: "Access control and audit" },
    ],
    providesTo: [
      { module: "Knowledge Graph", reason: "Analyst findings and updates" },
      { module: "Scenario Engine", reason: "Verified intelligence for modeling" },
    ],
    criticalityLevel: "HIGH",
  },
  {
    module: "ASOSINT Scenario Engine",
    dependsOn: [
      { module: "Knowledge Graph", criticality: "high", reason: "Entity relationships and history" },
      { module: "Analytics Engine", criticality: "high", reason: "Risk patterns and trends" },
      { module: "Red/Blue Cell Module", criticality: "medium", reason: "Tactical playbooks" },
    ],
    providesTo: [
      { module: "Executive Briefing Engine", reason: "Escalation forecasts and implications" },
      { module: "Red/Blue Cell Module", reason: "Scenario context for simulation" },
    ],
    criticalityLevel: "HIGH",
  },
  {
    module: "ASOSINT Red/Blue Cell Module",
    dependsOn: [
      { module: "Scenario Engine", criticality: "high", reason: "Escalation pathways" },
      { module: "Knowledge Graph", criticality: "high", reason: "Adversary profiles and tactics" },
      { module: "Compliance Engine", criticality: "medium", reason: "Regulatory constraints" },
    ],
    providesTo: [
      { module: "Executive Briefing Engine", reason: "Defense gap analysis" },
      { module: "Compliance Engine", reason: "Capability-to-control mapping" },
    ],
    criticalityLevel: "MEDIUM",
  },
  {
    module: "ASOSINT Executive Briefing Engine",
    dependsOn: [
      { module: "Analytics Engine", criticality: "high", reason: "Risk scores and summaries" },
      { module: "Scenario Engine", criticality: "high", reason: "Implications and forecasts" },
      { module: "Global Threat Observatory", criticality: "medium", reason: "Narrative context" },
    ],
    providesTo: [
      { module: "None (terminal consumer)", reason: "Leadership decisions" },
    ],
    criticalityLevel: "HIGH",
  },
  {
    module: "ASOSINT Compliance & Governance Engine",
    dependsOn: [
      { module: "All Layers", criticality: "high", reason: "Audit logging and monitoring" },
      { module: "Identity Layer", criticality: "high", reason: "Access control validation" },
    ],
    providesTo: [
      { module: "All Modules", reason: "Policy enforcement and audit results" },
    ],
    criticalityLevel: "CRITICAL",
  },
];

const SCENARIO_LOGIC = [
  {
    phase: "Inputs",
    icon: "📥",
    description: "Scenario modeling starts with structured inputs",
    sources: [
      { category: "Historical Patterns", items: ["Past escalation sequences", "Actor behavioral profiles", "Narrative propagation histories"] },
      { category: "Graph Relationships", items: ["Entity networks", "Influence pathways", "Infrastructure dependencies"] },
      { category: "Analytics Outputs", items: ["Current risk scores", "Anomaly detections", "Sector exposure levels"] },
      { category: "Scenario Parameters", items: ["Trigger events", "Time horizons", "Objective constraints"] },
    ],
  },
  {
    phase: "Logic",
    icon: "⚙️",
    description: "Probabilistic pathways and escalation modeling",
    steps: [
      {
        name: "Identify Base Cases",
        desc: "Start with known historical escalation sequences from graph and historical databases",
      },
      {
        name: "Apply Current Context",
        desc: "Adjust base cases for current risk scores, anomalies, and entity relationships",
      },
      {
        name: "Model Transitions",
        desc: "Use probabilistic state machines to model possible transitions from current state",
      },
      {
        name: "Cross-Domain Linking",
        desc: "Identify where escalation moves across domains (cyber → physical → influence)",
      },
      {
        name: "Estimate Likelihoods",
        desc: "Calculate probability estimates for each pathway using ML models and expert rules",
      },
      {
        name: "Identify Branch Points",
        desc: "Determine critical decision points where intervention could change outcomes",
      },
      {
        name: "Synthesize Outcomes",
        desc: "Project end-state consequences for each major pathway",
      },
    ],
    algorithms: [
      "Markov chain modeling for state transitions",
      "Bayesian networks for probabilistic inference",
      "Graph algorithms for network propagation",
      "Time-series analysis for temporal patterns",
      "Ensemble methods combining expert rules and ML",
    ],
  },
  {
    phase: "Outputs",
    icon: "📤",
    description: "Decision-grade forecasts and recommendations",
    deliverables: [
      {
        name: "Scenario Pathways",
        desc: "2-5 plausible escalation sequences with probability estimates and timeframes",
      },
      {
        name: "Risk Implications",
        desc: "Consequences for each scenario across organizational, sector, and community levels",
      },
      {
        name: "Early-Warning Indicators",
        desc: "Observable signals that indicate movement toward specific pathways",
      },
      {
        name: "Decision Points",
        desc: "Critical moments where intervention, policy, or resource changes would alter outcomes",
      },
      {
        name: "Recommended Actions",
        desc: "Specific preventive, mitigating, or responsive actions for each scenario",
      },
      {
        name: "Confidence Intervals",
        desc: "Uncertainty ranges reflecting data quality and model limitations",
      },
    ],
    consumption: "Executive Briefing Engine, Strategic Planning, Red/Blue Cell simulations",
  },
];

export default function AdvancedArchitecture() {
  const [expandedLineage, setExpandedLineage] = useState(null);
  const [expandedDependency, setExpandedDependency] = useState(null);
  const [expandedScenario, setExpandedScenario] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-4">ASOSINT Advanced Architecture</h1>
          <p className="text-gray-400 max-w-3xl">
            End-to-end data lineage, cross-module dependency mapping, and scenario-modeling logic that transforms ASOSINT from components into a functioning intelligence ecosystem.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* END-TO-END LINEAGE */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-4">End-to-End Data Lineage</h2>
          <p className="text-gray-400 mb-8">
            Data lineage traces the full lifecycle of a signal from ingestion through analytics to executive-level decision support. It ensures transparency, auditability, and trust in ASOSINT's intelligence.
          </p>

          <div className="space-y-4">
            {LINEAGE_STAGES.map((lineage, i) => (
              <button
                key={i}
                onClick={() => setExpandedLineage(expandedLineage === i ? null : i)}
                className="w-full text-left"
              >
                <div className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{lineage.icon}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{lineage.stage}</h3>
                        <p className="text-sm text-gray-400">{lineage.description}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedLineage === i ? "rotate-180" : ""}`} />
                  </div>

                  {expandedLineage === i && (
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
                      {lineage.sources && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Signal Sources</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {lineage.sources.map((source, j) => (
                              <div key={j} className="bg-white/5 rounded-lg p-4">
                                <p className="font-bold text-white text-sm mb-1">{source.name}</p>
                                <p className="text-xs text-gray-400">{source.examples}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lineage.metadata && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Metadata Tagged</h4>
                          <div className="flex flex-wrap gap-2">
                            {lineage.metadata.map((meta, j) => (
                              <span key={j} className="px-2.5 py-1 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff] text-xs font-mono">
                                {meta}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {lineage.operations && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Operations</h4>
                          <ul className="space-y-2">
                            {lineage.operations.map((op, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                                {op}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lineage.algorithms && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Correlation Methods</h4>
                          <ul className="space-y-2">
                            {lineage.algorithms.map((algo, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="w-1 h-1 rounded-full bg-[#a855f7] mt-1.5" />
                                {algo}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lineage.modules && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Module Consumers</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {lineage.modules.map((mod, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] mt-1 flex-shrink-0" />
                                <div>
                                  <p className="font-bold text-white text-sm">{mod.name}</p>
                                  <p className="text-xs text-gray-400">{mod.use}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lineage.layers && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Storage Layers</h4>
                          <div className="space-y-3">
                            {lineage.layers.map((layer, j) => (
                              <div key={j} className="bg-white/5 rounded-lg p-4">
                                <p className="font-bold text-white text-sm mb-2">{layer.name}</p>
                                <div className="space-y-1 text-xs text-gray-400">
                                  <p>Retention: {layer.retention}</p>
                                  <p>Encryption: {layer.encryption}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lineage.storage && (
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Storage Medium</p>
                          <p className="text-sm text-gray-300">{lineage.storage}</p>
                        </div>
                      )}

                      {lineage.auditability && (
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[#ffa502] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-[#ffa502] mb-1">Auditability</p>
                              <p className="text-sm text-gray-300">{lineage.auditability}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Lineage visualization concept */}
          <div className="mt-12 bg-[#111827] border border-white/5 rounded-lg p-8">
            <p className="text-sm font-bold text-gray-400 uppercase mb-6">Complete Data Lineage Flow</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {[
                "Raw Signal",
                "Normalized",
                "Enriched",
                "Correlated",
                "Graph Mapped",
                "Analyzed",
                "Module Used",
                "Stored",
                "Audited",
              ].map((stage, i) => (
                <React.Fragment key={i}>
                  <span className="px-2.5 py-1 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] font-bold text-[10px]">
                    {stage}
                  </span>
                  {i < 8 && <ArrowRight className="w-3 h-3 text-gray-600" />}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Each stage is logged with timestamp, actor, operation, input/output, and status for complete auditability.
            </p>
          </div>
        </section>

        {/* CROSS-MODULE DEPENDENCIES */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-4">Cross-Module Dependency Mapping</h2>
          <p className="text-gray-400 mb-8">
            Modules are independent but interconnected, sharing intelligence through the Intelligence Fabric and Analytics layers. Dependencies determine system resilience and scaling strategy.
          </p>

          <div className="space-y-4">
            {MODULE_DEPENDENCIES.map((dep, i) => (
              <button
                key={i}
                onClick={() => setExpandedDependency(expandedDependency === i ? null : i)}
                className="w-full text-left"
              >
                <div className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{dep.module}</h3>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            dep.criticalityLevel === "CRITICAL"
                              ? "bg-[#ff4757]/20 text-[#ff4757]"
                              : dep.criticalityLevel === "HIGH"
                              ? "bg-[#ffa502]/20 text-[#ffa502]"
                              : "bg-[#2ed573]/20 text-[#2ed573]"
                          }`}
                        >
                          {dep.criticalityLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Depends on {dep.dependsOn.length} module(s) • Provides to {dep.providesTo.length} module(s)
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedDependency === i ? "rotate-180" : ""}`} />
                  </div>

                  {expandedDependency === i && (
                    <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Dependencies (Receives from)</h4>
                        <div className="space-y-3">
                          {dep.dependsOn.map((d, j) => (
                            <div
                              key={j}
                              className={`rounded-lg p-3 border ${
                                d.criticality === "high"
                                  ? "border-[#ffa502]/30 bg-[#ffa502]/10"
                                  : "border-[#2ed573]/30 bg-[#2ed573]/10"
                              }`}
                            >
                              <p className={`font-bold text-sm ${d.criticality === "high" ? "text-[#ffa502]" : "text-[#2ed573]"}`}>
                                {d.module}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{d.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Provided to (Sends to)</h4>
                        <div className="space-y-3">
                          {dep.providesTo.map((p, j) => (
                            <div key={j} className="border border-[#00d4ff]/30 bg-[#00d4ff]/10 rounded-lg p-3">
                              <p className="font-bold text-sm text-[#00d4ff]">{p.module}</p>
                              <p className="text-xs text-gray-400 mt-1">{p.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Dependency Matrix Concept */}
          <div className="mt-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8">
            <p className="text-sm font-bold text-gray-400 uppercase mb-4">Dependency Impact</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-bold text-white mb-2">Critical Dependencies</p>
                <p className="text-xs text-gray-400">
                  Compliance Engine monitors all layers. Analytics Engine feeds multiple modules. Knowledge Graph is queried by most modules.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-2">Scaling Implications</p>
                <p className="text-xs text-gray-400">
                  Intelligence Fabric and Knowledge Graph must scale horizontally. Modules can scale independently if fabric is stable.
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-2">Failover Strategy</p>
                <p className="text-xs text-gray-400">
                  Fabric failure impacts all modules. Knowledge Graph outage degrades analytics. Module failures are isolated.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SCENARIO MODELING LOGIC */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-4">Scenario-Modeling Logic</h2>
          <p className="text-gray-400 mb-8">
            ASOSINT forecasts potential escalation pathways using historical patterns, graph relationships, and probabilistic models. This logic powers strategic planning and defensive modeling.
          </p>

          <div className="space-y-4">
            {SCENARIO_LOGIC.map((scenario, i) => (
              <button
                key={i}
                onClick={() => setExpandedScenario(expandedScenario === i ? null : i)}
                className="w-full text-left"
              >
                <div className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{scenario.icon}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{scenario.phase}</h3>
                        <p className="text-sm text-gray-400">{scenario.description}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedScenario === i ? "rotate-180" : ""}`} />
                  </div>

                  {expandedScenario === i && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      {scenario.sources && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Input Categories</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {scenario.sources.map((source, j) => (
                              <div key={j} className="bg-white/5 rounded-lg p-4">
                                <p className="font-bold text-white text-sm mb-3">{source.category}</p>
                                <ul className="space-y-1">
                                  {source.items.map((item, k) => (
                                    <li key={k} className="flex items-start gap-2 text-xs text-gray-300">
                                      <span className="w-1 h-1 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scenario.steps && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Modeling Steps</h4>
                          <div className="space-y-3">
                            {scenario.steps.map((step, j) => (
                              <div key={j} className="flex gap-4">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] text-xs font-bold flex-shrink-0">
                                  {j + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{step.name}</p>
                                  <p className="text-xs text-gray-400">{step.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scenario.algorithms && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-3">Algorithms & Methods</h4>
                          <ul className="space-y-2">
                            {scenario.algorithms.map((algo, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] mt-1.5 flex-shrink-0" />
                                {algo}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scenario.deliverables && (
                        <div className="mb-6">
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Output Deliverables</h4>
                          <div className="space-y-3">
                            {scenario.deliverables.map((deliv, j) => (
                              <div key={j} className="border border-[#2ed573]/30 bg-[#2ed573]/10 rounded-lg p-4">
                                <p className="font-bold text-white text-sm mb-1">{deliv.name}</p>
                                <p className="text-xs text-gray-400">{deliv.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {scenario.consumption && (
                        <div className="border-t border-white/10 pt-4">
                          <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Consumption</h4>
                          <p className="text-sm text-gray-300">{scenario.consumption}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Scenario Modeling Concept */}
          <div className="mt-12 bg-[#111827] border border-white/5 rounded-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <TrendingUp className="w-6 h-6 text-[#00d4ff] flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Scenario Modeling as Decision Support</p>
                <p className="text-sm text-gray-400">
                  Scenarios answer "What if?" questions by combining historical patterns, current indicators, and probabilistic modeling. They help organizations move from reactive to proactive postures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Implementation & Architecture</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            For detailed data lineage diagrams, dependency matrices, scenario playbooks, and performance optimization guidance:
          </p>
          <a href="mailto:info@eds-360.com" className="inline-flex items-center gap-2 text-[#00d4ff] font-bold hover:underline">
            info@eds-360.com
          </a>
        </section>
      </div>
    </div>
  );
}