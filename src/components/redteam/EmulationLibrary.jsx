import React, { useState } from "react";
import { BookOpen, Play, Globe2, Shield, Zap, Target, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SCENARIOS = [
  {
    id: "apt29_svr",
    name: "APT29 / SVR — SolarWinds-Style Supply Chain",
    actor: "APT29 (Cozy Bear)",
    country: "RU",
    type: "Nation-State Espionage",
    difficulty: "Expert",
    duration: "90 min",
    color: "#ff4757",
    desc: "Replicate the SolarWinds SUNBURST supply chain attack pattern — compromising build pipelines, injecting backdoors, and establishing covert C2 through trusted software updates.",
    chain: [
      { id: "1", tactic: "Reconnaissance", tactic_id: "TA0001", technique: "T1592 - Gather Victim Host Info", color: "#6b7280", c2_tool: null },
      { id: "2", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1195 - Supply Chain Compromise", color: "#f59e0b", c2_tool: "Cobalt Strike" },
      { id: "3", tactic: "Persistence", tactic_id: "TA0003", technique: "T1547 - Boot/Logon Autostart", color: "#ec4899", c2_tool: "Cobalt Strike" },
      { id: "4", tactic: "Defense Evasion", tactic_id: "TA0005", technique: "T1027 - Obfuscated Files", color: "#84cc16", c2_tool: "Cobalt Strike" },
      { id: "5", tactic: "Discovery", tactic_id: "TA0007", technique: "T1083 - File & Dir Discovery", color: "#3b82f6", c2_tool: null },
      { id: "6", tactic: "Collection", tactic_id: "TA0009", technique: "T1005 - Data from Local System", color: "#14b8a6", c2_tool: "Cobalt Strike" },
      { id: "7", tactic: "Exfiltration", tactic_id: "TA0010", technique: "T1041 - Exfiltration Over C2 Channel", color: "#f43f5e", c2_tool: "Cobalt Strike" },
    ],
    mitre_groups: ["G0016"],
    tags: ["Supply Chain", "Espionage", "APT29", "SUNBURST"],
  },
  {
    id: "lazarus_financial",
    name: "Lazarus Group — SWIFT Financial Heist",
    actor: "Lazarus Group (HIDDEN COBRA)",
    country: "KP",
    type: "Financial Crime",
    difficulty: "Advanced",
    duration: "60 min",
    color: "#a855f7",
    desc: "Emulate Lazarus Group's SWIFT banking attack methodology — spear-phishing bank employees, pivoting to SWIFT terminals, and initiating fraudulent wire transfers.",
    chain: [
      { id: "1", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1566 - Phishing", color: "#f59e0b", c2_tool: null },
      { id: "2", tactic: "Execution", tactic_id: "TA0002b", technique: "T1059 - Command & Scripting Interpreter", color: "#ef4444", c2_tool: "Metasploit" },
      { id: "3", tactic: "Persistence", tactic_id: "TA0003", technique: "T1543 - Create/Modify System Process", color: "#ec4899", c2_tool: null },
      { id: "4", tactic: "Lateral Movement", tactic_id: "TA0008", technique: "T1021 - Remote Services", color: "#a855f7", c2_tool: "Metasploit" },
      { id: "5", tactic: "Collection", tactic_id: "TA0009", technique: "T1213 - Data from Info Repos", color: "#14b8a6", c2_tool: null },
      { id: "6", tactic: "Impact", tactic_id: "TA0040", technique: "T1485 - Data Destruction", color: "#dc2626", c2_tool: null },
    ],
    mitre_groups: ["G0032"],
    tags: ["Financial", "SWIFT", "Lazarus", "DPRK"],
  },
  {
    id: "ransomware_lockbit",
    name: "LockBit 3.0 — Enterprise Ransomware",
    actor: "LockBit / LockBit Black",
    country: "RU/INT",
    type: "Ransomware",
    difficulty: "Intermediate",
    duration: "45 min",
    color: "#ffa502",
    desc: "Full LockBit 3.0 kill chain — initial access via RDP brute-force, credential dumping, lateral movement via PsExec, and mass file encryption with double extortion.",
    chain: [
      { id: "1", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1133 - External Remote Services", color: "#f59e0b", c2_tool: "Brute Ratel" },
      { id: "2", tactic: "Credential Access", tactic_id: "TA0006", technique: "T1003 - OS Credential Dumping", color: "#06b6d4", c2_tool: "Metasploit" },
      { id: "3", tactic: "Discovery", tactic_id: "TA0007", technique: "T1046 - Network Service Scan", color: "#3b82f6", c2_tool: null },
      { id: "4", tactic: "Lateral Movement", tactic_id: "TA0008", technique: "T1570 - Lateral Tool Transfer", color: "#a855f7", c2_tool: "Brute Ratel" },
      { id: "5", tactic: "Collection", tactic_id: "TA0009", technique: "T1005 - Data from Local System", color: "#14b8a6", c2_tool: null },
      { id: "6", tactic: "Impact", tactic_id: "TA0040", technique: "T1486 - Data Encrypted for Impact", color: "#dc2626", c2_tool: null },
    ],
    mitre_groups: ["G1033"],
    tags: ["Ransomware", "LockBit", "Double Extortion", "RDP"],
  },
  {
    id: "hafnium_exchange",
    name: "HAFNIUM — Exchange Server Exploitation",
    actor: "HAFNIUM",
    country: "CN",
    type: "Espionage",
    difficulty: "Advanced",
    duration: "50 min",
    color: "#00d4ff",
    desc: "Replicate HAFNIUM's Microsoft Exchange ProxyLogon/ProxyShell exploit chain, web shell deployment, and targeted data exfiltration from government and defense contractors.",
    chain: [
      { id: "1", tactic: "Reconnaissance", tactic_id: "TA0001", technique: "T1595 - Active Scanning", color: "#6b7280", c2_tool: null },
      { id: "2", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1190 - Exploit Public-Facing App", color: "#f59e0b", c2_tool: "Sliver" },
      { id: "3", tactic: "Persistence", tactic_id: "TA0003", technique: "T1505 - Server Software Component", color: "#ec4899", c2_tool: null },
      { id: "4", tactic: "Defense Evasion", tactic_id: "TA0005", technique: "T1036 - Masquerading", color: "#84cc16", c2_tool: "Sliver" },
      { id: "5", tactic: "Discovery", tactic_id: "TA0007", technique: "T1087 - Account Discovery", color: "#3b82f6", c2_tool: null },
      { id: "6", tactic: "Exfiltration", tactic_id: "TA0010", technique: "T1048 - Exfiltration Over Alt Protocol", color: "#f43f5e", c2_tool: "Sliver" },
    ],
    mitre_groups: ["G0125"],
    tags: ["Exchange", "ProxyLogon", "HAFNIUM", "China"],
  },
  {
    id: "insider_threat",
    name: "Insider Threat — Privileged Data Exfiltration",
    actor: "Malicious Insider",
    country: "Internal",
    type: "Insider Threat",
    difficulty: "Beginner",
    duration: "30 min",
    color: "#2ed573",
    desc: "Model a disgruntled privileged user systematically exfiltrating sensitive data to personal cloud storage over several weeks, evading DLP controls.",
    chain: [
      { id: "1", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1078 - Valid Accounts", color: "#f59e0b", c2_tool: null },
      { id: "2", tactic: "Discovery", tactic_id: "TA0007", technique: "T1135 - Network Share Discovery", color: "#3b82f6", c2_tool: null },
      { id: "3", tactic: "Collection", tactic_id: "TA0009", technique: "T1213 - Data from Info Repos", color: "#14b8a6", c2_tool: null },
      { id: "4", tactic: "Defense Evasion", tactic_id: "TA0005", technique: "T1070 - Indicator Removal", color: "#84cc16", c2_tool: null },
      { id: "5", tactic: "Exfiltration", tactic_id: "TA0010", technique: "T1567 - Exfiltration Over Web Service", color: "#f43f5e", c2_tool: null },
    ],
    mitre_groups: [],
    tags: ["Insider Threat", "DLP Bypass", "Cloud", "Privileged User"],
  },
  {
    id: "ics_attack",
    name: "TRITON/TRISIS — ICS Safety System Attack",
    actor: "XENOTIME",
    country: "RU",
    type: "Critical Infrastructure",
    difficulty: "Expert",
    duration: "120 min",
    color: "#ec4899",
    desc: "Replicate XENOTIME's attack on industrial safety systems (SIS) — targeting Triconex safety controllers to cause physical damage potential in oil & gas facilities.",
    chain: [
      { id: "1", tactic: "Initial Access", tactic_id: "TA0043", technique: "T1133 - External Remote Services", color: "#f59e0b", c2_tool: "Cobalt Strike" },
      { id: "2", tactic: "Lateral Movement", tactic_id: "TA0008", technique: "T1210 - Exploitation of Remote Services", color: "#a855f7", c2_tool: "Cobalt Strike" },
      { id: "3", tactic: "Collection", tactic_id: "TA0009", technique: "T1005 - Data from Local System", color: "#14b8a6", c2_tool: null },
      { id: "4", tactic: "C2", tactic_id: "TA0011", technique: "T1071 - App Layer Protocol", color: "#00d4ff", c2_tool: "Cobalt Strike" },
      { id: "5", tactic: "Impact", tactic_id: "TA0040", technique: "T1499 - Endpoint Denial of Service", color: "#dc2626", c2_tool: null },
    ],
    mitre_groups: ["G0088"],
    tags: ["ICS", "OT", "TRITON", "Safety Systems", "Critical Infrastructure"],
  },
];

const DIFFICULTY_COLORS = { Beginner: "#2ed573", Intermediate: "#ffa502", Advanced: "#f59e0b", Expert: "#ff4757" };

export default function EmulationLibrary({ onLoad }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = SCENARIOS.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.actor.toLowerCase().includes(search.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00d4ff]" /> Real-World Emulation Library</h2>
          <p className="text-xs text-gray-500 mt-0.5">Pre-built scenarios based on documented APT campaigns and real-world incidents</p>
        </div>
        <input
          placeholder="Search scenarios..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0d1220] border border-white/10 text-gray-300 text-xs rounded-lg px-3 py-2 w-56 placeholder-gray-600 focus:outline-none focus:border-[#00d4ff]/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(scenario => (
          <div
            key={scenario.id}
            className={`bg-[#0d1220] border rounded-xl p-5 cursor-pointer transition-all space-y-3 ${selected?.id === scenario.id ? "border-opacity-50" : "border-white/5 hover:border-white/10"}`}
            style={{ borderColor: selected?.id === scenario.id ? scenario.color : undefined }}
            onClick={() => setSelected(selected?.id === scenario.id ? null : scenario)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{scenario.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{scenario.actor} · {scenario.country}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded shrink-0" style={{ background: `${DIFFICULTY_COLORS[scenario.difficulty]}20`, color: DIFFICULTY_COLORS[scenario.difficulty] }}>{scenario.difficulty}</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{scenario.desc}</p>

            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />{scenario.chain.length} TTPs</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{scenario.duration}</span>
              <span className="flex items-center gap-1"><Globe2 className="w-3 h-3" />{scenario.type}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {scenario.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">{t}</span>
              ))}
            </div>

            {selected?.id === scenario.id && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">TTP Chain Preview</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.chain.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${step.color}20`, color: step.color }}>{step.tactic}</span>
                      {i < scenario.chain.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-gray-700" />}
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full mt-2 gap-2 text-xs text-black font-bold"
                  style={{ background: scenario.color }}
                  onClick={(e) => { e.stopPropagation(); onLoad(scenario); }}
                >
                  <Play className="w-3 h-3" /> Load Scenario in Builder
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}