import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download, RefreshCw, AlertTriangle, CheckCircle2, Building2,
  Server, Shield, Cpu, Radio, Truck, Lock, Globe, Plus, X, Eye,
  ExternalLink, Loader2, Package, Zap, MapPin
} from "lucide-react";

const SEVERITY_COLORS = {
  critical: { bg: "bg-red-900/30", text: "text-red-300", border: "border-red-500/30" },
  high: { bg: "bg-orange-900/30", text: "text-orange-300", border: "border-orange-500/30" },
  medium: { bg: "bg-yellow-900/30", text: "text-yellow-300", border: "border-yellow-500/30" },
  low: { bg: "bg-blue-900/30", text: "text-blue-300", border: "border-blue-500/30" },
  informational: { bg: "bg-gray-800/30", text: "text-gray-400", border: "border-gray-600/30" },
};

const DOMAIN_ICONS = { digital: Globe, physical: MapPin, hybrid: Zap };

const SOURCES = [
  { value: "nvd", label: "NVD (NIST)", description: "National Vulnerability Database — CVEs from NIST" },
  { value: "cisa_kev", label: "CISA KEV", description: "Known Exploited Vulnerabilities catalog" },
  { value: "manual", label: "Manual Entry", description: "Enter a vendor advisory manually" },
];

const MISSION_SET_OPTIONS = [
  "C2", "ISR", "Logistics", "Communications", "Cyber Operations",
  "Force Protection", "Medical", "Navigation/GPS", "Electronic Warfare",
  "SIGINT", "HUMINT", "OSINT", "Supply Chain", "Physical Security"
];

export default function VendorIngestionPanel({ onFindingsCreated }) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState("nvd");
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState("");
  const [daysBack, setDaysBack] = useState(7);
  const [autoFindings, setAutoFindings] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");

  // Manual form state
  const [manual, setManual] = useState({
    advisory_id: "", title: "", description: "", vendor: "",
    vendor_type: "software", domain: "digital", cve_ids: [],
    affected_products: [], affected_asset_types: [], mission_sets: [],
    severity: "medium", cvss_score: "", fix_available: false,
    fix_type: "patch", fix_url: "", fix_description: "",
    published_date: new Date().toISOString().slice(0, 10),
    tags: []
  });
  const [manualCveInput, setManualCveInput] = useState("");
  const [manualProductInput, setManualProductInput] = useState("");
  const [selectedMissions, setSelectedMissions] = useState([]);

  const { data: advisories = [], isLoading } = useQuery({
    queryKey: ["vendor-advisories"],
    queryFn: () => base44.entities.VendorAdvisory.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const addKeyword = () => {
    if (kwInput.trim() && !keywords.includes(kwInput.trim())) {
      setKeywords([...keywords, kwInput.trim()]);
      setKwInput("");
    }
  };

  const runIngestion = async () => {
    setRunning(true);
    setLastResult(null);
    try {
      const payload = { source, days_back: daysBack, keywords, auto_create_findings: autoFindings };
      if (source === "manual") {
        payload.manual_advisory = {
          ...manual,
          cvss_score: manual.cvss_score ? parseFloat(manual.cvss_score) : null,
          cve_ids: manualCveInput ? manualCveInput.split(",").map(s => s.trim()).filter(Boolean) : [],
          affected_products: manualProductInput ? manualProductInput.split(",").map(s => s.trim()).filter(Boolean) : [],
          mission_sets: selectedMissions,
          published_date: new Date(manual.published_date).toISOString(),
        };
      }
      const res = await base44.functions.invoke("ingestVendorAdvisories", payload);
      setLastResult(res.data);
      queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
      queryClient.invalidateQueries({ queryKey: ["vuln-findings"] });
      if (autoFindings && onFindingsCreated) onFindingsCreated();
    } finally {
      setRunning(false);
    }
  };

  const filtered = advisories.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (domainFilter !== "all" && a.domain !== domainFilter) return false;
    return true;
  });

  const updateAdvisoryStatus = async (id, status) => {
    await base44.entities.VendorAdvisory.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
  };

  return (
    <div className="space-y-5">
      {/* Ingestion Config */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Vendor Advisory Ingestion</span>
          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">DIGITAL + PHYSICAL</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {SOURCES.map(s => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={`text-left p-3 rounded-lg border transition-all ${
                source === s.value
                  ? "border-cyan-500/40 bg-cyan-900/20"
                  : "border-white/5 bg-white/3 hover:border-white/10"
              }`}
            >
              <p className={`text-xs font-bold ${source === s.value ? "text-cyan-300" : "text-gray-300"}`}>{s.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.description}</p>
            </button>
          ))}
        </div>

        {source !== "manual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Filter Keywords (vendor/product/platform)</Label>
              <div className="flex gap-2">
                <Input
                  value={kwInput}
                  onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  placeholder="e.g. cisco, windows, scada…"
                  className="bg-white/5 border-white/10 text-sm text-gray-200 h-8"
                />
                <Button size="sm" variant="outline" onClick={addKeyword} className="h-8 border-white/10 text-gray-300">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map(k => (
                    <Badge key={k} className="bg-white/5 text-gray-300 border-white/10 text-[10px] flex items-center gap-1">
                      {k}
                      <button onClick={() => setKeywords(keywords.filter(x => x !== k))}><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Look-back Window (days)</Label>
              <Select value={String(daysBack)} onValueChange={v => setDaysBack(Number(v))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 7, 14, 30, 90].map(d => (
                    <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {source === "manual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-white/3 rounded-lg border border-white/5">
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-400 mb-1 block">Advisory Title *</Label>
              <Input value={manual.title} onChange={e => setManual({ ...manual, title: e.target.value })}
                placeholder="e.g. Critical RCE in Cisco IOS XE" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Vendor *</Label>
              <Input value={manual.vendor} onChange={e => setManual({ ...manual, vendor: e.target.value })}
                placeholder="e.g. Cisco, Microsoft, Lenel…" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Advisory ID</Label>
              <Input value={manual.advisory_id} onChange={e => setManual({ ...manual, advisory_id: e.target.value })}
                placeholder="e.g. CSCO-2024-1234" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Domain</Label>
              <Select value={manual.domain} onValueChange={v => setManual({ ...manual, domain: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Vendor Type</Label>
              <Select value={manual.vendor_type} onValueChange={v => setManual({ ...manual, vendor_type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["software","hardware","firmware","physical_security","ics_ot","cloud","mobile","network"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Severity</Label>
              <Select value={manual.severity} onValueChange={v => setManual({ ...manual, severity: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["critical","high","medium","low","informational"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">CVE IDs (comma-separated)</Label>
              <Input value={manualCveInput} onChange={e => setManualCveInput(e.target.value)}
                placeholder="CVE-2024-1234, CVE-2024-5678" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Affected Products (comma-separated)</Label>
              <Input value={manualProductInput} onChange={e => setManualProductInput(e.target.value)}
                placeholder="IOS XE 17.x, ASA 9.x" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Fix URL</Label>
              <Input value={manual.fix_url} onChange={e => setManual({ ...manual, fix_url: e.target.value })}
                placeholder="https://vendor.com/patch" className="bg-white/5 border-white/10 text-gray-200 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-gray-400 mb-1 block">Fix Type</Label>
              <Select value={manual.fix_type} onValueChange={v => setManual({ ...manual, fix_type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["patch","firmware_update","configuration_change","hardware_replacement","workaround","no_fix"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-400 mb-1 block">Mission Sets Impacted</Label>
              <div className="flex flex-wrap gap-1.5">
                {MISSION_SET_OPTIONS.map(ms => (
                  <button
                    key={ms}
                    onClick={() => setSelectedMissions(p => p.includes(ms) ? p.filter(x => x !== ms) : [...p, ms])}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                      selectedMissions.includes(ms)
                        ? "bg-cyan-900/40 border-cyan-500/40 text-cyan-300"
                        : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    {ms}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-gray-400 mb-1 block">Description / Remediation Notes</Label>
              <Textarea value={manual.fix_description} onChange={e => setManual({ ...manual, fix_description: e.target.value })}
                placeholder="Describe the vulnerability and how to fix it…"
                className="bg-white/5 border-white/10 text-gray-200 text-sm h-20 resize-none" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Switch id="auto-findings" checked={autoFindings} onCheckedChange={setAutoFindings} />
            <Label htmlFor="auto-findings" className="text-xs text-gray-400 cursor-pointer">
              Auto-create VulnerabilityFindings for matched assets
            </Label>
          </div>
          <Button onClick={runIngestion} disabled={running} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 h-8 text-xs">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {running ? "Ingesting…" : `Ingest from ${SOURCES.find(s2 => s2.value === source)?.label}`}
          </Button>
        </div>

        {lastResult && (
          <div className={`mt-3 p-3 rounded-lg border text-xs flex flex-wrap gap-4 ${
            lastResult.error ? "bg-red-900/20 border-red-500/30 text-red-300" : "bg-green-900/20 border-green-500/30 text-green-300"
          }`}>
            {lastResult.error ? (
              <span>❌ {lastResult.error}</span>
            ) : (
              <>
                <span>✅ <strong>{lastResult.new_ingested}</strong> new advisories ingested</span>
                <span>🔗 <strong>{lastResult.asset_matches}</strong> asset matches</span>
                {lastResult.duplicates_skipped > 0 && <span>⏭ {lastResult.duplicates_skipped} duplicates skipped</span>}
                {lastResult.findings_created > 0 && <span>🛡 <strong>{lastResult.findings_created}</strong> findings created</span>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Advisory Library */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-white">Advisory Library</span>
            <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px]">{advisories.length} total</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-gray-300 h-7 text-xs w-28"><SelectValue placeholder="Domain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-gray-300 h-7 text-xs w-28"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading advisories…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No advisories ingested yet. Run an ingestion above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(adv => {
              const sev = SEVERITY_COLORS[adv.severity] || SEVERITY_COLORS.medium;
              const DomainIcon = DOMAIN_ICONS[adv.domain] || Globe;
              return (
                <div
                  key={adv.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-white/15 ${
                    selectedAdvisory?.id === adv.id ? "border-cyan-500/30 bg-cyan-900/10" : "border-white/5 bg-white/2"
                  }`}
                  onClick={() => setSelectedAdvisory(selectedAdvisory?.id === adv.id ? null : adv)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${sev.bg} ${sev.text} ${sev.border} text-[9px] font-bold uppercase`}>
                          {adv.severity}
                        </Badge>
                        <Badge className="bg-white/5 text-gray-400 border-white/10 text-[9px]">
                          <DomainIcon className="w-2.5 h-2.5 mr-1" />{adv.domain}
                        </Badge>
                        <Badge className="bg-white/5 text-gray-500 border-white/10 text-[9px]">
                          {adv.ingestion_source?.replace("_", " ")}
                        </Badge>
                        {adv.matched_asset_count > 0 && (
                          <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20 text-[9px]">
                            {adv.matched_asset_count} assets matched
                          </Badge>
                        )}
                        {adv.fix_available && (
                          <Badge className="bg-green-900/20 text-green-400 border-green-500/20 text-[9px]">
                            Fix Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-200 font-medium truncate">{adv.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {adv.vendor} · {adv.advisory_id} · {adv.cve_ids?.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={adv.status}
                        onValueChange={v => updateAdvisoryStatus(adv.id, v)}
                        onClick={e => e.stopPropagation()}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-gray-300 h-6 text-[10px] w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedAdvisory?.id === adv.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                      {adv.description && (
                        <p className="text-xs text-gray-400 leading-relaxed">{adv.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                        {adv.cvss_score != null && (
                          <div><span className="text-gray-500">CVSS</span><p className="text-white font-bold">{adv.cvss_score}</p></div>
                        )}
                        <div><span className="text-gray-500">Fix Type</span><p className="text-gray-300">{adv.fix_type?.replace(/_/g, " ") || "—"}</p></div>
                        <div><span className="text-gray-500">Vendor Type</span><p className="text-gray-300">{adv.vendor_type?.replace(/_/g, " ") || "—"}</p></div>
                        <div><span className="text-gray-500">Published</span><p className="text-gray-300">{adv.published_date ? new Date(adv.published_date).toLocaleDateString() : "—"}</p></div>
                      </div>
                      {adv.affected_products?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Affected Products</p>
                          <div className="flex flex-wrap gap-1">
                            {adv.affected_products.slice(0, 8).map(p => (
                              <Badge key={p} className="bg-white/5 text-gray-400 border-white/10 text-[9px]">{p}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {adv.mission_sets?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Mission Sets</p>
                          <div className="flex flex-wrap gap-1">
                            {adv.mission_sets.map(ms => (
                              <Badge key={ms} className="bg-cyan-900/20 text-cyan-400 border-cyan-500/20 text-[9px]">{ms}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {adv.fix_description && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Remediation</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{adv.fix_description}</p>
                        </div>
                      )}
                      {adv.fix_url && (
                        <a href={adv.fix_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300">
                          <ExternalLink className="w-3 h-3" /> View Vendor Advisory
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}