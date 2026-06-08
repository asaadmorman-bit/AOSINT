import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Search, Plus, FolderOpen, Shield, Layers, Activity,
  Clock, ChevronRight, AlertTriangle, Globe2, Hash,
  Database, FileText, Cpu, BarChart3, Lock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CaseDrillDown from "@/components/osint_workbench/CaseDrillDown";
import EvidenceVault from "@/components/osint_workbench/EvidenceVault";
import { buildCaseReportURL } from "@/utils/radix44";

const MOCK_CASES = [
  { id: "CASE-7X9K2", title: "APT Cluster: Operation IRONVEIL", status: "active", severity: "critical", indicators: 47, evidence: 12, updated: "2m ago", tags: ["APT", "Ransomware", "Eastern Europe"] },
  { id: "CASE-3M1P8", title: "Influence Op: NARRATIVE-FLOOD", status: "active", severity: "high", indicators: 23, evidence: 7, updated: "18m ago", tags: ["SOCMINT", "Disinfo", "Social Media"] },
  { id: "CASE-9A4Q1", title: "Supply Chain Compromise: DEVPIPE", status: "investigating", severity: "high", indicators: 19, evidence: 5, updated: "1h ago", tags: ["Supply Chain", "CI/CD", "OSS"] },
  { id: "CASE-2C6R5", title: "Credential Leak: DARKMARKET-44", status: "triaged", severity: "medium", indicators: 8, evidence: 3, updated: "3h ago", tags: ["Dark Web", "Credentials", "PII"] },
  { id: "CASE-5F8T0", title: "Physical Recon: SECTOR-DELTA", status: "closed", severity: "low", indicators: 4, evidence: 2, updated: "1d ago", tags: ["HUMINT", "Physical", "Geospatial"] },
];

const sevColor = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };
const statusColor = { active: "#2ed573", investigating: "#ffa502", triaged: "#00d4ff", closed: "#6b7280" };

export default function OsintWorkbench() {
  const [activeCase, setActiveCase] = useState(null);
  const [activeView, setActiveView] = useState("grid"); // grid | case | evidence
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const filtered = MOCK_CASES.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  const openCase = (c) => { setActiveCase(c); setActiveView("case"); };
  const openEvidence = (c) => { setActiveCase(c); setActiveView("evidence"); };

  if (activeView === "case" && activeCase) {
    return <CaseDrillDown case_={activeCase} onBack={() => setActiveView("grid")} onEvidence={() => setActiveView("evidence")} />;
  }
  if (activeView === "evidence" && activeCase) {
    return <EvidenceVault case_={activeCase} onBack={() => setActiveView(activeCase ? "case" : "grid")} />;
  }

  return (
    <div className="min-h-screen bg-[#060a14] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-[#00d4ff]" />
            <h1 className="text-xl font-black tracking-tight">OSINT Workbench</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#2ed573]/10 border border-[#2ed573]/20 text-[#2ed573]">PRODUCTION</span>
          </div>
          <p className="text-[10px] font-mono text-gray-600">Privacy-first investigation environment · IPFS-ready evidence · Radix-44 shareable reports</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cases…"
              className="bg-[#0d1220] border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/30 w-44"
            />
          </div>
          <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#38bfff] text-xs font-bold h-8 px-3">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Case
          </Button>
        </div>
      </div>

      {/* Bento Grid — top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Cases", val: MOCK_CASES.filter(c => c.status === "active").length, color: "#2ed573", icon: Activity },
          { label: "Total Indicators", val: MOCK_CASES.reduce((a, c) => a + c.indicators, 0), color: "#00d4ff", icon: Hash },
          { label: "Evidence Items", val: MOCK_CASES.reduce((a, c) => a + c.evidence, 0), color: "#a855f7", icon: Database },
          { label: "Critical Cases", val: MOCK_CASES.filter(c => c.severity === "critical").length, color: "#ff4757", icon: AlertTriangle },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-[#0d1220] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
                <Icon className="w-3 h-3" style={{ color }} />
              </div>
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-black" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Bento Grid — cases + sidebar widgets */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Case list — spans 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Investigation Cases</p>
            <span className="text-[9px] font-mono text-gray-700">{filtered.length} cases</span>
          </div>
          {filtered.map(c => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/5 bg-[#0d1220] p-4 hover:border-white/10 transition-all group cursor-pointer"
              onClick={() => openCase(c)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${sevColor[c.severity]}10`, border: `1px solid ${sevColor[c.severity]}20` }}>
                  <FolderOpen className="w-4 h-4" style={{ color: sevColor[c.severity] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-white text-sm truncate">{c.title}</h3>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: sevColor[c.severity], backgroundColor: `${sevColor[c.severity]}12`, border: `1px solid ${sevColor[c.severity]}25` }}>{c.severity.toUpperCase()}</span>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: statusColor[c.status], backgroundColor: `${statusColor[c.status]}10`, border: `1px solid ${statusColor[c.status]}20` }}>{c.status.toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-700 mb-2">{c.id}</p>
                  <div className="flex items-center gap-4 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{c.indicators} indicators</span>
                    <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5" />{c.evidence} evidence items</span>
                    <span className="flex items-center gap-1 ml-auto"><Clock className="w-2.5 h-2.5" />{c.updated}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.tags.map(t => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/8 text-gray-600">{t}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
              </div>
              {/* Evidence & report actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => openEvidence(c)}
                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#a855f7] transition-colors font-mono"
                >
                  <Database className="w-3 h-3" /> Evidence Vault
                </button>
                <span className="text-gray-800">·</span>
                <button
                  onClick={() => { navigator.clipboard?.writeText(buildCaseReportURL(c.id)); }}
                  className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#00d4ff] transition-colors font-mono"
                  title={buildCaseReportURL(c.id)}
                >
                  <FileText className="w-3 h-3" /> Copy R44 Report URL
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar bento widgets */}
        <div className="space-y-4">
          {/* Encoding demo */}
          <div className="rounded-2xl border border-[#00d4ff]/15 bg-[#0d1220] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00d4ff]" />
              <p className="text-xs font-bold text-white">Radix-44 URL Encoder</p>
            </div>
            <p className="text-[10px] text-gray-600 leading-relaxed mb-3">Case report URLs are encoded using a 44-character QR-safe alphabet (0–9, A–Z, + 8 QR symbols). Alphanumeric, compact, scannable.</p>
            {MOCK_CASES.slice(0, 3).map(c => {
              let token = "";
              try { token = buildCaseReportURL(c.id).split("/").pop(); } catch {}
              return (
                <div key={c.id} className="mb-2">
                  <p className="text-[9px] font-mono text-gray-700">{c.id}</p>
                  <p className="text-[9px] font-mono text-[#00d4ff] break-all">…/{token}</p>
                </div>
              );
            })}
          </div>

          {/* IPFS evidence info */}
          <div className="rounded-2xl border border-[#a855f7]/15 bg-[#0d1220] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-3.5 h-3.5 text-[#a855f7]" />
              <p className="text-xs font-bold text-white">IPFS Evidence Model</p>
            </div>
            <div className="space-y-2 text-[10px] text-gray-600">
              {[
                { k: "Entity stores", v: "SHA-256 hash + metadata only" },
                { k: "Content goes to", v: "IPFS node (pinned)" },
                { k: "Integrity", v: "Cryptographic hash verification" },
                { k: "Privacy", v: "No raw evidence in DB" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-gray-700">{k}</span>
                  <span className="text-[#a855f7] font-mono text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="rounded-2xl border border-white/5 bg-[#0d1220] p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-xs font-bold text-white">Severity Breakdown</p>
            </div>
            {["critical", "high", "medium", "low"].map(s => {
              const count = MOCK_CASES.filter(c => c.severity === s).length;
              const pct = Math.round((count / MOCK_CASES.length) * 100);
              return (
                <div key={s} className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="font-mono uppercase" style={{ color: sevColor[s] }}>{s}</span>
                    <span className="text-gray-700">{count} cases</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: sevColor[s] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}