import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertTriangle, Shield, Code, FileText, Globe, Lock, Star, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = ["Profile", "Capabilities", "Safety Review", "Submit"];

const CATEGORIES = ["Intelligence", "Detection", "Forecasting", "Analysis", "Influence", "Threat", "Risk", "Reporting", "Collection", "OT/ICS", "Financial"];
const MIN_TIERS = ["pro", "enterprise", "gov"];

const SAFETY_CHECKLIST = [
  { id: "no_offensive", label: "Agent performs no offensive, exploit, or attack actions" },
  { id: "human_loop", label: "Human-in-the-loop override is always respected" },
  { id: "no_pii", label: "Agent does not exfiltrate or store PII without consent" },
  { id: "audit_log", label: "All actions are audit logged with attribution" },
  { id: "rbac", label: "Access controls and RBAC are enforced within the agent" },
  { id: "no_sensitive_targeting", label: "No targeting of specific individuals or protected groups" },
  { id: "tested", label: "Agent has been tested against the ASOSINT safety test suite" },
];

export default function VendorPublishPanel() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [safety, setSafety] = useState({});
  const [form, setForm] = useState({
    name: "", vendor: "", category: "", min_tier: "pro",
    description: "", capabilities: "", endpoint_url: "",
    auth_type: "api_key", contact_email: "", tags: "",
    icon: "🤖",
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const allSafetyChecked = SAFETY_CHECKLIST.every(s => safety[s.id]);

  async function handleSubmit() {
    setLoading(true);
    // Simulate submission — in production this would call a backend function
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#2ed573]/10 border border-[#2ed573]/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-[#2ed573]" />
        </div>
        <h2 className="text-xl font-bold text-white">Submission Received</h2>
        <p className="text-sm text-gray-400">
          Your agent <span className="text-[#a855f7] font-medium">{form.name}</span> has been submitted for review by the ASOSINT safety team.
          You'll receive an email at <span className="text-[#00d4ff]">{form.contact_email}</span> within 3–5 business days.
        </p>
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4 text-left space-y-2 text-[11px] text-gray-500">
          <p className="font-bold text-white text-xs mb-2">Review Process</p>
          {["Safety & safety checklist audit", "Code/endpoint review (sandboxed)", "Human evaluation of sample runs", "Listing approval & tier assignment"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#a855f7] font-bold">{i + 1}.</span> {s}
            </div>
          ))}
        </div>
        <Button onClick={() => { setSubmitted(false); setStep(0); setForm({ name: "", vendor: "", category: "", min_tier: "pro", description: "", capabilities: "", endpoint_url: "", auth_type: "api_key", contact_email: "", tags: "", icon: "🤖" }); setSafety({}); }}
          variant="ghost" className="text-gray-500 hover:text-white text-xs">
          Submit another agent
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-5 h-5 text-[#a855f7]" />
          <h2 className="text-base font-bold text-white">Publish an AI Agent</h2>
          <Badge className="text-[9px] bg-[#ffa502]/10 text-[#ffa502] border border-[#ffa502]/20">VENDOR PORTAL</Badge>
        </div>
        <p className="text-xs text-gray-500">List your specialized intelligence agent in the ASOSINT marketplace. All agents undergo mandatory safety review before publication.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              i === step ? "bg-[#a855f7]/20 text-[#a855f7]" : i < step ? "text-[#2ed573]" : "text-gray-600"
            }`}>
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold" style={{ borderColor: i === step ? "#a855f7" : "#374151" }}>{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/5" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Profile */}
      {step === 0 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Agent Profile</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Agent Name *</label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. DarkWeb Crawler Pro"
                className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Vendor / Company *</label>
              <Input value={form.vendor} onChange={e => update("vendor", e.target.value)} placeholder="e.g. CipherTrace Intel"
                className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Category *</label>
              <select value={form.category} onChange={e => update("category", e.target.value)}
                className="w-full h-8 bg-black/30 border border-white/10 rounded-md text-sm text-white px-2">
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Minimum Tier *</label>
              <select value={form.min_tier} onChange={e => update("min_tier", e.target.value)}
                className="w-full h-8 bg-black/30 border border-white/10 rounded-md text-sm text-white px-2">
                {MIN_TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Description *</label>
            <textarea value={form.description} onChange={e => update("description", e.target.value)}
              placeholder="What does this agent do? Be specific about data sources and methodologies..."
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-md text-sm text-white p-2 placeholder:text-gray-700 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Icon (emoji)</label>
              <Input value={form.icon} onChange={e => update("icon", e.target.value)} placeholder="🤖"
                className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Tags (comma separated)</label>
              <Input value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="OSINT, Dark Web, Real-time"
                className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Contact Email *</label>
            <Input value={form.contact_email} onChange={e => update("contact_email", e.target.value)} placeholder="dev@yourcompany.com" type="email"
              className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700" />
          </div>
        </div>
      )}

      {/* Step 1: Capabilities & Integration */}
      {step === 1 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Capabilities & Integration</p>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Capabilities (one per line) *</label>
            <textarea value={form.capabilities} onChange={e => update("capabilities", e.target.value)}
              placeholder={"Actor attribution\nTTP mapping\nInfrastructure tracking"}
              rows={5}
              className="w-full bg-black/30 border border-white/10 rounded-md text-sm text-white p-2 placeholder:text-gray-700 resize-none font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Agent API Endpoint *</label>
            <Input value={form.endpoint_url} onChange={e => update("endpoint_url", e.target.value)}
              placeholder="https://api.yourservice.com/agent/v1"
              className="h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700 font-mono" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-2 block">Authentication Type</label>
            <div className="flex gap-2">
              {["api_key", "oauth2", "mtls"].map(auth => (
                <button key={auth} onClick={() => update("auth_type", auth)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium uppercase transition-colors ${
                    form.auth_type === auth
                      ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30"
                      : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
                  }`}>{auth}</button>
              ))}
            </div>
          </div>
          <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Code className="w-3.5 h-3.5 text-[#00d4ff]" />
              <p className="text-[10px] font-bold text-[#00d4ff]">Integration Notes</p>
            </div>
            <p className="text-[10px] text-gray-500">ASOSINT will proxy all requests through its secure gateway. Your endpoint will receive sanitized, RBAC-filtered payloads. See vendor SDK docs for the full spec.</p>
          </div>
        </div>
      )}

      {/* Step 2: Safety Review */}
      {step === 2 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#2ed573]" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Mandatory Safety Attestation</p>
          </div>
          <div className="bg-[#ff4757]/5 border border-[#ff4757]/10 rounded-lg p-3 text-[10px] text-gray-500">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff4757] inline mr-1.5" />
            All boxes must be checked to proceed. False attestations may result in permanent vendor ban.
          </div>
          <div className="space-y-3">
            {SAFETY_CHECKLIST.map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                <div onClick={() => setSafety(p => ({ ...p, [item.id]: !p[item.id] }))}
                  className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                    safety[item.id] ? "bg-[#2ed573] border-[#2ed573]" : "border-white/20 bg-transparent"
                  }`}>
                  {safety[item.id] && <CheckCircle2 className="w-3 h-3 text-black" />}
                </div>
                <span className={`text-xs leading-relaxed transition-colors ${safety[item.id] ? "text-gray-300" : "text-gray-600"}`}>{item.label}</span>
              </label>
            ))}
          </div>
          {allSafetyChecked && (
            <div className="bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
              <p className="text-[11px] text-[#2ed573] font-medium">Safety attestation complete. Ready to submit.</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Submission Summary</p>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{form.icon}</span>
            <div>
              <p className="text-base font-bold text-white">{form.name || "Unnamed Agent"}</p>
              <p className="text-xs text-gray-500">by {form.vendor || "Unknown vendor"}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/20 font-bold">{form.category}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 font-bold">{form.min_tier.toUpperCase()}+</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400">{form.description}</p>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-gray-600 mb-1">Endpoint</p>
              <p className="text-gray-400 font-mono truncate">{form.endpoint_url || "—"}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-gray-600 mb-1">Auth</p>
              <p className="text-gray-400 uppercase font-mono">{form.auth_type}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-gray-600 mb-1">Contact</p>
              <p className="text-gray-400 truncate">{form.contact_email || "—"}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <p className="text-gray-600 mb-1">Safety Checks</p>
              <p className="text-[#2ed573] font-bold">{Object.values(safety).filter(Boolean).length}/{SAFETY_CHECKLIST.length} passed</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(s => s - 1)}
            className="text-gray-500 hover:text-white border border-white/5 hover:border-white/10 h-9">
            ← Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && (!form.name || !form.vendor || !form.category || !form.description || !form.contact_email)}
            className="flex-1 h-9 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 hover:bg-[#a855f7]/30 text-sm font-medium">
            Next →
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!allSafetyChecked || loading}
            className="flex-1 h-9 bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/30 hover:bg-[#2ed573]/30 text-sm font-medium gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Upload className="w-4 h-4" /> Submit for Review</>}
          </Button>
        )}
      </div>
    </div>
  );
}