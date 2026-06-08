import React, { useState } from "react";
import { Cloud, Server, CheckCircle2, AlertTriangle, Lock, Globe2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ENVIRONMENTS = [
  {
    id: "govcloud",
    name: "AWS GovCloud (US)",
    type: "Public Cloud",
    region: "us-gov-east-1 / us-gov-west-1",
    classification: "up to IL5 / Unclassified",
    status: "operational",
    fedramp: "FedRAMP High",
    services: ["EKS Fargate", "RDS Aurora", "S3 GovCloud", "IAM SAML Federation", "CloudTrail", "GuardDuty"],
    compliance: ["FedRAMP High", "ITAR", "CJIS", "DoD SRG IL4"],
    score: 94,
    icon: "🇺🇸",
    color: "border-blue-500/30 bg-blue-900/10",
  },
  {
    id: "azure_gov",
    name: "Azure Government",
    type: "Public Cloud",
    region: "USGov Virginia / Arizona / Texas",
    classification: "up to IL5",
    status: "operational",
    fedramp: "FedRAMP High",
    services: ["AKS", "Azure SQL", "Blob Storage", "Entra ID", "Defender for Cloud", "Sentinel SIEM"],
    compliance: ["FedRAMP High", "DoD SRG IL5", "ITAR", "CJIS"],
    score: 91,
    icon: "☁️",
    color: "border-purple-500/30 bg-purple-900/10",
  },
  {
    id: "on_prem",
    name: "On-Premises (Private DC)",
    type: "On-Premises",
    region: "Customer-Controlled",
    classification: "up to TS/SCI",
    status: "operational",
    fedramp: "N/A (customer-managed ATO)",
    services: ["Bare Metal / VMware", "Air-gapped networking", "HSM Key Management", "FIPS 140-3 crypto", "SIEM Integration"],
    compliance: ["JSIG", "NIST RMF", "CMMC L3", "ICD 503"],
    score: 89,
    icon: "🏢",
    color: "border-green-500/30 bg-green-900/10",
  },
  {
    id: "private_cloud",
    name: "Private Cloud (Hybrid)",
    type: "Private Cloud",
    region: "Customer-Controlled",
    classification: "up to IL5 (SCIF-adjacent)",
    status: "operational",
    fedramp: "Agency ATO path",
    services: ["OpenShift / Kubernetes", "Ceph Storage", "Vault Secrets Manager", "Calico Network Policy", "OPA Gatekeeper"],
    compliance: ["NIST SP 800-145", "CSA CCM", "NIST RMF"],
    score: 86,
    icon: "🔒",
    color: "border-yellow-500/30 bg-yellow-900/10",
  },
  {
    id: "commercial_cloud",
    name: "Commercial Public Cloud",
    type: "Public Cloud",
    region: "Multi-region (AWS / GCP / Azure)",
    classification: "Unclassified / CUI",
    status: "operational",
    fedramp: "FedRAMP Moderate (in progress)",
    services: ["EKS", "CloudFront CDN", "Aurora PostgreSQL", "KMS", "WAF", "Shield Advanced"],
    compliance: ["SOC2 Type II", "ISO 27001", "GDPR", "CCPA"],
    score: 82,
    icon: "🌐",
    color: "border-[#00d4ff]/20 bg-[#00d4ff]/5",
  },
];

const NETWORK_CONTROLS = [
  { label: "Zero Trust Architecture (NIST SP 800-207)", status: "active" },
  { label: "FIPS 140-3 Encryption at rest & in transit", status: "active" },
  { label: "mTLS between all microservices", status: "active" },
  { label: "STIG-hardened container base images", status: "active" },
  { label: "CIS Benchmark Level 2 applied to all nodes", status: "active" },
  { label: "IL4/IL5 data boundary enforcement", status: "active" },
  { label: "Cross-domain solution (CDS) for classified", status: "warning" },
  { label: "PKI / CAC smart card authentication", status: "active" },
];

export default function CloudDeploymentMatrix() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-white">Cloud & Deployment Environments</p>
        <p className="text-xs text-gray-500 mt-0.5">All environments continuously monitored for compliance posture. Click an environment for details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ENVIRONMENTS.map(env => (
          <button key={env.id} onClick={() => setSelected(selected === env.id ? null : env.id)}
            className={`text-left border rounded-xl p-4 space-y-3 transition-all hover:border-[#00d4ff]/30 ${env.color} ${selected === env.id ? "ring-1 ring-[#00d4ff]/40" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{env.icon}</span>
                <div>
                  <p className="font-black text-white text-xs">{env.name}</p>
                  <p className="text-[10px] text-gray-500">{env.type} · {env.region}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-black ${env.score >= 90 ? "text-[#2ed573]" : env.score >= 80 ? "text-[#ffa502]" : "text-red-400"}`}>{env.score}%</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${env.status === "operational" ? "bg-[#2ed573]/10 text-[#2ed573]" : "bg-[#ffa502]/10 text-[#ffa502]"}`}>
                  {env.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500">
              <span className="text-gray-400 font-semibold">Max Classification:</span> {env.classification}
            </div>
            <div className="text-[10px] text-gray-500">
              <span className="text-gray-400 font-semibold">FedRAMP:</span> {env.fedramp}
            </div>
            <div className="flex flex-wrap gap-1">
              {env.compliance.map(c => (
                <span key={c} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">{c}</span>
              ))}
            </div>
            {selected === env.id && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deployed Services</p>
                {env.services.map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-xs text-gray-300">
                    <CheckCircle2 className="w-3 h-3 text-[#2ed573] shrink-0" />{s}
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Network & Crypto Controls */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00d4ff]" />
          <p className="text-sm font-bold text-white">Platform-Wide Security Controls</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {NETWORK_CONTROLS.map(c => (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              {c.status === "active"
                ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573] shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 text-[#ffa502] shrink-0" />}
              <span className={c.status === "active" ? "text-gray-300" : "text-[#ffa502]"}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FedRAMP Readiness Roadmap */}
      <div className="bg-[#0d1220] border border-[#00d4ff]/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00d4ff]" />
          <p className="text-sm font-bold text-white">FedRAMP Authorization Roadmap</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { step: "01", label: "System Boundary & SSP", status: "complete" },
            { step: "02", label: "Control Implementation", status: "in_progress" },
            { step: "03", label: "3PAO Assessment", status: "pending" },
            { step: "04", label: "Agency ATO Review", status: "pending" },
            { step: "05", label: "FedRAMP PMO Listing", status: "pending" },
          ].map(s => (
            <div key={s.step} className="space-y-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                ${s.status === "complete" ? "bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/30"
                  : s.status === "in_progress" ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 animate-pulse"
                  : "bg-white/5 text-gray-600 border border-white/5"}`}>
                {s.step}
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
              <p className={`text-[9px] font-bold ${s.status === "complete" ? "text-[#2ed573]" : s.status === "in_progress" ? "text-[#00d4ff]" : "text-gray-600"}`}>
                {s.status === "complete" ? "COMPLETE" : s.status === "in_progress" ? "IN PROGRESS" : "PENDING"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}