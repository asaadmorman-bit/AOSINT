import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Globe2, Bug, CheckCircle2, ChevronRight, Loader2, Eye, EyeOff } from "lucide-react";

const REPORT_TYPES = [
  {
    id: "vulnerability",
    label: "Vulnerability",
    icon: Bug,
    color: "orange",
    desc: "CVEs, software bugs, unpatched systems, misconfigurations",
    fields: ["cve_id", "affected_systems", "affected_versions", "source_reference"]
  },
  {
    id: "incident",
    label: "Incident",
    icon: AlertTriangle,
    color: "red",
    desc: "Active breaches, intrusions, data leaks, ransomware events",
    fields: ["incident_date", "affected_systems", "evidence_url"]
  },
  {
    id: "threat_intelligence",
    label: "Threat Intelligence",
    icon: Globe2,
    color: "cyan",
    desc: "IOCs, threat actor TTPs, malicious domains/IPs/hashes",
    fields: ["indicator_type", "indicator_value", "source_reference"]
  }
];

const SEVERITY_OPTS = ["critical", "high", "medium", "low"];
const INDICATOR_TYPES = ["ip_address", "domain", "hash", "url", "email", "cve", "other"];
const SEV_COLOR = { critical: "bg-red-900/20 border-red-500/30 text-red-300", high: "bg-orange-900/20 border-orange-500/30 text-orange-300", medium: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300", low: "bg-blue-900/20 border-blue-500/30 text-blue-300" };

export default function CommunityReporting() {
  const [step, setStep] = useState(1); // 1=type, 2=details, 3=submitted
  const [reportType, setReportType] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", severity: "medium",
    cve_id: "", affected_systems: "", affected_versions: "",
    incident_date: "", evidence_url: "", source_reference: "",
    indicator_type: "ip_address", indicator_value: "",
    is_anonymous: false
  });

  const selectedType = REPORT_TYPES.find(t => t.id === reportType);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const payload = {
        report_type: reportType,
        title: form.title,
        description: form.description,
        severity: form.severity,
        is_anonymous: form.is_anonymous,
        submitter_email: form.is_anonymous ? null : user?.email,
        submitter_name: form.is_anonymous ? null : user?.full_name,
        verification_status: "pending"
      };
      if (form.cve_id) payload.cve_id = form.cve_id;
      if (form.affected_systems) payload.affected_systems = form.affected_systems;
      if (form.affected_versions) payload.affected_versions = form.affected_versions;
      if (form.incident_date) payload.incident_date = new Date(form.incident_date).toISOString();
      if (form.evidence_url) payload.evidence_url = form.evidence_url;
      if (form.source_reference) payload.source_reference = form.source_reference;
      if (reportType === "threat_intelligence") {
        payload.indicator_type = form.indicator_type;
        payload.indicator_value = form.indicator_value;
      }
      return base44.entities.CommunityReport.create(payload);
    },
    onSuccess: () => setStep(3)
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inputCls = "w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50";

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold text-white">Community Reporting</h1>
          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">SUBSCRIBER</Badge>
        </div>
        <p className="text-xs text-gray-500">Submit vulnerabilities, incidents, or threat intelligence. All reports are verified before being added to the platform.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs">
        {["Select Type", "Report Details", "Submitted"].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 ${step > i + 1 ? "text-green-400" : step === i + 1 ? "text-cyan-400" : "text-gray-600"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step > i + 1 ? "bg-green-900/30 border-green-500/40" : step === i + 1 ? "bg-cyan-900/30 border-cyan-500/40" : "border-gray-700"}`}>
                {step > i + 1 ? "✓" : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < 2 && <ChevronRight className="w-3 h-3 text-gray-700" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Pick type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">What are you reporting?</p>
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => { setReportType(t.id); setStep(2); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${reportType === t.id ? "border-cyan-500/40 bg-cyan-900/10" : "border-white/5 bg-slate-900/40 hover:border-white/10"}`}>
              <div className="flex items-center gap-3">
                <t.icon className={`w-5 h-5 ${t.color === "orange" ? "text-orange-400" : t.color === "red" ? "text-red-400" : "text-cyan-400"}`} />
                <div>
                  <p className="font-semibold text-white text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && selectedType && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
            ← Change report type
          </button>

          {/* Severity */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Severity *</label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITY_OPTS.map(s => (
                <button key={s} onClick={() => update("severity", s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${form.severity === s ? SEV_COLOR[s] : "border-white/5 bg-slate-800/40 text-gray-500 hover:text-gray-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
            <input className={inputCls} placeholder="Brief, descriptive title" value={form.title} onChange={e => update("title", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description *</label>
            <textarea className={inputCls + " h-28 resize-none"} placeholder="Describe the vulnerability, incident, or threat intelligence in detail..." value={form.description} onChange={e => update("description", e.target.value)} />
          </div>

          {/* Type-specific fields */}
          {selectedType.fields.includes("cve_id") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">CVE ID</label>
              <input className={inputCls} placeholder="e.g. CVE-2024-12345" value={form.cve_id} onChange={e => update("cve_id", e.target.value)} />
            </div>
          )}
          {selectedType.fields.includes("affected_systems") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Affected Systems / Software</label>
              <input className={inputCls} placeholder="e.g. Apache HTTP Server, Windows 11" value={form.affected_systems} onChange={e => update("affected_systems", e.target.value)} />
            </div>
          )}
          {selectedType.fields.includes("affected_versions") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Affected Versions</label>
              <input className={inputCls} placeholder="e.g. 2.4.0 - 2.4.56" value={form.affected_versions} onChange={e => update("affected_versions", e.target.value)} />
            </div>
          )}
          {selectedType.fields.includes("incident_date") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Incident Date / Time</label>
              <input type="datetime-local" className={inputCls} value={form.incident_date} onChange={e => update("incident_date", e.target.value)} />
            </div>
          )}
          {selectedType.fields.includes("indicator_type") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Indicator Type</label>
                <select className={inputCls} value={form.indicator_type} onChange={e => update("indicator_type", e.target.value)}>
                  {INDICATOR_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Indicator Value *</label>
                <input className={inputCls} placeholder="IP, domain, hash, URL…" value={form.indicator_value} onChange={e => update("indicator_value", e.target.value)} />
              </div>
            </div>
          )}
          {selectedType.fields.includes("source_reference") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Source Reference / URL</label>
              <input className={inputCls} placeholder="Link to advisory, article, or original source" value={form.source_reference} onChange={e => update("source_reference", e.target.value)} />
            </div>
          )}
          {selectedType.fields.includes("evidence_url") && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Evidence URL</label>
              <input className={inputCls} placeholder="Screenshot, log excerpt, pastebin link…" value={form.evidence_url} onChange={e => update("evidence_url", e.target.value)} />
            </div>
          )}

          {/* Anonymous toggle */}
          <div className="flex items-center gap-3 p-3 bg-slate-900/40 border border-white/5 rounded-lg">
            <button onClick={() => update("is_anonymous", !form.is_anonymous)} className={`w-9 h-5 rounded-full transition-colors flex items-center ${form.is_anonymous ? "bg-cyan-600 justify-end" : "bg-slate-700 justify-start"}`}>
              <span className="w-4 h-4 bg-white rounded-full mx-0.5 block shrink-0" />
            </button>
            <div>
              <p className="text-xs text-white font-semibold flex items-center gap-1">
                {form.is_anonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {form.is_anonymous ? "Anonymous submission" : "Submit with my identity"}
              </p>
              <p className="text-[10px] text-gray-600">Your identity is never shared publicly regardless.</p>
            </div>
          </div>

          {/* Verification disclaimer */}
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-300/80">
            ⚠️ All submissions go through AI-assisted + human verification before being added to the platform. False or fabricated reports violate our Acceptable Use Policy.
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !form.title || !form.description}
            className="w-full bg-cyan-700 hover:bg-cyan-600 gap-2"
          >
            {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Shield className="w-4 h-4" />Submit for Verification</>}
          </Button>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="text-center py-16 bg-slate-900/40 border border-green-500/20 rounded-xl space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Report Submitted</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Your report is in the verification queue. Our AI system will assess it first, followed by human review. You'll be notified if it's approved or if we need more information.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white" onClick={() => { setStep(1); setReportType(null); setForm({ title: "", description: "", severity: "medium", cve_id: "", affected_systems: "", affected_versions: "", incident_date: "", evidence_url: "", source_reference: "", indicator_type: "ip_address", indicator_value: "", is_anonymous: false }); }}>
              Submit Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}