import React, { useState } from "react";
import { Lightbulb, ChevronDown, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";

const LESSONS_DATABASE = {
  "supply-chain-attacks": {
    title: "Supply Chain Attack Detection",
    lessons: [
      {
        title: "Trust Boundaries Must Be Continuously Verified",
        description: "Software vendors are not immune. Assume compromise and verify all updates.",
        sources: ["SolarWinds 2020", "Kaseya 2021"],
        keyTakeway: "Implement Software Supply Chain Security (SSCS) practices",
      },
      {
        title: "Detection Timelines Are Measured in Months",
        description: "Supply chain attacks often go undetected for 6+ months. Build detective controls that don't rely on immediate detection.",
        sources: ["SolarWinds 2020"],
        keyTakeway: "Focus on containment and resilience, not just detection",
      },
      {
        title: "Code Signing Is Not Sufficient",
        description: "Even properly signed code can be malicious if the signing process is compromised.",
        sources: ["SolarWinds 2020"],
        keyTakeway: "Require runtime behavioral analysis for critical processes",
      },
    ],
  },
  "credential-theft": {
    title: "Credential Theft & Account Compromise",
    lessons: [
      {
        title: "MFA Fatigue Is a Real Attack Vector",
        description: "Repeatedly pushing MFA notifications until users accept can bypass modern security controls.",
        sources: ["Uber 2022"],
        keyTakeway: "Implement risk-aware MFA and enforce approval workflows",
      },
      {
        title: "Valid Accounts Are the Most Dangerous Tool",
        description: "Once an attacker has legitimate credentials, detection becomes exponentially harder.",
        sources: ["Colonial Pipeline 2021"],
        keyTakeway: "Implement continuous authentication and anomaly detection on privileged accounts",
      },
    ],
  },
  "ransomware": {
    title: "Ransomware Response & Preparedness",
    lessons: [
      {
        title: "Offline, Immutable Backups Are Non-Negotiable",
        description: "Backup systems must be completely isolated and unable to be encrypted or modified.",
        sources: ["Colonial Pipeline 2021", "Kaseya 2021"],
        keyTakeway: "Test restoration procedures quarterly",
      },
      {
        title: "Incident Response Plans Must Include Cyber Insurance",
        description: "Notification procedures, ransom negotiation contacts, and law enforcement reporting must be pre-planned.",
        sources: ["Colonial Pipeline 2021"],
        keyTakeway: "Have legal and insurance contacts on standby",
      },
    ],
  },
};

export default function LessonPanel({ category = "supply-chain-attacks" }) {
  const [expandedLesson, setExpandedLesson] = useState(0);
  const data = LESSONS_DATABASE[category];

  if (!data) return null;

  return (
    <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-[#ffd700]" />
        <h3 className="text-lg font-bold text-white">{data.title}</h3>
      </div>

      <div className="space-y-3">
        {data.lessons.map((lesson, idx) => (
          <div
            key={idx}
            className="border border-white/10 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedLesson(expandedLesson === idx ? -1 : idx)}
              className="w-full p-4 hover:bg-white/5 transition-colors flex items-start justify-between"
            >
              <div className="text-left flex-1">
                <p className="font-bold text-white mb-1">{lesson.title}</p>
                <p className="text-sm text-gray-400">{lesson.description}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 mt-1 transition-transform shrink-0 ml-4 ${
                  expandedLesson === idx ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedLesson === idx && (
              <div className="p-4 bg-white/5 border-t border-white/10 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Sources:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lesson.sources.map((source, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded text-xs text-[#00d4ff]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#2ed573]" /> Key Takeaway:
                  </p>
                  <p className="text-sm text-white font-medium">{lesson.keyTakeway}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}