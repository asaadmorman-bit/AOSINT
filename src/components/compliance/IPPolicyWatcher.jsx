import React, { useState } from "react";
import { Eye, AlertTriangle, CheckCircle2, RefreshCw, FileText, Shield, ExternalLink, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const POLICY_FEEDS = [
  { id: "nist", name: "NIST SP 800-53 / 800-171 / 800-172", last_check: "4 mins ago", delta: "Rev 5.1 — 3 new controls", status: "updated", url: "https://csrc.nist.gov" },
  { id: "cmmc", name: "CMMC 2.0 Practice Updates (DoD OUSD)", last_check: "4 mins ago", delta: "AC.L3-3.1.3e sub-requirement added", status: "updated", url: "https://dodcmmc.com" },
  { id: "fedramp", name: "FedRAMP Baselines (GSA)", last_check: "4 mins ago", delta: "No changes in last 24h", status: "current", url: "https://fedramp.gov" },
  { id: "jsig", name: "JSIG / ICD 503 (ODNI)", last_check: "8 mins ago", delta: "No changes in last 7 days", status: "current", url: "#" },
  { id: "soc2", name: "AICPA Trust Services Criteria (TSC 2022)", last_check: "2 hrs ago", delta: "No changes", status: "current", url: "https://aicpa.org" },
  { id: "iso27001", name: "ISO/IEC 27001:2022 Controls", last_check: "2 hrs ago", delta: "No changes", status: "current", url: "https://iso.org" },
  { id: "cisa_kem", name: "CISA Known Exploited Vulnerabilities (KEV)", last_check: "2 mins ago", delta: "4 new CVEs added today", status: "urgent", url: "https://cisa.gov/known-exploited-vulnerabilities-catalog" },
  { id: "disa_stig", name: "DISA STIG Updates", last_check: "6 mins ago", delta: "Container runtime STIG v1r3 released", status: "updated", url: "https://public.cyber.mil/stigs" },
];

const IP_FINDINGS = [
  { id: 1, library: "openssl@3.1.4", old_license: "Apache-2.0", new_license: "Apache-2.0", status: "clean", usage: "TLS encryption" },
  { id: 2, library: "libxml2@2.11.0", old_license: "MIT", new_license: "MIT", status: "clean", usage: "XML parsing" },
  { id: 3, library: "pyyaml@6.0.1", old_license: "MIT", new_license: "MIT", status: "clean", usage: "Configuration parsing" },
  { id: 4, library: "redis-py@5.0.1", old_license: "MIT", new_license: "MIT", status: "clean", usage: "Cache layer" },
  { id: 5, library: "celery@5.3.4", old_license: "BSD-3", new_license: "BSD-3", status: "clean", usage: "Task queue" },
  { id: 6, library: "faker@19.6.2", old_license: "MIT", new_license: "GPL-3.0", status: "flagged", usage: "Test data generation — REVIEW REQUIRED" },
  { id: 7, library: "chart.js@4.4.0", old_license: "MIT", new_license: "LGPL-2.1", status: "flagged", usage: "Frontend visualizations — legal review needed" },
  { id: 8, library: "jsonpath@1.1.1", old_license: "MIT", new_license: "GPL-2.0", status: "flagged", usage: "JSON query utilities — isolate or replace" },
  { id: 9, library: "grpc@1.59.0", old_license: "Apache-2.0", new_license: "Apache-2.0", status: "clean", usage: "Service mesh communication" },
  { id: 10, library: "prometheus-client@0.18.0", old_license: "Apache-2.0", new_license: "Apache-2.0", status: "clean", usage: "Metrics exporter" },
];

const PATENT_ITEMS = [
  { title: "Multi-source OSINT graph correlation engine", status: "filed", ref: "EDS-2024-001", date: "2024-03-15" },
  { title: "Agentic threat hunting orchestration with MITRE ATT&CK auto-mapping", status: "pending", ref: "EDS-2024-002", date: "2024-06-01" },
  { title: "Quantum-classical hybrid anomaly detection for cyber threat intelligence", status: "filed", ref: "EDS-2024-003", date: "2024-09-12" },
  { title: "Real-time playbook adaptation via reinforcement learning from analyst feedback", status: "pending", ref: "EDS-2025-001", date: "2025-01-20" },
];

export default function IPPolicyWatcher() {
  const [generating, setGenerating] = useState(false);
  const [ipReport, setIpReport] = useState("");

  const generateIPAnalysis = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an IP and compliance counsel for Emerging Defense Solutions (EDS). Analyze these software license findings and provide actionable legal guidance:

Flagged license changes:
1. faker@19.6.2 — MIT→GPL-3.0 (used in test data generation)
2. chart.js@4.4.0 — MIT→LGPL-2.1 (used in frontend visualizations)
3. jsonpath@1.1.1 — MIT→GPL-2.0 (used in JSON query utilities)

Policy updates requiring attention:
- CISA KEV: 4 new CVEs added today
- NIST 800-53 Rev 5.1: 3 new controls
- CMMC 2.0: new sub-requirement AC.L3-3.1.3e

Provide: (1) Immediate risk for each flagged library, (2) Recommended action per library (replace/isolate/obtain commercial license), (3) Impact on FedRAMP/CMMC status, (4) Timeline recommendations. Be direct and concise (under 250 words).`,
      });
      setIpReport(res);
    } catch {
      setIpReport("Report unavailable.");
    }
    setGenerating(false);
  };

  const flagged = IP_FINDINGS.filter(f => f.status === "flagged");
  const clean = IP_FINDINGS.filter(f => f.status === "clean");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-white">IP, Policy & Regulatory Watcher</p>
          <p className="text-xs text-gray-500">Continuously monitors policy feeds, software licenses, and intellectual property for changes</p>
        </div>
        <Button onClick={generateIPAnalysis} disabled={generating}
          className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
          <Bot className="w-4 h-4" /> {generating ? "Analyzing..." : "AI IP Analysis"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Policy Feed Monitor */}
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00d4ff]" />
            <p className="text-sm font-bold text-white">Regulatory Policy Feeds</p>
          </div>
          <div className="space-y-2">
            {POLICY_FEEDS.map(f => {
              const statusColor = f.status === "urgent" ? "text-red-400 border-red-500/20 bg-red-900/10"
                : f.status === "updated" ? "text-[#ffa502] border-[#ffa502]/20 bg-[#ffa502]/5"
                : "text-[#2ed573] border-[#2ed573]/20 bg-[#2ed573]/5";
              const Icon = f.status === "urgent" ? AlertTriangle : f.status === "updated" ? RefreshCw : CheckCircle2;
              return (
                <div key={f.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[#111827]">
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${f.status === "urgent" ? "text-red-400" : f.status === "updated" ? "text-[#ffa502]" : "text-[#2ed573]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300 truncate">{f.name}</p>
                    <p className={`text-[10px] ${f.status !== "current" ? "text-[#ffa502]" : "text-gray-500"}`}>{f.delta}</p>
                    <p className="text-[9px] text-gray-600">Last checked: {f.last_check}</p>
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-300 shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Software License Scan */}
        <div className="space-y-3">
          <div className="bg-[#0d1220] border border-red-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffa502]" />
              <p className="text-sm font-bold text-white">License Drift — Action Required ({flagged.length})</p>
            </div>
            {flagged.map(f => (
              <div key={f.id} className="px-3 py-2.5 rounded-lg bg-[#ffa502]/5 border border-[#ffa502]/15 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{f.library}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111827] text-gray-400 font-mono">{f.old_license}</span>
                    <span className="text-[9px] text-gray-600">→</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 font-mono font-bold">{f.new_license}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#ffa502]">{f.usage}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
              <p className="text-sm font-bold text-white">Clean ({clean.length} libraries)</p>
            </div>
            {clean.map(f => (
              <div key={f.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#111827]">
                <span className="text-xs font-mono text-gray-400">{f.library}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2ed573]/10 text-[#2ed573] font-mono">{f.new_license}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patent Portfolio */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-bold text-white">EDS Patent & IP Portfolio</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PATENT_ITEMS.map(p => (
            <div key={p.ref} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-[#111827]">
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${p.status === "filed" ? "bg-[#2ed573]" : "bg-[#ffa502] animate-pulse"}`} />
              <div>
                <p className="text-xs font-semibold text-gray-200">{p.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{p.ref} · Filed {p.date}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${p.status === "filed" ? "bg-[#2ed573]/10 text-[#2ed573]" : "bg-[#ffa502]/10 text-[#ffa502]"}`}>
                  {p.status === "filed" ? "FILED" : "PENDING"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Report */}
      {ipReport && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/15 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#00d4ff]" />
            <p className="text-sm font-bold text-white">AI IP & Policy Analysis</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{ipReport}</p>
        </div>
      )}
    </div>
  );
}