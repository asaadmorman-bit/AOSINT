import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Shield, Globe2, Brain, Users, Zap, Lock, LogIn, Bell, Eye, Network, Search, BarChart3, AlertTriangle, CheckCircle, Crosshair, Cpu, Radio, MapPin, Glasses } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Homepage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#00d4ff]" />
          <span className="text-lg font-black tracking-tight">ASOSINT</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to={createPageUrl("Dashboard")}>
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#0099cc]">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white border border-white/10 hover:border-white/20" onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}>
                <LogIn className="w-4 h-4 mr-1" /> Log In
              </Button>
              <Link to={createPageUrl("TrialSignup")}>
                <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#0099cc]">
                  Sign Up Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-[#0a0e1a] to-[#0a0e1a]" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00d4ff]/6 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-[#0055aa]/8 blur-[100px] pointer-events-none" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />

        <div className="relative max-w-6xl mx-auto text-center z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-[#00d4ff]/8 border border-[#00d4ff]/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            <span className="text-[#00d4ff] text-xs font-bold tracking-widest uppercase">Edge-Computed · Field-Ready · Predictive Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-4 leading-tight tracking-tight">
            ASOSINT
            <br />
            <span className="bg-gradient-to-r from-[#00d4ff] via-[#38bfff] to-[#0099cc] text-transparent bg-clip-text">The Common Operational Picture</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            Predictive, AI-fused intelligence delivered at the edge — for field agents, operators, and decision-makers who can't afford to be wrong.
          </p>
          <p className="text-sm sm:text-base text-[#00d4ff]/70 mb-10 font-mono tracking-wide">
            Now integrating AR smart wearables &amp; tactical goggles for eyes-free, hands-free operational awareness.
          </p>

          {/* AR wearables pill badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["AR Goggles", "Smart Wearables", "Edge Compute", "Biometric Feeds", "Real-Time Fusion"].map(tag => (
              <span key={tag} className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-[#00d4ff]/25 bg-[#00d4ff]/5 text-[#00d4ff]/80 backdrop-blur-sm">{tag}</span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#38bfff] text-lg h-12 px-8 font-black">
                  Open COP Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to={createPageUrl("TrialSignup")}>
                  <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#38bfff] text-lg h-12 px-8 font-black">
                    Deploy Free Access
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-[#00d4ff]/30 text-white hover:bg-[#00d4ff]/5 text-lg h-12 px-8 backdrop-blur-sm" onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}>
                  <LogIn className="w-5 h-5 mr-2" /> Operator Login
                </Button>
              </>
            )}
          </div>

          {/* Hero COP panel — glassmorphism */}
          <div className="relative mt-6 rounded-2xl border border-[#00d4ff]/15 bg-[#0d1220]/60 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(0,212,255,0.07)]">
            {/* HUD top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#00d4ff]/10 bg-[#00d4ff]/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
                <span className="text-[10px] font-mono text-[#00d4ff]/70 tracking-widest">COP · LIVE · FIELD ACTIVE</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600">
                <span>OSINT·SIGINT·HUMINT</span>
                <span>·</span>
                <span className="text-[#ffa502]">THREAT LEVEL: ELEVATED</span>
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-[#00d4ff]/8">
              {[
                { label: "Active IOCs", val: "2,847", color: "#ff4757" },
                { label: "Field Agents", val: "14", color: "#00d4ff" },
                { label: "AR Feeds", val: "8", color: "#2ed573" },
                { label: "Threat Score", val: "72", color: "#ffa502" },
                { label: "Edge Nodes", val: "31", color: "#a855f7" },
                { label: "Alerts / hr", val: "143", color: "#00d4ff" },
              ].map(s => (
                <div key={s.label} className="py-4 text-center">
                  <p className="text-lg sm:text-2xl font-black" style={{color: s.color}}>{s.val}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-600 font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Globe placeholder */}
            <div className="relative h-40 sm:h-56 flex items-center justify-center">
              <Globe2 className="w-24 h-24 text-[#00d4ff]/10" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0e1a]" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 bg-[#0d1220] border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00d4ff] mb-2">COP</div>
            <div className="text-sm text-gray-400">Common Operational Picture</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00d4ff] mb-2">AR</div>
            <div className="text-sm text-gray-400">Wearable Integration</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00d4ff] mb-2">&lt;1s</div>
            <div className="text-sm text-gray-400">Edge Latency</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00d4ff] mb-2">100%</div>
            <div className="text-sm text-gray-400">Field-First Design</div>
          </div>
        </div>
      </section>

      {/* AR Wearables Spotlight */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0d1528] to-[#0a0e1a]" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#00d4ff]/4 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#00d4ff]/8 border border-[#00d4ff]/20 rounded-full px-3 py-1 mb-6">
                <span className="text-[#00d4ff] text-[10px] font-bold tracking-widest uppercase">New · AR Integration</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black mb-5 leading-tight">Intelligence at the<br /><span className="text-[#00d4ff]">Speed of Vision</span></h2>
              <p className="text-gray-300 text-base leading-relaxed mb-6">
                ASOSINT now streams live COP data directly to AR smart goggles and tactical wearables. Field agents see threat overlays, IOC alerts, entity profiles, and navigation cues — hands-free, eyes-on-target.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Crosshair, label: "Threat overlay on live visual feed", desc: "IOCs and alerts appear as AR annotations in real-time" },
                  { icon: Cpu, label: "Edge-computed, no cloud dependency", desc: "AI inference runs locally for denied-area operations" },
                  { icon: Radio, label: "Biometric & situational data fusion", desc: "Fuses GPS, bio-sensors, comm intercepts, and OSINT" },
                  { icon: MapPin, label: "Sub-second geofenced alerts", desc: "Precision geofencing triggers immediate threat notifications" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:border-[#00d4ff]/20 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-[#00d4ff]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* AR HUD mock */}
            <div className="relative">
              <div className="rounded-2xl border border-[#00d4ff]/20 bg-[#0d1220]/70 backdrop-blur-xl overflow-hidden shadow-[0_0_60px_rgba(0,212,255,0.1)] aspect-video">
                {/* HUD corner brackets */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#00d4ff]/60 rounded-tl-sm" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#00d4ff]/60 rounded-tr-sm" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#00d4ff]/60 rounded-bl-sm" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#00d4ff]/60 rounded-br-sm" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Eye className="w-16 h-16 text-[#00d4ff]/20" />
                  <span className="text-[10px] font-mono text-[#00d4ff]/50 tracking-widest">AR · FIELD VIEW · LIVE</span>
                </div>
                {/* HUD overlay badges */}
                <div className="absolute top-6 left-6 text-[9px] font-mono text-[#2ed573] space-y-1">
                  <div className="bg-[#2ed573]/10 border border-[#2ed573]/20 rounded px-2 py-0.5">THREAT: LOW</div>
                  <div className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded px-2 py-0.5 text-[#00d4ff]">GPS LOCKED</div>
                </div>
                <div className="absolute bottom-6 right-6 text-[9px] font-mono text-[#ffa502]">
                  <div className="bg-[#ffa502]/10 border border-[#ffa502]/20 rounded px-2 py-0.5">2 IOCs IN RANGE</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/3 via-transparent to-[#a855f7]/3" />
              </div>
              <p className="text-center text-xs text-gray-600 mt-3 font-mono">Simulated AR field view — ASOSINT Wearable Interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Pillars */}
      <section className="py-20 px-4 bg-[#080c18] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-[#00d4ff]/8 border border-[#00d4ff]/20 rounded-full px-3 py-1 mb-5">
              <span className="text-[#00d4ff] text-[10px] font-bold tracking-widest uppercase">Core Capabilities · Research Pillars</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 items-end">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black leading-tight mb-4">
                  Autonomous Intelligence.<br />
                  <span className="text-[#00d4ff]">Zero Lag. Zero Gaps.</span>
                </h2>
              </div>
              <div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                  ASOSINT autonomously scrapes, parses, and fuses unstructured public data — forums, dark web markets, social feeds, gov databases, and open-source repositories — to continuously extract Indicators of Compromise (IoCs) and identify <span className="text-[#ffa502] font-semibold">physical pre-incident indicators</span> before events materialize on the ground.
                </p>
              </div>
            </div>
          </div>

          {/* Three Research Pillars */}
          <div className="grid lg:grid-cols-3 gap-5 mb-10">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-[#a855f7]/20 bg-gradient-to-b from-[#a855f7]/5 to-[#0a0e1a]/80 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#a855f7]/8 rounded-full blur-3xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/25 flex items-center justify-center mb-5">
                <Brain className="w-5 h-5 text-[#a855f7]" />
              </div>
              <h3 className="text-lg font-black text-white mb-3">Behavioral Anomaly Detection</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Continuously models baseline behavioral patterns for entities, assets, and networks. When deviations emerge — unusual travel, access at odd hours, abnormal communication spikes — the system flags pre-incident indicators and scores them for escalation.
              </p>
              <div className="space-y-2">
                {["Pattern-of-life baselining", "Predictive deviation scoring", "Physical & digital cross-domain", "Sub-second alert triggering"].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#a855f7]" />
                    <span className="text-xs text-gray-500">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#a855f7]/10">
                <span className="text-[10px] font-mono text-[#a855f7]/70 tracking-widest uppercase">Research Pillar · 01</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-[#2ed573]/20 bg-gradient-to-b from-[#2ed573]/5 to-[#0a0e1a]/80 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ed573]/8 rounded-full blur-3xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-[#2ed573]/15 border border-[#2ed573]/25 flex items-center justify-center mb-5">
                <MapPin className="w-5 h-5 text-[#2ed573]" />
              </div>
              <h3 className="text-lg font-black text-white mb-3">Dynamic Route Planning for Executive Protection</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Integrates live threat intelligence, geofenced IOC feeds, crowd density data, and historical incident mapping to generate and continuously re-optimize safe routes for executive protection teams in real-time.
              </p>
              <div className="space-y-2">
                {["Live threat-weighted routing", "Geofenced IOC avoidance zones", "AR goggle turn-by-turn overlay", "Multi-principal convoy coordination"].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#2ed573]" />
                    <span className="text-xs text-gray-500">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#2ed573]/10">
                <span className="text-[10px] font-mono text-[#2ed573]/70 tracking-widest uppercase">Research Pillar · 02</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-[#00d4ff]/20 bg-gradient-to-b from-[#00d4ff]/5 to-[#0a0e1a]/80 backdrop-blur-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/8 rounded-full blur-3xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff]/25 flex items-center justify-center mb-5">
                <Radio className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <h3 className="text-lg font-black text-white mb-3">Real-Time OSINT Data Fusion</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Autonomously ingests and fuses unstructured public data — social media, paste sites, dark web forums, leaked databases, and news wire — applying NLP and ML classifiers to extract structured IoCs and surface actionable threat signals.
              </p>
              <div className="space-y-2">
                {["Dark web & paste site scraping", "NLP-driven IoC extraction", "Multi-source data deconfliction", "Confidence-scored threat signals"].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#00d4ff]" />
                    <span className="text-xs text-gray-500">{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#00d4ff]/10">
                <span className="text-[10px] font-mono text-[#00d4ff]/70 tracking-widest uppercase">Research Pillar · 03</span>
              </div>
            </div>
          </div>

          {/* IoC + Pre-Incident explainer data grid */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1220]/60 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-sm font-bold text-white">Autonomous Public Data Extraction — How It Works</p>
              <span className="text-[9px] font-mono text-[#00d4ff]/60 border border-[#00d4ff]/20 px-2 py-0.5 rounded">CONTINUOUS · REAL-TIME</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {[
                { label: "Data Sources Scraped", val: "40+", sub: "Forums, paste sites, dark web, social, wire feeds", color: "#00d4ff" },
                { label: "IoC Types Extracted", val: "12", sub: "IPs, domains, hashes, emails, CVEs, TTPs, actors", color: "#a855f7" },
                { label: "Pre-Incident Indicators", val: "Physical, Digital, Hybrid", sub: "Crowd signals, recon patterns, anomalous movement", color: "#ffa502" },
                { label: "Extraction Latency", val: "<3s", sub: "From raw unstructured source to structured IoC record", color: "#2ed573" },
              ].map(c => (
                <div key={c.label} className="px-6 py-5">
                  <p className="text-xl sm:text-2xl font-black mb-1" style={{color: c.color}}>{c.val}</p>
                  <p className="text-xs font-bold text-white mb-1">{c.label}</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Built for Operators. Designed for the Field.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
              Every capability engineered for speed, trust, and decisive action — from the operations center to the last mile.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Eye, color: "#00d4ff", title: "Real-Time Threat Intelligence", desc: "Monitor cyber, physical, influence, and geopolitical threats as they emerge — across all domains simultaneously." },
              { icon: Search, color: "#a855f7", title: "OSINT Investigation Tools", desc: "Deep-dive investigations with person OSINT search, entity graph mapping, and indicator correlation." },
              { icon: Network, color: "#2ed573", title: "Cross-Domain Correlation", desc: "AI-powered correlation engine links disparate signals across SIEM alerts, OSINT, and threat feeds." },
              { icon: AlertTriangle, color: "#ffa502", title: "Automated Alerting", desc: "Customizable alert rules with multi-channel delivery — email, Discord, SMS — for the threats that matter." },
              { icon: BarChart3, color: "#00d4ff", title: "Executive Dashboards", desc: "Clear, actionable intelligence briefings designed for decision-makers, not just analysts." },
              { icon: Shield, color: "#ff4757", title: "Vulnerability Management", desc: "Track CVEs, vendor advisories, SCAP/STIG findings, and remediation workflows from a single pane." },
              { icon: Brain, color: "#a855f7", title: "AI Agents & Automation", desc: "Deploy specialized AI agents to automate intelligence collection, triage, and report generation." },
              { icon: Users, color: "#2ed573", title: "Collaborative War Rooms", desc: "Secure, classified collaboration spaces for teams to jointly investigate and respond to incidents." },
              { icon: CheckCircle, color: "#ffa502", title: "Compliance & Governance", desc: "Built-in compliance controls, policy enforcement, and documentation for regulated industries." },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/5 bg-[#0d1220]/80 backdrop-blur-sm hover:border-[#00d4ff]/20 hover:bg-[#0d1528]/80 transition-all group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#0d1220] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">From Signal to Action in Seconds</h2>
            <p className="text-gray-400 max-w-xl mx-auto">The ASOSINT pipeline: raw intelligence collected at the edge, fused by AI, delivered to your wearable before the threat closes.</p>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Edge Collection & Ingest", desc: "Sensors, feeds, SIEM alerts, OSINT sources, and AR wearable data streams are ingested at the edge node — no cloud dependency required for field operations.", color: "#00d4ff" },
              { step: "02", title: "AI Fusion & Prediction", desc: "The AI fusion engine correlates signals in real-time, enriches indicators, runs predictive threat modeling, and scores actionable risk — in under one second.", color: "#a855f7" },
              { step: "03", title: "COP Delivery to Field", desc: "The Common Operational Picture is pushed to dashboards, AR goggles, wearables, and mobile devices simultaneously — every agent sees the same picture.", color: "#2ed573" },
              { step: "04", title: "Investigate, Collaborate & Brief", desc: "Analysts run deep investigations in War Rooms, generate executive briefings, and trigger automated playbooks — while operators stay eyes-on with AR feeds.", color: "#ffa502" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex gap-5 items-start p-5 rounded-xl border border-white/5 bg-[#0a0f1e]/60 backdrop-blur-sm hover:border-[#00d4ff]/15 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <span className="font-black text-sm" style={{ color }}>{step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-white mb-1">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ASOSINT Was Created */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#00d4ff]/8 border border-[#00d4ff]/20 rounded-full px-3 py-1 mb-6">
            <span className="text-[#00d4ff] text-[10px] font-bold tracking-widest uppercase">Mission Brief</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold mb-6">Why ASOSINT Was Created</h2>
          <p className="text-base sm:text-xl text-gray-300 leading-relaxed mb-6">
            Modern threats don't wait. Cyber incidents cascade into physical risk. Influence operations shape real-world behavior. Field operators need intelligence that arrives before the threat does — not after the debrief.
          </p>
          <p className="text-base sm:text-xl text-gray-300 leading-relaxed">
            ASOSINT was built to give operators, analysts, and decision-makers a unified, field-hardened intelligence platform that fuses all domains — cyber, physical, influence, and geopolitical — into one Common Operational Picture, delivered at edge speed to every device from the SOC to the AR goggle.
          </p>
        </div>
      </section>

      {/* Who It's Built For */}
      <section className="py-16 px-4 bg-[#0d1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-center">Who ASOSINT Was Built For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Enterprise security teams",
              "Cyber defenders and SOC analysts",
              "Protective intelligence and EP teams",
              "Public safety and emergency communications",
              "Government agencies and critical infrastructure",
              "Law enforcement partners",
              "MSPs, integrators, and security service providers",
              "Community safety organizations",
              "Executives and decision-makers",
            ].map((audience, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/5 hover:border-[#00d4ff]/20 transition-colors">
                <Shield className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges Solved */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8">Challenges ASOSINT Solves</h2>
          <div className="space-y-4">
            {[
              "Fragmented threat landscapes across cyber, physical, influence, and geopolitical domains",
              "Information overload and alert fatigue",
              "Slow, manual intelligence cycles",
              "Siloed teams and disconnected tools",
              "Lack of early-warning indicators",
              "Limited access to intelligence for smaller organizations and communities",
            ].map((challenge, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-white/5 hover:border-[#00d4ff]/20 transition-colors">
                <Zap className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
                <span className="text-gray-300">{challenge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Modules */}
      <section className="py-16 px-4 bg-[#0d1220]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-center">ASOSINT's Core Modules</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Global Threat Observatory", desc: "Real-time, multi-domain threat intelligence" },
              { title: "Fusion Center", desc: "Unified intelligence analysis and correlation" },
              { title: "Scenario Engine", desc: "Strategic forecasting and planning" },
              { title: "Red/Blue Cell Module", desc: "Adversary simulation and defensive planning" },
              { title: "Compliance & Governance", desc: "Policy, oversight, and regulatory alignment" },
              { title: "Training Portal", desc: "Role-based learning and certification" },
              { title: "Agent Marketplace", desc: "Specialized AI agents for every domain" },
              { title: "Intelligence Program Builder", desc: "Design full-spectrum intelligence programs" },
            ].map((module, idx) => (
              <Link key={idx} to={createPageUrl("Modules")} className="group">
                <div className="p-6 rounded-xl border border-white/5 bg-[#0a0e1a] hover:border-[#00d4ff]/30 hover:bg-[#0d1220] transition-all">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#00d4ff]" />
                    {module.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{module.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8 text-center">The Founders Behind ASOSINT</h2>
          <p className="text-center text-gray-400 mb-8 max-w-3xl mx-auto">
            ASOSINT reflects the combined strengths of two leaders who have lived these challenges from every angle.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-[#00d4ff]/20 overflow-hidden bg-[#0d1220] hover:border-[#00d4ff]/40 transition-colors">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a02e84d20c4e5765cf405d/64f033491_1661030090872.jpg" alt="Asaad Morman" className="w-full aspect-[4/3] sm:aspect-square object-cover object-top" />
              <div className="p-5 sm:p-8 space-y-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Asaad Morman</h3>
                  <p className="text-[#00d4ff] font-bold mb-3 text-sm sm:text-base">Enterprise Architect & Intelligence Engineer</p>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    Marine Corps veteran, cybersecurity engineer, and enterprise architect with deep experience across public and private sectors in red/blue operations, IAM modernization, DevSecOps, multi-tenant intelligence systems, and cyber operations infrastructure.
                  </p>
                </div>
                <Link to={createPageUrl("FounderBios")}>
                  <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]">
                    View Full Bio
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-[#00d4ff]/20 overflow-hidden bg-[#0d1220] hover:border-[#00d4ff]/40 transition-colors">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a02e84d20c4e5765cf405d/04709accb_Screenshot2025-11-18090738.jpg" alt="Shauntze Morman" className="w-full aspect-[4/3] sm:aspect-square object-cover object-top" />
              <div className="p-5 sm:p-8 space-y-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Shauntze Morman</h3>
                  <p className="text-[#00d4ff] font-bold mb-3 text-sm sm:text-base">Public Safety Leader & Protective Intelligence Specialist</p>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    20+ year veteran of Washington, DC public safety, certified in Security+ and CASP (SecurityX). Expert in emergency communications, operational governance, training, and community safety.
                  </p>
                </div>
                <Link to={createPageUrl("FounderBios")}>
                  <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]">
                    View Full Bio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-400 mt-8 max-w-3xl mx-auto">
            Together, they built ASOSINT as a platform that blends enterprise-grade engineering with public safety heart — a system designed to protect people, empower communities, and strengthen resilience.
          </p>
        </div>
      </section>

      {/* Follow Us Section */}
      <section className="py-16 px-4 bg-[#0d1220]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4">Stay Ahead of Threats</h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Follow our public channels for exclusive threat intelligence, security advisories, and community content — published as events happen.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* LinkedIn */}
            <div className="rounded-xl border border-[#0077B5]/20 bg-[#0077B5]/5 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0077B5]/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077B5]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <div>
                  <p className="font-bold text-white">LinkedIn</p>
                  <p className="text-xs text-gray-400">Emerging Defense Solutions</p>
                </div>
                <span className="ml-auto text-[10px] bg-[#0077B5]/20 text-[#0077B5] px-2 py-1 rounded font-bold border border-[#0077B5]/30">PUBLIC</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">Public security advisories, threat intelligence briefings, vendor disclosures, and ASOSINT feature announcements.</p>
              <ul className="space-y-1.5">
                {["Public vulnerability advisories", "Weekly threat intelligence briefs", "Security industry insights"].map((b,i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 text-[#0077B5] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {b}
                  </li>
                ))}
              </ul>
              <a href="https://www.linkedin.com/company/emerging-defense-solutions" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-[#0077B5] hover:bg-[#005885] text-white font-bold text-sm">
                  Follow on LinkedIn <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>

            {/* Discord */}
            <div className="rounded-xl border border-[#7289da]/20 bg-[#7289da]/5 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7289da]/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#7289da]"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
                <div>
                  <p className="font-bold text-white">Discord</p>
                  <p className="text-xs text-gray-400">ASOSINT Community Server</p>
                </div>
                <span className="ml-auto text-[10px] bg-[#7289da]/20 text-[#7289da] px-2 py-1 rounded font-bold border border-[#7289da]/30">FREE</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">Real-time threat discussions, analyst community channels, live alerts, and exclusive intelligence content drops.</p>
              <ul className="space-y-1.5">
                {["Live threat actor tracking channels", "Real-time critical alert feeds", "Community analyst collaboration"].map((b,i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5 text-[#7289da] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    {b}
                  </li>
                ))}
              </ul>
              <a href="https://discord.gg/asosint" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-[#7289da] hover:bg-[#5f73bc] text-white font-bold text-sm">
                  Join Discord Server <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>

          {/* Email Subscription CTA */}
          <div className="rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5 p-6 text-center">
            <Bell className="w-8 h-8 text-[#00d4ff] mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Get Critical Vulnerability Alerts by Email</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-lg mx-auto">
              Subscribe to receive instant email alerts when critical vulnerabilities are ingested from your monitored feeds — with direct links to affected assets.
            </p>
            <Link to={createPageUrl("FeedSubscriptions")}>
              <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] font-bold">
                Configure Alert Subscriptions <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0d1220] to-[#0a0e1a] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00d4ff]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#00d4ff]/8 border border-[#00d4ff]/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[#00d4ff] text-[10px] font-bold tracking-widest uppercase">Operational Deployment Available Now</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">Deploy Your Common Operational Picture</h2>
          <p className="text-base sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join operators and analysts already running ASOSINT. Get your COP live in minutes — from the SOC to the field.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#38bfff] text-lg h-12 px-8 font-black">
                  Open COP Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to={createPageUrl("TrialSignup")}>
                  <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#38bfff] text-lg h-12 px-8 font-black">
                    Deploy Free Access <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-[#00d4ff]/30 text-white hover:bg-[#00d4ff]/5 text-lg h-12 px-8" onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}>
                  <LogIn className="w-5 h-5 mr-2" /> Operator Login
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-6">No credit card required · Free trial available · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0e1a] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-10">
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to={createPageUrl("WhyAsoint")} className="hover:text-[#00d4ff] transition-colors">Why ASOSINT</Link></li>
                <li><Link to={createPageUrl("Dashboard")} className="hover:text-[#00d4ff] transition-colors">Platform</Link></li>
                <li><Link to={createPageUrl("Comparison")} className="hover:text-[#00d4ff] transition-colors">vs. OSINT Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to={createPageUrl("AboutEDS")} className="hover:text-[#00d4ff] transition-colors">About EDS</Link></li>
                <li><Link to={createPageUrl("FounderBios")} className="hover:text-[#00d4ff] transition-colors">Founders</Link></li>
                <li><Link to={createPageUrl("Careers")} className="hover:text-[#00d4ff] transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to={createPageUrl("Documentation")} className="hover:text-[#00d4ff] transition-colors">Documentation</Link></li>
                <li><Link to={createPageUrl("Support")} className="hover:text-[#00d4ff] transition-colors">Support</Link></li>
                <li><Link to={createPageUrl("Forum")} className="hover:text-[#00d4ff] transition-colors">Community Forum</Link></li>
                <li><Link to={createPageUrl("BriefingEngine")} className="hover:text-[#00d4ff] transition-colors">Intel Briefs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="mailto:info@eds-360.com" className="hover:text-[#00d4ff] transition-colors">info@eds-360.com</a></li>
                <li><a href="tel:+18662083674" className="hover:text-[#00d4ff] transition-colors">(866) 208-3674</a></li>
                <li><a href="mailto:legal@eds-360.com" className="hover:text-[#00d4ff] transition-colors">legal@eds-360.com</a></li>
                <li><a href="mailto:privacy@eds-360.com" className="hover:text-[#00d4ff] transition-colors">privacy@eds-360.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2026 Emerging Defense Solutions. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#00d4ff] transition-colors">Privacy Policy</Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-[#00d4ff] transition-colors">Terms of Service</Link>
              <Link to={createPageUrl("ComplianceDocumentation")} className="hover:text-[#00d4ff] transition-colors">Legal & Compliance</Link>
              <Link to={createPageUrl("AcceptableUsePolicy")} className="hover:text-[#00d4ff] transition-colors">Acceptable Use Policy</Link>
              <Link to={createPageUrl("Documentation")} className="hover:text-[#00d4ff] transition-colors">Documentation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}