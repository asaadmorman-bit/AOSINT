import React from "react";
import { createPageUrl } from "@/utils";
import { Shield, Radar, Globe, Eye, FileText, Zap, Link, BarChart2, ArrowRight, CheckCircle, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Globe, title: "Multi-Source OSINT Ingestion", desc: "Aggregate feeds from open, commercial, and custom sources in real-time." },
  { icon: Radar, title: "Automated Risk Scoring", desc: "AI-powered scoring across cyber, physical, influence, and supply-chain domains." },
  { icon: Eye, title: "Digital + Physical Asset Discovery", desc: "Map your entire attack surface — cloud, on-prem, facilities, and personnel." },
  { icon: Shield, title: "Dark Web Monitoring", desc: "Correlate credentials, data leaks, and threat actor mentions across dark web sources." },
  { icon: FileText, title: "Compliance & Gap Analysis", desc: "Automated mapping to NIST CSF, ISO 27001, CIS Controls, CMMC 2.0." },
  { icon: Zap, title: "Remediation Playbooks", desc: "AI-generated, prioritized remediation plans with owner assignment and cost estimates." },
  { icon: Link, title: "API + Integrations", desc: "Connect SIEM, SOAR, MDM, EDR platforms with a full REST API." },
  { icon: BarChart2, title: "Real-Time Dashboards", desc: "Situational awareness, threat maps, asset risk matrices, speed-of-action radar." },
];



export default function Home() {
  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050d1a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <Radar className="w-4 h-4 text-[#00d4ff]" />
            </div>
            <span className="font-bold text-lg tracking-tight">ASOSINT</span>
            <Badge variant="outline" className="text-[9px] border-[#00d4ff]/20 text-[#00d4ff] ml-1">BETA</Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href={createPageUrl("Forum")} className="hover:text-white transition-colors">Community</a>
            <a href={createPageUrl("Support")} className="hover:text-white transition-colors">Support</a>
            <a href={createPageUrl("Dashboard")} className="hover:text-white transition-colors">Dashboard</a>
          </div>
          <div className="flex items-center gap-3">
            <a href={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">Log In</Button>
            </a>
            <a href={createPageUrl("Pricing")}>
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] text-xs font-bold">Get Started Free</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#00d4ff]/5 via-transparent to-transparent" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,255,0.08), transparent)" }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/5 text-[#00d4ff] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            Open-Sourced Intelligence Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            <span className="text-white">ASOSINT — </span>
            <span style={{ background: "linear-gradient(135deg, #00d4ff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Open-Sourced Intelligence
            </span>
            <br />
            <span className="text-white">for Everyone</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Unify your threat feeds, assess risk instantly, and strengthen your security posture with actionable intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] font-bold px-8 gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>

          </div>
          <p className="text-xs text-gray-600 mt-4">No credit card required · Community Edition is free forever</p>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["10K+", "Threat Feeds"], ["500K+", "Indicators Tracked"], ["99.9%", "Uptime SLA"], ["150+", "Integrations"]].map(([v, l]) => (
            <div key={l}>
              <p className="text-2xl font-black text-[#00d4ff]">{v}</p>
              <p className="text-xs text-gray-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-white mb-3">Everything You Need to Defend at Speed</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Intelligence capabilities that span OSINT, SIGINT, and HUMINT — consolidated in one platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#0d1929] border border-white/5 rounded-xl p-5 hover:border-[#00d4ff]/20 transition-all group">
                <div className="p-2.5 rounded-lg bg-[#00d4ff]/10 w-fit mb-4 group-hover:bg-[#00d4ff]/15 transition-colors">
                  <Icon className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Spotlight */}
      <section className="py-20 px-6 bg-[#0d1929] border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[#6b7280]/10 text-gray-400 border-gray-700 mb-4">Community Edition</Badge>
            <h2 className="text-3xl font-black text-white mb-4">Free Forever. No Strings Attached.</h2>
            <p className="text-gray-400 mb-6">Start with our Community Edition — no credit card, no expiry. Get access to basic OSINT feeds, risk scoring for up to 25 assets, and the community forum.</p>
            <ul className="space-y-2 mb-8">
              {["Free forever", "Community-powered support", "Basic OSINT feeds", "Basic risk scoring", "25 monitored assets", "Weekly summary reports", "Community forum access"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-[#2ed573] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href={createPageUrl("Dashboard")}>
              <Button className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] font-bold gap-2">
                Start for Free <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-[#00d4ff]" />
              <span className="text-sm font-bold text-white">Community Forum Preview</span>
            </div>
            {[
              { cat: "OSINT", title: "Best open sources for threat intel in 2026?", votes: 47, replies: 12, badge: "Hot" },
              { cat: "Tools", title: "Integrating ASOSINT with Splunk — step by step", votes: 31, replies: 8, badge: null },
              { cat: "Help", title: "How to configure custom OSINT feeds on Community tier?", votes: 24, replies: 5, badge: null },
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                <div className="text-center bg-white/5 rounded-lg p-2 min-w-[40px]">
                  <p className="text-xs font-bold text-white">{p.votes}</p>
                  <p className="text-[8px] text-gray-600">votes</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] text-[#00d4ff] font-semibold uppercase tracking-wider">{p.cat}</span>
                    {p.badge && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{p.badge}</span>}
                  </div>
                  <p className="text-xs text-gray-300 truncate">{p.title}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{p.replies} replies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0d1929] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-[#00d4ff]" />
              <span className="font-bold text-white">ASOSINT</span>
              <span className="text-gray-600 text-xs">Asaad & Shauntze's Open-Sourced Intelligence</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500">
              {[["Dashboard", "Dashboard"], ["Forum", "Forum"], ["Support", "Support"], ["AdminConsole", "Admin"]].map(([page, label]) => (
                <a key={page} href={createPageUrl(page)} className="hover:text-gray-300 transition-colors">{label}</a>
              ))}
              <span className="hover:text-gray-300 cursor-pointer">Privacy</span>
              <span className="hover:text-gray-300 cursor-pointer">Terms</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-gray-600">
            © 2026 ASOSINT. All rights reserved. Built for defenders, by defenders.
          </div>
        </div>
      </footer>
    </div>
  );
}