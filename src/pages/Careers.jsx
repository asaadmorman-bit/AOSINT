import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Briefcase, Users, Target, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Careers() {
  useEffect(() => window.scrollTo(0, 0), []);

  const roles = [
    {
      title: "Cybersecurity & Intelligence Analysis",
      description: "Join our threat intelligence team to analyze global security threats and develop defensive strategies.",
      division: "Cyber Division"
    },
    {
      title: "Firearms & Defensive Tactics Instruction",
      description: "Deliver world-class training in firearms safety, defensive tactics, and protective operations.",
      division: "Training Division"
    },
    {
      title: "Mobile Notary & Legal Support Services",
      description: "Provide professional mobile notary and legal document services to individuals and businesses.",
      division: "Legal Division"
    },
    {
      title: "Landscaping & Property Maintenance",
      description: "Manage grounds and property care operations for residential and commercial clients.",
      division: "Operations Division"
    },
    {
      title: "Customer Service & Operations Coordination",
      description: "Support our operations with excellent customer service and operational excellence.",
      division: "Corporate"
    },
    {
      title: "Leadership, Management & Strategic Roles",
      description: "Lead teams and drive strategic initiatives across our enterprise divisions.",
      division: "Corporate"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#0a0e1a]/90 backdrop-blur-xl sticky top-0 z-50 h-16 flex items-center px-6">
        <Link to={createPageUrl("Homepage")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Careers at Emerging Defense Solutions</h1>
        <p className="text-gray-400 text-lg mb-12">
          Build your future inside a fast-growing, mission-driven enterprise where discipline, leadership, and service are the foundation of everything we do.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-gradient-to-br from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/20 rounded-lg p-8">
            <Users className="w-8 h-8 text-[#00d4ff] mb-4" />
            <h2 className="text-xl font-bold mb-3">Why Work at EDS</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Competitive compensation and benefits</li>
              <li>• Professional development opportunities</li>
              <li>• Multi-industry growth potential</li>
              <li>• Mission-driven culture</li>
              <li>• Community impact</li>
              <li>• Veteran-owned company</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-[#a855f7]/10 to-transparent border border-[#a855f7]/20 rounded-lg p-8">
            <Target className="w-8 h-8 text-[#a855f7] mb-4" />
            <h2 className="text-xl font-bold mb-3">Our Culture</h2>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Discipline and excellence</li>
              <li>• Integrity and transparency</li>
              <li>• Community focus</li>
              <li>• Collaborative teams</li>
              <li>• Continuous learning</li>
              <li>• Generational legacy building</li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-8">Open Opportunities</h2>
        <div className="grid gap-4 mb-12">
          {roles.map((role, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-[#00d4ff]/30 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{role.title}</h3>
                  <p className="text-xs text-[#00d4ff] mt-1">{role.division}</p>
                </div>
                <Briefcase className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-1" />
              </div>
              <p className="text-gray-400 text-sm mb-4">{role.description}</p>
              <Button variant="ghost" size="sm" className="text-[#00d4ff] hover:bg-[#00d4ff]/10 gap-2">
                Learn More <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-[#00d4ff]/10 via-[#a855f7]/10 to-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Join Our Mission?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Send your resume and a brief message about your interests to careers@eds-360.com
          </p>
          <a href="mailto:careers@eds-360.com">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#0099cc] gap-2">
              Inquire About Careers <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}