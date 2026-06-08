import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Loader2, Search, Zap, Shield, Globe2, Bug, Cpu, Skull, Package, Smartphone, Factory } from "lucide-react";

const CURATED_FEEDS = [
  // Cyber / IOC
  { name: "AlienVault OTX", feed_type: "cyber", confidence_level: "high", refresh_interval: "1hr", source_url: "https://otx.alienvault.com/api/v1/pulses/subscribed", description: "Community-powered threat intelligence with millions of IOCs including IPs, domains, hashes, and CVEs.", icon: Globe2, tags: ["IOC", "IP", "Hash", "Domain"], color: "#00d4ff" },
  { name: "Abuse.ch URLhaus", feed_type: "cyber", confidence_level: "high", refresh_interval: "15min", source_url: "https://urlhaus-api.abuse.ch/v1/urls/recent/", description: "Real-time database of malicious URLs used for malware distribution.", icon: Bug, tags: ["URL", "Malware", "IOC"], color: "#ff4757" },
  { name: "Abuse.ch MalwareBazaar", feed_type: "cyber", confidence_level: "high", refresh_interval: "15min", source_url: "https://mb-api.abuse.ch/api/v1/", description: "Malware sample repository with hash intelligence and malware family tagging.", icon: Bug, tags: ["Hash", "Malware", "Sample"], color: "#ff4757" },
  { name: "Abuse.ch Feodo Tracker", feed_type: "cyber", confidence_level: "high", refresh_interval: "1hr", source_url: "https://feodotracker.abuse.ch/downloads/ipblocklist.json", description: "Tracks botnet C2 servers for Feodo, Emotet, TrickBot, and QakBot.", icon: Skull, tags: ["C2", "Botnet", "IP"], color: "#ff4757" },
  { name: "VirusTotal Intelligence", feed_type: "cyber", confidence_level: "high", refresh_interval: "6hr", source_url: "https://www.virustotal.com/api/v3/feeds", description: "Multi-engine AV detection results for files, URLs, and IPs.", icon: Shield, tags: ["Hash", "URL", "IP", "AV"], color: "#a855f7" },
  { name: "Shodan Monitor", feed_type: "cyber", confidence_level: "medium", refresh_interval: "24hr", source_url: "https://api.shodan.io/shodan/alert/", description: "Internet-wide scanning data exposing open ports and vulnerable services.", icon: Globe2, tags: ["IP", "Port", "Exposure"], color: "#00d4ff" },
  { name: "CIRCL MISP", feed_type: "cyber", confidence_level: "high", refresh_interval: "1hr", source_url: "https://www.circl.lu/doc/misp/", description: "Structured threat intelligence from the Computer Incident Response Center Luxembourg.", icon: Shield, tags: ["MISP", "IOC", "Structured"], color: "#2ed573" },

  // Vulnerability
  { name: "NVD CVE Feed", feed_type: "vulnerability", confidence_level: "high", refresh_interval: "6hr", source_url: "https://services.nvd.nist.gov/rest/json/cves/2.0", description: "NIST National Vulnerability Database — authoritative CVE scoring and metadata.", icon: Bug, tags: ["CVE", "CVSS", "Patch"], color: "#ffa502" },
  { name: "CISA KEV Catalog", feed_type: "vulnerability", confidence_level: "high", refresh_interval: "24hr", source_url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", description: "CISA's Known Exploited Vulnerabilities catalog with mandatory patching deadlines.", icon: Shield, tags: ["KEV", "CVE", "Exploit"], color: "#ffa502" },
  { name: "Exploit-DB", feed_type: "vulnerability", confidence_level: "medium", refresh_interval: "12hr", source_url: "https://www.exploit-db.com/", description: "Public exploit repository with PoC code for known CVEs.", icon: Bug, tags: ["Exploit", "PoC", "CVE"], color: "#ff4757" },

  // Threat Actors
  { name: "MITRE ATT&CK", feed_type: "cyber", confidence_level: "high", refresh_interval: "24hr", source_url: "https://attack.mitre.org/", description: "Globally-accessible knowledge base of adversary tactics and techniques.", icon: Skull, tags: ["TTP", "Actor", "Technique"], color: "#a855f7" },
  { name: "APT Groups (Google TAG)", feed_type: "cyber", confidence_level: "high", refresh_interval: "24hr", source_url: "https://blog.google/threat-analysis-group/", description: "Nation-state threat actor tracking from Google's Threat Analysis Group.", icon: Skull, tags: ["APT", "Nation-State", "Actor"], color: "#a855f7" },

  // Geopolitical / OSINT
  { name: "ACLED Conflict Data", feed_type: "geopolitical", confidence_level: "high", refresh_interval: "24hr", source_url: "https://acleddata.com/data-export-tool/", description: "Armed Conflict Location & Event Data — real-time geopolitical conflict tracking.", icon: Globe2, tags: ["Conflict", "Geopolitical", "Events"], color: "#f59e0b" },
  { name: "GDELT Project", feed_type: "geopolitical", confidence_level: "medium", refresh_interval: "6hr", source_url: "https://api.gdeltproject.org/api/v2/events/query", description: "Global news event database monitoring worldwide instability and geopolitical shifts.", icon: Globe2, tags: ["News", "Events", "OSINT"], color: "#f59e0b" },

  // Crime / Dark Web
  { name: "Have I Been Pwned API", feed_type: "crime", confidence_level: "high", refresh_interval: "24hr", source_url: "https://haveibeenpwned.com/api/v3/breaches", description: "Data breach and credential leak monitoring across thousands of exposed datasets.", icon: Skull, tags: ["Breach", "Credential", "Email"], color: "#ff4757" },
  { name: "RansomWatch", feed_type: "crime", confidence_level: "high", refresh_interval: "1hr", source_url: "https://ransomwatch.telemetry.ltd/", description: "Monitors ransomware group leak sites and victim postings in real-time.", icon: Skull, tags: ["Ransomware", "Darkweb", "Victim"], color: "#ff4757" },

  // Supply Chain
  { name: "Sonatype OSS Index", feed_type: "supply_chain", confidence_level: "high", refresh_interval: "6hr", source_url: "https://ossindex.sonatype.org/api/v3/component-report", description: "Open-source software vulnerability intelligence for dependency chain risk.", icon: Package, tags: ["OSS", "Dependency", "Package"], color: "#2ed573" },
  { name: "Snyk Vulnerability DB", feed_type: "supply_chain", confidence_level: "high", refresh_interval: "6hr", source_url: "https://security.snyk.io/", description: "Developer-focused vulnerability database covering npm, PyPI, Maven, and more.", icon: Package, tags: ["Package", "Container", "Code"], color: "#2ed573" },

  // Mobile
  { name: "Android Vulnerabilities", feed_type: "mobile_security", confidence_level: "high", refresh_interval: "24hr", source_url: "https://source.android.com/docs/security/bulletin", description: "Official Android security bulletins with monthly patch levels and CVE details.", icon: Smartphone, tags: ["Android", "CVE", "Patch"], color: "#00d4ff" },
  { name: "Apple Security Updates", feed_type: "mobile_security", confidence_level: "high", refresh_interval: "24hr", source_url: "https://support.apple.com/en-us/111900", description: "Apple platform security updates for iOS, macOS, and watchOS.", icon: Smartphone, tags: ["iOS", "macOS", "CVE"], color: "#00d4ff" },

  // ICS/OT
  { name: "ICS-CERT Advisories", feed_type: "ics_ot", confidence_level: "high", refresh_interval: "24hr", source_url: "https://www.cisa.gov/ics-advisories", description: "CISA ICS-CERT advisories for industrial control system vulnerabilities.", icon: Factory, tags: ["ICS", "SCADA", "OT"], color: "#f59e0b" },
];

const TYPE_COLORS = {
  cyber: "#00d4ff", vulnerability: "#ffa502", geopolitical: "#f59e0b",
  crime: "#ff4757", supply_chain: "#2ed573", mobile_security: "#00d4ff",
  ics_ot: "#f59e0b", influence: "#a855f7",
};

const ALL_TAGS = [...new Set(CURATED_FEEDS.flatMap(f => f.tags))].sort();

export default function FeedLibrary({ existingFeeds = [], onSubscribe }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [subscribing, setSubscribing] = useState(new Set());
  const [subscribed, setSubscribed] = useState(new Set());

  const existingNames = new Set(existingFeeds.map(f => f.name?.toLowerCase()));

  const filtered = CURATED_FEEDS.filter(f => {
    if (filterType !== "all" && f.feed_type !== filterType) return false;
    if (filterTag !== "all" && !f.tags.includes(filterTag)) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allTypes = [...new Set(CURATED_FEEDS.map(f => f.feed_type))];

  const handleSubscribe = async (feed) => {
    setSubscribing(prev => new Set([...prev, feed.name]));
    try {
      await base44.entities.ThreatFeed.create({
        name: feed.name,
        feed_type: feed.feed_type,
        source_url: feed.source_url,
        refresh_interval: feed.refresh_interval,
        confidence_level: feed.confidence_level,
        description: feed.description,
        status: "active",
      });
      setSubscribed(prev => new Set([...prev, feed.name]));
      onSubscribe?.();
    } finally {
      setSubscribing(prev => { const n = new Set(prev); n.delete(feed.name); return n; });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            placeholder="Search library..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 text-white h-8 text-xs pl-8"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${filterType === "all" ? "bg-[#00d4ff] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            All
          </button>
          {allTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? "all" : t)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all capitalize ${filterType === t ? "text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              style={filterType === t ? { background: TYPE_COLORS[t] || "#00d4ff" } : {}}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-600">{filtered.length} feeds available · {existingNames.size} already subscribed</p>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(feed => {
          const Icon = feed.icon;
          const isAlready = existingNames.has(feed.name.toLowerCase()) || subscribed.has(feed.name);
          const isLoading = subscribing.has(feed.name);
          return (
            <div
              key={feed.name}
              className={`bg-[#0d1220] border rounded-xl p-4 flex gap-3 transition-all ${isAlready ? "border-[#2ed573]/20 opacity-70" : "border-white/5 hover:border-white/10"}`}
            >
              <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${feed.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: feed.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{feed.name}</p>
                    <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: TYPE_COLORS[feed.feed_type] || "#6b7280" }}>{feed.feed_type.replace(/_/g, " ")}</span>
                  </div>
                  {isAlready ? (
                    <div className="flex items-center gap-1 text-[#2ed573] shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Subscribed</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSubscribe(feed)}
                      disabled={isLoading}
                      className="h-7 text-[10px] px-2.5 shrink-0 text-black font-bold gap-1"
                      style={{ background: feed.color }}
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {isLoading ? "Adding..." : "Subscribe"}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{feed.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {feed.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-500">{tag}</span>
                  ))}
                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-600">↻ {feed.refresh_interval}</span>
                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-gray-600">Conf: {feed.confidence_level}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}