import React, { useState } from "react";
import { Terminal, Radio, Wifi, WifiOff, AlertTriangle, Lock, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const C2_FRAMEWORKS = [
  {
    id: "cobalt_strike",
    name: "Cobalt Strike",
    vendor: "Fortra",
    version: "4.9",
    type: "Commercial",
    color: "#ff4757",
    capabilities: ["Beacon C2", "PowerShell Exec", "Process Injection", "Lateral Movement", "Pivoting", "Keylogging", "Screenshot", "Port Scanning", "SOCKS Proxy"],
    ttp_map: ["T1071.001", "T1055", "T1059.001", "T1021.002", "T1569.002"],
    detection_rate: 43,
    desc: "Industry-standard adversary simulation platform. Connect via API key to correlate beacon activity with your intel picture.",
  },
  {
    id: "metasploit",
    name: "Metasploit Framework",
    vendor: "Rapid7",
    version: "6.x",
    type: "Open Source",
    color: "#ffa502",
    capabilities: ["Exploit Modules", "Meterpreter", "Post-Exploitation", "Pivoting", "Password Attacks", "Scanners", "Payloads"],
    ttp_map: ["T1190", "T1059", "T1078", "T1110", "T1046"],
    detection_rate: 62,
    desc: "World's most used penetration testing framework. RPC integration enables real-time session telemetry within ASOSINT.",
  },
  {
    id: "sliver",
    name: "Sliver C2",
    vendor: "BishopFox",
    version: "1.5",
    type: "Open Source",
    color: "#00d4ff",
    capabilities: ["mTLS Comms", "WireGuard Pivoting", "BOF Support", "Multi-Platform Implants", "DNS Canaries"],
    ttp_map: ["T1071", "T1132", "T1568", "T1573"],
    detection_rate: 28,
    desc: "Modern open-source C2 with mTLS and WireGuard. Low detection profile ideal for purple team exercises.",
  },
  {
    id: "havoc",
    name: "Havoc C2",
    vendor: "HavocFramework",
    version: "0.7",
    type: "Open Source",
    color: "#a855f7",
    capabilities: ["Demon Implant", "BOF Loader", "Process Injection", "Token Impersonation", "Kerberoasting"],
    ttp_map: ["T1055", "T1134", "T1558.003", "T1059"],
    detection_rate: 31,
    desc: "Advanced post-exploitation framework with a modern Demon implant supporting BOF and sleep obfuscation.",
  },
  {
    id: "brute_ratel",
    name: "Brute Ratel C4",
    vendor: "Dark Vortex",
    version: "1.2",
    type: "Commercial",
    color: "#ec4899",
    capabilities: ["EDR Bypass", "OPSEC Techniques", "Lateral Movement", "Badgers", "User-Defined Reflective DLL"],
    ttp_map: ["T1070", "T1036", "T1027", "T1055"],
    detection_rate: 19,
    desc: "Adversary simulation platform purpose-built to bypass modern EDRs. Used by nation-state APTs in the wild.",
  },
];

const SIMULATED_LOGS = {
  cobalt_strike: [
    "[+] 14:32:01 | Beacon connected: WORKSTATION-01 (10.10.1.45) | sleep 60s",
    "[*] 14:32:14 | whoami: CORP\\jsmith (Admin)",
    "[*] 14:32:19 | getuid: NT AUTHORITY\\SYSTEM",
    "[*] 14:32:45 | ps: Found defender.exe, amsi.dll loaded",
    "[!] 14:33:01 | AMSI bypass attempted via patch — Success",
    "[+] 14:33:15 | inject 1234 x64: Process injection into lsass.exe",
    "[*] 14:33:22 | hashdump: Captured 14 NTLM hashes",
    "[!] 14:33:58 | lateral — SMB beacon to DC01 (10.10.0.5)",
    "[+] 14:34:12 | DC01 Beacon online — Elevated",
  ],
  metasploit: [
    "[*] Started reverse TCP handler on 192.168.1.100:4444",
    "[*] Sending stage (200774 bytes) to 10.10.1.45",
    "[*] Meterpreter session 1 opened (10.10.1.45:4444)",
    "meterpreter > sysinfo: Computer=WORKSTATION-01, OS=Windows 10",
    "meterpreter > getuid: Server username: NT AUTHORITY\\SYSTEM",
    "meterpreter > run post/windows/gather/credentials/credential_collector",
    "[+] Credentials saved to /root/.msf4/loot/...",
    "[*] run post/multi/recon/local_exploit_suggester",
    "[+] CVE-2021-1675 (PrintNightmare) — Potentially vulnerable",
  ],
  sliver: [
    "[*] Session 4b3a opened: WORKSTATION-01 — alive",
    "sliver > info: OS=Windows, Arch=amd64, PID=4892",
    "sliver > whoami: corp\\\\jsmith",
    "sliver > ps -e lsass: Found at PID 876",
    "[!] Canary domain queried: art-canary.corp.local — Alert triggered",
    "sliver > execute-assembly SharpHound.exe -c all",
    "[+] BloodHound data collected — 2,341 objects",
    "sliver > socks5 start --port 1080: Proxy active",
  ],
};

export default function C2Console({ activeScenario }) {
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [connected, setConnected] = useState({});
  const [showLogs, setShowLogs] = useState(null);

  const toggleConnect = (id) => {
    setConnected(prev => ({ ...prev, [id]: !prev[id] }));
    if (!connected[id]) setShowLogs(id);
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-[#ff4757] shrink-0 mt-0.5" />
        <p className="text-xs text-red-200 leading-relaxed">
          <strong>Authorized Use Only.</strong> C2 integration is intended for authorized red team exercises, purple team operations, and controlled lab environments only. All activity is logged. Ensure you have proper authorization before connecting any C2 framework to production or staging environments.
        </p>
      </div>

      {/* Active Scenario Context */}
      {activeScenario && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-4 flex items-center gap-4">
          <Activity className="w-4 h-4 text-[#00d4ff]" />
          <div className="flex-1">
            <p className="text-xs text-gray-400">Active Scenario</p>
            <p className="text-sm font-bold text-white">{activeScenario.name} — {activeScenario.chain?.length || 0} TTPs loaded</p>
          </div>
          <Badge className="bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20 text-[10px]">IN SCOPE</Badge>
        </div>
      )}

      {/* C2 Frameworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {C2_FRAMEWORKS.map(fw => (
          <div
            key={fw.id}
            className={`bg-[#0d1220] border rounded-xl p-5 space-y-4 cursor-pointer transition-all ${selectedFramework?.id === fw.id ? "border-opacity-60" : "border-white/5 hover:border-white/10"}`}
            style={{ borderColor: selectedFramework?.id === fw.id ? fw.color : undefined }}
            onClick={() => setSelectedFramework(selectedFramework?.id === fw.id ? null : fw)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="w-4 h-4" style={{ color: fw.color }} />
                  <span className="font-bold text-white text-sm">{fw.name}</span>
                </div>
                <p className="text-[10px] text-gray-500">{fw.vendor} · v{fw.version}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">{fw.type}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-gray-500">Detection:</span>
                  <span className={`text-[9px] font-bold ${fw.detection_rate > 50 ? "text-[#ff4757]" : fw.detection_rate > 30 ? "text-[#ffa502]" : "text-[#2ed573]"}`}>{fw.detection_rate}%</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">{fw.desc}</p>

            <div className="flex flex-wrap gap-1">
              {fw.capabilities.slice(0, 4).map(c => (
                <span key={c} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">{c}</span>
              ))}
              {fw.capabilities.length > 4 && <span className="text-[9px] text-gray-600">+{fw.capabilities.length - 4} more</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1">
                {fw.ttp_map.slice(0, 3).map(t => (
                  <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${fw.color}15`, color: fw.color }}>{t}</span>
                ))}
              </div>
              <Button
                size="sm"
                className="h-7 px-3 text-xs gap-1.5 transition-all"
                style={connected[fw.id] ? { background: `${fw.color}20`, color: fw.color, borderColor: `${fw.color}30` } : { background: fw.color, color: "#0a0e1a" }}
                onClick={(e) => { e.stopPropagation(); toggleConnect(fw.id); }}
              >
                {connected[fw.id] ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Connect</>}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Simulated Session Log */}
      {showLogs && connected[showLogs] && (
        <div className="bg-[#0a0d17] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#2ed573] animate-pulse" />
              <span className="text-xs font-bold text-white">{C2_FRAMEWORKS.find(f => f.id === showLogs)?.name} — Live Session Telemetry (Simulated)</span>
            </div>
            <Lock className="w-3 h-3 text-gray-600" />
          </div>
          <div className="p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
            {(SIMULATED_LOGS[showLogs] || []).map((line, i) => (
              <div key={i} className={`${line.startsWith("[+]") ? "text-[#2ed573]" : line.startsWith("[!]") ? "text-[#ffa502]" : line.startsWith("[*]") ? "text-[#00d4ff]" : "text-gray-400"}`}>
                <ChevronRight className="w-3 h-3 inline mr-1 opacity-50" />{line}
              </div>
            ))}
            <div className="text-gray-600 animate-pulse">_</div>
          </div>
        </div>
      )}
    </div>
  );
}