import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, ArrowRight, ChevronLeft, Code2, Building2, Zap, Globe2, Brain,
  CheckCircle2, Users, BarChart3, Lock, Handshake, Rocket, Star,
  GitBranch, Package, Layers, Award, MessageSquare, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const PARTNER_TYPES = [
  {
    icon: Code2,
    title: "Technology Partners",
    color: "#00d4ff",
    desc: "Integrate your security tools, APIs, or data feeds directly into the ASOSINT ecosystem.",
    benefits: ["API-first integration framework", "Co-marketing opportunities", "Revenue sharing on referrals", "Joint go-to-market support"]
  },
  {
    icon: Building2,
    title: "Enterprise Resellers",
    color: "#a855f7",
    desc: "Bring ASOSINT to your enterprise clients as part of your managed security services portfolio.",
    benefits: ["White-label ready", "Volume licensing", "Dedicated partner success manager", "Sales enablement resources"]
  },
  {
    icon: Globe2,
    title: "Systems Integrators",
    color: "#2ed573",
    desc: "Build custom deployments for government, critical infrastructure, and enterprise clients.",
    benefits: ["Professional services support", "Implementation certification", "Priority technical access", "Custom contract structures"]
  },
  {
    icon: Brain,
    title: "Research & Academic",
    color: "#f59e0b",
    desc: "Collaborate on threat intelligence research, training programs, and intelligence methodologies.",
    benefits: ["Data sharing agreements", "Publication partnerships", "Training curriculum development", "Grant & funding support"]
  },
];

const WHY_PARTNER = [
  { icon: Rocket, title: "Fast Integration", desc: "Modern REST APIs and SDKs make integrating with ASOSINT fast and straightforward." },
  { icon: BarChart3, title: "Revenue Growth", desc: "Earn recurring commissions on every customer you bring to the platform." },
  { icon: Users, title: "Community Access", desc: "Join a growing network of security professionals, researchers, and operators." },
  { icon: Award, title: "Certifications", desc: "Get your team and solutions certified on the ASOSINT platform for credibility." },
  { icon: Zap, title: "Real-time Intel", desc: "Access curated threat intelligence feeds to enhance your own offerings." },
  { icon: Lock, title: "Trusted Brand", desc: "Align with a veteran-owned, mission-driven enterprise that security teams trust." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Apply", desc: "Submit your partner application with your company profile, use case, and integration goals." },
  { step: "02", title: "Review", desc: "Our partnerships team reviews your application within 5–7 business days." },
  { step: "03", title: "Onboard", desc: "Once approved, access the partner portal with technical docs, APIs, and go-to-market resources." },
  { step: "04", title: "Launch", desc: "Co-market your integration, earn referrals, and grow together." },
];

const TESTIMONIALS = [
  {
    quote: "Integrating with ASOSINT gave our SOC team a major upgrade in correlation capability. The API was clean and the support was outstanding.",
    name: "Security Operations Lead",
    org: "Mid-size MSSP"
  },
  {
    quote: "The partnership program opened doors for us with government clients who specifically required an OSINT-native platform.",
    name: "VP of Business Development",
    org: "Federal Systems Integrator"
  }
];

export default function Partners() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 bg-[#0a0e1a]/95 backdrop-blur-xl border-b border-white/5">
        <Link to={createPageUrl("Homepage")} className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#00d4ff]" />
          <span className="text-lg font-black tracking-tight">ASOSINT</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Homepage")} className="text-sm text-gray-400 hover:text-white flex items-center gap-1 hidden sm:flex">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          {user ? (
            <Link to={createPageUrl("PartnerPortal")}>
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] gap-2">
                Partner Portal <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] gap-2" onClick={() => base44.auth.redirectToLogin(createPageUrl("PartnerPortal"))}>
              <LogIn className="w-4 h-4" /> Partner Login
            </Button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-radial from-[#00d4ff]/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20">
            <Handshake className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-sm text-[#00d4ff] font-semibold">ASOSINT Partner Program</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 leading-tight">
            Build the Future of
            <br />
            <span className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-transparent bg-clip-text">
              Threat Intelligence
            </span>
            <br />Together
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Partner with ASOSINT to extend your platform, reach new markets, and deliver world-class intelligence capabilities to organizations that depend on them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("PartnerOnboarding")}>
              <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] h-12 px-8 text-base font-bold gap-2">
                Apply to Partner <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            {user ? (
              <Link to={createPageUrl("PartnerPortal")}>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-12 px-8 text-base gap-2">
                  Access Partner Portal
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-12 px-8 text-base gap-2" onClick={() => base44.auth.redirectToLogin(createPageUrl("PartnerPortal"))}>
                <LogIn className="w-5 h-5" /> Partner Login
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-[#0d1220] border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { value: "4", label: "Partner Tiers" },
            { value: "7+", label: "Integration Categories" },
            { value: "100%", label: "API Coverage" },
            { value: "∞", label: "Growth Potential" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-[#00d4ff] mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Partner Program Types</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Whether you build software, deliver services, or conduct research — there's a partnership model designed for you.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {PARTNER_TYPES.map((type, i) => {
              const Icon = type.icon;
              return (
                <div key={i} className="bg-[#0d1220] border border-white/5 rounded-xl p-8 hover:border-opacity-50 transition-all" style={{ '--hover-color': type.color }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                      <Icon className="w-6 h-6" style={{ color: type.color }} />
                    </div>
                    <h3 className="text-xl font-bold">{type.title}</h3>
                  </div>
                  <p className="text-gray-400 mb-5 leading-relaxed">{type.desc}</p>
                  <ul className="space-y-2">
                    {type.benefits.map((b, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: type.color }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-20 px-4 bg-[#0d1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why Build With ASOSINT</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Join a platform purpose-built for the modern threat landscape, with technical foundations and a partner-first culture.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_PARTNER.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-[#0a0e1a] border border-white/5 rounded-xl p-6 hover:border-[#00d4ff]/20 transition-colors">
                  <Icon className="w-8 h-8 text-[#00d4ff] mb-4" />
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#00d4ff]/10 via-[#0d1220] to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-2xl p-10 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Code2 className="w-5 h-5 text-[#00d4ff]" />
                  <span className="text-sm font-bold text-[#00d4ff] uppercase tracking-wider">For Developers</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Build on ASOSINT's API</h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Access comprehensive REST APIs, webhook support, and real-time streams to build powerful integrations. From IOC enrichment to threat actor correlation — our API gives you full access to the intelligence layer.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full REST API with OpenAPI specs",
                    "Webhook events for real-time threat updates",
                    "SDKs for Python, Node.js, and more",
                    "Sandbox environment for development",
                    "Dedicated developer documentation",
                    "Community Slack & forum support"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-[#00d4ff] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={createPageUrl("Documentation")}>
                  <Button className="bg-[#00d4ff] text-black hover:bg-[#0099cc] gap-2">
                    View Developer Docs <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="bg-black/50 rounded-xl p-6 border border-white/10 font-mono text-sm">
                <div className="text-gray-500 mb-3 text-xs">// ASOSINT Threat Indicator Lookup</div>
                <div className="text-[#00d4ff]">const asosint = <span className="text-yellow-400">require</span>(<span className="text-green-400">'@asosint/sdk'</span>);</div>
                <br />
                <div className="text-[#00d4ff]">const result = <span className="text-yellow-400">await</span> asosint</div>
                <div className="ml-4 text-gray-300">.indicators</div>
                <div className="ml-4 text-gray-300">.lookup(<span className="text-green-400">'192.168.1.1'</span>);</div>
                <br />
                <div className="text-gray-500">// Returns:</div>
                <div className="text-gray-300">{"{"}</div>
                <div className="ml-4 text-gray-300">risk: <span className="text-yellow-400">"high"</span>,</div>
                <div className="ml-4 text-gray-300">confidence: <span className="text-[#00d4ff]">92</span>,</div>
                <div className="ml-4 text-gray-300">actor: <span className="text-green-400">"APT28"</span>,</div>
                <div className="ml-4 text-gray-300">ttps: [<span className="text-green-400">"T1566"</span>, ...]</div>
                <div className="text-gray-300">{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#0d1220]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">How Partnering Works</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">A simple, transparent process from application to activation.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#00d4ff]/30 to-transparent z-10" />
                )}
                <div className="bg-[#0a0e1a] border border-white/5 rounded-xl p-6 hover:border-[#00d4ff]/20 transition-colors text-center">
                  <div className="text-4xl font-black text-[#00d4ff]/20 mb-3">{step.step}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Partners Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#0d1220] border border-white/5 rounded-xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0d1220] to-[#0a0e1a] border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <Handshake className="w-12 h-12 text-[#00d4ff] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Partner?</h2>
          <p className="text-gray-400 text-lg mb-10">
            Apply today and let's build the future of threat intelligence together. Our team reviews every application personally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("PartnerOnboarding")}>
              <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] h-12 px-8 font-bold gap-2">
                Apply to Partner Program <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="mailto:partners@eds-360.com">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 h-12 px-8 gap-2">
                <MessageSquare className="w-5 h-5" /> Email Us
              </Button>
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-6">Already a partner? <button onClick={() => base44.auth.redirectToLogin(createPageUrl("PartnerPortal"))} className="text-[#00d4ff] hover:underline">Log in to your portal →</button></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0e1a] py-8 px-6 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Emerging Defense Solutions · <a href="mailto:partners@eds-360.com" className="hover:text-[#00d4ff]">partners@eds-360.com</a></p>
      </footer>
    </div>
  );
}