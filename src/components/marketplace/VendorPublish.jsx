import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Code2, Globe2, Shield, Star, Package } from "lucide-react";

const CATEGORIES = ["threat_profiling", "anomaly_detection", "geopolitical", "osint_automation", "malware_analysis", "vulnerability_intel", "incident_response", "compliance"];
const TIERS = ["community", "pro", "enterprise", "gov"];

export default function VendorPublish() {
  const [form, setForm] = useState({
    name: "", description: "", category: "threat_profiling",
    min_tier: "pro", version: "1.0.0", vendor_name: "",
    vendor_url: "", icon: "🤖", capabilities: "",
    api_endpoint: "", documentation_url: "", pricing_model: "free",
    use_cases: "", supported_entity_types: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `Review this AI agent submission for ASOSINT marketplace compliance. Agent: "${form.name}" by ${form.vendor_name}. Description: ${form.description}. Category: ${form.category}. Check for: appropriate use (defensive/intelligence only), no offensive capabilities claims, clear documentation. Return JSON with approved: boolean, notes: string, suggestions: array of strings.`,
        response_json_schema: {
          type: "object",
          properties: {
            approved: { type: "boolean" },
            notes: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } },
          }
        }
      });
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <CheckCircle2 className="w-14 h-14 text-[#2ed573] mx-auto" />
        <h2 className="text-xl font-bold text-white">Agent Submitted for Review</h2>
        <p className="text-gray-400 text-sm">Your agent <strong className="text-white">{form.name}</strong> by <strong className="text-white">{form.vendor_name}</strong> has been submitted. Our team will review it within 3–5 business days. You'll receive an email with the outcome.</p>
        <Button className="bg-[#a855f7] hover:bg-[#a855f7]/80 text-white" onClick={() => { setSubmitted(false); setForm({ name: "", description: "", category: "threat_profiling", min_tier: "pro", version: "1.0.0", vendor_name: "", vendor_url: "", icon: "🤖", capabilities: "", api_endpoint: "", documentation_url: "", pricing_model: "free", use_cases: "", supported_entity_types: "" }); }}>
          Submit Another Agent
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Package className="w-8 h-8 text-[#a855f7] shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Publish an AI Agent</h2>
            <p className="text-sm text-gray-400 leading-relaxed">List your specialized intelligence AI agent on the ASOSINT Marketplace. Agents must be defensive/analytical in nature, well-documented, and comply with our vendor guidelines. Approved agents earn revenue share from Pro/Enterprise subscribers.</p>
          </div>
        </div>
      </div>

      {/* Guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Shield, color: "#2ed573", title: "Defensive Only", desc: "No offensive capabilities, exploit generation, or active attack features." },
          { icon: Code2, color: "#00d4ff", title: "Well Documented", desc: "Clear API docs, use cases, and data handling disclosure required." },
          { icon: Globe2, color: "#a855f7", title: "Revenue Share", desc: "Earn 70% of subscription revenue attributed to your agent." },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-2">
            <Icon className="w-5 h-5" style={{ color }} />
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">Agent Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Agent Name *</label>
            <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. ThreatActor Profiler Pro" required className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Vendor / Company Name *</label>
            <Input value={form.vendor_name} onChange={e => update("vendor_name", e.target.value)} placeholder="e.g. Acme Threat Labs" required className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Category *</label>
            <select value={form.category} onChange={e => update("category", e.target.value)} className="w-full bg-[#0a0e1a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Minimum Tier</label>
            <select value={form.min_tier} onChange={e => update("min_tier", e.target.value)} className="w-full bg-[#0a0e1a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2">
              {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Version</label>
            <Input value={form.version} onChange={e => update("version", e.target.value)} placeholder="1.0.0" className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Icon (Emoji)</label>
            <Input value={form.icon} onChange={e => update("icon", e.target.value)} placeholder="🤖" maxLength={4} className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400 mb-1.5 block">Description * (min 100 chars)</label>
            <textarea value={form.description} onChange={e => update("description", e.target.value)} required minLength={100} rows={3} placeholder="Describe what your agent does, what data it consumes, and what outputs it produces..." className="w-full bg-[#0a0e1a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2 resize-none placeholder-gray-600 focus:outline-none focus:border-[#a855f7]/50" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-400 mb-1.5 block">Key Capabilities (comma-separated)</label>
            <Input value={form.capabilities} onChange={e => update("capabilities", e.target.value)} placeholder="Real-time profiling, MITRE mapping, attribution scoring..." className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">API Endpoint (optional)</label>
            <Input value={form.api_endpoint} onChange={e => update("api_endpoint", e.target.value)} placeholder="https://api.yourvendor.com/v1/agent" className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Documentation URL *</label>
            <Input value={form.documentation_url} onChange={e => update("documentation_url", e.target.value)} placeholder="https://docs.yourvendor.com/agent" required className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Pricing Model</label>
            <select value={form.pricing_model} onChange={e => update("pricing_model", e.target.value)} className="w-full bg-[#0a0e1a] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-2">
              <option value="free">Free / Open Source</option>
              <option value="included">Included in Tier</option>
              <option value="addon">Paid Add-on</option>
              <option value="usage">Usage-Based</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Vendor Website</label>
            <Input value={form.vendor_url} onChange={e => update("vendor_url", e.target.value)} placeholder="https://yourvendor.com" className="bg-white/5 border-white/10 text-white text-sm" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-[#ff4757] shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <p className="text-[10px] text-gray-600">By submitting, you agree to the ASOSINT Vendor Terms and Marketplace Guidelines.</p>
          <Button type="submit" disabled={submitting} className="bg-[#a855f7] hover:bg-[#a855f7]/80 text-white gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Reviewing...</> : <><Upload className="w-4 h-4" /> Submit Agent</>}
          </Button>
        </div>
      </form>
    </div>
  );
}