import React from "react";
import { createPageUrl } from "@/utils";
import { Shield, CheckCircle2, ArrowRight, ChevronLeft, Clock, Zap, Lock, Star, Building2, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TIERS = [
  {
    key: "community",
    name: "Community",
    badge: "FREE FOREVER",
    price: "$0",
    color: "#6b7280",
    icon: Star,
    audience: "Individuals, students, researchers, hobbyists",
    description: "Perfect for learning, personal projects, and getting started with threat intelligence.",
    features: [
      "Basic OSINT feed access (curated sources)",
      "Up to 25 monitored assets",
      "Weekly threat summary reports",
      "Basic risk scoring",
      "Community forum access",
      "Limited dashboard widgets",
      "7-day data retention",
      "Community forum support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    badge: "MOST POPULAR",
    price: "$79",
    priceSub: "per user / month",
    color: "#00d4ff",
    icon: Zap,
    audience: "Small security teams, consultants, SMBs",
    description: "Everything a growing security team needs to stay ahead of threats.",
    popular: true,
    features: [
      "All Community features",
      "Full OSINT feed access",
      "Up to 250 monitored assets",
      "Daily risk scoring & alerts",
      "Digital asset discovery",
      "Automated weekly reports",
      "Basic remediation recommendations",
      "API access (rate limited)",
      "SIEM/EDR integrations (limited)",
      "30–90 day data retention",
      "Email support (48–72 hr SLA)",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    badge: "ENTERPRISE",
    price: "$1,200",
    priceSub: "per month",
    color: "#a855f7",
    icon: Building2,
    audience: "Mid-market, MSSPs, corporate security teams",
    description: "Full-scale threat intelligence for organizations that need complete coverage.",
    features: [
      "All Pro features",
      "Unlimited OSINT feeds",
      "Unlimited monitored assets",
      "Continuous real-time monitoring",
      "Dark web exposure correlation",
      "Compliance mapping (NIST, ISO 27001, CIS)",
      "Automated remediation playbooks",
      "Custom dashboards & reporting",
      "Full API access (unlimited)",
      "Full SIEM/SOAR/EDR/MDM integrations",
      "Multi-team management & admin console",
      "Advanced audit logs",
      "180–365 day data retention",
      "Priority support (24 hr SLA)",
    ],
  },
  {
    key: "gov",
    name: "Gov / CI",
    badge: "GOV / CRITICAL INFRASTRUCTURE",
    price: "$5,000",
    priceSub: "per month (custom contracts available)",
    color: "#f59e0b",
    icon: Globe2,
    audience: "Federal, state, defense, critical infrastructure operators",
    description: "Mission-critical threat intelligence for high-assurance environments.",
    features: [
      "All Enterprise features",
      "Air-gapped or sovereign deployment options",
      "Unlimited assets & unlimited API calls",
      "Custom OSINT feed ingestion",
      "1–3 year data retention",
      "Dedicated analyst hours",
      "Advanced audit logging & compliance documentation",
      "Executive reporting suite",
      "Quarterly threat briefings",
      "SCAP/STIG compliance scanning",
      "Cross-domain intelligence correlation",
      "Custom SLAs & dedicated support",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#07091a] text-gray-100">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#07091a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Homepage")} className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#00d4ff]" />
            <span className="font-bold text-white">ASOSINT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Homepage")} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Home
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button size="sm" className="bg-[#00d4ff] text-black font-semibold gap-1.5">
                Launch App <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30">
            <span className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[#00d4ff] text-xs font-bold uppercase tracking-wide">Community Beta — Everything Free</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">Free for Everyone Right Now</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            ASOSINT is in community beta. All features are unlocked for every user at no cost.
            Paid tiers are <span className="text-[#ffa502] font-semibold">coming soon</span> — here's a preview of what each will include.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="flex justify-center mb-14">
          <div className="flex items-center gap-3 bg-[#ffa502]/10 border border-[#ffa502]/30 rounded-full px-6 py-2.5">
            <Clock className="w-4 h-4 text-[#ffa502]" />
            <span className="text-sm text-[#ffa502] font-semibold">Paid tiers launching soon — join beta now to lock in early pricing</span>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-20">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.key}
                className={`relative flex flex-col rounded-2xl p-6 border transition-all hover:-translate-y-1 duration-200 ${
                  tier.popular
                    ? "bg-[#111827] border-[#00d4ff]/40 shadow-[0_0_40px_rgba(0,212,255,0.10)]"
                    : "bg-[#0d1220] border-white/5"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#00d4ff] text-black whitespace-nowrap">MOST POPULAR</span>
                  </div>
                )}

                {/* Coming Soon badge */}
                <div className="absolute top-4 right-4">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#ffa502]/15 text-[#ffa502] border border-[#ffa502]/20">
                    <Clock className="w-2.5 h-2.5" /> Coming Soon
                  </span>
                </div>

                <div className="mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: tier.color }} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: tier.color }}>{tier.badge}</span>
                  <h2 className="text-xl font-bold text-white mt-1">{tier.name}</h2>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{tier.audience}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-black text-white">{tier.price}</span>
                    {tier.priceSub && <p className="text-[10px] text-gray-500 mt-0.5">{tier.priceSub}</p>}
                    {!tier.priceSub && <p className="text-[10px] text-gray-500 mt-0.5">No credit card required</p>}
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-4 leading-relaxed">{tier.description}</p>

                <ul className="space-y-2 flex-1 mb-6">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tier.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed select-none"
                  style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}20` }}
                >
                  <Clock className="w-3.5 h-3.5" /> Coming Soon
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Beta CTA */}
        <div className="bg-gradient-to-r from-[#00d4ff]/10 via-transparent to-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-2xl p-12 text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-[#2ed573]/10 border border-[#2ed573]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[#2ed573] text-xs font-bold">All Features Unlocked Now</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Join the Community Beta Today</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Every single feature — including everything from the Enterprise and Gov tiers — is completely free during beta.
            Use it, break it, give us feedback, and help shape what ASOSINT becomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("Dashboard")}>
              <Button className="bg-[#00d4ff] text-black font-bold text-base h-12 px-8 hover:bg-[#0099cc]">
                Launch App — It's Free <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to={createPageUrl("Forum")}>
              <Button variant="outline" className="border-white/10 text-gray-300 hover:bg-white/5 h-12 px-8">
                Submit Feedback
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}