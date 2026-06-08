import React, { useState } from "react";
import { Shield, Globe2, AlertTriangle, Zap, Search, ExternalLink, RefreshCw, CheckCircle2, Clock, Eye, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GOV_FEEDS = [
  // US Federal
  {
    group: "🇺🇸 US Federal Intelligence & Cyber",
    sources: [
      { id: "cisa", name: "CISA", full: "Cybersecurity & Infrastructure Security Agency", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", type: "KEV / Advisories", tags: ["CVE", "KEV", "ICS", "Critical Infrastructure"], status: "live", tier: "community", desc: "Known Exploited Vulnerabilities catalog, ICS-CERT advisories, alerts & emergency directives." },
      { id: "nsa", name: "NSA / USCYBERCOM", full: "NSA Cybersecurity Directorate + US Cyber Command", url: "https://www.nsa.gov/cybersecurity/", type: "Threat Advisories", tags: ["APT", "Nation-State", "Hardening"], status: "live", tier: "pro", desc: "Joint advisories on nation-state TTPs, malware analysis, and hardening guidance from NSA/USCYBERCOM." },
      { id: "dhs", name: "DHS / I&A", full: "Dept. of Homeland Security Intelligence & Analysis", url: "https://www.dhs.gov/intelligence-and-analysis", type: "Threat Bulletins", tags: ["Physical", "Terrorism", "Critical Infrastructure"], status: "live", tier: "pro", desc: "Terrorism, physical threat, and domestic extremism bulletins, critical infrastructure risk matrices." },
      { id: "dod", name: "DoD / DIU", full: "Dept. of Defense Defense Intelligence Unit", url: "https://www.defense.gov/News/Releases/", type: "Military Threat Intel", tags: ["Military", "Geopolitical", "Nation-State"], status: "live", tier: "enterprise", desc: "DoD threat reports, adversary capability assessments, and defense posture advisories." },
      { id: "odni", name: "ODNI", full: "Office of the Director of National Intelligence", url: "https://www.odni.gov/index.php/newsroom/reports-publications", type: "National Intel Assessments", tags: ["Strategic", "Geopolitical", "Annual Threat Assessment"], status: "live", tier: "enterprise", desc: "Annual Threat Assessment reports, Worldwide Threat Assessments, and NCSC advisories." },
      { id: "cia", name: "CIA", full: "Central Intelligence Agency", url: "https://www.cia.gov/stories/", type: "Open Source Intel", tags: ["OSINT", "Geopolitical", "Foreign Intelligence"], status: "live", tier: "enterprise", desc: "CIA World Factbook data, open-source foreign intelligence summaries, and geopolitical analysis." },
      { id: "socom", name: "USSOCOM", full: "US Special Operations Command", url: "https://www.socom.mil/", type: "Operational Threat Intel", tags: ["Gray Zone", "Hybrid Warfare", "PSYOP"], status: "live", tier: "gov", desc: "Special operations threat assessments, gray zone conflict indicators, and hybrid warfare TTPs." },
      { id: "fbi", name: "FBI Cyber Division", full: "Federal Bureau of Investigation — Cyber Division", url: "https://www.ic3.gov/", type: "Cyber Crime / IC3", tags: ["Ransomware", "BEC", "Fraud", "Malware"], status: "live", tier: "community", desc: "IC3 alerts, ransomware advisories, business email compromise warnings, and threat actor indictments." },
      { id: "usss", name: "USSS NCCIC", full: "US Secret Service National Cybercrime Center", url: "https://www.secretservice.gov/investigation/cyber", type: "Financial Cyber Crime", tags: ["Financial", "Fraud", "Skimming"], status: "live", tier: "pro", desc: "Financial sector cybercrimes, ATM skimming, point-of-sale attacks, and identity theft patterns." },
    ]
  },
  // US Private Sector Partners
  {
    group: "🏭 US Private Sector & ISAC Partners",
    sources: [
      { id: "fs_isac", name: "FS-ISAC", full: "Financial Services Information Sharing & Analysis Center", url: "https://www.fsisac.com/", type: "Financial Sector TI", tags: ["Banking", "Finance", "Ransomware"], status: "live", tier: "pro", desc: "Real-time financial sector threat intelligence, incident sharing, and sector-specific vulnerability data." },
      { id: "h_isac", name: "H-ISAC", full: "Health Information Sharing & Analysis Center", url: "https://h-isac.org/", type: "Healthcare TI", tags: ["Healthcare", "Ransomware", "PHI"], status: "live", tier: "pro", desc: "Healthcare sector threats, medical device vulnerabilities, and ransomware targeting hospital networks." },
      { id: "e_isac", name: "E-ISAC", full: "Electricity ISAC", url: "https://www.eisac.com/", type: "Energy Sector TI", tags: ["ICS", "OT", "Grid", "Critical Infrastructure"], status: "live", tier: "enterprise", desc: "Grid security threats, OT/ICS vulnerabilities, and energy sector threat actor tracking." },
      { id: "ms_isac", name: "MS-ISAC", full: "Multi-State ISAC", url: "https://www.cisecurity.org/ms-isac/", type: "State/Local Gov TI", tags: ["SLTT", "Election", "Gov Systems"], status: "live", tier: "community", desc: "State, local, tribal, and territorial government threat intelligence and cyber advisories." },
    ]
  },
  // Five Eyes
  {
    group: "👁️ Five Eyes Alliance",
    sources: [
      { id: "ncsc_uk", name: "NCSC UK", full: "UK National Cyber Security Centre", url: "https://www.ncsc.gov.uk/", type: "UK Cyber Advisories", tags: ["APT", "UK", "Ransomware", "Supply Chain"], status: "live", tier: "pro", desc: "UK threat advisories, joint Five Eyes publications, and ransomware/state-sponsored attack alerts." },
      { id: "acsc", name: "ACSC", full: "Australian Cyber Security Centre", url: "https://www.cyber.gov.au/", type: "AUS Advisories", tags: ["APT", "Australia", "Critical Infrastructure"], status: "live", tier: "pro", desc: "Australian advisories, critical infrastructure alerts, and ASD threat reports." },
      { id: "cccs", name: "CCCS", full: "Canadian Centre for Cyber Security", url: "https://www.cyber.gc.ca/", type: "Canada Advisories", tags: ["APT", "Canada", "Finance", "Energy"], status: "live", tier: "pro", desc: "Canadian national cyber threat assessments and sector-specific security bulletins." },
      { id: "ncsc_nz", name: "NCSC NZ", full: "NZ National Cyber Security Centre", url: "https://www.ncsc.govt.nz/", type: "NZ Advisories", tags: ["APT", "NZ", "Critical Infrastructure"], status: "live", tier: "pro", desc: "New Zealand threat reports and critical infrastructure protection guidance." },
    ]
  },
  // NATO & European
  {
    group: "🇪🇺 NATO & European Allies",
    sources: [
      { id: "enisa", name: "ENISA", full: "EU Agency for Cybersecurity", url: "https://www.enisa.europa.eu/", type: "EU Threat Landscape", tags: ["EU", "APT", "Ransomware", "Supply Chain"], status: "live", tier: "pro", desc: "EU Threat Landscape reports, ENISA advisories, and pan-European vulnerability tracking." },
      { id: "bsi", name: "BSI Germany", full: "German Federal Office for Information Security", url: "https://www.bsi.bund.de/EN/", type: "Germany Advisories", tags: ["Germany", "APT", "ICS", "Critical Infrastructure"], status: "live", tier: "pro", desc: "German national cybersecurity advisories, ICS/OT threat bulletins, and APT tracking." },
      { id: "anssi", name: "ANSSI France", full: "French National Cybersecurity Agency", url: "https://www.ssi.gouv.fr/", type: "France Advisories", tags: ["France", "APT", "Ransomware"], status: "live", tier: "pro", desc: "French cyberattack reports, APT attribution, and critical system protection guidance." },
      { id: "nato_circ", name: "NATO CIRC", full: "NATO Computer Incident Response Capability", url: "https://www.nato.int/cps/en/natohq/topics_77606.htm", type: "NATO Threat Intel", tags: ["NATO", "Military", "Nation-State", "Hybrid Warfare"], status: "live", tier: "gov", desc: "NATO collective defense threat assessments, hybrid warfare indicators, and alliance-wide advisories." },
      { id: "cert_eu", name: "CERT-EU", full: "EU Institutions Computer Emergency Response Team", url: "https://cert.europa.eu/", type: "EU CERT Advisories", tags: ["EU", "APT", "Phishing", "Malware"], status: "live", tier: "pro", desc: "EU institutions threat landscape, spear-phishing campaigns, and malware analysis reports." },
    ]
  },
  // Asia-Pacific Partners
  {
    group: "🌏 Asia-Pacific Partners",
    sources: [
      { id: "nisc_jp", name: "NISC Japan", full: "Japan National center of Incident Readiness & Strategy for Cybersecurity", url: "https://www.nisc.go.jp/eng/", type: "Japan Advisories", tags: ["Japan", "APT", "Critical Infrastructure"], status: "live", tier: "pro", desc: "Japan national cyber strategy, APT threat reports, and critical infrastructure protection advisories." },
      { id: "kisa", name: "KrCERT/CC", full: "Korea Internet & Security Agency", url: "https://www.kisa.or.kr/", type: "Korea Advisories", tags: ["Korea", "North Korea", "APT", "Financial Crime"], status: "live", tier: "pro", desc: "North Korean APT tracking, financial cybercrime, and South Korean national threat advisories." },
      { id: "isac_sg", name: "CSA Singapore", full: "Cyber Security Agency of Singapore", url: "https://www.csa.gov.sg/", type: "Singapore Advisories", tags: ["Singapore", "APT", "Financial", "Critical Infrastructure"], status: "live", tier: "pro", desc: "Singapore national cybersecurity landscape reports and financial sector threat advisories." },
    ]
  },
  // Open Source Intel
  {
    group: "🌐 Open Source & Community Intelligence",
    sources: [
      { id: "nvd", name: "NVD / NIST", full: "National Vulnerability Database", url: "https://nvd.nist.gov/", type: "CVE / CVSS", tags: ["CVE", "CVSS", "Vulnerability"], status: "live", tier: "community", desc: "Full CVE/CVSS database, CPE mappings, and vulnerability scoring updated daily." },
      { id: "mitre_cve", name: "MITRE ATT&CK + CVE", full: "MITRE Corporation", url: "https://attack.mitre.org/", type: "TTP + CVE DB", tags: ["ATT&CK", "CVE", "Groups", "Software"], status: "live", tier: "community", desc: "MITRE ATT&CK framework updates, CVE database, and threat group campaign tracking." },
      { id: "otx", name: "AlienVault OTX", full: "AlienVault Open Threat Exchange", url: "https://otx.alienvault.com/", type: "Community IOC Feed", tags: ["IOC", "Community", "Malware", "IP"], status: "live", tier: "community", desc: "Community-driven IOC sharing platform with 100K+ contributors and daily pulse updates." },
      { id: "misp", name: "MISP Community", full: "Malware Information Sharing Platform", url: "https://www.misp-project.org/", type: "STIX/TAXII Feed", tags: ["STIX", "TAXII", "IOC", "Malware"], status: "live", tier: "pro", desc: "Federated MISP threat sharing communities — government, ISAC, and private sector sharing circles." },
    ]
  }
];

const TIER_COLORS = { community: "bg-gray-700 text-gray-300", pro: "bg-[#00d4ff]/10 text-[#00d4ff]", enterprise: "bg-purple-900/40 text-purple-300", gov: "bg-yellow-900/40 text-yellow-300" };
const STATUS_COLORS = { live: "text-[#2ed573]", beta: "text-[#ffa502]", pending: "text-gray-500" };
const STATUS_LABELS = { live: "Live", beta: "Beta", pending: "Pending" };

export default function GovIntelFeeds() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");
  const [connected, setConnected] = useState({});

  const groups = ["All", ...GOV_FEEDS.map(g => g.group)];

  const allSources = GOV_FEEDS.flatMap(g => g.sources.map(s => ({ ...s, group: g.group })));
  const filtered = allSources.filter(s => {
    const matchGroup = activeGroup === "All" || s.group === activeGroup;
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.full.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    return matchGroup && matchSearch;
  });

  const groupedFiltered = GOV_FEEDS.map(g => ({
    ...g,
    sources: filtered.filter(s => s.group === g.group)
  })).filter(g => g.sources.length > 0);

  const totalConnected = Object.values(connected).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[#00d4ff] text-xs font-bold uppercase tracking-widest">
          <Globe2 className="w-3.5 h-3.5" /> Government & Allied Intelligence Network
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Multi-Agency Intelligence Feeds</h1>
            <p className="text-gray-400 text-sm mt-1">USCYBERCOM · SOCOM · ODNI · CIA · DHS · DoD · Five Eyes · NATO · EU · APAC · ISACs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-2 text-center">
              <div className="text-[#2ed573] font-black text-xl">{totalConnected}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Connected</div>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-2 text-center">
              <div className="text-[#00d4ff] font-black text-xl">{allSources.length}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Total Feeds</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search agencies, tags, threats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#111827] border-white/10 text-gray-200 w-72 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {groups.slice(0, 1).concat(["🇺🇸 US Federal Intelligence & Cyber", "👁️ Five Eyes Alliance", "🇪🇺 NATO & European Allies", "🌏 Asia-Pacific Partners", "🌐 Open Source & Community Intelligence"]).map((g, idx) => (
            <button
              key={idx}
              onClick={() => setActiveGroup(g === activeGroup ? "All" : g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${activeGroup === g ? "bg-[#00d4ff] text-black border-[#00d4ff]" : "bg-[#111827] border-white/5 text-gray-400 hover:text-gray-200"}`}
            >
              {g === "All" ? "All Sources" : g.split(" ").slice(1).join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-200 leading-relaxed">
          <strong>Classification Notice:</strong> ASOSINT ingests publicly available, unclassified intelligence from official government sources. Government and Enterprise tier subscribers with appropriate accreditation can configure access to CUI-level feeds through the classified deployment option. All data is processed according to applicable handling requirements.
        </p>
      </div>

      {/* Feed Groups */}
      {groupedFiltered.map(group => (
        <div key={group.group} className="space-y-3">
          <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            {group.group}
            <span className="text-[10px] font-normal text-gray-600">({group.sources.length} sources)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.sources.map(source => (
              <div key={source.id} className={`bg-[#111827] rounded-xl border transition-all space-y-3 p-5 ${connected[source.id] ? "border-[#2ed573]/30" : "border-white/5 hover:border-white/10"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{source.name}</span>
                      <span className={`text-[9px] font-bold uppercase ${STATUS_COLORS[source.status]} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${source.status === "live" ? "bg-[#2ed573]" : "bg-yellow-400"} inline-block`} />
                        {STATUS_LABELS[source.status]}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{source.full}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${TIER_COLORS[source.tier]}`}>{source.tier}</span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">{source.desc}</p>

                <div className="flex flex-wrap gap-1">
                  {source.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full border border-white/5">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock className="w-3 h-3" />{source.type}</span>
                  <div className="flex items-center gap-2">
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-500 hover:text-gray-300 text-xs gap-1">
                        <ExternalLink className="w-3 h-3" /> Source
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      className={`h-7 px-3 text-xs gap-1 transition-all ${connected[source.id] ? "bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/30 hover:bg-[#2ed573]/20" : "bg-[#00d4ff] text-black hover:bg-[#00bfe6]"}`}
                      onClick={() => setConnected(prev => ({ ...prev, [source.id]: !prev[source.id] }))}
                    >
                      {connected[source.id] ? <><CheckCircle2 className="w-3 h-3" /> Connected</> : <><Zap className="w-3 h-3" /> Connect</>}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Classified Tier CTA */}
      <div className="rounded-xl border border-yellow-700/20 bg-yellow-900/10 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Lock className="w-6 h-6 text-yellow-400 shrink-0 mt-1" />
          <div>
            <p className="font-bold text-yellow-300 mb-1">Classified & CUI Feed Access</p>
            <p className="text-sm text-gray-400 max-w-xl">Government and cleared enterprise clients can configure ASOSINT for CUI, FOUO, and classified feed access through our on-premise or GovCloud deployment. Requires accreditation validation and ISSO approval.</p>
          </div>
        </div>
        <Button className="bg-yellow-700 hover:bg-yellow-600 text-white gap-2 shrink-0">
          <Eye className="w-4 h-4" /> Request Gov Access
        </Button>
      </div>
    </div>
  );
}