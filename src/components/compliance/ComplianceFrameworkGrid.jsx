import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FRAMEWORKS = [
  {
    id: "soc2",
    name: "SOC 2 Type II",
    score: 94,
    status: "passing",
    authority: "AICPA",
    last_scan: "2 mins ago",
    description: "Trust Services Criteria covering security, availability, processing integrity, confidentiality, and privacy.",
    controls: [
      { id: "CC1", name: "Control Environment", status: "passing", findings: 0 },
      { id: "CC2", name: "Communication & Information", status: "passing", findings: 0 },
      { id: "CC3", name: "Risk Assessment", status: "passing", findings: 1 },
      { id: "CC6", name: "Logical Access Controls", status: "passing", findings: 0 },
      { id: "CC7", name: "System Operations", status: "warning", findings: 2 },
      { id: "CC8", name: "Change Management", status: "passing", findings: 0 },
      { id: "CC9", name: "Risk Mitigation", status: "passing", findings: 0 },
    ],
    color: "border-[#2ed573]/30 bg-[#2ed573]/5",
    badge: "bg-[#2ed573]/10 text-[#2ed573]",
  },
  {
    id: "iso27001",
    name: "ISO 27001:2022",
    score: 91,
    status: "passing",
    authority: "ISO/IEC",
    last_scan: "2 mins ago",
    description: "Information security management system standard with 93 controls across 4 themes and 11 clauses.",
    controls: [
      { id: "A.5", name: "Organizational Controls", status: "passing", findings: 0 },
      { id: "A.6", name: "People Controls", status: "passing", findings: 1 },
      { id: "A.7", name: "Physical Controls", status: "passing", findings: 0 },
      { id: "A.8.2", name: "Privileged Access Rights", status: "passing", findings: 0 },
      { id: "A.8.7", name: "Protection Against Malware", status: "passing", findings: 0 },
      { id: "A.8.16", name: "Monitoring Activities", status: "warning", findings: 3 },
      { id: "A.8.28", name: "Secure Coding", status: "passing", findings: 0 },
    ],
    color: "border-blue-500/30 bg-blue-900/10",
    badge: "bg-blue-900/20 text-blue-300",
  },
  {
    id: "jsig",
    name: "JSIG (Joint SAP Implementation Guide)",
    score: 87,
    status: "warning",
    authority: "DoD / ODNI",
    last_scan: "4 mins ago",
    description: "DoD/IC Special Access Program (SAP) security implementation requirements for classified environments.",
    controls: [
      { id: "JSIG-IA", name: "Identification & Authentication", status: "passing", findings: 0 },
      { id: "JSIG-AC", name: "Access Control", status: "passing", findings: 1 },
      { id: "JSIG-AU", name: "Audit & Accountability", status: "warning", findings: 4 },
      { id: "JSIG-CM", name: "Configuration Management", status: "passing", findings: 0 },
      { id: "JSIG-IR", name: "Incident Response", status: "warning", findings: 2 },
      { id: "JSIG-SC", name: "System & Communications Protection", status: "passing", findings: 0 },
    ],
    color: "border-yellow-500/30 bg-yellow-900/10",
    badge: "bg-yellow-900/20 text-yellow-300",
  },
  {
    id: "rmf",
    name: "NIST RMF (SP 800-37)",
    score: 89,
    status: "passing",
    authority: "NIST / DoD",
    last_scan: "3 mins ago",
    description: "Risk Management Framework for federal information systems — 6 step lifecycle: Categorize, Select, Implement, Assess, Authorize, Monitor.",
    controls: [
      { id: "RMF-CAT", name: "Categorize System", status: "passing", findings: 0 },
      { id: "RMF-SEL", name: "Select Controls", status: "passing", findings: 0 },
      { id: "RMF-IMP", name: "Implement Controls", status: "passing", findings: 1 },
      { id: "RMF-ASS", name: "Assess Controls", status: "warning", findings: 3 },
      { id: "RMF-AUT", name: "Authorize System (ATO)", status: "passing", findings: 0 },
      { id: "RMF-MON", name: "Monitor Controls", status: "passing", findings: 0 },
    ],
    color: "border-purple-500/30 bg-purple-900/10",
    badge: "bg-purple-900/20 text-purple-300",
  },
  {
    id: "cmmc",
    name: "CMMC 2.0 Level 3",
    score: 82,
    status: "warning",
    authority: "DoD OUSD(A&S)",
    last_scan: "3 mins ago",
    description: "Cybersecurity Maturity Model Certification — 110 NIST SP 800-172 practices required for advanced CUI protection.",
    controls: [
      { id: "AC", name: "Access Control (26 practices)", status: "passing", findings: 0 },
      { id: "AT", name: "Awareness & Training", status: "passing", findings: 1 },
      { id: "AU", name: "Audit & Accountability", status: "warning", findings: 5 },
      { id: "CM", name: "Configuration Management", status: "passing", findings: 0 },
      { id: "IA", name: "Identification & Authentication", status: "passing", findings: 0 },
      { id: "IR", name: "Incident Response", status: "warning", findings: 3 },
      { id: "MA", name: "Maintenance", status: "passing", findings: 0 },
      { id: "MP", name: "Media Protection", status: "warning", findings: 2 },
      { id: "PE", name: "Physical Protection", status: "passing", findings: 0 },
      { id: "PS", name: "Personnel Security", status: "passing", findings: 0 },
      { id: "RA", name: "Risk Assessment", status: "passing", findings: 1 },
      { id: "SA", name: "System & Services Acquisition", status: "passing", findings: 0 },
      { id: "SC", name: "System & Comms Protection", status: "passing", findings: 0 },
      { id: "SI", name: "System & Information Integrity", status: "passing", findings: 0 },
    ],
    color: "border-orange-500/30 bg-orange-900/10",
    badge: "bg-orange-900/20 text-orange-300",
  },
  {
    id: "fedramp",
    name: "FedRAMP Moderate (In Progress)",
    score: 76,
    status: "warning",
    authority: "GSA / OMB",
    last_scan: "5 mins ago",
    description: "Federal Risk and Authorization Management Program — 325 NIST SP 800-53 controls for cloud services used by federal agencies.",
    controls: [
      { id: "AC", name: "Access Control", status: "passing", findings: 0 },
      { id: "AU", name: "Audit & Accountability", status: "warning", findings: 6 },
      { id: "CA", name: "Security Assessment", status: "warning", findings: 4 },
      { id: "CM", name: "Configuration Mgmt", status: "passing", findings: 1 },
      { id: "CP", name: "Contingency Planning", status: "warning", findings: 3 },
      { id: "IA", name: "Identification & Auth", status: "passing", findings: 0 },
      { id: "IR", name: "Incident Response", status: "warning", findings: 5 },
      { id: "MA", name: "Maintenance", status: "passing", findings: 0 },
      { id: "PL", name: "Planning", status: "passing", findings: 0 },
      { id: "RA", name: "Risk Assessment", status: "passing", findings: 2 },
      { id: "SA", name: "System & Services Acq.", status: "warning", findings: 3 },
      { id: "SC", name: "System & Comms Protection", status: "passing", findings: 0 },
      { id: "SI", name: "System & Info Integrity", status: "passing", findings: 1 },
    ],
    color: "border-red-500/30 bg-red-900/10",
    badge: "bg-red-900/20 text-red-300",
  },
];

function ControlRow({ control }) {
  const Icon = control.status === "passing" ? CheckCircle2 : control.status === "warning" ? AlertTriangle : XCircle;
  const color = control.status === "passing" ? "text-[#2ed573]" : control.status === "warning" ? "text-[#ffa502]" : "text-red-400";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
        <span className="text-xs text-gray-300">{control.id} — {control.name}</span>
      </div>
      {control.findings > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ffa502]/10 text-[#ffa502]">{control.findings} finding{control.findings > 1 ? "s" : ""}</span>
      )}
    </div>
  );
}

export default function ComplianceFrameworkGrid() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">Active Compliance Frameworks</p>
        <span className="text-xs text-gray-500">Agent scans every 5 minutes · All frameworks continuously monitored</span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {FRAMEWORKS.map(f => {
          const isOpen = expanded === f.id;
          const Icon = f.status === "passing" ? CheckCircle2 : f.status === "warning" ? AlertTriangle : XCircle;
          const statusColor = f.status === "passing" ? "text-[#2ed573]" : "text-[#ffa502]";
          const totalFindings = f.controls.reduce((a, c) => a + c.findings, 0);
          return (
            <div key={f.id} className={`border rounded-xl bg-[#0d1220] ${f.color} transition-all`}>
              <button className="w-full text-left p-5" onClick={() => setExpanded(isOpen ? null : f.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${statusColor}`} />
                    <div>
                      <p className="font-black text-white text-sm">{f.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{f.authority} · Last scan: {f.last_scan}</p>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`text-lg font-black ${statusColor}`}>{f.score}%</div>
                    {totalFindings > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ffa502]/10 text-[#ffa502] font-bold">{totalFindings} open</span>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${f.score >= 90 ? "bg-[#2ed573]" : f.score >= 80 ? "bg-[#ffa502]" : "bg-red-500"}`} style={{ width: `${f.score}%` }} />
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Control Domains</p>
                  <div className="space-y-0">
                    {f.controls.map(c => <ControlRow key={c.id} control={c} />)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 text-xs h-7 gap-1">
                      View Full Report
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white text-xs h-7 gap-1">
                      <ExternalLink className="w-3 h-3" /> Remediation Guide
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}