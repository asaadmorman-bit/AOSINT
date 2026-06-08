import React, { useState, useEffect } from "react";
import { Globe2, TrendingUp, AlertCircle, Eye, Filter, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function GlobalThreatObservatory() {
  const [selectedDomain, setSelectedDomain] = useState("cyber");
  const [threatLevel, setThreatLevel] = useState("all");

  const domains = [
    { key: "cyber", label: "Cyber", color: "#00d4ff" },
    { key: "physical", label: "Physical", color: "#2ed573" },
    { key: "influence", label: "Influence", color: "#ffa502" },
    { key: "geopolitical", label: "Geopolitical", color: "#ff4757" },
    { key: "protective", label: "Protective Intel", color: "#a855f7" },
  ];

  const threatIndicators = [
    { id: 1, type: "Critical", count: 12, color: "#ff4757", domain: "cyber" },
    { id: 2, type: "High", count: 38, color: "#ffa502", domain: "physical" },
    { id: 3, type: "Medium", count: 142, color: "#ffd700", domain: "influence" },
    { id: 4, type: "Low", count: 89, color: "#00d4ff", domain: "geopolitical" },
    { id: 5, type: "Info", count: 234, color: "#6b7280", domain: "protective" },
  ];

  return (
    <ProtectedRoute minTier="pro">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
        {/* Header */}
        <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Globe2 className="w-8 h-8 text-[#00d4ff]" />
              <h1 className="text-4xl font-black text-white">Global Threat Observatory</h1>
            </div>
            <p className="text-gray-400 max-w-2xl">Real-time, multi-domain intelligence view of global risk. Cyber, physical, influence, geopolitical, and protective intelligence unified in one operational picture.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Threat Level Summary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Threat Landscape Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {threatIndicators.map((threat) => (
                <div
                  key={threat.id}
                  className="bg-[#111827] border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: threat.color }}
                    />
                    <p className="text-xs font-bold text-gray-400 uppercase">{threat.type}</p>
                  </div>
                  <p className="text-2xl font-black text-white">{threat.count}</p>
                  <p className="text-xs text-gray-500 mt-1">Active indicators</p>
                </div>
              ))}
            </div>
          </section>

          {/* Multi-Domain Threat Map */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Domain-Specific Views</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/20">
                  <Filter className="w-4 h-4 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="border-white/20">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {domains.map((domain) => (
                <div
                  key={domain.key}
                  className={`bg-[#111827] border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedDomain === domain.key
                      ? "border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                      : "border-white/5 hover:border-white/10"
                  }`}
                  onClick={() => setSelectedDomain(domain.key)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{domain.label} Domain</h3>
                      <p className="text-sm text-gray-400">Real-time threat indicators and exposure trends</p>
                    </div>
                    <TrendingUp className="w-5 h-5" style={{ color: domain.color }} />
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-500 mb-1">Active Threats</p>
                      <p className="text-lg font-bold text-white">
                        {Math.floor(Math.random() * 50) + 10}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-500 mb-1">24h Change</p>
                      <p className="text-lg font-bold" style={{ color: domain.color }}>
                        {Math.floor(Math.random() * 20) + 5}%
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-500 mb-1">Severity Avg</p>
                      <p className="text-lg font-bold text-white">
                        {(Math.random() * 100).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <p className="text-gray-500 mb-1">TTL (Hours)</p>
                      <p className="text-lg font-bold text-white">
                        {Math.floor(Math.random() * 72) + 1}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Key Metrics */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Key Indicators</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fragmentation Index</p>
                    <p className="text-3xl font-black text-white">6.8/10</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-[#ffa502]" />
                </div>
                <p className="text-xs text-gray-400">
                  Threat actors showing increased operational separation and decoupling across domains.
                </p>
              </div>

              <div className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Convergence Index</p>
                    <p className="text-3xl font-black text-white">4.3/10</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-[#2ed573]" />
                </div>
                <p className="text-xs text-gray-400">
                  Limited evidence of multi-domain attacks, but tactical coordination increasing.
                </p>
              </div>

              <div className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Global Risk Level</p>
                    <p className="text-3xl font-black text-white">High</p>
                  </div>
                  <AlertCircle className="w-6 h-6 text-[#ff4757]" />
                </div>
                <p className="text-xs text-gray-400">
                  Sustained elevated risk across cyber, geopolitical, and influence domains.
                </p>
              </div>
            </div>
          </section>

          {/* Narrative Propagation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Narrative Propagation Monitor</h2>
            <div className="bg-[#111827] border border-white/5 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#00d4ff]" />
                    Active Narratives
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "US-China tech competition escalation",
                      "Energy security vulnerabilities in Europe",
                      "Disinformation about critical infrastructure",
                      "Border security amplification campaigns",
                    ].map((narrative, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff] mt-1.5 flex-shrink-0" />
                        {narrative}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-4">Propagation Metrics</h3>
                  <div className="space-y-4">
                    {[
                      { metric: "Narrative Velocity", value: "234 shares/hour" },
                      { metric: "Amplification Sources", value: "17 coordinated accounts" },
                      { metric: "Geographic Spread", value: "23 countries" },
                      { metric: "Audience Reach", value: "2.3M potential exposure" },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded">
                        <span className="text-sm text-gray-400">{item.metric}</span>
                        <span className="text-sm font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sector Exposure */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Sector Exposure Monitor</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { sector: "Critical Infrastructure", risk: "Critical", exposure: "89%" },
                { sector: "Government & Agencies", risk: "High", exposure: "67%" },
                { sector: "Financial Services", risk: "High", exposure: "72%" },
                { sector: "Healthcare & Life Sciences", risk: "Medium", exposure: "54%" },
                { sector: "Technology & Software", risk: "High", exposure: "81%" },
                { sector: "Manufacturing & Supply Chain", risk: "Medium", exposure: "58%" },
              ].map((item, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white">{item.sector}</h3>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        item.risk === "Critical"
                          ? "bg-[#ff4757]/20 text-[#ff4757]"
                          : item.risk === "High"
                          ? "bg-[#ffa502]/20 text-[#ffa502]"
                          : "bg-[#ffd700]/20 text-[#ffd700]"
                      }`}
                    >
                      {item.risk}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">Exposure</span>
                      <span className="text-sm font-bold text-white">{item.exposure}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.risk === "Critical"
                            ? "bg-[#ff4757]"
                            : item.risk === "High"
                            ? "bg-[#ffa502]"
                            : "bg-[#ffd700]"
                        }`}
                        style={{ width: item.exposure }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Early Warning */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Early-Warning Indicators</h2>
            <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-white mb-4">Emerging Threats</h3>
                  <ul className="space-y-3">
                    {[
                      { threat: "New APT cluster", likelihood: "High", timeline: "14 days" },
                      { threat: "Ransomware variant prep", likelihood: "High", timeline: "7 days" },
                      { threat: "Influence op escalation", likelihood: "Medium", timeline: "21 days" },
                      { threat: "Supply chain targeting", likelihood: "Medium", timeline: "30 days" },
                    ].map((item, i) => (
                      <li key={i} className="flex justify-between items-center p-3 bg-white/5 rounded">
                        <span className="text-sm text-gray-300">{item.threat}</span>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#00d4ff]">{item.likelihood}</p>
                          <p className="text-xs text-gray-500">{item.timeline}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-4">Action Items</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded border border-[#00d4ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      </span>
                      <span className="text-sm text-gray-300">Review APT campaign IOCs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded border border-[#00d4ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      </span>
                      <span className="text-sm text-gray-300">Update EDR signatures for new ransomware</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded border border-[#00d4ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      </span>
                      <span className="text-sm text-gray-300">Coordinate with comms on narrative response</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded border border-[#00d4ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      </span>
                      <span className="text-sm text-gray-300">Harden vendor risk controls</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Export to Executive Briefing</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">Generate an executive summary of Global Threat Observatory findings and recommendations.</p>
            <Link to={createPageUrl("BriefingEngine")}>
              <Button className="bg-[#00d4ff] text-black font-bold gap-2">
                Generate Brief <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}