import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Users, Zap, Target, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutEDS() {
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl sticky top-0 z-50 h-16 flex items-center px-6">
        <Link to={createPageUrl("Homepage")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">About Emerging Defense Solutions</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p>
              Emerging Defense Solutions (EDS) serves as the strategic headquarters for a connected universe of mission-driven companies. Founded by Asaad and Shauntze Morman, EDS is a unified S-Corporation designed to bring multiple businesses under one cohesive, disciplined, and future-focused structure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">What We Do</h2>
            <p>
              By centralizing leadership, compliance, technology, and operations, EDS gives each brand the strength of a larger enterprise while preserving the authenticity and mission focus of each company. Our structure is built for long-term scalability, community impact, and generational legacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Divisions</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-bold text-[#00d4ff] mb-2">Cyber Division</h3>
                <p className="text-sm">Advanced cybersecurity consulting, threat intelligence, and digital defense solutions through Cyber Dojo Solutions.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-bold text-[#00d4ff] mb-2">Defense & Training Division</h3>
                <p className="text-sm">Firearms training, defensive tactics, and executive protection programs through Heritage Shield Defense Academy.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-bold text-[#00d4ff] mb-2">Legal Division</h3>
                <p className="text-sm">Professional mobile notary and legal document services through Seals on Wheels.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-bold text-[#00d4ff] mb-2">Landscaping Division</h3>
                <p className="text-sm">Professional property maintenance and grounds care through Mow Dojo.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Our Values</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
                <span><strong>Veteran-Owned</strong> — Built on military discipline and service principles</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
                <span><strong>Family-Led Enterprise</strong> — Founded and operated by Asaad and Shauntze Morman</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
                <span><strong>Multi-Industry Portfolio</strong> — Diversified expertise across cyber, training, legal, and operations</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
                <span><strong>Community-Centered</strong> — Committed to protecting and empowering communities</span>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Partner With EDS</h2>
            <p className="mb-6">
              We welcome collaboration with organizations that share our commitment to excellence, protection, and community impact. EDS partners with government agencies, private sector companies, non-profits, and local businesses.
            </p>
            <Link to={createPageUrl("PartnerPortal")}>
              <Button className="bg-[#00d4ff] text-black hover:bg-[#0099cc]">
                Explore Partnerships
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}