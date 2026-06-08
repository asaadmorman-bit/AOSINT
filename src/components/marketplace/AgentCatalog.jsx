import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Download, Shield, Zap, ChevronRight, Filter, CheckCircle2, Lock } from "lucide-react";

export const AGENT_CATALOG = [
  // ── ASOSINT Core Agents ──────────────────────────────────────────────────
  {
    id: "threat-actor-profiler", name: "Threat Actor Profiler", icon: "🎭",
    vendor: "ASOSINT", vendor_type: "core", category: "Intelligence",
    min_tier: "pro", rating: 4.9, installs: 1240,
    description: "Automated profiling of threat actors using multi-source OSINT, SIGINT, and HUMINT fusion. Tracks TTPs, infrastructure, and campaign linkages.",
    capabilities: ["Actor attribution", "TTP mapping", "Infrastructure tracking", "Campaign correlation"],
    tags: ["MITRE", "APT", "Attribution"],
    teams: ["cyber", "analyst"],
  },
  {
    id: "anomaly-detector", name: "COTS Anomaly Detector", icon: "📡",
    vendor: "ASOSINT", vendor_type: "core", category: "Detection",
    min_tier: "pro", rating: 4.7, installs: 980,
    description: "Real-time anomaly detection across commercial-off-the-shelf data streams including social media, financial feeds, and logistics data.",
    capabilities: ["Behavioral baseline", "Statistical outlier detection", "Cross-domain correlation", "Alert triage"],
    tags: ["Anomaly", "COTS", "Real-time"],
    teams: ["cyber", "analyst", "leadership"],
  },
  {
    id: "geo-forecaster", name: "Geopolitical Event Forecaster", icon: "🌍",
    vendor: "ASOSINT", vendor_type: "core", category: "Forecasting",
    min_tier: "enterprise", rating: 4.8, installs: 620,
    description: "Predictive modeling for geopolitical events using historical patterns, open-source indicators, and machine learning-based scenario projection.",
    capabilities: ["Event probability scoring", "Regional risk mapping", "Scenario branching", "Indicator tracking"],
    tags: ["Geopolitical", "Forecasting", "ML"],
    teams: ["leadership", "analyst"],
  },
  {
    id: "fusion-synthesizer", name: "Fusion Center Synthesizer", icon: "🔀",
    vendor: "ASOSINT", vendor_type: "core", category: "Analysis",
    min_tier: "pro", rating: 4.6, installs: 870,
    description: "Fuses signals from cyber, physical, and influence domains into a unified operational picture, reducing analyst cognitive load by 60%.",
    capabilities: ["Cross-domain fusion", "Signal deconfliction", "Priority scoring", "Auto-summarization"],
    tags: ["Fusion", "Cross-domain", "OSINT"],
    teams: ["analyst", "cyber", "physical"],
  },
  {
    id: "narrative-tracker", name: "Narrative & Disinfo Tracker", icon: "📰",
    vendor: "ASOSINT", vendor_type: "core", category: "Influence",
    min_tier: "pro", rating: 4.5, installs: 540,
    description: "Tracks influence operations, disinformation campaigns, and narrative shifts across social platforms, news, and dark web forums.",
    capabilities: ["Narrative clustering", "Amplification detection", "Source attribution", "Trend forecasting"],
    tags: ["Influence", "Disinformation", "Social"],
    teams: ["analyst", "leadership"],
  },
  {
    id: "ransomware-monitor", name: "Ransomware Ecosystem Monitor", icon: "💀",
    vendor: "ASOSINT", vendor_type: "core", category: "Threat",
    min_tier: "pro", rating: 4.7, installs: 1100,
    description: "Monitors ransomware group activity, data leak sites, victim announcements, and ransom negotiation patterns to provide early warning.",
    capabilities: ["Leak site monitoring", "Group tracking", "Victim identification", "TTR analysis"],
    tags: ["Ransomware", "Dark Web", "Early Warning"],
    teams: ["cyber", "analyst"],
  },
  {
    id: "supply-chain-sentinel", name: "Supply Chain Sentinel", icon: "🔗",
    vendor: "ASOSINT", vendor_type: "core", category: "Risk",
    min_tier: "enterprise", rating: 4.6, installs: 430,
    description: "Continuously monitors third-party and supply chain risk by tracking vendor news, CVEs, financial health, and geopolitical exposure.",
    capabilities: ["Vendor risk scoring", "CVE tracking", "Financial monitoring", "Country exposure mapping"],
    tags: ["Supply Chain", "Third Party", "Risk"],
    teams: ["analyst", "leadership"],
  },
  {
    id: "executive-briefer", name: "Executive Briefing Agent", icon: "📋",
    vendor: "ASOSINT", vendor_type: "core", category: "Reporting",
    min_tier: "pro", rating: 4.8, installs: 760,
    description: "Generates concise, executive-ready intelligence briefs tailored to audience, classification level, and organizational priority.",
    capabilities: ["Auto-summarization", "Audience tailoring", "Priority highlighting", "Format templates"],
    tags: ["Briefing", "Executive", "Reporting"],
    teams: ["leadership", "analyst"],
  },
  // ── Vendor / Third-Party Agents ──────────────────────────────────────────
  {
    id: "darkweb-crawler", name: "Dark Web Crawler Pro", icon: "🕷️",
    vendor: "CipherTrace Intel", vendor_type: "vendor", category: "Collection",
    min_tier: "enterprise", rating: 4.3, installs: 290,
    description: "Automated crawling of Tor, I2P, and Freenet forums and markets for credentials, exploit listings, and threat actor communications.",
    capabilities: ["Tor indexing", "Credential monitoring", "Marketplace scanning", "Actor profiling"],
    tags: ["Dark Web", "Credentials", "Tor"],
    teams: ["cyber"],
  },
  {
    id: "ics-guardian", name: "ICS/OT Guardian Agent", icon: "⚙️",
    vendor: "Dragos Community", vendor_type: "vendor", category: "OT/ICS",
    min_tier: "gov", rating: 4.9, installs: 180,
    description: "Specialized agent for monitoring ICS/SCADA environments, detecting anomalous OT protocol behavior, and correlating with known ICS threat groups.",
    capabilities: ["OT protocol analysis", "ICS TTP mapping", "Dragos WorldView sync", "Site risk scoring"],
    tags: ["ICS", "OT", "SCADA", "TRITON"],
    teams: ["cyber", "physical"],
  },
  {
    id: "patent-osint", name: "Patent & R&D OSINT Agent", icon: "🔬",
    vendor: "Stratfor Labs", vendor_type: "vendor", category: "Intelligence",
    min_tier: "enterprise", rating: 4.1, installs: 210,
    description: "Tracks patent filings, academic publications, and R&D activity to identify emerging technology threats and foreign investment patterns.",
    capabilities: ["Patent monitoring", "Author tracking", "Tech trend analysis", "Investment mapping"],
    tags: ["IP", "R&D", "Economic Intel"],
    teams: ["analyst", "leadership"],
  },
  {
    id: "financial-flow", name: "Financial Flow Analyzer", icon: "💱",
    vendor: "FinCEN Nexus", vendor_type: "vendor", category: "Financial",
    min_tier: "gov", rating: 4.5, installs: 150,
    description: "Traces financial flows, sanctions evasion patterns, and crypto transactions linked to threat actor financing and money laundering.",
    capabilities: ["Blockchain tracing", "Sanctions screening", "Shell company detection", "SAR correlation"],
    tags: ["Financial", "Crypto", "Sanctions"],
    teams: ["analyst", "leo"],
  },
];

const CATEGORIES = ["All", "Intelligence", "Detection", "Forecasting", "Analysis", "Influence", "Threat", "Risk", "Reporting", "Collection", "OT/ICS", "Financial"];
const VENDOR_TYPES = ["All", "core", "vendor"];
const TIER_ORDER = { community: 0, pro: 1, enterprise: 2, gov: 3 };

const TIER_COLORS = {
  community: "#6b7280", pro: "#00d4ff", enterprise: "#a855f7", gov: "#f59e0b",
};

export default function AgentCatalog({ configs, userTier, onConfigure, onToggle, onDeploy }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = AGENT_CATALOG.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === "All" || a.category === category;
    const matchVendor = vendorFilter === "All" || a.vendor_type === vendorFilter;
    return matchSearch && matchCat && matchVendor;
  });

  const getConfig = (id) => configs.find(c => c.agent_id === id);
  const canDeploy = (agent) => TIER_ORDER[userTier] >= TIER_ORDER[agent.min_tier];

  if (selected) {
    const config = getConfig(selected.id);
    const deployable = canDeploy(selected);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
          ← Back to catalog
        </button>
        <AgentDetailView
          agent={selected}
          config={config}
          deployable={deployable}
          onConfigure={() => onConfigure(selected, config)}
          onToggle={() => { onToggle(selected, config); onDeploy?.(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search agents, tags, vendors..."
            className="pl-8 h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VENDOR_TYPES.map(v => (
            <button key={v} onClick={() => setVendorFilter(v)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize whitespace-nowrap transition-colors ${
                vendorFilter === v
                  ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30"
                  : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
              }`}>
              {v === "core" ? "🏛 ASOSINT" : v === "vendor" ? "🏪 Vendors" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
              category === c
                ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[10px] text-gray-600">
        <span>{filtered.length} agents found</span>
        <span>•</span>
        <span className="text-[#a855f7]">{AGENT_CATALOG.filter(a => a.vendor_type === "core").length} ASOSINT native</span>
        <span>•</span>
        <span className="text-[#00d4ff]">{AGENT_CATALOG.filter(a => a.vendor_type === "vendor").length} vendor partners</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(agent => {
          const config = getConfig(agent.id);
          const deployable = canDeploy(agent);
          const isEnabled = config?.status === "enabled";
          const isDeployed = !!config;

          return (
            <div key={agent.id}
              className={`bg-[#0d1117] border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:border-[#a855f7]/30 ${
                isEnabled ? "border-[#2ed573]/20" : "border-white/5"
              }`}
              onClick={() => setSelected(agent)}>
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{agent.name}</p>
                    <p className="text-[10px] text-gray-500">{agent.vendor}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {agent.vendor_type === "core" ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20 font-bold">NATIVE</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 font-bold">VENDOR</span>
                  )}
                  {isEnabled && <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-500 line-clamp-2">{agent.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {agent.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600 border border-white/5">{tag}</span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#ffa502]" fill="#ffa502" /> {agent.rating}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {agent.installs.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!deployable && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${TIER_COLORS[agent.min_tier]}10`, color: TIER_COLORS[agent.min_tier] }}>
                      {agent.min_tier.toUpperCase()}+
                    </span>
                  )}
                  {isDeployed ? (
                    <span className="text-[9px] px-2 py-1 rounded-lg bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 font-medium">
                      {isEnabled ? "Active" : "Paused"}
                    </span>
                  ) : deployable ? (
                    <span className="text-[9px] px-2 py-1 rounded-lg bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 font-medium">Deploy</span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-gray-700" />
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentDetailView({ agent, config, deployable, onConfigure, onToggle }) {
  const isEnabled = config?.status === "enabled";
  const isDeployed = !!config;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Info */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-4xl">{agent.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-white">{agent.name}</h2>
                {agent.vendor_type === "core"
                  ? <span className="text-[9px] px-2 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20 font-bold">ASOSINT NATIVE</span>
                  : <span className="text-[9px] px-2 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 font-bold">VENDOR PARTNER</span>}
              </div>
              <p className="text-xs text-gray-500 mb-2">by {agent.vendor}</p>
              <div className="flex items-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#ffa502]" fill="#ffa502" /> {agent.rating} rating</span>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {agent.installs.toLocaleString()} deployments</span>
                <span className="text-[#a855f7]">{agent.category}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>
        </div>

        {/* Capabilities */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Capabilities</p>
          <div className="grid grid-cols-2 gap-2">
            {agent.capabilities.map(cap => (
              <div key={cap} className="flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573] shrink-0" />
                {cap}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {agent.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-500 border border-white/5">{tag}</span>
          ))}
        </div>
      </div>

      {/* Right: Deploy panel */}
      <div className="space-y-4">
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4 space-y-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Deployment</p>

          {!deployable && (
            <div className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-[#ffa502]" />
                <p className="text-[11px] text-[#ffa502] font-bold">{agent.min_tier.toUpperCase()}+ Required</p>
              </div>
              <p className="text-[10px] text-gray-600">Upgrade your plan to deploy this agent.</p>
            </div>
          )}

          {isDeployed && (
            <div className={`rounded-lg p-3 border ${isEnabled ? "bg-[#2ed573]/5 border-[#2ed573]/15" : "bg-white/5 border-white/5"}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isEnabled ? "bg-[#2ed573] animate-pulse" : "bg-gray-600"}`} />
                <p className="text-xs font-medium text-white">{isEnabled ? "Agent Active" : "Agent Paused"}</p>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                {config?.assigned_teams?.join(", ") || "No teams assigned"}
              </p>
            </div>
          )}

          {deployable && (
            <Button onClick={onToggle}
              className={`w-full h-9 text-xs font-bold ${
                isEnabled
                  ? "bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20 hover:bg-[#ff4757]/20"
                  : isDeployed
                  ? "bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/20"
                  : "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 hover:bg-[#a855f7]/30"
              }`}>
              {isEnabled ? "⏸ Pause Agent" : isDeployed ? "▶ Resume Agent" : "⚡ Deploy Agent"}
            </Button>
          )}

          {isDeployed && (
            <Button onClick={onConfigure} variant="ghost"
              className="w-full h-8 text-xs text-gray-400 hover:text-white border border-white/5 hover:border-white/10">
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Configure
            </Button>
          )}
        </div>

        {/* Safety */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#2ed573]" /> Safety Controls
          </p>
          <div className="space-y-1.5">
            {["Human-in-the-loop enforced", "Audit logging mandatory", "No offensive actions", "RBAC enforced"].map(r => (
              <div key={r} className="flex items-center gap-2 text-[10px] text-gray-600">
                <CheckCircle2 className="w-3 h-3 text-[#2ed573] shrink-0" /> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}