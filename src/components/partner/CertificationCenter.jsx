import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Award, CheckCircle2, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CERT_PATHS = [
  {
    id: "fundamentals",
    name: "SOINT Fundamentals",
    modules: 5,
    duration: "2 hours",
    minTier: "registered",
    description: "Learn the basics of SOINT intelligence platform",
  },
  {
    id: "fusion_center",
    name: "Fusion Center Operations",
    modules: 8,
    duration: "4 hours",
    minTier: "silver",
    description: "Manage and operate the Fusion Center module",
  },
  {
    id: "scenario_engine",
    name: "Scenario Engine Mastery",
    modules: 10,
    duration: "5 hours",
    minTier: "silver",
    description: "Design and execute defensive scenarios",
  },
  {
    id: "red_blue",
    name: "Red/Blue Cell Facilitation",
    modules: 8,
    duration: "4 hours",
    minTier: "gold",
    description: "Facilitate red team and blue team exercises",
  },
  {
    id: "compliance",
    name: "Compliance & Governance",
    modules: 6,
    duration: "3 hours",
    minTier: "gold",
    description: "Manage compliance controls and audit logs",
  },
  {
    id: "agent_marketplace",
    name: "Agent Marketplace Administration",
    modules: 7,
    duration: "3.5 hours",
    minTier: "gold",
    description: "Deploy and manage SOINT agents",
  },
];

export default function CertificationCenter({ partner }) {
  const { data: certs } = useQuery({
    queryKey: ["certifications", partner.id],
    queryFn: () => base44.entities.PartnerCertification.filter({ partner_id: partner.id }),
  });

  const TIER_ORDER = ["registered", "silver", "gold", "elite", "gov"];
  const partnerTierIndex = TIER_ORDER.indexOf(partner.tier);

  const availablePaths = CERT_PATHS.filter(cp => TIER_ORDER.indexOf(cp.minTier) <= partnerTierIndex);
  const lockedPaths = CERT_PATHS.filter(cp => TIER_ORDER.indexOf(cp.minTier) > partnerTierIndex);

  const userCerts = certs || [];

  return (
    <div className="space-y-6">
      {/* Available Paths */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Training Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePaths.map(path => {
            const userCert = userCerts.find(c => c.certification_type === path.id);
            const isPassed = userCert?.status === "passed";

            return (
              <div key={path.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{path.name}</h3>
                    {isPassed && (
                      <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Certified
                      </p>
                    )}
                  </div>
                  {isPassed && <Award className="w-5 h-5 text-amber-400" />}
                </div>

                <p className="text-sm text-gray-400 mb-3">{path.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>{path.modules} modules</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  <span>{path.duration}</span>
                </div>

                {!isPassed && (
                  <Button className="w-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 h-8 text-sm">
                    Start Training
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Locked Paths */}
      {lockedPaths.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Premium Training Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedPaths.map(path => (
              <div key={path.id} className="bg-[#0d1117] border border-white/10 rounded-xl p-4 opacity-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{path.name}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Requires {path.minTier.charAt(0).toUpperCase() + path.minTier.slice(1)} tier
                    </p>
                  </div>
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>

                <p className="text-sm text-gray-500 mb-3">{path.description}</p>

                <Button className="w-full bg-gray-700 text-gray-400 h-8 text-sm" disabled>
                  Upgrade Required
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {userCerts.length > 0 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Your Certification Progress</h3>
          <div className="space-y-3">
            {userCerts.map(cert => (
              <div key={cert.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-sm font-medium capitalize">{cert.certification_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cert.status === "passed" ? `Passed: ${new Date(cert.passed_date).toLocaleDateString()}` : "In Progress"}
                  </p>
                </div>
                {cert.status === "passed" && (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}