import React from "react";
import { Shield, Globe, Zap, Users, Target, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function BrandIdentity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      <style>{`
        .brand-hero {
          background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(168,85,247,0.1) 100%);
        }
      `}</style>

      {/* Hero */}
      <section className="brand-hero border-b border-white/5 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative w-20 h-20">
              <Shield className="w-20 h-20 text-[#00d4ff]" strokeWidth={1} />
              <div className="absolute inset-0 rounded-lg border border-[#00d4ff]/30 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">ASOSINT Brand Identity</h1>
          <p className="text-xl text-gray-400 mb-2">Asaad & Shauntze's Open-Sourced Intelligence</p>
          <p className="text-gray-500 max-w-2xl mx-auto">The flagship intelligence platform created and owned by Emerging Defense Solutions (EDS). Integrated cyber, physical, influence, geopolitical, and protective intelligence for unified operational excellence.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Founders */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Leadership & Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <Users className="w-8 h-8 text-[#00d4ff] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Asaad Morman</h3>
              <p className="text-gray-400 text-sm mb-4">Marine Corps Veteran | Enterprise Architect | Cybersecurity Engineer</p>
              <p className="text-gray-500 text-sm leading-relaxed">Brings military discipline, enterprise-scale architecture expertise, and deep cybersecurity knowledge to ASOSINT's foundational design and operational architecture.</p>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <Users className="w-8 h-8 text-[#a855f7] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Shauntze Morman</h3>
              <p className="text-gray-400 text-sm mb-4">Public Safety Leader | Emergency Communications Expert | Security+ & CASP Certified</p>
              <p className="text-gray-500 text-sm leading-relaxed">Drives public safety integration, emergency response workflows, and operational resilience across ASOSINT's protective intelligence capabilities.</p>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Globe, title: "Multi-Domain Integration", desc: "Cyber, physical, influence, geopolitical, protective" },
              { icon: Target, title: "Defensive Orientation", desc: "Protect communities, strengthen resilience" },
              { icon: Zap, title: "Operational Excellence", desc: "Human-centric, technology-enabled, mission-focused" },
              { icon: BookOpen, title: "Knowledge-Driven", desc: "Data fusion, correlation, actionable intelligence" },
            ].map((principle, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6">
                <principle.icon className="w-6 h-6 text-[#00d4ff] mb-3" />
                <h3 className="font-bold text-white mb-1 text-sm">{principle.title}</h3>
                <p className="text-gray-500 text-xs">{principle.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Identity */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Visual Identity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Logo & Emblem</h3>
              <div className="bg-[#0a0e1a] rounded-lg p-12 flex items-center justify-center mb-6 min-h-48">
                <div className="relative w-24 h-24">
                  <Shield className="w-full h-full text-[#00d4ff] stroke-1" />
                  <Globe className="absolute inset-0 w-full h-full text-[#a855f7]/60 stroke-1 p-4" />
                </div>
              </div>
              <p className="text-gray-400 text-sm">Shield + Globe motif representing integrated multi-domain intelligence and global operational reach.</p>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Color Palette</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0a0e1a] border-2 border-white/10" />
                  <div>
                    <p className="font-mono text-sm text-white">#0A0E1A</p>
                    <p className="text-xs text-gray-500">Deep Navy (Primary)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1a1a1a]" />
                  <div>
                    <p className="font-mono text-sm text-white">#1A1A1A</p>
                    <p className="text-xs text-gray-500">Charcoal (Secondary)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#00d4ff]" />
                  <div>
                    <p className="font-mono text-sm text-white">#00D4FF</p>
                    <p className="text-xs text-gray-500">Electric Blue (Accent)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#a855f7]" />
                  <div>
                    <p className="font-mono text-sm text-white">#A855F7</p>
                    <p className="text-xs text-gray-500">Purple (Secondary Accent)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Module Ecosystem */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">ASOSINT Module Ecosystem</h2>
          <div className="space-y-3">
            {[
              "ASOSINT Global Threat Observatory",
              "ASOSINT Certification Engine",
              "ASOSINT Intelligence Program Builder",
              "ASOSINT Executive Briefing Engine",
              "ASOSINT Fusion Center",
              "ASOSINT Scenario Engine",
              "ASOSINT Red Cell / Blue Cell Module",
              "ASOSINT Compliance & Governance Engine",
              "ASOSINT Training Portal",
              "ASOSINT Agent Marketplace",
              "ASOSINT Billing & Subscription Infrastructure",
              "ASOSINT Customer Portal & Tenant Administration",
              "ASOSINT Partner Portal",
              "ASOSINT Public Marketplace & App Store",
              "ASOSINT Global Intelligence Exchange (GIX)",
              "ASOSINT Data Lake",
              "ASOSINT Knowledge Graph",
            ].map((module, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-lg px-6 py-4 hover:border-[#00d4ff]/30 transition-colors">
                <p className="text-white font-medium">{module}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand Guidelines */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-white mb-8">Brand Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-4">Typography</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>• Headings: Bold, futuristic sans-serif</li>
                <li>• Body: Clean, readable sans-serif</li>
                <li>• Technical: Monospace for code/data</li>
                <li>• Style: Minimal, authoritative, enterprise-grade</li>
              </ul>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8">
              <h3 className="text-lg font-bold text-white mb-4">Format & Delivery</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>• Transparent background preferred</li>
                <li>• Vector-ready (SVG format)</li>
                <li>• Scalable across all media</li>
                <li>• Consistent across platforms</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Organization */}
        <section className="bg-[#111827] border border-white/5 rounded-xl p-8 mb-20">
          <h2 className="text-2xl font-bold text-white mb-6">Organization</h2>
          <div className="space-y-4 text-gray-300">
            <p><span className="font-bold text-white">Platform Owner:</span> Emerging Defense Solutions (EDS)</p>
            <p><span className="font-bold text-white">Contact Email:</span> <a href="mailto:info@eds-360.com" className="text-[#00d4ff] hover:underline">info@eds-360.com</a></p>
            <p><span className="font-bold text-white">Mission:</span> Empower human teams, protect communities, strengthen resilience through integrated multi-domain intelligence.</p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link to={createPageUrl("Homepage")}>
            <Button size="lg" className="bg-[#00d4ff] text-black font-bold">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}