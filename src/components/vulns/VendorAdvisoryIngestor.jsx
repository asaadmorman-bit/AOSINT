import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Package, Zap, CheckCircle2, AlertTriangle, Loader2, Plus,
  Cpu, Radio, Shield, Server, Truck, Lock, Wifi, RefreshCw, Trash2, PlayCircle
} from "lucide-react";

const SEVERITY_COLORS = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  medium: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  informational: { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
};

const STATUS_COLORS = {
  new: "bg-red-500/10 text-red-400",
  triaged: "bg-yellow-500/10 text-yellow-400",
  in_remediation: "bg-blue-500/10 text-blue-400",
  resolved: "bg-green-500/10 text-green-400",
  accepted_risk: "bg-gray-500/10 text-gray-400",
  not_applicable: "bg-gray-600/10 text-gray-500",
};

const VENDOR_TYPE_ICONS = {
  software: Server,
  hardware: Cpu,
  firmware: Zap,
  ics_ot: Radio,
  physical_security: Lock,
  comms_systems: Wifi,
  vehicle_systems: Truck,
  tactical_equipment: Shield,
  cloud_provider: Server,
  other: Package,
};

export default function VendorAdvisoryIngestor() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("browse"); // browse | ai_ingest | manual
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [manualForm, setManualForm] = useState({
    vendor_name: "", title: "", severity: "medium", advisory_type: "vulnerability",
    vendor_type: "software", affected_domain: "digital", description: "",
    fix_available: false, fix_type: "pending", fix_reference: "", fix_instructions: "",
    mission_sets: [], infrastructure_tags: [], cve_ids: [], affected_products: [],
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDomain, setFilterDomain] = useState("all");
  const [workflowLoading, setWorkflowLoading] = useState({});
  const [workflowResults, setWorkflowResults] = useState({});

  const { data: advisories = [], isLoading, refetch } = useQuery({
    queryKey: ["vendor-advisories"],
    queryFn: () => base44.entities.VendorAdvisory.list("-created_date", 100),
    refetchInterval: 60000,
  });

  const handleAIEnrich = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const resp = await base44.functions.invoke("ingestVendorAdvisory", {
        mode: "ai_enrich",
        query: aiQuery,
      });
      setAiResult(resp.data?.advisory || null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleIngest = async (data) => {
    setIngestLoading(true);
    setIngestResult(null);
    try {
      const resp = await base44.functions.invoke("ingestVendorAdvisory", {
        mode: "ingest",
        advisory_data: { ...data, ingestion_source: "ai_enriched" },
      });
      setIngestResult(resp.data);
      queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
      setAiResult(null);
      setAiQuery("");
      setTab("browse");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleManualIngest = async () => {
    setIngestLoading(true);
    setIngestResult(null);
    try {
      const resp = await base44.functions.invoke("ingestVendorAdvisory", {
        mode: "ingest",
        advisory_data: { ...manualForm, ingestion_source: "manual" },
      });
      setIngestResult(resp.data);
      queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
      setTab("browse");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    await base44.entities.VendorAdvisory.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
  };

  const handleTriggerWorkflow = async (advisory) => {
    setWorkflowLoading(prev => ({ ...prev, [advisory.id]: true }));
    setWorkflowResults(prev => ({ ...prev, [advisory.id]: null }));
    try {
      const resp = await base44.functions.invoke("vendorAdvisoryRemediationWorkflow", {
        advisory_id: advisory.id,
        data: advisory
      });
      setWorkflowResults(prev => ({ ...prev, [advisory.id]: resp.data }));
      queryClient.invalidateQueries({ queryKey: ["vendor-advisories"] });
    } finally {
      setWorkflowLoading(prev => ({ ...prev, [advisory.id]: false }));
    }
  };

  const filtered = advisories.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterDomain !== "all" && a.affected_domain !== filterDomain) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Tab Nav */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "browse", label: "All Advisories", icon: Package },
          { id: "ai_ingest", label: "AI Ingest", icon: Zap },
          { id: "manual", label: "Manual Entry", icon: Plus },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === id
                ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                : "bg-white/5 text-gray-400 border border-white/5 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI Ingest Tab */}
      {tab === "ai_ingest" && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#00d4ff] mb-1">AI-Powered Vendor Advisory Ingestion</p>
            <p className="text-[11px] text-gray-500">
              Paste a CVE ID, vendor bulletin URL, advisory text, or product name. AI will extract structured data and match against your asset inventory.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              placeholder="e.g. CVE-2024-1234 · Cisco IOS XE advisory · L3Harris tactical radio firmware bulletin..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 flex-1"
              onKeyDown={e => e.key === "Enter" && handleAIEnrich()}
            />
            <Button
              onClick={handleAIEnrich}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 shrink-0"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {aiLoading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>

          {aiResult && (
            <div className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{aiResult.title}</span>
                    {aiResult.severity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEVERITY_COLORS[aiResult.severity]?.bg} ${SEVERITY_COLORS[aiResult.severity]?.text}`}>
                        {aiResult.severity?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{aiResult.vendor_name} · {aiResult.advisory_type} · {aiResult.affected_domain}</p>
                </div>
                {aiResult.cvss_score && (
                  <div className="text-center shrink-0">
                    <div className="text-lg font-black text-white">{aiResult.cvss_score}</div>
                    <div className="text-[9px] text-gray-500">CVSS</div>
                  </div>
                )}
              </div>

              {aiResult.description && (
                <p className="text-[11px] text-gray-400 leading-relaxed">{aiResult.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {aiResult.cve_ids?.length > 0 && (
                  <div>
                    <span className="text-gray-500">CVEs: </span>
                    <span className="text-[#00d4ff]">{aiResult.cve_ids.join(", ")}</span>
                  </div>
                )}
                {aiResult.fix_available !== undefined && (
                  <div>
                    <span className="text-gray-500">Fix: </span>
                    <span className={aiResult.fix_available ? "text-green-400" : "text-red-400"}>
                      {aiResult.fix_available ? aiResult.fix_type || "Available" : "Not Available"}
                    </span>
                  </div>
                )}
              </div>

              {(aiResult.mission_sets?.length > 0 || aiResult.infrastructure_tags?.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.mission_sets?.map(ms => (
                    <span key={ms} className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">{ms}</span>
                  ))}
                  {aiResult.infrastructure_tags?.map(t => (
                    <span key={t} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              {aiResult.fix_instructions && (
                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                  <p className="text-[10px] text-green-400 font-semibold mb-1">Remediation</p>
                  <p className="text-[11px] text-gray-400">{aiResult.fix_instructions}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => handleIngest(aiResult)}
                  disabled={ingestLoading}
                  className="bg-[#00d4ff] text-black font-bold text-xs hover:bg-[#00d4ff]/90"
                >
                  {ingestLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  Ingest & Match Assets
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setAiResult(null)}
                  className="text-gray-500 text-xs"
                >
                  Discard
                </Button>
              </div>
            </div>
          )}

          {ingestResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-300">
                Advisory ingested · {ingestResult.matched_assets || 0} assets matched · {ingestResult.findings_created || 0} findings created
              </span>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === "manual" && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-xs font-semibold text-[#00d4ff]">Manual Advisory Entry</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Vendor Name *</label>
              <Input
                value={manualForm.vendor_name}
                onChange={e => setManualForm(f => ({ ...f, vendor_name: e.target.value }))}
                placeholder="e.g. Cisco, L3Harris, Bosch Security"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Title *</label>
              <Input
                value={manualForm.title}
                onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Advisory title"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Vendor Type</label>
              <Select value={manualForm.vendor_type} onValueChange={v => setManualForm(f => ({ ...f, vendor_type: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["software","hardware","firmware","ics_ot","physical_security","comms_systems","vehicle_systems","tactical_equipment","cloud_provider","other"].map(v => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Advisory Type</label>
              <Select value={manualForm.advisory_type} onValueChange={v => setManualForm(f => ({ ...f, advisory_type: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["vulnerability","bug_fix","patch","eol_notice","configuration_guidance","security_bulletin","zero_day","supply_chain"].map(v => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Severity</label>
              <Select value={manualForm.severity} onValueChange={v => setManualForm(f => ({ ...f, severity: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["critical","high","medium","low","informational"].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Affected Domain</label>
              <Select value={manualForm.affected_domain} onValueChange={v => setManualForm(f => ({ ...f, affected_domain: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["digital","physical","hybrid"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
              <Textarea
                value={manualForm.description}
                onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the vulnerability or bug fix..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-20"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Mission Sets (comma-separated)</label>
              <Input
                value={manualForm.mission_sets.join(", ")}
                onChange={e => setManualForm(f => ({ ...f, mission_sets: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                placeholder="ISR, C2, SIGINT, comms..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Infrastructure Tags (comma-separated)</label>
              <Input
                value={manualForm.infrastructure_tags.join(", ")}
                onChange={e => setManualForm(f => ({ ...f, infrastructure_tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                placeholder="network, endpoint, tactical..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Fix Type</label>
              <Select value={manualForm.fix_type} onValueChange={v => setManualForm(f => ({ ...f, fix_type: v, fix_available: v !== "no_fix" && v !== "pending" }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["patch","firmware_update","configuration_change","workaround","hardware_replacement","no_fix","pending"].map(v => (
                    <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Fix Reference URL</label>
              <Input
                value={manualForm.fix_reference}
                onChange={e => setManualForm(f => ({ ...f, fix_reference: e.target.value }))}
                placeholder="https://vendor.com/advisory/..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
          </div>
          <Button
            onClick={handleManualIngest}
            disabled={ingestLoading || !manualForm.vendor_name || !manualForm.title}
            className="bg-[#00d4ff] text-black font-bold text-xs hover:bg-[#00d4ff]/90"
          >
            {ingestLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Save & Match Assets
          </Button>
        </div>
      )}

      {/* Browse Tab */}
      {tab === "browse" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["new","triaged","in_remediation","resolved","accepted_risk","not_applicable"].map(s => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-36 h-8 text-xs"><SelectValue placeholder="Domain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {["digital","physical","hybrid"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-gray-500 ml-auto">{filtered.length} advisories</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No vendor advisories yet.</p>
              <p className="text-xs mt-1">Use AI Ingest or Manual Entry to add advisories.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(a => {
                const sev = SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.medium;
                const Icon = VENDOR_TYPE_ICONS[a.vendor_type] || Package;
                return (
                  <div key={a.id} className="bg-[#0d1220] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                        <Icon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="text-xs font-semibold text-white">{a.title}</span>
                            <span className="text-[11px] text-gray-500 ml-2">{a.vendor_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sev.bg} ${sev.text}`}>
                              {a.severity?.toUpperCase()}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || "bg-gray-500/10 text-gray-400"}`}>
                              {a.status?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-2">
                          <span className="capitalize">{a.advisory_type?.replace(/_/g, " ")}</span>
                          <span className={`font-medium ${a.affected_domain === "physical" ? "text-amber-400" : a.affected_domain === "hybrid" ? "text-purple-400" : "text-blue-400"}`}>
                            {a.affected_domain}
                          </span>
                          {a.cvss_score && <span>CVSS {a.cvss_score}</span>}
                          {a.matched_assets?.length > 0 && (
                            <span className="text-orange-400">{a.matched_assets.length} assets matched</span>
                          )}
                          {a.fix_available && (
                            <span className="text-green-400">✓ Fix available</span>
                          )}
                        </div>

                        {(a.mission_sets?.length > 0 || a.infrastructure_tags?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {a.mission_sets?.slice(0, 4).map(ms => (
                              <span key={ms} className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">{ms}</span>
                            ))}
                            {a.infrastructure_tags?.slice(0, 4).map(t => (
                              <span key={t} className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}

                        {a.cve_ids?.length > 0 && (
                          <p className="text-[10px] text-[#00d4ff] mb-2">{a.cve_ids.join(" · ")}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            value={a.status}
                            onValueChange={v => handleStatusUpdate(a.id, v)}
                          >
                            <SelectTrigger className="h-6 w-36 bg-white/5 border-white/10 text-white text-[10px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["new","triaged","in_remediation","resolved","accepted_risk","not_applicable"].map(s => (
                                <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {(a.fix_available || a.status === "applied") && (
                            <button
                              onClick={() => handleTriggerWorkflow(a)}
                              disabled={workflowLoading[a.id]}
                              title="Trigger remediation workflow"
                              className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                            >
                              {workflowLoading[a.id]
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <PlayCircle className="w-3 h-3" />}
                              {workflowLoading[a.id] ? "Running..." : "Trigger Workflow"}
                            </button>
                          )}

                          {workflowResults[a.id] && (
                            <span className="text-[10px] text-green-400">
                              ✓ {workflowResults[a.id].tasks_created || 0} tasks · {workflowResults[a.id].findings_updated || 0} findings updated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}