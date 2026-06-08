import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, Shield, Zap, Globe2, Brain, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { name: "ASOSINT", highlight: true, logo: null },
  { name: "Maltego", highlight: false },
  { name: "Recorded Future", highlight: false },
  { name: "Shodan", highlight: false },
  { name: "Palantir Gotham", highlight: false },
  { name: "SpiderFoot", highlight: false },
];

const FEATURES = [
  {
    category: "Intelligence Domains",
    rows: [
      { label: "Cyber Threat Intelligence", values: [true, true, true, true, true, true] },
      { label: "Physical Security Intelligence", values: [true, false, false, false, true, false] },
      { label: "Influence & Narrative Tracking", values: [true, false, true, false, true, false] },
      { label: "Geopolitical Analysis", values: [true, false, true, false, true, false] },
      { label: "Protective Intelligence (EP)", values: [true, false, false, false, false, false] },
      { label: "Cross-Domain Fusion", values: [true, false, false, false, "partial", false] },
    ],
  },
  {
    category: "Data & Transforms",
    rows: [
      { label: "Custom Transforms / Plugins", values: [true, true, false, false, true, true] },
      { label: "COTS Tool Integration", values: [true, "partial", "partial", false, true, "partial"] },
      { label: "Red Team Tool Integration", values: [true, false, false, false, false, "partial"] },
      { label: "Open API / SDK for Vendors", values: [true, false, false, true, false, true] },
      { label: "Live Feed Ingestion", values: [true, false, true, true, true, "partial"] },
      { label: "MITRE ATT&CK Mapping", values: [true, "partial", true, false, true, true] },
    ],
  },
  {
    category: "AI & Automation",
    rows: [
      { label: "AI-Powered Correlation", values: [true, false, true, false, true, false] },
      { label: "Agent Marketplace", values: [true, false, false, false, false, false] },
      { label: "Automated TTP Analysis", values: [true, false, true, false, false, false] },
      { label: "Threat Actor Profiling (AI)", values: [true, false, true, false, true, false] },
      { label: "Scenario Forecasting", values: [true, false, false, false, true, false] },
    ],
  },
  {
    category: "Operations & Collaboration",
    rows: [
      { label: "Multi-Tenant Architecture", values: [true, false, true, false, true, false] },
      { label: "Operator / Analyst Roles", values: [true, true, true, false, true, true] },
      { label: "Red/Blue Cell Module", values: [true, false, false, false, "partial", false] },
      { label: "Forum / Community Hub", values: [true, false, false, false, false, false] },
      { label: "Executive Dashboards", values: [true, false, true, false, true, false] },
    ],
  },
  {
    category: "Deployment & Pricing",
    rows: [
      { label: "Free Community Tier", values: [true, false, false, true, false, true] },
      { label: "SaaS + On-Prem Options", values: [true, false, true, false, true, false] },
      { label: "Government / CI Edition", values: [true, false, true, false, true, false] },
      { label: "Transparent Public Pricing", values: [true, false, false, true, false, true] },
    ],
  },
];

const Icon = ({ val }) => {
  if (val === true) return <CheckCircle2 className="w-5 h-5 text-[#2ed573] mx-auto" />;
  if (val === false) return <XCircle className="w-5 h-5 text-[#ff4757]/60 mx-auto" />;
  return <MinusCircle className="w-5 h-5 text-yellow-500/70 mx-auto" title="Partial" />;
};

export default function ToolComparison() {
  const [activeCategory, setActiveCategory] = useState(null);

  const filteredFeatures = activeCategory
    ? FEATURES.filter(f => f.category === activeCategory)
    : FEATURES;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <section className="py-20 px-4 text-center border-b border-white/5 bg-[#0d1220]">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#00d4ff] bg-[#00d4ff]/10 px-3 py-1 rounded-full mb-4">Platform Comparison</span>
          <h1 className="text-5xl font-black mb-6">How ASOSINT Stacks Up</h1>
          <p className="text-xl text-gray-400 mb-8">
            See how ASOSINT compares against leading OSINT and threat intelligence platforms — across every domain, capability, and use case.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["All", ...FEATURES.map(f => f.category)].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === "All" ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  (cat === "All" && !activeCategory) || activeCategory === cat
                    ? "bg-[#00d4ff] text-black border-[#00d4ff]"
                    : "border-white/10 text-gray-400 hover:border-[#00d4ff]/40 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="text-left py-4 px-4 text-gray-500 font-medium text-sm w-64">Feature</th>
                {TOOLS.map(tool => (
                  <th key={tool.name} className={`py-4 px-3 text-center ${tool.highlight ? "bg-[#00d4ff]/5 border-x border-[#00d4ff]/20 rounded-t-xl" : ""}`}>
                    <div className={`text-sm font-bold ${tool.highlight ? "text-[#00d4ff]" : "text-gray-300"}`}>{tool.name}</div>
                    {tool.highlight && <div className="text-[9px] text-[#00d4ff]/60 uppercase tracking-widest mt-0.5">Your Platform</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map(section => (
                <React.Fragment key={section.category}>
                  <tr>
                    <td colSpan={TOOLS.length + 1} className="pt-8 pb-2 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff]">{section.category}</span>
                    </td>
                  </tr>
                  {section.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-300">{row.label}</td>
                      {row.values.map((val, vIdx) => (
                        <td key={vIdx} className={`py-3 px-3 text-center ${TOOLS[vIdx].highlight ? "bg-[#00d4ff]/5 border-x border-[#00d4ff]/10" : ""}`}>
                          <Icon val={val} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {/* Bottom border for highlighted column */}
              <tr>
                <td className="pb-4" />
                {TOOLS.map(tool => (
                  <td key={tool.name} className={tool.highlight ? "bg-[#00d4ff]/5 border-x border-b border-[#00d4ff]/20 rounded-b-xl pb-4" : "pb-4"} />
                ))}
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#2ed573]" /> Full support</span>
            <span className="flex items-center gap-1.5"><MinusCircle className="w-4 h-4 text-yellow-500/70" /> Partial support</span>
            <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-[#ff4757]/60" /> Not supported</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#0d1220] border-t border-white/5 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
          <p className="text-gray-400 mb-8">ASOSINT is the only platform built for all domains, all teams, and all scales — from community safety to enterprise defense.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Explore the Platform <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
            <Link to={createPageUrl("Integrations")}>
              <Button variant="outline" className="border-[#00d4ff]/40 text-[#00d4ff] hover:bg-[#00d4ff]/10">View Integrations & SDK</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}