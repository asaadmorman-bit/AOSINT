import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap, Shield, Terminal, Globe2, Search, Plus, ChevronRight,
  Code2, Package, Users, Upload, Settings, Check, ExternalLink, Star
} from "lucide-react";

const CATEGORIES = ["All", "EDS Products", "Red Team", "OSINT", "COTS", "Proprietary", "Vendor SDK"];

const INTEGRATIONS = [
  // EDS Products
  {
    id: "izulu_sentinel",
    name: "Izulu Sentinel",
    category: "EDS Products",
    status: "available",
    desc: "Real-time threat detection and automated response platform by EDS. Bi-directional sync of alerts, incidents, detection rules, and response actions with ASOSINT's intelligence graph and playbook engine.",
    icon: "⚡",
    tier: "enterprise",
    eds: true,
    features: ["Bi-directional alert sync", "Shared detection rule library", "Unified incident timeline", "Joint playbook execution", "Single-pane-of-glass SOC view"],
    docs_url: "#",
    color: "from-yellow-900/30 to-orange-900/20",
    border: "border-yellow-500/30",
    badge_color: "bg-yellow-900/30 text-yellow-300",
  },
  {
    id: "outpost_zero",
    name: "Outpost Zero",
    category: "EDS Products",
    status: "available",
    desc: "Forward-deployed, disconnected-environment intelligence and situational awareness platform by EDS. Sync field intelligence, operational events, and ground-truth IOCs from austere or air-gapped deployments back into ASOSINT.",
    icon: "🛰️",
    tier: "enterprise",
    eds: true,
    features: ["Air-gap / offline sync bridge", "Field intelligence ingestion", "Operational event correlation", "Asset registry shared sync", "Geospatial IOC mapping"],
    docs_url: "#",
    color: "from-green-900/30 to-emerald-900/20",
    border: "border-green-500/30",
    badge_color: "bg-green-900/30 text-green-300",
  },
  {
    id: "dojo_core",
    name: "Dojo Core",
    category: "EDS Products",
    status: "available",
    desc: "EDS's cybersecurity training, skills assessment, and range platform. Push live threat scenarios from ASOSINT into Dojo Core for real-world training exercises, and pull analyst performance and certification data back.",
    icon: "🥋",
    tier: "pro",
    eds: true,
    features: ["Live threat scenario injection", "Analyst certification sync", "Red/Blue exercise coordination", "Performance metrics sharing", "Curriculum driven by live intel"],
    docs_url: "#",
    color: "from-blue-900/30 to-indigo-900/20",
    border: "border-blue-500/30",
    badge_color: "bg-blue-900/30 text-blue-300",
  },
  // Red Team
  { id: "cobalt_strike", name: "Cobalt Strike", category: "Red Team", status: "available", desc: "Bi-directional beacon data ingestion, malleable C2 profile analysis, and post-exploitation TTP mapping.", icon: "🎯", tier: "enterprise" },
  { id: "metasploit", name: "Metasploit Framework", category: "Red Team", status: "available", desc: "Import exploit modules, session data, and findings directly into ASOSINT's threat graph.", icon: "💥", tier: "pro" },
  { id: "core_impact", name: "Core Impact", category: "Red Team", status: "available", desc: "Sync penetration test results and vulnerability chains into the ASOSINT asset risk matrix.", icon: "⚡", tier: "enterprise" },
  { id: "kali", name: "Kali Linux Tools", category: "Red Team", status: "available", desc: "Native transform bridge for nmap, nikto, masscan, enum4linux, and 50+ Kali CLI tools.", icon: "🐉", tier: "pro" },
  { id: "parrot", name: "Parrot OS Suite", category: "Red Team", status: "available", desc: "Full Parrot OS tool integration including AnonSurf, MassDNS, and Aircrack-ng pipelines.", icon: "🦜", tier: "pro" },
  { id: "burp", name: "Burp Suite", category: "Red Team", status: "beta", desc: "Push Burp scan results as threat indicators with severity scoring and CVE correlation.", icon: "🔍", tier: "pro" },
  // OSINT
  { id: "shodan", name: "Shodan", category: "OSINT", status: "available", desc: "Query Shodan directly from entity records; auto-enrich IPs and domains with banner data.", icon: "🌊", tier: "pro" },
  { id: "maltego", name: "Maltego Transforms", category: "OSINT", status: "available", desc: "Import and run Maltego-compatible transforms natively inside ASOSINT's graph engine.", icon: "🕸️", tier: "pro" },
  { id: "spiderfoot", name: "SpiderFoot HX", category: "OSINT", status: "available", desc: "Pipe SpiderFoot scan results into ASOSINT indicators with auto-tagging and deduplication.", icon: "🕷️", tier: "community" },
  { id: "censys", name: "Censys", category: "OSINT", status: "available", desc: "Internet-wide scan data enrichment for IP addresses, certificates, and exposed services.", icon: "📡", tier: "pro" },
  { id: "virustotal", name: "VirusTotal", category: "OSINT", status: "available", desc: "Hash, URL, and domain reputation lookups with multi-engine scoring.", icon: "🦠", tier: "community" },
  { id: "intelx", name: "Intelligence X", category: "OSINT", status: "available", desc: "Dark web, leaked credentials, and deep web search integration.", icon: "🔎", tier: "enterprise" },
  // COTS
  { id: "splunk", name: "Splunk", category: "COTS", status: "available", desc: "Bi-directional SIEM integration — ingest alerts and push enriched IOCs back to Splunk.", icon: "📊", tier: "enterprise" },
  { id: "crowdstrike", name: "CrowdStrike Falcon", category: "COTS", status: "available", desc: "EDR telemetry fusion with threat actor attribution and indicator correlation.", icon: "🦅", tier: "enterprise" },
  { id: "sentinel", name: "Microsoft Sentinel", category: "COTS", status: "available", desc: "Azure Sentinel SIEM integration with KQL query bridge and incident enrichment.", icon: "🛡️", tier: "enterprise" },
  { id: "elastic", name: "Elastic SIEM", category: "COTS", status: "beta", desc: "ECS-compliant event ingestion and threat signal forwarding.", icon: "🟡", tier: "pro" },
  { id: "servicenow", name: "ServiceNow SecOps", category: "COTS", status: "available", desc: "Automated ticket creation from ASOSINT alerts with full context payload.", icon: "🎫", tier: "enterprise" },
  // Proprietary
  { id: "custom_api", name: "Custom REST API", category: "Proprietary", status: "available", desc: "Connect any REST API as a data source, transform, or alert sink using the ASOSINT Connector SDK.", icon: "🔗", tier: "pro" },
  { id: "custom_feed", name: "Custom Threat Feed", category: "Proprietary", status: "available", desc: "Ingest STIX/TAXII, CSV, JSON, or XML proprietary feeds with field mapping UI.", icon: "📥", tier: "pro" },
  { id: "custom_transform", name: "Custom Transforms", category: "Proprietary", status: "available", desc: "Build JavaScript/Python transforms that run inside the ASOSINT graph engine.", icon: "⚙️", tier: "pro" },
  // Vendor SDK
  { id: "vendor_sdk", name: "Vendor SDK", category: "Vendor SDK", status: "available", desc: "Full SDK for vendors to publish transforms, data connectors, and marketplace apps for ASOSINT.", icon: "📦", tier: "enterprise" },
  { id: "transform_api", name: "Transform API", category: "Vendor SDK", status: "available", desc: "REST-based transform API specification for building platform-compatible data enrichment services.", icon: "🔄", tier: "pro" },
  { id: "marketplace_submit", name: "Marketplace Submission", category: "Vendor SDK", status: "available", desc: "Publish and monetize your integration in the ASOSINT Marketplace for 300K+ users.", icon: "🏪", tier: "community" },
];

const STATUS_COLORS = { available: "text-[#2ed573]", beta: "text-[#ffa502]", coming_soon: "text-gray-500" };
const STATUS_LABELS = { available: "Available", beta: "Beta", coming_soon: "Coming Soon" };
const TIER_COLORS = { community: "bg-gray-700 text-gray-300", pro: "bg-[#00d4ff]/10 text-[#00d4ff]", enterprise: "bg-purple-900/40 text-purple-300" };

export default function IntegrationHub() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("browse"); // browse | build | vendors

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = activeCategory === "All" || i.category === activeCategory;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[#00d4ff] text-xs font-bold uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" /> Integration Hub
        </div>
        <h1 className="text-2xl font-black text-white">Tools, COTS & Vendor Ecosystem</h1>
        <p className="text-gray-400 text-sm">Connect red team frameworks, OSINT tools, COTS platforms, and your own proprietary data sources. Build and publish your own transforms and apps.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111827] border border-white/5 rounded-xl p-1 w-fit">
        {[
          { id: "browse", label: "Browse Integrations", icon: Globe2 },
          { id: "build", label: "Build Custom", icon: Code2 },
          { id: "vendors", label: "Vendor Program", icon: Package },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-[#00d4ff] text-black" : "text-gray-400 hover:text-gray-200"}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <div className="space-y-5">

          {/* EDS First-Party Products Featured Banner */}
          {(activeCategory === "All" || activeCategory === "EDS Products") && !search && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#00d4ff]" />
                <p className="text-sm font-bold text-white">Emerging Defense Solutions Products</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">NATIVE INTEGRATION</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INTEGRATIONS.filter(i => i.eds).map(product => (
                  <div key={product.id} className={`bg-gradient-to-br ${product.color} border ${product.border} rounded-xl p-5 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{product.icon}</span>
                        <div>
                          <p className="font-black text-white text-sm">{product.name}</p>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${product.badge_color}`}>EDS PRODUCT</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${TIER_COLORS[product.tier]}`}>{product.tier}</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{product.desc}</p>
                    <div className="space-y-1">
                      {product.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check className="w-3 h-3 text-[#2ed573] shrink-0" />{f}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs h-7 gap-1">
                        <Settings className="w-3 h-3" /> Configure
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white h-7 px-2">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-3" />
            </div>
          )}

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search integrations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[#111827] border-white/10 text-gray-200 w-64 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat ? "bg-[#00d4ff] text-black" : "bg-[#111827] border border-white/5 text-gray-400 hover:text-gray-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(integration => (
              <div key={integration.id} className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-[#00d4ff]/20 transition-colors group space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="font-bold text-white text-sm">{integration.name}</p>
                      <p className={`text-[10px] font-semibold ${STATUS_COLORS[integration.status]}`}>{STATUS_LABELS[integration.status]}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${TIER_COLORS[integration.tier]}`}>{integration.tier}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{integration.desc}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">{integration.category}</Badge>
                  <Button size="sm" variant="ghost" className="text-[#00d4ff] text-xs h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    Configure <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build Custom Tab */}
      {activeTab === "build" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Transform Builder */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="font-bold text-white">Custom Transform Builder</p>
                  <p className="text-xs text-gray-500">Write transforms in JavaScript or Python</p>
                </div>
              </div>
              <div className="bg-[#0a0e1a] rounded-lg p-4 font-mono text-xs text-green-400 space-y-1">
                <p className="text-gray-600">// ASOSINT Transform SDK v1.0</p>
                <p><span className="text-[#00d4ff]">export</span> <span className="text-purple-400">async</span> <span className="text-yellow-400">function</span> <span className="text-white">transform</span>(input) {"{"}</p>
                <p className="ml-4 text-gray-300">const result = <span className="text-[#00d4ff]">await</span> enrich(input.value);</p>
                <p className="ml-4 text-gray-300"><span className="text-[#00d4ff]">return</span> {"{"} nodes: [...result.entities], edges: [...] {"}"};</p>
                <p>{"}"}</p>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-400">
                {["Full access to ASOSINT graph API", "Input validation & schema support", "Rate limiting & caching built-in", "Deploy in seconds via CLI"].map(item => (
                  <li key={item} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#2ed573]" />{item}</li>
                ))}
              </ul>
              <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 text-sm">
                <Terminal className="w-4 h-4" /> Open Transform Editor
              </Button>
            </div>

            {/* Custom Feed Connector */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/40 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Proprietary Feed Connector</p>
                  <p className="text-xs text-gray-500">Ingest your own data in any format</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Supported Formats", value: "STIX 2.x, TAXII 2.1, CSV, JSON, XML, NDJSON" },
                  { label: "Auth Methods", value: "API Key, OAuth 2.0, mTLS, Basic Auth" },
                  { label: "Field Mapping", value: "Visual drag-and-drop field mapper" },
                  { label: "Refresh Rate", value: "5 min → 24 hr configurable intervals" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="text-gray-300 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-purple-700 hover:bg-purple-600 gap-2 text-sm text-white">
                <Settings className="w-4 h-4" /> Configure Feed
              </Button>
            </div>

            {/* Red Team Bridge */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Red Team Bridge</p>
                  <p className="text-xs text-gray-500">Cobalt Strike · Metasploit · Core Impact · Kali · Parrot</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { tool: "Cobalt Strike", action: "Import beacon logs, malleable profiles, and post-ex TTPs" },
                  { tool: "Metasploit", action: "Sync sessions, auxiliary findings, and loot into graph" },
                  { tool: "Core Impact", action: "Map penetration chains to ASOSINT asset risk scores" },
                  { tool: "Kali / Parrot", action: "CLI wrapper for 60+ tools with auto-parsed output" },
                ].map(row => (
                  <div key={row.tool} className="bg-[#0a0e1a] rounded-lg px-4 py-2.5 flex items-start gap-3">
                    <span className="text-red-400 font-bold text-xs w-24 shrink-0">{row.tool}</span>
                    <span className="text-gray-400 text-xs">{row.action}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-red-800 hover:bg-red-700 gap-2 text-sm text-white">
                <Terminal className="w-4 h-4" /> Configure Red Team Bridge
              </Button>
            </div>

            {/* REST API Connector */}
            <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-white">REST / Webhook Connector</p>
                  <p className="text-xs text-gray-500">Any REST API as a source or sink</p>
                </div>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="bg-[#0a0e1a] rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Endpoint URL</p>
                  <p className="text-[#00d4ff] font-mono">https://api.yourtool.com/v1/alerts</p>
                </div>
                <div className="bg-[#0a0e1a] rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Outbound Webhook (push enriched IOCs)</p>
                  <p className="text-[#00d4ff] font-mono">https://asosint.io/webhook/{"{your_key}"}</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-400">
                {["Drag-and-drop field mapping", "Response schema auto-detection", "Retry logic & dead-letter queue", "Signed webhook payloads"].map(item => (
                  <li key={item} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#2ed573]" />{item}</li>
                ))}
              </ul>
              <Button className="w-full bg-yellow-700 hover:bg-yellow-600 gap-2 text-sm text-white">
                <Plus className="w-4 h-4" /> Add REST Connector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Program Tab */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#111827] to-[#0d1220] border border-[#00d4ff]/10 rounded-xl p-8 text-center space-y-3">
            <Package className="w-10 h-10 text-[#00d4ff] mx-auto" />
            <h2 className="text-2xl font-black text-white">ASOSINT Vendor Partner Program</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">Build and publish transforms, data connectors, and full applications that work natively inside ASOSINT. Reach 300K+ intelligence professionals, security teams, and government clients.</p>
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 mt-2">
              <Users className="w-4 h-4" /> Apply to Vendor Program
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Code2, color: "text-[#00d4ff]", bg: "bg-[#00d4ff]/10", title: "SDK Access", items: ["Transform SDK (JS/Python)", "Graph API access", "Entity schema SDK", "CLI dev tools & emulator", "Automated testing harness"] },
              { icon: Package, color: "text-purple-400", bg: "bg-purple-900/30", title: "Marketplace Publishing", items: ["Approval within 5 business days", "Version management & rollbacks", "Usage analytics dashboard", "Revenue sharing program", "Co-marketing opportunities"] },
              { icon: Shield, color: "text-[#2ed573]", bg: "bg-[#2ed573]/10", title: "Certification Tiers", items: ["Bronze: Community transforms", "Silver: Pro data connectors", "Gold: Enterprise app bundles", "Government: CI/SCIF-cleared apps", "Platinum: Strategic partner"] },
            ].map(card => (
              <div key={card.title} className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="font-bold text-white">{card.title}</p>
                <ul className="space-y-1.5">
                  {card.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-400">
                      <Check className="w-3.5 h-3.5 text-[#2ed573] shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Process Steps */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-4">
            <p className="font-bold text-white text-sm">How to Publish Your Integration</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Apply", desc: "Submit vendor application with product overview and intended use case." },
                { step: "02", title: "Build", desc: "Use our SDK to build transforms, connectors, or full applications." },
                { step: "03", title: "Test", desc: "Validate against our automated test suite and security review." },
                { step: "04", title: "Publish", desc: "Go live on the ASOSINT Marketplace and reach our entire user base." },
              ].map(s => (
                <div key={s.step} className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
                    <span className="text-[#00d4ff] text-xs font-bold">{s.step}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">{s.title}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}