import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Shield, Radio, MessageSquare, Users, Layers } from "lucide-react";

const PLAYBOOKS = [
  {
    id: "ransomware", title: "Ransomware Response", icon: Shield, color: "#ff4757",
    steps: ["Isolate affected systems from network immediately", "Notify security leadership and legal counsel", "Preserve forensic evidence before remediation", "Identify patient zero and initial infection vector", "Assess backup integrity and recovery timeline", "Engage incident response retainer if available", "Coordinate communications with affected stakeholders", "Document all actions with timestamps for post-incident review"],
  },
  {
    id: "cyber_incident", title: "Cyber Incident Triage", icon: Radio, color: "#00d4ff",
    steps: ["Confirm and classify the incident type and severity", "Activate appropriate response team and escalation chain", "Contain the threat to prevent lateral movement", "Collect and preserve logs and indicators", "Assess impact to critical assets and data", "Initiate remediation per approved runbooks", "Maintain situational awareness updates every 30 minutes"],
  },
  {
    id: "influence_op", title: "Influence Operation Response", icon: MessageSquare, color: "#a855f7",
    steps: ["Identify narrative source and propagation vector", "Assess potential impact on organizational reputation", "Brief communications and legal teams", "Monitor spread across platforms with defined metrics", "Coordinate counter-narrative strategy if appropriate", "Document evidence for potential attribution analysis"],
  },
  {
    id: "physical_threat", title: "Physical Threat Protocol", icon: Users, color: "#ffa502",
    steps: ["Activate physical security team and notify EP assets", "Verify threat credibility and specificity", "Brief affected personnel on protective measures", "Coordinate with law enforcement if appropriate", "Increase facility access control posture", "Maintain secure communications throughout response"],
  },
  {
    id: "cross_domain", title: "Cross-Domain Escalation", icon: Layers, color: "#ff6b35",
    steps: ["Confirm cross-domain correlation with analyst team", "Brief executive team on convergence indicators", "Activate multi-domain response coordination", "Assign domain-specific leads for each threat vector", "Establish unified command and communication cadence", "Escalate to Executive Dashboard for strategic guidance"],
  },
];

export default function OperatorPlaybooks({ userTier }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-600 mb-3">High-level, safe response guidance. No sensitive operational detail.</p>
      {PLAYBOOKS.map(pb => {
        const Icon = pb.icon;
        const isOpen = expanded === pb.id;
        return (
          <div key={pb.id} className="bg-[#0d1117] border border-white/5 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : pb.id)}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-white/2 transition-colors text-left">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${pb.color}10`, border: `1px solid ${pb.color}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: pb.color }} />
              </div>
              <span className="flex-1 text-xs font-semibold text-white">{pb.title}</span>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
            </button>
            {isOpen && (
              <div className="border-t border-white/5 px-4 py-3 space-y-2">
                {pb.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[9px] font-bold font-mono shrink-0 mt-0.5" style={{ color: pb.color }}>{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}