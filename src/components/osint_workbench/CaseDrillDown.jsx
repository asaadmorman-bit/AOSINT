import React, { useState } from "react";
import {
  ArrowLeft, Hash, Database, Clock, AlertTriangle, Globe2,
  Copy, QrCode, Shield, ChevronRight, FileText, Eye
} from "lucide-react";
import { buildCaseReportURL } from "@/utils/radix44";
import { Button } from "@/components/ui/button";

const sevColor = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };
const statusColor = { active: "#2ed573", investigating: "#ffa502", triaged: "#00d4ff", closed: "#6b7280" };

const MOCK_INDICATORS = [
  { type: "ip", value: "185.220.101.47", severity: "critical", source: "AlienVault OTX", last_seen: "2m ago", tags: ["C2", "Tor Exit"] },
  { type: "domain", value: "update-secure-cdn.net", severity: "high", source: "VirusTotal", last_seen: "18m ago", tags: ["Phishing", "DGA"] },
  { type: "hash_sha256", value: "a3f1c2...8e4b90", severity: "high", source: "AbuseIPDB", last_seen: "1h ago", tags: ["Malware", "Dropper"] },
  { type: "email", value: "admin@ironveil-ops.ru", severity: "medium", source: "Shodan", last_seen: "3h ago", tags: ["Threat Actor", "APT"] },
  { type: "cve", value: "CVE-2024-3400", severity: "critical", source: "NIST NVD", last_seen: "5h ago", tags: ["RCE", "PAN-OS"] },
];

const MOCK_TIMELINE = [
  { ts: "2026-04-06 09:14", actor: "AI Agent", action: "IOC Cluster Detected", detail: "5 new indicators linked to IRONVEIL campaign" },
  { ts: "2026-04-06 08:31", actor: "Analyst", action: "Evidence Added", detail: "Network capture uploaded to IPFS. SHA-256 verified." },
  { ts: "2026-04-05 22:47", actor: "System", action: "Case Elevated", detail: "Severity auto-escalated from HIGH → CRITICAL" },
  { ts: "2026-04-05 19:03", actor: "Analyst", action: "Case Opened", detail: "Initial OSINT pivot from AlienVault pulse #9024" },
];

export default function CaseDrillDown({ case_, onBack, onEvidence }) {
  const [copied, setCopied] = useState(false);
  const reportURL = buildCaseReportURL(case_.id);
  const r44Token = reportURL.split("/").pop();

  const copyURL = () => {
    navigator.clipboard?.writeText(reportURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Workbench
        </button>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <span className="text-xs text-[#00d4ff] font-mono">{case_.id}</span>
      </div>

      {/* Case header bento */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1220] p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: sevColor[case_.severity], backgroundColor: `${sevColor[case_.severity]}12`, border: `1px solid ${sevColor[case_.severity]}25` }}>{case_.severity.toUpperCase()}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: statusColor[case_.status], backgroundColor: `${statusColor[case_.status]}10`, border: `1px solid ${statusColor[case_.status]}20` }}>{case_.status.toUpperCase()}</span>
            </div>
            <h1 className="text-lg font-black text-white mb-1">{case_.title}</h1>
            <p className="text-[10px] font-mono text-gray-600">{case_.id} · Updated {case_.updated}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onEvidence} className="flex items-center gap-1.5 text-xs border border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/5 px-3 py-1.5 rounded-lg transition-colors">
              <Database className="w-3.5 h-3.5" /> Evidence Vault
            </button>
            <button onClick={copyURL} className="flex items-center gap-1.5 text-xs border border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/5 px-3 py-1.5 rounded-lg transition-colors">
              <Copy className="w-3.5 h-3.5" /> {copied ? "Copied!" : "Copy R44 URL"}
            </button>
          </div>
        </div>

        {/* R44 URL display */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] font-mono text-gray-700 mb-1">RADIX-44 ENCODED REPORT URL (QR-SAFE)</p>
          <div className="bg-[#060a14] rounded-lg px-3 py-2 font-mono text-[10px] text-[#00d4ff] break-all border border-white/5">
            {reportURL}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <QrCode className="w-3 h-3 text-gray-700" />
            <p className="text-[9px] font-mono text-gray-700">Token: <span className="text-gray-500">{r44Token}</span> · Alphanumeric · QR Mode compatible</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {case_.tags.map(t => (
            <span key={t} className="text-[9px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/8 text-gray-500 font-mono">{t}</span>
          ))}
        </div>
      </div>

      {/* Bento grid — indicators + timeline */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Indicators table — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-[#0d1220] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-[#00d4ff]" />
              <p className="text-xs font-bold text-white">Indicators of Compromise</p>
            </div>
            <span className="text-[9px] font-mono text-gray-700">{MOCK_INDICATORS.length} total</span>
          </div>
          <div className="space-y-2">
            {MOCK_INDICATORS.map((ioc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/8 transition-colors">
                <div className="text-[8px] font-mono px-1.5 py-1 rounded bg-white/5 text-gray-600 shrink-0 uppercase w-16 text-center">
                  {ioc.type.replace("_", "·").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-white truncate">{ioc.value}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[8px] text-gray-700">{ioc.source}</span>
                    <span className="text-gray-800">·</span>
                    <span className="text-[8px] text-gray-700 flex items-center gap-0.5"><Clock className="w-2 h-2" />{ioc.last_seen}</span>
                    {ioc.tags.map(t => (
                      <span key={t} className="text-[8px] px-1 py-0.5 rounded bg-white/[0.03] border border-white/8 text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: sevColor[ioc.severity] }} />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-[#0d1220] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-[#a855f7]" />
            <p className="text-xs font-bold text-white">Case Timeline</p>
          </div>
          <div className="relative space-y-4 pl-4">
            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-white/5" />
            {MOCK_TIMELINE.map((ev, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-[#a855f7]/60 border border-[#a855f7]/30 top-1" />
                <p className="text-[8px] font-mono text-gray-700 mb-0.5">{ev.ts} · {ev.actor}</p>
                <p className="text-xs font-bold text-white">{ev.action}</p>
                <p className="text-[10px] text-gray-600 leading-snug mt-0.5">{ev.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}