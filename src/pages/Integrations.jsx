import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Terminal, Code2, Package, Puzzle, Shield, Zap, Globe2, ArrowRight,
  ChevronDown, ChevronUp, Plus, Download, ExternalLink, Cpu, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RED_TEAM_TOOLS = [
  { name: "Cobalt Strike", desc: "Import beacon logs, aggressor scripts, and C2 sessions as threat indicators and operational events.", tag: "C2 Framework", color: "#ff4757" },
  { name: "Metasploit", desc: "Pull exploit results and session data into ASOSINT for red team timeline correlation and actor profiling.", tag: "Exploitation", color: "#ff6b35" },
  { name: "Core Impact", desc: "Map penetration test findings directly to MITRE ATT&CK TTPs in ASOSINT's analysis engine.", tag: "Pentest", color: "#ffa502" },
  { name: "Kali Linux Tools", desc: "Native transform wrappers for nmap, Nessus, Nikto, Hydra, and 50+ Kali tools via CLI bridge.", tag: "Multi-Tool", color: "#2ed573" },
  { name: "Parrot OS", desc: "Full compatibility with Parrot Security tools — import recon, scan, and exploit results via ASOSINT bridge agent.", tag: "OS Platform", color: "#00d4ff" },
  { name: "BloodHound / SharpHound", desc: "Ingest AD attack paths and pivot data into ASOSINT's entity graph for insider threat and lateral movement analysis.", tag: "AD Recon", color: "#a855f7" },
  { name: "Burp Suite", desc: "Web vulnerability findings and proxy intercepts map to TTP clusters and threat indicators automatically.", tag: "Web Security", color: "#f59e0b" },
  { name: "Nessus / OpenVAS", desc: "Vulnerability scan results auto-enrich assets and feed risk scoring in the ASOSINT asset registry.", tag: "Vulnerability Mgmt", color: "#06b6d4" },
];

const COTS_TOOLS = [
  { name: "Splunk", desc: "Bidirectional SIEM integration — push threat indicators from ASOSINT and pull alerts back as operational events.", tag: "SIEM" },
  { name: "Microsoft Sentinel", desc: "Native connector for syncing threat actor profiles, campaigns, and indicators as Sentinel watchlists and incidents.", tag: "SIEM" },
  { name: "CrowdStrike Falcon", desc: "EDR telemetry feeds ASOSINT's threat correlation engine. Share IOCs and actor attribution in real time.", tag: "EDR" },
  { name: "SentinelOne", desc: "Threat detections from SentinelOne auto-populate ASOSINT operational events with full kill-chain context.", tag: "EDR" },
  { name: "Palo Alto XSOAR", desc: "Playbook integration — ASOSINT actions available as XSOAR commands for automated enrichment and response.", tag: "SOAR" },
  { name: "Recorded Future", desc: "Import RF intelligence bundles as ASOSINT feed sources — actors, TTPs, and IOCs enriched and correlated.", tag: "TI Feed" },
  { name: "VirusTotal", desc: "Hash, domain, and IP lookups auto-enriched via VT API, results stored as indicator transforms.", tag: "Enrichment" },
  { name: "Shodan", desc: "Infrastructure discovery results map to ASOSINT asset registry and threat indicators automatically.", tag: "Recon" },
  { name: "TheHive", desc: "Case management sync — ASOSINT incidents create TheHive cases, investigations auto-update both platforms.", tag: "Case Mgmt" },
  { name: "MISP", desc: "Full MISP feed compatibility — import and export threat intelligence in MISP-native formats.", tag: "Sharing" },
];

const SDK_FEATURES = [
  { icon: Code2, title: "REST API", desc: "Full RESTful API with OpenAPI 3.0 spec. Create, read, update, delete any entity, trigger transforms, and stream events." },
  { icon: Package, title: "Transform SDK", desc: "Build custom transforms in Python, Node.js, or Go. Submit to the ASOSINT Vendor Marketplace or deploy privately." },
  { icon: Puzzle, title: "Plugin Framework", desc: "Extend the UI with custom panels, widgets, and map layers. React-based plugin system with hot-reload support." },
  { icon: Terminal, title: "CLI Bridge", desc: "asosint-cli: pipe tool output directly into ASOSINT entities. Supports stdin/stdout from any command-line tool." },
  { icon: Cpu, title: "Agent API", desc: "Deploy custom AI agents that read/write ASOSINT entities, trigger workflows, and appear in the Agent Marketplace." },
  { icon: Globe2, title: "Webhook Engine", desc: "Subscribe to entity events (create, update, delete) and push to any endpoint — SIEM, Slack, PagerDuty, custom apps." },
];

const VENDOR_STEPS = [
  { num: "01", title: "Register as a Vendor", desc: "Apply through the Partner Portal. Approved vendors get sandbox access, API keys, and SDK documentation." },
  { num: "02", title: "Build Your Integration", desc: "Use the Transform SDK or Plugin Framework to build your integration. Full test suite and validator included." },
  { num: "03", title: "Submit for Review", desc: "Submit through the Marketplace submission pipeline. Security review + functionality test completed within 5 business days." },
  { num: "04", title: "Publish & Monetize", desc: "List your integration in the ASOSINT Agent & Transform Marketplace. Set pricing, manage installs, and track usage analytics." },
];

export default function Integrations() {
  const [expandedRed, setExpandedRed] = useState(null);
  const [activeTab, setActiveTab] = useState("redteam");

  const tabs = [
    { id: "redteam", label: "Red Team Tools" },
    { id: "cots", label: "COTS Integrations" },
    { id: "sdk", label: "SDK & APIs" },
    { id: "vendor", label: "Vendor Program" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-[#0d1220] border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 px-3 py-1 rounded-full mb-4">Open Platform</span>
          <h1 className="text-5xl font-black mb-6">Integrations, SDK & Vendor Ecosystem</h1>
          <p className="text-xl text-gray-400 mb-8">
            ASOSINT is an open, extensible intelligence platform. Integrate your existing COTS tools, red team tooling, proprietary systems, and custom applications — or build new transforms and agents for the Marketplace.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Apply as Vendor <ArrowRight className="w-4 h-4 ml-1" /></Button>
            <Link to={createPageUrl("PartnerPortal")}>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:border-[#00d4ff]/40">Partner Portal</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-[#0a0e1a]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Red Team Tools */}
        {activeTab === "redteam" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3">Red Team & Offensive Security Tools</h2>
              <p className="text-gray-400">Connect your red team stack to ASOSINT. Import findings, sessions, and recon data — then correlate directly with threat actor profiles, TTPs, and campaigns in the platform.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {RED_TEAM_TOOLS.map((tool, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/8 bg-[#111827] p-5 hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => setExpandedRed(expandedRed === idx ? null : idx)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: tool.color }} />
                      <div>
                        <div className="font-bold text-white">{tool.name}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${tool.color}20`, color: tool.color }}>{tool.tag}</span>
                      </div>
                    </div>
                    {expandedRed === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                  {expandedRed === idx && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-sm text-gray-300 mb-3">{tool.desc}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 text-xs">
                          <Download className="w-3 h-3 mr-1" /> Get Connector
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-500 hover:text-gray-300 text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" /> Docs
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5">
              <div className="flex items-start gap-4">
                <Terminal className="w-6 h-6 text-[#00d4ff] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#00d4ff] mb-2">CLI Bridge — Pipe Any Tool Into ASOSINT</h3>
                  <code className="block text-sm text-gray-300 bg-black/40 rounded-lg p-3 font-mono mb-3">
                    nmap -oJ - 192.168.1.0/24 | asosint-cli ingest --type asset_scan --campaign my-op
                  </code>
                  <p className="text-sm text-gray-400">Any tool that outputs JSON, CSV, or XML can be piped directly into ASOSINT entities via the CLI bridge. Supports streaming, batch, and interactive modes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COTS Integrations */}
        {activeTab === "cots" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3">Commercial Off-The-Shelf (COTS) Integrations</h2>
              <p className="text-gray-400">Seamlessly connect your existing enterprise security stack. ASOSINT works alongside — and enhances — your current tooling investments.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COTS_TOOLS.map((tool, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-[#111827] p-5 hover:border-[#00d4ff]/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-white">{tool.name}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{tool.tag}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{tool.desc}</p>
                  <Button size="sm" variant="ghost" className="text-[#00d4ff] hover:text-[#00bfe6] text-xs p-0 h-auto">
                    View Integration <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-xl border border-white/8 bg-[#111827]">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Plus className="w-4 h-4 text-[#00d4ff]" /> Don't See Your Tool?</h3>
              <p className="text-sm text-gray-400 mb-4">ASOSINT's open API and Transform SDK let you build an integration with any COTS product in hours, not months. Submit it to the Marketplace or keep it proprietary.</p>
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Request an Integration</Button>
            </div>
          </div>
        )}

        {/* SDK & APIs */}
        {activeTab === "sdk" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3">SDK, APIs & Developer Tools</h2>
              <p className="text-gray-400">Everything you need to build on, extend, and integrate with ASOSINT — from simple REST calls to full custom agent deployments.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {SDK_FEATURES.map((feat, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-[#111827] p-6">
                  <feat.icon className="w-6 h-6 text-[#00d4ff] mb-3" />
                  <h3 className="font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-400">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Proprietary Tool Integration */}
            <div className="rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/5 p-6 mb-5">
              <h3 className="font-bold text-[#a855f7] mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Proprietary & Internal Tool Integration</h3>
              <p className="text-sm text-gray-300 mb-4">Keep your proprietary tools private. ASOSINT supports air-gapped, on-prem, and hybrid deployment models for sensitive government and enterprise environments. Custom transforms run entirely within your environment — no data leaves your perimeter.</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {["Private Transform Registry", "On-Prem Agent Deployment", "Air-Gapped Mode"].map(item => (
                  <div key={item} className="bg-black/20 rounded-lg px-3 py-2 text-sm text-[#a855f7] font-medium text-center">{item}</div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-6">
              <h3 className="font-bold text-white mb-4">Quick Start</h3>
              <pre className="text-sm text-green-400 bg-black/40 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed">{`# Install ASOSINT CLI
npm install -g @asosint/cli

# Authenticate
asosint auth login --tenant your-org

# Ingest an indicator
asosint indicator create \\
  --type ip_address \\
  --value 198.51.100.5 \\
  --severity high \\
  --tags "cobalt-strike,c2"

# List transforms
asosint transforms list

# Run a transform
asosint transforms run enrich_ip --value 198.51.100.5`}</pre>
            </div>
          </div>
        )}

        {/* Vendor Program */}
        {activeTab === "vendor" && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-3">Vendor & Developer Program</h2>
              <p className="text-gray-400">Build applications, transforms, and AI agents for the ASOSINT ecosystem. Reach thousands of intelligence analysts, SOC teams, and operators through the Marketplace.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {VENDOR_STEPS.map(step => (
                <div key={step.num} className="rounded-xl border border-white/8 bg-[#111827] p-5">
                  <div className="text-3xl font-black text-[#00d4ff]/20 mb-3">{step.num}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {[
                { title: "Transform Vendor", desc: "Build data enrichment and pivot transforms that analysts can run on any indicator, entity, or actor.", icon: Puzzle, color: "#00d4ff" },
                { title: "App Developer", desc: "Create standalone applications that sit alongside ASOSINT modules — case managers, reporting tools, map overlays.", icon: Code2, color: "#a855f7" },
                { title: "Agent Publisher", desc: "Deploy AI agents that automate intelligence workflows and appear in the ASOSINT Agent Marketplace.", icon: Cpu, color: "#2ed573" },
              ].map((type, idx) => (
                <div key={idx} className="rounded-xl border p-6" style={{ borderColor: `${type.color}20`, background: `${type.color}08` }}>
                  <type.icon className="w-7 h-7 mb-4" style={{ color: type.color }} />
                  <h3 className="font-bold text-white mb-2">{type.title}</h3>
                  <p className="text-sm text-gray-400">{type.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#2ed573]/20 bg-[#2ed573]/5 p-6 text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to Build on ASOSINT?</h3>
              <p className="text-gray-400 mb-6">Join the Vendor Program to get sandbox credentials, SDK access, documentation, and a dedicated technical partner manager.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to={createPageUrl("PartnerPortal")}>
                  <Button className="bg-[#2ed573] text-black hover:bg-[#27c265]">Apply to Vendor Program</Button>
                </Link>
                <Button variant="outline" className="border-[#2ed573]/30 text-[#2ed573] hover:bg-[#2ed573]/10">
                  <ExternalLink className="w-4 h-4 mr-1" /> View SDK Docs
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}