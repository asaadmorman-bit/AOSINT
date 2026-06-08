import React, { useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, ChevronDown, ChevronUp, Shield, Zap, Globe2, Cpu, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COMPETITORS = [
  { id: "asosint", name: "ASOSINT", highlight: true },
  { id: "maltego", name: "Maltego" },
  { id: "spiderfoot", name: "SpiderFoot" },
  { id: "shodan", name: "Shodan" },
  { id: "recon_ng", name: "Recon-ng" },
  { id: "recorded_future", name: "Recorded Future" },
];

const CATEGORIES = [
  {
    label: "Core Intelligence",
    features: [
      { name: "Multi-Domain Threat Intelligence (Cyber + Physical + Influence)", asosint: true, maltego: "partial", spiderfoot: false, shodan: false, recon_ng: false, recorded_future: "partial" },
      { name: "Real-time Threat Feeds", asosint: true, maltego: false, spiderfoot: true, shodan: true, recon_ng: false, recorded_future: true },
      { name: "MITRE ATT&CK TTP Mapping", asosint: true, maltego: "partial", spiderfoot: false, shodan: false, recon_ng: false, recorded_future: true },
      { name: "Geopolitical & Narrative Intelligence", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: "partial" },
      { name: "Cross-Domain Correlation (Convergence/Fragmentation)", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
    ]
  },
  {
    label: "AI & Automation",
    features: [
      { name: "AI-Powered TTP Correlation", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: "partial" },
      { name: "Automated Threat Actor Profiling", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: true },
      { name: "AI Agent Orchestration", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
      { name: "Pattern of Life Analysis", asosint: true, maltego: "partial", spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
      { name: "Predictive Warning Time Scoring", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: "partial" },
    ]
  },
  {
    label: "Integrations & Extensibility",
    features: [
      { name: "Red Team Tool Integration (Cobalt Strike, Metasploit, etc.)", asosint: true, maltego: "partial", spiderfoot: false, shodan: false, recon_ng: true, recorded_future: false },
      { name: "Custom Transforms / Plugins", asosint: true, maltego: true, spiderfoot: true, shodan: false, recon_ng: true, recorded_future: false },
      { name: "Vendor SDK & Marketplace", asosint: true, maltego: true, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
      { name: "COTS Tool Integration", asosint: true, maltego: "partial", spiderfoot: "partial", shodan: false, recon_ng: "partial", recorded_future: "partial" },
      { name: "Proprietary Data Source Import", asosint: true, maltego: true, spiderfoot: true, shodan: false, recon_ng: true, recorded_future: true },
    ]
  },
  {
    label: "Operations & UX",
    features: [
      { name: "Interactive Network Graph", asosint: true, maltego: true, spiderfoot: "partial", shodan: false, recon_ng: false, recorded_future: "partial" },
      { name: "Executive Dashboard & Briefings", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: true },
      { name: "Scenario / Wargame Engine", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
      { name: "Role-Based Access & Multi-Tenant", asosint: true, maltego: "partial", spiderfoot: false, shodan: false, recon_ng: false, recorded_future: true },
      { name: "Community Intelligence Forum", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: false },
    ]
  },
  {
    label: "Pricing & Access",
    features: [
      { name: "Free Community Tier", asosint: true, maltego: "partial", spiderfoot: true, shodan: "partial", recon_ng: true, recorded_future: false },
      { name: "Open Source Option", asosint: false, maltego: false, spiderfoot: true, shodan: false, recon_ng: true, recorded_future: false },
      { name: "Government / CI Tier", asosint: true, maltego: false, spiderfoot: false, shodan: false, recon_ng: false, recorded_future: true },
      { name: "On-Premise Deployment", asosint: true, maltego: true, spiderfoot: true, shodan: false, recon_ng: true, recorded_future: false },
    ]
  }
];

function Cell({ value }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-[#2ed573] mx-auto" />;
  if (value === false) return <XCircle className="w-5 h-5 text-gray-600 mx-auto" />;
  return <MinusCircle className="w-5 h-5 text-[#ffa502] mx-auto" title="Partial" />;
}

export default function Comparison() {
  const [expandedCats, setExpandedCats] = useState(CATEGORIES.map(c => c.label));

  const toggle = (label) => setExpandedCats(prev =>
    prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-full px-4 py-1.5 text-[#00d4ff] text-xs font-semibold uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" /> Platform Comparison
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white">ASOSINT vs. The Market</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          See how ASOSINT's unified multi-domain intelligence platform stacks up against leading OSINT toolkits, data providers, and open-source tools.
        </p>
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" /> Supported</span>
          <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-[#ffa502]" /> Partial</span>
          <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-gray-600" /> Not Available</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-[#0d1220] border-b border-white/5">
              <th className="text-left px-5 py-4 text-gray-500 font-medium w-72">Feature</th>
              {COMPETITORS.map(c => (
                <th key={c.id} className={`px-4 py-4 text-center font-bold text-xs uppercase tracking-wide ${c.highlight ? "text-[#00d4ff]" : "text-gray-400"}`}>
                  {c.highlight && <div className="w-1.5 h-1.5 bg-[#00d4ff] rounded-full mx-auto mb-1 animate-pulse" />}
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => (
              <React.Fragment key={cat.label}>
                <tr
                  className="bg-[#111827] border-t border-white/5 cursor-pointer hover:bg-[#1a2235] transition-colors"
                  onClick={() => toggle(cat.label)}
                >
                  <td colSpan={COMPETITORS.length + 1} className="px-5 py-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00d4ff]">
                      {expandedCats.includes(cat.label) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {cat.label}
                    </div>
                  </td>
                </tr>
                {expandedCats.includes(cat.label) && cat.features.map((f, i) => (
                  <tr key={f.name} className={`border-t border-white/5 ${i % 2 === 0 ? "bg-[#0d1220]" : "bg-[#0a0e1a]"} hover:bg-[#1a2235]/40 transition-colors`}>
                    <td className="px-5 py-3 text-gray-300 text-xs leading-snug">{f.name}</td>
                    {COMPETITORS.map(c => (
                      <td key={c.id} className={`px-4 py-3 text-center ${c.highlight ? "bg-[#00d4ff]/5" : ""}`}>
                        <Cell value={f[c.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {[
          { icon: Globe2, title: "Multi-Domain Coverage", desc: "Cyber, physical, influence, and geopolitical intelligence in one unified platform — no other tool comes close." },
          { icon: Cpu, title: "AI-Native Architecture", desc: "Built from the ground up with AI agents, automated profiling, and predictive analytics baked in." },
          { icon: Zap, title: "Open Ecosystem", desc: "Vendor SDK, custom transforms, COTS integrations, and red team tool bridges all in one place." },
        ].map(item => (
          <div key={item.title} className="bg-[#111827] border border-[#00d4ff]/10 rounded-xl p-5 space-y-2">
            <item.icon className="w-6 h-6 text-[#00d4ff]" />
            <p className="font-bold text-white text-sm">{item.title}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}