import React, { useState } from "react";
import { AlertTriangle, Lock, CheckCircle2, Shield, FileCheck, Users, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const VERIFICATION_TYPES = {
  subject_consent: {
    label: "Subject Consent",
    icon: Users,
    color: "green",
    description: "Individual has provided written consent for background analysis",
    requires: ["Signed consent form", "Identity verification", "Specific scope agreement"],
  },
  law_enforcement: {
    label: "Law Enforcement Authority",
    icon: Shield,
    color: "blue",
    description: "Authorized law enforcement conducting official investigation",
    requires: ["Search warrant or subpoena", "Agency credentials", "Case number", "Judicial authorization"],
  },
  legal_counsel: {
    label: "Legal Authority (Counsel)",
    icon: FileCheck,
    color: "purple",
    description: "Authorized legal representative conducting legitimate investigation",
    requires: ["Power of attorney", "Legal authorization", "Client identity verification", "Scope limitation"],
  },
};

export default function CivilRightsGate({ onVerified, onDeny }) {
  const [selectedType, setSelectedType] = useState(null);
  const [verified, setVerified] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleVerify = (type) => {
    setSelectedType(type);
    setVerified(true);
    onVerified?.(type);
  };

  const handleDeny = () => {
    setVerified(false);
    setSelectedType(null);
    onDeny?.();
  };

  if (verified) {
    const meta = VERIFICATION_TYPES[selectedType];
    const Icon = meta.icon;
    return (
      <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 text-green-300 mb-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Civil Rights Verified</span>
        </div>
        <p className="text-sm text-gray-300 mb-3">
          <Icon className="w-3.5 h-3.5 inline mr-1" />
          Authorized under: <span className="font-semibold">{meta.label}</span>
        </p>
        <Button
          onClick={handleDeny}
          size="sm"
          variant="outline"
          className="text-xs border-green-500/30 text-green-400"
        >
          Revoke Verification
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-red-900/10 border border-red-500/20 rounded-xl overflow-hidden mb-6">
      <div className="p-4">
        <h3 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Civil Rights Protection Notice
        </h3>
        <p className="text-xs text-gray-300 mb-4 leading-relaxed">
          <strong>IMPORTANT:</strong> Deep OSINT analysis may infringe on civil rights protections (4th and 5th Amendment rights). 
          Unless you have verified legal authority or subject consent, only basic searches are permitted.
        </p>

        <div className="space-y-2">
          {Object.entries(VERIFICATION_TYPES).map(([key, meta]) => {
            const Icon = meta.icon;
            const colorMap = {
              green: "border-green-500/20 hover:bg-green-900/10",
              blue: "border-blue-500/20 hover:bg-blue-900/10",
              purple: "border-purple-500/20 hover:bg-purple-900/10",
            };
            return (
              <button
                key={key}
                onClick={() => setExpanded(expanded === key ? null : key)}
                className={`w-full border rounded-lg p-3 transition-colors text-left ${colorMap[meta.color]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">{meta.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                  {expanded === key ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  )}
                </div>

                {expanded === key && (
                  <div className="mt-3 pt-3 border-t border-gray-700/40">
                    <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-semibold">Required Documentation:</p>
                    <div className="space-y-1 mb-3">
                      {meta.requires.map((req, i) => (
                        <p key={i} className="text-[10px] text-gray-300">▸ {req}</p>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleVerify(key)}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-[10px] h-7"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> I Have Verified Authority
                    </Button>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
          <p className="text-[9px] text-gray-500">
            <strong>Legal Notice:</strong> Misuse of this tool for unauthorized surveillance may violate federal and state privacy laws. Users are responsible for complying with applicable legal statutes.
          </p>
        </div>
      </div>
    </div>
  );
}