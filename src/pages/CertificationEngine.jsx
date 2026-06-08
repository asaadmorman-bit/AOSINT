import React, { useState } from "react";
import { Award, BookOpen, Target, Zap, Users, CheckCircle2, Lock, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CertificationEngine() {
  const [selectedLevel, setSelectedLevel] = useState("operator");
  const [selectedTrack, setSelectedTrack] = useState(null);

  const certLevels = [
    {
      key: "operator",
      name: "ASOSINT Operator",
      level: "Level 1",
      color: "#00d4ff",
      duration: "40 hours",
      prerequisite: "None",
      overview: "Foundation-level certification covering platform navigation, basic threat analysis, and operational workflows.",
      modules: [
        "ASOSINT Platform Essentials",
        "Threat Indicator Basics",
        "Dashboard Navigation",
        "Alert Triage & Response",
        "Basic Reporting",
      ],
      assessment: "Online exam + practical lab",
    },
    {
      key: "analyst",
      name: "ASOSINT Analyst",
      level: "Level 2",
      color: "#a855f7",
      duration: "80 hours",
      prerequisite: "ASOSINT Operator certification",
      overview: "Advanced certification covering intelligence analysis, data correlation, multi-domain investigation, and narrative mapping.",
      modules: [
        "Intelligence Analysis Methods",
        "Data Fusion & Correlation",
        "Cross-Domain Investigation",
        "Narrative Intelligence",
        "Threat Profiling",
        "Advanced Reporting",
      ],
      assessment: "Written exam + capstone project",
    },
    {
      key: "engineer",
      name: "ASOSINT Engineer",
      level: "Level 3",
      color: "#2ed573",
      duration: "120 hours",
      prerequisite: "ASOSINT Analyst certification",
      overview: "Expert certification covering systems architecture, integration design, API development, and advanced automation.",
      modules: [
        "ASOSINT Architecture",
        "Data Lake Integration",
        "API Development & Integration",
        "Custom Agent Design",
        "Automated Workflows",
        "Performance Tuning",
      ],
      assessment: "Hands-on lab + system design project",
    },
    {
      key: "architect",
      name: "ASOSINT Architect",
      level: "Level 4",
      color: "#ffa502",
      duration: "160 hours",
      prerequisite: "ASOSINT Engineer certification + 2 years experience",
      overview: "Master certification covering enterprise program design, strategic intelligence architecture, and organizational transformation.",
      modules: [
        "Intelligence Program Architecture",
        "Organizational Design",
        "Enterprise Integration Strategy",
        "Governance & Compliance",
        "Strategic Forecasting",
        "Leadership & Team Development",
      ],
      assessment: "Strategic assessment + organizational design proposal",
    },
  ];

  const specializedTracks = [
    {
      key: "protective",
      name: "Protective Intelligence",
      icon: Target,
      description: "Executive Protection, threat assessment, and personal security operations.",
      modules: ["Threat Assessment", "Security Planning", "Incident Response", "Executive Briefing"],
      minLevel: "Operator",
    },
    {
      key: "public-safety",
      name: "Public Safety & Emergency Comms",
      icon: Zap,
      description: "Emergency response, incident command, and community safety operations.",
      modules: ["Incident Command", "Emergency Protocols", "Community Coordination", "Resilience Planning"],
      minLevel: "Operator",
    },
    {
      key: "cyber",
      name: "Cyber Defense",
      icon: Lock,
      description: "Cyber threat analysis, SOC operations, and incident response.",
      modules: ["Cyber Threat Analysis", "SOC Operations", "IR Playbooks", "Threat Hunting"],
      minLevel: "Analyst",
    },
    {
      key: "influence",
      name: "Influence & Narrative Intelligence",
      icon: Users,
      description: "Information operations, narrative analysis, and strategic communication.",
      modules: ["Narrative Analysis", "InfoOps Tracking", "Influence Mapping", "Comms Strategy"],
      minLevel: "Analyst",
    },
    {
      key: "scenario",
      name: "Scenario & Red/Blue Cell",
      icon: Zap,
      description: "Strategic forecasting, wargaming, and adversary simulation.",
      modules: ["Scenario Design", "Red Team Ops", "Blue Team Defense", "Strategic Planning"],
      minLevel: "Analyst",
    },
    {
      key: "compliance",
      name: "Compliance & Governance",
      icon: BookOpen,
      description: "Regulatory alignment, policy development, and audit management.",
      modules: ["Compliance Frameworks", "Policy Design", "Risk Assessment", "Audit Prep"],
      minLevel: "Analyst",
    },
  ];

  const currentLevel = certLevels.find(l => l.key === selectedLevel);

  return (
    <ProtectedRoute minTier="community">
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
        {/* Header */}
        <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-[#00d4ff]" />
              <h1 className="text-4xl font-black text-white">ASOSINT Certification Engine</h1>
            </div>
            <p className="text-gray-400 max-w-2xl">Validate expertise across cyber, physical, influence, protective intelligence, and leadership roles. From operator to architect, across six specialized domains.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Certification Path */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">Certification Levels</h2>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {certLevels.map((cert) => (
                <button
                  key={cert.key}
                  onClick={() => setSelectedLevel(cert.key)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedLevel === cert.key
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 shadow-[0_0_20px_rgba(0,212,255,0.1)]"
                      : "border-white/10 bg-[#111827] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{cert.level}</p>
                      <h3 className="font-bold text-white">{cert.name}</h3>
                    </div>
                    <Award className="w-5 h-5 flex-shrink-0" style={{ color: cert.color }} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {cert.duration}
                  </div>
                </button>
              ))}
            </div>

            {/* Level Details */}
            {currentLevel && (
              <div className="bg-[#111827] border border-white/5 rounded-lg p-8 mb-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                    <p className="text-gray-300 mb-6">{currentLevel.overview}</p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-white">Duration</p>
                          <p className="text-sm text-gray-400">{currentLevel.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        {currentLevel.prerequisite === "None" ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-[#2ed573] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-white">Entry Requirement</p>
                              <p className="text-sm text-gray-400">No prerequisites</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5 text-[#ffa502] flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-white">Prerequisite</p>
                              <p className="text-sm text-gray-400">{currentLevel.prerequisite}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Learning Modules</h3>
                    <ul className="space-y-3">
                      {currentLevel.modules.map((module, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded">
                          <span className="w-2 h-2 rounded-full" style={{ background: currentLevel.color }} />
                          <span className="text-sm text-gray-300">{module}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 p-4 bg-white/5 rounded border border-white/5">
                      <p className="text-xs font-bold text-gray-500 mb-1">ASSESSMENT METHOD</p>
                      <p className="text-sm text-gray-300">{currentLevel.assessment}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Specialized Tracks */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">Specialized Certification Tracks</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {specializedTracks.map((track) => (
                <button
                  key={track.key}
                  onClick={() => setSelectedTrack(selectedTrack === track.key ? null : track.key)}
                  className={`text-left p-6 rounded-lg border transition-all ${
                    selectedTrack === track.key
                      ? "border-[#00d4ff] bg-[#00d4ff]/10"
                      : "border-white/5 bg-[#111827] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <track.icon className="w-6 h-6 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white">{track.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{track.minLevel}+</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-gray-500 transition-transform ${selectedTrack === track.key ? "rotate-90" : ""}`} />
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{track.description}</p>
                  {selectedTrack === track.key && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs font-bold text-gray-500 mb-2">MODULES</p>
                      <div className="flex flex-wrap gap-2">
                        {track.modules.map((module, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-gray-300">
                            {module}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Delivery Modes */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">Learning & Delivery Modes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  mode: "Self-Paced",
                  icon: "🎓",
                  description: "Learn on your schedule with lifetime access to course materials",
                  features: ["24/7 access", "Video modules", "Lab environments", "Flexible timeline"],
                },
                {
                  mode: "Instructor-Led",
                  icon: "👨‍🏫",
                  description: "Live training sessions with ASOSINT certified instructors",
                  features: ["Live cohorts", "Q&A sessions", "Group projects", "Networking"],
                },
                {
                  mode: "Hybrid",
                  icon: "🤝",
                  description: "Combination of self-paced and live sessions for maximum flexibility",
                  features: ["Recorded lectures", "Live labs", "Mentorship", "Capstone support"],
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.mode}</h3>
                  <p className="text-sm text-gray-400 mb-4">{item.description}</p>
                  <ul className="space-y-2">
                    {item.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Badging & Renewal */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8">Digital Badges & Credentials</h2>
            <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Badge Verification</h3>
                  <p className="text-gray-300 mb-6">
                    Each certification earns a digitally verifiable badge that can be displayed on LinkedIn, portfolios, and professional profiles.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#2ed573] flex-shrink-0" />
                      Cryptographically signed
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#2ed573] flex-shrink-0" />
                      Publicly verifiable
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#2ed573] flex-shrink-0" />
                      Career advancement benefit
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#2ed573] flex-shrink-0" />
                      Partner recognized
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Certification Renewal</h3>
                  <p className="text-gray-300 mb-6">
                    ASOSINT certifications remain valid for 2 years. Renewal options include:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#00d4ff] flex-shrink-0">1</span>
                      <div>
                        <p className="font-bold">Retake examination</p>
                        <p className="text-sm text-gray-500">Full certification exam for current level</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#00d4ff] flex-shrink-0">2</span>
                      <div>
                        <p className="font-bold">Advance to next level</p>
                        <p className="text-sm text-gray-500">Pursue higher certification for automatic renewal</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-gray-300">
                      <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#00d4ff] flex-shrink-0">3</span>
                      <div>
                        <p className="font-bold">Continuing education</p>
                        <p className="text-sm text-gray-500">80 hours of approved CE activities</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-[#111827] border border-white/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Start Your ASOSINT Certification Journey</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Join thousands of intelligence professionals, security operators, and leadership teams who have advanced their expertise with ASOSINT certifications.</p>
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="bg-[#00d4ff] text-black font-bold gap-2">
                Enroll Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}