import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Sword, Plus, Trash2, ArrowRight, Play, ChevronDown,
  ChevronUp, Shield, AlertTriangle, Loader2, CheckCircle2, GripVertical
} from "lucide-react";

const TACTICS = [
  { id: "TA0001", name: "Reconnaissance", color: "#6b7280", techniques: ["T1595 - Active Scanning", "T1592 - Gather Victim Host Info", "T1589 - Gather Victim Identity Info", "T1590 - Gather Victim Network Info", "T1591 - Gather Victim Org Info", "T1598 - Phishing for Information"] },
  { id: "TA0002", name: "Resource Development", color: "#8b5cf6", techniques: ["T1583 - Acquire Infrastructure", "T1585 - Establish Accounts", "T1587 - Develop Capabilities", "T1588 - Obtain Capabilities"] },
  { id: "TA0043", name: "Initial Access", color: "#f59e0b", techniques: ["T1566 - Phishing", "T1190 - Exploit Public-Facing App", "T1133 - External Remote Services", "T1200 - Hardware Additions", "T1078 - Valid Accounts", "T1199 - Trusted Relationship"] },
  { id: "TA0002b", name: "Execution", color: "#ef4444", techniques: ["T1059 - Command & Scripting Interpreter", "T1203 - Exploitation for Client Exec", "T1053 - Scheduled Task/Job", "T1106 - Native API", "T1129 - Shared Modules"] },
  { id: "TA0003", name: "Persistence", color: "#ec4899", techniques: ["T1547 - Boot/Logon Autostart", "T1098 - Account Manipulation", "T1136 - Create Account", "T1543 - Create/Modify System Process", "T1574 - Hijack Execution Flow"] },
  { id: "TA0004", name: "Privilege Escalation", color: "#f97316", techniques: ["T1548 - Abuse Elevation Control", "T1134 - Access Token Manipulation", "T1068 - Exploitation for Priv Esc", "T1055 - Process Injection"] },
  { id: "TA0005", name: "Defense Evasion", color: "#84cc16", techniques: ["T1070 - Indicator Removal", "T1036 - Masquerading", "T1027 - Obfuscated Files", "T1055 - Process Injection", "T1218 - System Binary Proxy Exec"] },
  { id: "TA0006", name: "Credential Access", color: "#06b6d4", techniques: ["T1110 - Brute Force", "T1555 - Credentials from Password Stores", "T1003 - OS Credential Dumping", "T1558 - Steal Kerberos Tickets"] },
  { id: "TA0007", name: "Discovery", color: "#3b82f6", techniques: ["T1087 - Account Discovery", "T1083 - File & Dir Discovery", "T1046 - Network Service Scan", "T1135 - Network Share Discovery", "T1057 - Process Discovery"] },
  { id: "TA0008", name: "Lateral Movement", color: "#a855f7", techniques: ["T1210 - Exploitation of Remote Services", "T1534 - Internal Spearphishing", "T1570 - Lateral Tool Transfer", "T1021 - Remote Services"] },
  { id: "TA0009", name: "Collection", color: "#14b8a6", techniques: ["T1560 - Archive Collected Data", "T1115 - Clipboard Data", "T1530 - Data from Cloud Storage", "T1213 - Data from Info Repos", "T1005 - Data from Local System"] },
  { id: "TA0011", name: "C2", color: "#00d4ff", techniques: ["T1071 - App Layer Protocol", "T1092 - Comm Through Removable Media", "T1132 - Data Encoding", "T1001 - Data Obfuscation", "T1568 - Dynamic Resolution"] },
  { id: "TA0010", name: "Exfiltration", color: "#f43f5e", techniques: ["T1048 - Exfiltration Over Alt Protocol", "T1041 - Exfiltration Over C2 Channel", "T1567 - Exfiltration Over Web Service"] },
  { id: "TA0040", name: "Impact", color: "#dc2626", techniques: ["T1485 - Data Destruction", "T1486 - Data Encrypted for Impact", "T1491 - Defacement", "T1499 - Endpoint Denial of Service", "T1529 - System Shutdown/Reboot"] },
];

const ACTOR_PROFILES = [
  { id: "apt29", name: "APT29 / Cozy Bear", country: "RU", type: "Nation-State" },
  { id: "apt41", name: "APT41 / Winnti", country: "CN", type: "Nation-State" },
  { id: "lazarus", name: "Lazarus Group", country: "KP", type: "Nation-State" },
  { id: "fin7", name: "FIN7 / Carbanak", country: "UA", type: "Criminal" },
  { id: "custom", name: "Custom Actor", country: "--", type: "Custom" },
];

export default function EmulationBuilder({ activeScenario, setActiveScenario }) {
  const [scenarioName, setScenarioName] = useState(activeScenario?.name || "New Emulation Scenario");
  const [selectedActor, setSelectedActor] = useState(null);
  const [chain, setChain] = useState(activeScenario?.chain || []);
  const [expandedTactic, setExpandedTactic] = useState(null);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState(null);

  const addToChain = (tactic, technique) => {
    const step = {
      id: `${Date.now()}`,
      tactic_id: tactic.id,
      tactic: tactic.name,
      technique,
      color: tactic.color,
      c2_tool: null,
      notes: "",
    };
    setChain(prev => [...prev, step]);
  };

  const removeStep = (id) => setChain(prev => prev.filter(s => s.id !== id));

  const setC2Tool = (id, tool) => setChain(prev => prev.map(s => s.id === id ? { ...s, c2_tool: tool } : s));

  const runEmulation = async () => {
    setRunning(true);
    setRunOutput(null);
    try {
      const prompt = `You are a red team AI assistant. Analyze this adversary emulation scenario:

Scenario: "${scenarioName}"
Threat Actor Profile: ${selectedActor?.name || "Unknown"}
TTP Chain (${chain.length} steps):
${chain.map((s, i) => `${i + 1}. [${s.tactic}] ${s.technique} ${s.c2_tool ? `via ${s.c2_tool}` : ""}`).join("\n")}

Provide a detailed analysis in JSON with:
- execution_summary: string overview of the attack chain
- detection_opportunities: array of {step, detection_method, tool, confidence}
- defense_gaps: array of {gap, severity, mitigation}
- intel_impact: array of {intel_item, impact_type, severity}
- posture_score: number 0-100 (higher = harder to detect)
- recommended_detections: array of strings`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            execution_summary: { type: "string" },
            detection_opportunities: { type: "array", items: { type: "object", properties: { step: { type: "string" }, detection_method: { type: "string" }, tool: { type: "string" }, confidence: { type: "string" } } } },
            defense_gaps: { type: "array", items: { type: "object", properties: { gap: { type: "string" }, severity: { type: "string" }, mitigation: { type: "string" } } } },
            intel_impact: { type: "array", items: { type: "object", properties: { intel_item: { type: "string" }, impact_type: { type: "string" }, severity: { type: "string" } } } },
            posture_score: { type: "number" },
            recommended_detections: { type: "array", items: { type: "string" } },
          }
        }
      });
      setRunOutput(result);
      setActiveScenario({ name: scenarioName, actor: selectedActor, chain, analysis: result });
    } finally {
      setRunning(false);
    }
  };

  const severityColor = (s) => s === "critical" ? "text-[#ff4757]" : s === "high" ? "text-[#ffa502]" : s === "medium" ? "text-yellow-400" : "text-gray-400";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: TTP Palette */}
      <div className="xl:col-span-1 bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Sword className="w-4 h-4 text-[#ff4757]" /> MITRE ATT&CK Tactics</h2>
        <p className="text-xs text-gray-500">Click a technique to add to the chain →</p>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {TACTICS.map(tactic => (
            <div key={tactic.id}>
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-all"
                onClick={() => setExpandedTactic(expandedTactic === tactic.id ? null : tactic.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tactic.color }} />
                  <span className="text-xs font-semibold text-gray-200">{tactic.name}</span>
                </div>
                {expandedTactic === tactic.id ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
              </button>
              {expandedTactic === tactic.id && (
                <div className="ml-4 space-y-0.5 mb-1">
                  {tactic.techniques.map(tech => (
                    <button
                      key={tech}
                      onClick={() => addToChain(tactic, tech)}
                      className="w-full text-left px-3 py-1.5 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 shrink-0" style={{ color: tactic.color }} />{tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Chain Builder */}
      <div className="xl:col-span-1 bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-4">
        <div>
          <Input
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            className="bg-white/5 border-white/10 text-white font-bold text-sm mb-3"
          />
          <div className="flex flex-wrap gap-2 mb-3">
            {ACTOR_PROFILES.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedActor(a)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${selectedActor?.id === a.id ? "bg-[#ff4757]/20 border-[#ff4757]/40 text-[#ff4757]" : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200"}`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">TTP Chain ({chain.length} steps)</div>

        {chain.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm border border-dashed border-white/5 rounded-lg">
            ← Add techniques from the palette
          </div>
        )}

        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {chain.map((step, idx) => (
            <div key={step.id} className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <GripVertical className="w-3 h-3 text-gray-600 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${step.color}20`, color: step.color }}>{step.tactic}</span>
                    <span className="text-[10px] text-gray-400">Step {idx + 1}</span>
                  </div>
                  <p className="text-xs text-gray-200 truncate">{step.technique}</p>
                </div>
                <button onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-[#ff4757] transition-colors shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <select
                value={step.c2_tool || ""}
                onChange={e => setC2Tool(step.id, e.target.value || null)}
                className="w-full bg-[#0a0e1a] border border-white/5 text-[11px] text-gray-400 rounded px-2 py-1"
              >
                <option value="">No C2 Tool</option>
                <option value="Cobalt Strike">Cobalt Strike</option>
                <option value="Metasploit">Metasploit (MSF)</option>
                <option value="Sliver">Sliver C2</option>
                <option value="Havoc">Havoc C2</option>
                <option value="Brute Ratel">Brute Ratel C4</option>
                <option value="Covenant">Covenant</option>
              </select>
            </div>
          ))}
        </div>

        {chain.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-white/5">
            <Button
              onClick={runEmulation}
              disabled={running}
              className="flex-1 bg-[#ff4757] hover:bg-[#ff4757]/80 text-white font-bold gap-2 text-xs"
            >
              {running ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</> : <><Play className="w-3 h-3" /> Run Emulation</>}
            </Button>
          </div>
        )}
      </div>

      {/* Right: Analysis Output */}
      <div className="xl:col-span-1 bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-[#2ed573]" /> Emulation Analysis</h2>

        {!runOutput && !running && (
          <div className="text-center py-12 text-gray-600 text-sm">
            Build a TTP chain and run emulation to see analysis
          </div>
        )}
        {running && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="w-6 h-6 text-[#ff4757] animate-spin mx-auto" />
            <p className="text-xs text-gray-500">AI analyzing attack chain...</p>
          </div>
        )}

        {runOutput && (
          <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-1">
            {/* Posture Score */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Adversary Stealth Score</span>
                <span className={`font-black text-lg ${runOutput.posture_score > 70 ? "text-[#ff4757]" : runOutput.posture_score > 40 ? "text-[#ffa502]" : "text-[#2ed573]"}`}>{runOutput.posture_score}/100</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${runOutput.posture_score}%`, background: runOutput.posture_score > 70 ? "#ff4757" : runOutput.posture_score > 40 ? "#ffa502" : "#2ed573" }} />
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Execution Summary</p>
              <p className="text-xs text-gray-300 leading-relaxed">{runOutput.execution_summary}</p>
            </div>

            {/* Defense Gaps */}
            {runOutput.defense_gaps?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-[#ffa502]" /> Defense Gaps</p>
                <div className="space-y-1.5">
                  {runOutput.defense_gaps.map((g, i) => (
                    <div key={i} className="bg-white/5 rounded p-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-white font-medium">{g.gap}</span>
                        <span className={`text-[9px] font-bold uppercase ${severityColor(g.severity)}`}>{g.severity}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{g.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detection Opportunities */}
            {runOutput.detection_opportunities?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#2ed573]" /> Detection Opportunities</p>
                <div className="space-y-1.5">
                  {runOutput.detection_opportunities.slice(0, 5).map((d, i) => (
                    <div key={i} className="bg-white/5 rounded p-2.5">
                      <p className="text-[11px] text-gray-200 font-medium">{d.step}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{d.detection_method} — <span className="text-[#00d4ff]">{d.tool}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intel Impact */}
            {runOutput.intel_impact?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Intelligence Picture Impact</p>
                <div className="space-y-1.5">
                  {runOutput.intel_impact.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/5 rounded p-2">
                      <ArrowRight className="w-3 h-3 text-[#ff4757] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-200">{item.intel_item}</p>
                        <p className={`text-[9px] font-bold uppercase mt-0.5 ${severityColor(item.severity)}`}>{item.impact_type} · {item.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}