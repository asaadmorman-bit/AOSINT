import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Star, Download, ExternalLink, CheckCircle2, Zap, Shield, TrendingUp, Brain, Globe2, AlertTriangle, Eye, Lock, Filter } from "lucide-react";

const COMMUNITY_AGENTS = [
  // ASOSINT Native
  {
    id: "ta_profiler", name: "Threat Actor Auto-Profiler", vendor: "ASOSINT Labs", verified: true, native: true,
    icon: "🎭", category: "threat_profiling", tier: "pro", rating: 4.9, installs: 2840,
    desc: "Automatically profiles threat actors by correlating MITRE ATT&CK groups, OSINT feeds, government advisories, and historical campaign data. Outputs structured actor dossiers with attribution confidence scores.",
    capabilities: ["ATT&CK Group Mapping", "Attribution Scoring", "Campaign Correlation", "Dossier Generation", "Alias Resolution"],
    use_cases: ["Track APT29 infrastructure changes", "Auto-profile new ransomware operators", "Link actor to historical campaigns"],
    color: "#a855f7",
  },
  {
    id: "anomaly_cots", name: "COTS Anomaly Detector", vendor: "ASOSINT Labs", verified: true, native: true,
    icon: "🔍", category: "anomaly_detection", tier: "enterprise", rating: 4.8, installs: 1920,
    desc: "Detects statistical and behavioral anomalies in COTS security tool data (Splunk, CrowdStrike, Sentinel) using AI-driven baselining. Surfaces deviations that indicate APT dwell time, insider behavior, or C2 activity.",
    capabilities: ["Behavioral Baselining", "Drift Detection", "Cross-Tool Correlation", "Dwell Time Estimation", "False Positive Reduction"],
    use_cases: ["Detect slow APT lateral movement", "Identify credential stuffing patterns", "Surface anomalous service account behavior"],
    color: "#00d4ff",
  },
  {
    id: "geo_forecast", name: "Geopolitical Event Forecaster", vendor: "ASOSINT Labs", verified: true, native: true,
    icon: "🌐", category: "geopolitical", tier: "enterprise", rating: 4.7, installs: 1450,
    desc: "Uses LLM-powered analysis of ODNI assessments, ENISA reports, news feeds, and historical conflict patterns to predict geopolitical events and their likely cyber/physical threat implications.",
    capabilities: ["Event Probability Scoring", "Sector Impact Prediction", "Warning Time Estimation", "Narrative Tracking", "Allied Intel Synthesis"],
    use_cases: ["Forecast election interference risks", "Predict cyber escalation windows", "Score regional instability indicators"],
    color: "#f59e0b",
  },
  {
    id: "supply_chain_intel", name: "Supply Chain Risk Intelligence", vendor: "ASOSINT Labs", verified: true, native: true,
    icon: "🔗", category: "osint_automation", tier: "enterprise", rating: 4.6, installs: 1230,
    desc: "Maps your organization's supply chain exposure by correlating vendor IOCs, dark web mentions, ransomware targeting patterns, and third-party breach data against CISA KEV and ISAC feeds.",
    capabilities: ["Vendor Breach Monitoring", "Dark Web Correlation", "KEV Cross-Reference", "Tier-N Supplier Mapping", "SBOM Analysis"],
    use_cases: ["Monitor software supplier compromises", "Detect pre-positioned supply chain backdoors", "Score vendor cyber risk"],
    color: "#ec4899",
  },
  // Community Vendors
  {
    id: "ransomware_tracker_v2", name: "RaaS Ecosystem Tracker", vendor: "DarkTrace Intel", verified: true, native: false,
    icon: "🔒", category: "threat_profiling", tier: "pro", rating: 4.5, installs: 3100,
    desc: "Tracks 50+ active Ransomware-as-a-Service operators, their affiliate networks, victim posts on dark web leak sites, and sector targeting trends. Integrates with FS-ISAC and H-ISAC feeds.",
    capabilities: ["Leak Site Monitoring", "Affiliate Tracking", "Victim Industry Analysis", "Negotiation Pattern Analysis"],
    use_cases: ["Alert when your sector is targeted", "Track LockBit affiliate infrastructure", "Benchmark ransom demand trends"],
    color: "#ff4757",
  },
  {
    id: "nation_state_ttp", name: "Nation-State TTP Fingerprinter", vendor: "Mandiant Community", verified: true, native: false,
    icon: "🏛️", category: "malware_analysis", tier: "enterprise", rating: 4.8, installs: 2200,
    desc: "Ingests malware samples and network traffic to fingerprint nation-state actor TTPs using ML models trained on APT29, APT41, Lazarus Group, and SANDWORM behavioral profiles.",
    capabilities: ["Malware Behavioral Profiling", "TTP Fingerprinting", "Group Attribution ML", "Similarity Scoring", "YARA Integration"],
    use_cases: ["Attribute malware to APT group", "Find shared tooling between actors", "Detect retooling campaigns"],
    color: "#ffa502",
  },
  {
    id: "osint_enricher", name: "Automated OSINT Enricher", vendor: "Censys Community", verified: true, native: false,
    icon: "🔭", category: "osint_automation", tier: "pro", rating: 4.4, installs: 4500,
    desc: "Automatically enriches IOCs (IP, domain, hash, email) using Shodan, Censys, VirusTotal, PassiveTotal, and WHOIS APIs. Produces structured enrichment reports with confidence scoring.",
    capabilities: ["Multi-Source IP Enrichment", "Domain WHOIS Pivoting", "Hash Reputation", "Certificate Pivoting", "ASN Analysis"],
    use_cases: ["Enrich IOCs from CISA advisories", "Pivot from C2 IP to actor infrastructure", "Score domain reputation"],
    color: "#3b82f6",
  },
  {
    id: "vuln_exploitability", name: "Exploitability Intelligence Agent", vendor: "VulnDB Community", verified: true, native: false,
    icon: "⚡", category: "vulnerability_intel", tier: "pro", rating: 4.6, installs: 5200,
    desc: "Scores CVEs beyond CVSS using real-world exploit availability, dark web exploit marketplace activity, threat actor tooling correlations, and EPSS probability data.",
    capabilities: ["EPSS Integration", "Exploit Marketplace Monitoring", "Actor Tooling Correlation", "Patch Priority Scoring", "CISA KEV Sync"],
    use_cases: ["Prioritize patching beyond CVSS", "Alert when actor weaponizes a CVE", "Score exploitability in your environment"],
    color: "#2ed573",
  },
  {
    id: "influence_ops", name: "Influence Operations Detector", vendor: "Meta OSINT Research", verified: false, native: false,
    icon: "📢", category: "anomaly_detection", tier: "pro", rating: 4.2, installs: 890,
    desc: "Detects coordinated inauthentic behavior, bot network signatures, and influence campaign infrastructure across social media platforms by analyzing posting patterns and content propagation.",
    capabilities: ["CIB Detection", "Bot Fingerprinting", "Narrative Velocity Tracking", "Account Network Analysis"],
    use_cases: ["Detect influence operations targeting your org", "Track narrative hijacking", "Identify coordination networks"],
    color: "#14b8a6",
  },
  {
    id: "cloud_threat_intel", name: "Cloud Misconfiguration Hunter", vendor: "Wiz Community", verified: true, native: false,
    icon: "☁️", category: "anomaly_detection", tier: "pro", rating: 4.5, installs: 3800,
    desc: "Continuously scans cloud environments for misconfigurations, exposed credentials, and shadow IT using CSPM data, correlating findings against known attacker exploitation patterns.",
    capabilities: ["CSPM Integration", "Exposed Credential Detection", "Shadow IT Discovery", "ATT&CK Cloud Matrix", "Blast Radius Analysis"],
    use_cases: ["Find exposed S3 buckets before attackers do", "Detect IAM privilege escalation paths", "Score cloud attack surface"],
    color: "#06b6d4",
  },
];

const CATEGORY_LABELS = {
  all: "All",
  threat_profiling: "Threat Profiling",
  anomaly_detection: "Anomaly Detection",
  geopolitical: "Geopolitical",
  osint_automation: "OSINT Automation",
  malware_analysis: "Malware Analysis",
  vulnerability_intel: "Vulnerability Intel",
};

export default function AgentDiscover({ configs, onDeploy }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showVerified, setShowVerified] = useState(false);
  const [selected, setSelected] = useState(null);

  const deployedIds = new Set(configs.map(c => c.agent_id));

  const filtered = COMMUNITY_AGENTS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.vendor.toLowerCase().includes(q);
    const matchCat = category === "all" || a.category === category;
    const matchVerified = !showVerified || a.verified;
    return matchSearch && matchCat && matchVerified;
  });

  return (
    <div className="space-y-5">
      {/* Search + Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents, vendors, capabilities..." className="w-full pl-9 pr-4 py-2 bg-[#0d1220] border border-white/10 text-gray-300 text-sm rounded-lg placeholder-gray-600 focus:outline-none focus:border-[#a855f7]/50" />
        </div>
        <button onClick={() => setShowVerified(!showVerified)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-all ${showVerified ? "bg-[#2ed573]/10 border-[#2ed573]/30 text-[#2ed573]" : "bg-white/5 border-white/5 text-gray-500"}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Only
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setCategory(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${category === k ? "bg-[#a855f7]/20 border-[#a855f7]/40 text-[#a855f7]" : "bg-white/5 border-white/5 text-gray-500 hover:text-gray-300"}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Available Agents", value: COMMUNITY_AGENTS.length, color: "#a855f7" },
          { label: "Verified Vendors", value: COMMUNITY_AGENTS.filter(a => a.verified).length, color: "#2ed573" },
          { label: "Deployed by You", value: deployedIds.size, color: "#00d4ff" },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1220] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(agent => {
          const deployed = deployedIds.has(agent.id);
          return (
            <div key={agent.id}
              className={`bg-[#0d1220] border rounded-xl p-5 space-y-3 cursor-pointer transition-all ${selected?.id === agent.id ? "border-opacity-50" : "border-white/5 hover:border-white/10"}`}
              style={{ borderColor: selected?.id === agent.id ? agent.color : undefined }}
              onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-white">{agent.name}</p>
                      {agent.verified && <CheckCircle2 className="w-3 h-3 text-[#2ed573]" />}
                      {agent.native && <span className="text-[8px] bg-[#a855f7]/20 text-[#a855f7] px-1.5 py-0.5 rounded font-bold">NATIVE</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{agent.vendor}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] text-gray-400">{agent.rating}</span>
                  </div>
                  <span className="text-[9px] text-gray-600">{agent.installs.toLocaleString()} installs</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{agent.desc}</p>

              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map(c => (
                  <span key={c} className="text-[9px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">{c}</span>
                ))}
                {agent.capabilities.length > 3 && <span className="text-[9px] text-gray-600">+{agent.capabilities.length - 3}</span>}
              </div>

              {/* Expanded detail */}
              {selected?.id === agent.id && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Use Cases</p>
                    <div className="space-y-1">
                      {agent.use_cases.map((u, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Zap className="w-3 h-3 text-[#a855f7] mt-0.5 shrink-0" />
                          <p className="text-[11px] text-gray-300">{u}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <Button size="sm" className="flex-1 h-7 text-xs gap-1.5 font-bold"
                  style={deployed ? { background: `${agent.color}15`, color: agent.color, borderColor: `${agent.color}30` } : { background: agent.color, color: "#0a0e1a" }}
                  onClick={(e) => { e.stopPropagation(); if (!deployed) onDeploy(agent); }}
                >
                  {deployed ? <><CheckCircle2 className="w-3 h-3" /> Deployed</> : <><Download className="w-3 h-3" /> Deploy</>}
                </Button>
                <button className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white transition-colors" onClick={e => e.stopPropagation()}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}