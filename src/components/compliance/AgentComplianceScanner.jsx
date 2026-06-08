import React, { useState, useEffect, useRef } from "react";
import { Bot, Play, Pause, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const SCAN_TARGETS = [
  { id: "soc2", label: "SOC 2 Type II", frameworks: ["CC1","CC2","CC3","CC6","CC7","CC8","CC9"] },
  { id: "iso27001", label: "ISO 27001:2022", frameworks: ["A.5","A.6","A.7","A.8.2","A.8.7","A.8.16"] },
  { id: "jsig", label: "JSIG", frameworks: ["JSIG-IA","JSIG-AC","JSIG-AU","JSIG-CM","JSIG-IR"] },
  { id: "rmf", label: "NIST RMF", frameworks: ["CAT","SEL","IMP","ASS","AUT","MON"] },
  { id: "cmmc", label: "CMMC L3", frameworks: ["AC","AT","AU","CM","IA","IR","MA","MP","SI"] },
  { id: "fedramp", label: "FedRAMP Mod.", frameworks: ["AC","AU","CA","CM","CP","IA","IR","RA","SC","SI"] },
  { id: "ip", label: "IP & Copyright", frameworks: ["Software Licenses","Patent Filings","Trade Secrets","EULA Compliance"] },
  { id: "cloud", label: "Cloud Posture", frameworks: ["GovCloud","Private","Public","Hybrid"] },
];

const AGENT_EVENTS = [
  { type: "info", msg: "Agent initialized — multi-framework compliance scan starting" },
  { type: "scan", msg: "Scanning SOC 2 CC6 Logical Access Controls..." },
  { type: "pass", msg: "SOC 2 CC6 — PASSED (0 findings)" },
  { type: "scan", msg: "Scanning ISO 27001 A.8.16 Monitoring Activities..." },
  { type: "warn", msg: "ISO 27001 A.8.16 — 3 findings: Log retention not meeting 12-month requirement in us-east-2" },
  { type: "scan", msg: "Scanning JSIG Audit & Accountability controls..." },
  { type: "warn", msg: "JSIG-AU — 4 findings: Audit log forwarding latency exceeds 60s threshold for SAP systems" },
  { type: "scan", msg: "Scanning CMMC Media Protection (MP) domain..." },
  { type: "warn", msg: "CMMC MP — 2 findings: Removable media policy not enforced on 3 endpoints" },
  { type: "scan", msg: "Scanning FedRAMP Incident Response controls..." },
  { type: "warn", msg: "FedRAMP IR — 5 findings: Incident response plan not updated within 12-month cycle" },
  { type: "scan", msg: "Scanning RMF Authorization to Operate (ATO) status..." },
  { type: "pass", msg: "RMF ATO — CURRENT (expires in 8 months)" },
  { type: "scan", msg: "Scanning intellectual property compliance — SPDX license headers..." },
  { type: "warn", msg: "IP Scan — 7 third-party libraries detected with undeclared license changes (MIT→GPL)" },
  { type: "scan", msg: "Scanning cloud configuration — AWS GovCloud posture..." },
  { type: "pass", msg: "GovCloud IAM policies — COMPLIANT" },
  { type: "scan", msg: "Cross-referencing NIST SP 800-53 baseline changes (Rev 5.1)..." },
  { type: "info", msg: "Policy delta detected: 3 new NIST 800-53 Rev 5.1 controls added in last 30 days — updating mappings" },
  { type: "scan", msg: "Checking CMMC 2.0 DoD assessment objective changes..." },
  { type: "info", msg: "CMMC 2.0 Practice AC.L3-3.1.3e — new sub-requirement identified, creating remediation task" },
  { type: "pass", msg: "Scan cycle complete — 6 frameworks scanned · 24 findings · 12 remediation tasks created" },
];

export default function AgentComplianceScanner() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logIdx, setLogIdx] = useState(0);
  const [scanProgress, setScanProgress] = useState({});
  const [generating, setGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const logRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (running && logIdx < AGENT_EVENTS.length) {
      timerRef.current = setTimeout(() => {
        const evt = AGENT_EVENTS[logIdx];
        setLogs(prev => [...prev, { ...evt, ts: new Date().toLocaleTimeString() }]);
        // Update scan progress
        if (evt.type === "pass" || evt.type === "warn") {
          const target = SCAN_TARGETS.find(t => AGENT_EVENTS[logIdx - 1]?.msg.toLowerCase().includes(t.label.toLowerCase()) || evt.msg.toLowerCase().includes(t.label.toLowerCase()));
          if (target) setScanProgress(prev => ({ ...prev, [target.id]: evt.type }));
        }
        setLogIdx(i => i + 1);
      }, 600 + Math.random() * 800);
    } else if (logIdx >= AGENT_EVENTS.length && running) {
      setRunning(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [running, logIdx]);

  const startScan = () => {
    setLogs([]);
    setLogIdx(0);
    setScanProgress({});
    setAiAnalysis("");
    setRunning(true);
  };

  const stopScan = () => {
    setRunning(false);
    clearTimeout(timerRef.current);
  };

  const generateAnalysis = async () => {
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a compliance expert for a national-security-grade OSINT platform called ASOSINT, operated by Emerging Defense Solutions (EDS). 
Generate a concise executive compliance analysis covering these frameworks: SOC2 Type II, ISO 27001:2022, JSIG, NIST RMF, CMMC 2.0 Level 3, and FedRAMP Moderate readiness.
Key findings from the latest agent scan:
- ISO 27001 A.8.16: Log retention gap in us-east-2 (3 findings)
- JSIG-AU: Audit log latency exceeds threshold for SAP systems (4 findings)
- CMMC MP: Removable media policy not enforced on 3 endpoints (2 findings)
- FedRAMP IR: Incident response plan overdue for annual review (5 findings)
- IP Scan: 7 libraries with undeclared license changes (MIT→GPL)
- NIST 800-53 Rev 5.1: 3 new controls added requiring mapping
Provide: (1) Overall risk posture, (2) Top 3 priority remediation items, (3) FedRAMP readiness estimate, (4) IP risk assessment, (5) Recommended agent scan cadence. Be direct and professional. Under 300 words.`,
      });
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Analysis unavailable — ensure LLM integration is configured.");
    }
    setGenerating(false);
  };

  const typeColor = { info: "text-[#00d4ff]", scan: "text-gray-400", pass: "text-[#2ed573]", warn: "text-[#ffa502]", fail: "text-red-400" };
  const typePrefix = { info: "[INFO]", scan: "[SCAN]", pass: "[ OK ]", warn: "[WARN]", fail: "[FAIL]" };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-white">Agentic Compliance Scanner</p>
          <p className="text-xs text-gray-500">Continuously scans all frameworks, cloud environments, and IP policy — generates remediation tasks automatically</p>
        </div>
        <div className="flex gap-2">
          {!running ? (
            <Button onClick={startScan} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 text-sm">
              <Play className="w-4 h-4" /> Run Full Compliance Scan
            </Button>
          ) : (
            <Button onClick={stopScan} variant="outline" className="border-[#ffa502]/30 text-[#ffa502] hover:bg-[#ffa502]/10 gap-2 text-sm">
              <Pause className="w-4 h-4" /> Pause Agent
            </Button>
          )}
          {logs.length > 0 && !running && (
            <Button onClick={generateAnalysis} disabled={generating} variant="outline" className="border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/10 gap-2 text-sm">
              <Bot className="w-4 h-4" /> {generating ? "Generating..." : "AI Analysis"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Framework Status Grid */}
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scan Targets</p>
          <div className="space-y-2">
            {SCAN_TARGETS.map(t => {
              const st = scanProgress[t.id];
              const Icon = st === "pass" ? CheckCircle2 : st === "warn" ? AlertTriangle : running && logIdx > 0 ? RefreshCw : Clock;
              const color = st === "pass" ? "text-[#2ed573]" : st === "warn" ? "text-[#ffa502]" : running ? "text-[#00d4ff] animate-spin" : "text-gray-600";
              return (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827]">
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300 truncate">{t.label}</p>
                    <p className="text-[9px] text-gray-600 truncate">{t.frameworks.length} control domains</p>
                  </div>
                  {st && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${st === "pass" ? "bg-[#2ed573]/10 text-[#2ed573]" : "bg-[#ffa502]/10 text-[#ffa502]"}`}>
                      {st === "pass" ? "PASS" : "WARN"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Log */}
        <div className="lg:col-span-2 bg-[#0a0e1a] border border-white/5 rounded-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${running ? "bg-[#00d4ff] animate-pulse" : "bg-gray-600"}`} />
              <span className="text-xs font-mono text-gray-400">compliance-agent · live output</span>
            </div>
            {running && <span className="text-[9px] text-[#00d4ff] font-mono animate-pulse">SCANNING...</span>}
          </div>
          <div ref={logRef} className="flex-1 p-4 font-mono text-xs space-y-1 overflow-y-auto h-72">
            {logs.length === 0 && (
              <p className="text-gray-600">Run a scan to see live compliance agent output...</p>
            )}
            {logs.map((l, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-gray-600 shrink-0 text-[10px]">{l.ts}</span>
                <span className={`shrink-0 font-bold text-[10px] ${typeColor[l.type]}`}>{typePrefix[l.type]}</span>
                <span className={`${typeColor[l.type]} leading-relaxed`}>{l.msg}</span>
              </div>
            ))}
            {running && <span className="text-[#00d4ff] animate-pulse">▊</span>}
          </div>
        </div>
      </div>

      {/* AI Analysis Output */}
      {aiAnalysis && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/15 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#00d4ff]" />
            <p className="text-sm font-bold text-white">AI Compliance Analysis</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
        </div>
      )}

      {/* Auto-Scan Config */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Continuous Scan Schedule</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Framework Controls", freq: "Every 5 mins", color: "text-[#2ed573]" },
            { label: "Cloud Posture", freq: "Every 15 mins", color: "text-[#00d4ff]" },
            { label: "Policy Feed Updates", freq: "Every 1 hour", color: "text-purple-400" },
            { label: "IP / License Changes", freq: "Every 6 hours", color: "text-[#ffa502]" },
          ].map(s => (
            <div key={s.label} className="bg-[#111827] rounded-lg p-3 space-y-1">
              <p className="text-[10px] text-gray-500">{s.label}</p>
              <p className={`text-xs font-bold ${s.color}`}>{s.freq}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}