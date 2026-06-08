import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Zap, AlertCircle, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhyAsoint() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0d1220] sticky top-0 z-10 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl("Homepage")}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Why ASOINT Exists</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6">The Problem</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-6">
            Modern organizations face an unprecedented security challenge: threats no longer fit neatly into categories. A cyber incident triggers a physical security response. An influence operation shapes real-world behavior. A supply chain disruption cascades into geopolitical instability. Local emergencies ripple into global consequences.
          </p>
          <p className="text-xl text-gray-300 leading-relaxed mb-6">
            Yet the tools we use to defend ourselves are still built for yesterday's world — siloed by domain, fragmented across departments, and overwhelmed by noise.
          </p>
          <div className="bg-[#0d1220] border border-red-500/20 rounded-xl p-6 mt-8">
            <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              The Real Cost of Fragmentation
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Analysts drowning in alerts with no correlation</li>
              <li>• Security teams unable to see connections between domains</li>
              <li>• Leadership lacking unified visibility into organizational risk</li>
              <li>• Response teams working in isolation</li>
              <li>• Communities unable to access intelligence they need to stay safe</li>
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6">The Solution</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-6">
            ASOINT was created to bridge the fragmentation gap. It's a unified intelligence platform that brings all domains together — cyber, physical, influence, geopolitical, and protective intelligence — and makes sense of it all in real time.
          </p>
          <p className="text-xl text-gray-300 leading-relaxed mb-6">
            ASOINT doesn't replace human expertise. It empowers it. It gives analysts, operators, leaders, and decision-makers the unified foundation they need to see what matters, faster, and act with confidence.
          </p>
          <div className="bg-gradient-to-r from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/20 rounded-xl p-6 mt-8">
            <h3 className="font-bold text-[#00d4ff] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              How ASOINT Works
            </h3>
            <ol className="space-y-3 text-gray-300">
              <li><span className="font-bold text-[#00d4ff]">1. Unified Collection:</span> Bring all domains together — cyber, physical, influence, geopolitical</li>
              <li><span className="font-bold text-[#00d4ff]">2. Intelligent Fusion:</span> Correlate signals across domains to reveal patterns</li>
              <li><span className="font-bold text-[#00d4ff]">3. Strategic Forecasting:</span> Use scenario planning to anticipate convergence and escalation</li>
              <li><span className="font-bold text-[#00d4ff]">4. Actionable Intelligence:</span> Deliver clear, prioritized, mission-relevant insights</li>
              <li><span className="font-bold text-[#00d4ff]">5. Continuous Learning:</span> Improve with every cycle through training and certification</li>
            </ol>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6">Who Needed ASOINT</h2>
          <div className="space-y-4">
            {[
              { title: "The Dispatcher", desc: "Overwhelmed by simultaneous emergencies with no unified picture" },
              { title: "The Analyst", desc: "Drowning in alerts with no ability to correlate across domains" },
              { title: "The EP Team", desc: "Trying to stay ahead of converging risks with fragmented intelligence" },
              { title: "The Cyber Defender", desc: "Facing hybrid threats that blur the line between cyber and physical" },
              { title: "The Executive", desc: "Needing clarity and early warning in a world of noise" },
              { title: "The Community Leader", desc: "Trying to keep people safe without access to unified intelligence" },
            ].map((persona, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-white/5 bg-[#0d1220] hover:border-[#00d4ff]/20 transition-colors">
                <h4 className="font-bold text-[#00d4ff] mb-1">{persona.title}</h4>
                <p className="text-gray-400 text-sm">{persona.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6">The ASOINT Mission</h2>
          <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-8">
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              ASOINT exists to give organizations a unified, defensively oriented intelligence platform that empowers teams to:
            </p>
            <ul className="space-y-3">
              {[
                "See threats across all domains — cyber, physical, influence, geopolitical, protective",
                "Connect patterns that traditional tools miss",
                "Forecast escalation and convergence before they happen",
                "Act faster with confidence",
                "Strengthen communities and organizational resilience",
                "Access enterprise-grade intelligence regardless of size",
              ].map((mission, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{mission}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6">Why It Matters</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            In a world where threats move faster than traditional security can keep up, ASOINT provides the unified foundation organizations need. It doesn't replace human expertise — it amplifies it. It doesn't automate decision-making — it clarifies it.
          </p>
          <p className="text-xl text-gray-300 leading-relaxed">
            ASOINT was created by people who have lived these challenges from every angle. Asaad brings enterprise architecture and intelligence engineering expertise. Shauntze brings public safety operations and community protection perspective. Together, they built a platform designed to protect people, empower communities, and strengthen resilience.
          </p>
        </section>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to See What ASOINT Can Do?</h3>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" className="bg-[#00d4ff] text-black hover:bg-[#0099cc]">
              Explore ASOINT
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}