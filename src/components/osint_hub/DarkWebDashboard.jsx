import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, AlertTriangle, CheckCircle2, Clock, RefreshCw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEVERITY_STYLE = {
  low: "bg-green-900/30 text-green-400 border-green-500/20",
  medium: "bg-yellow-900/30 text-yellow-400 border-yellow-500/20",
  high: "bg-orange-900/30 text-orange-400 border-orange-500/20",
  critical: "bg-red-900/30 text-red-400 border-red-500/20",
};

const STATUS_ICON = { new: AlertTriangle, investigating: RefreshCw, confirmed: CheckCircle2, false_positive: CheckCircle2, resolved: CheckCircle2 };

export default function DarkWebDashboard() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all"); // all, persons, entities, professions
  const [form, setForm] = useState({ 
    title: "", 
    source_platform: "paste_site", 
    severity: "medium", 
    affected_emails: "", 
    affected_domains: "", 
    affected_persons: "",
    affected_entities: "",
    affected_professions: "",
    raw_excerpt: "", 
    threat_actor: "", 
    record_count: "",
    intelligence_types: ["osint"] // osint, sigint, humint, geoint, techint
  });

  const { data: leaks = [], isLoading } = useQuery({ queryKey: ["leaks"], queryFn: () => base44.entities.LeakIntelligence.list("-created_date", 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeakIntelligence.create(data),
    onSuccess: () => { 
      qc.invalidateQueries(["leaks"]); 
      setShowForm(false); 
      setForm({ 
        title: "", 
        source_platform: "paste_site", 
        severity: "medium", 
        affected_emails: "", 
        affected_domains: "", 
        affected_persons: "",
        affected_entities: "",
        affected_professions: "",
        raw_excerpt: "", 
        threat_actor: "", 
        record_count: "",
        intelligence_types: ["osint"]
      }); 
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeakIntelligence.update(id, data),
    onSuccess: () => qc.invalidateQueries(["leaks"])
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      affected_emails: form.affected_emails ? form.affected_emails.split(",").map(s => s.trim()) : [],
      affected_domains: form.affected_domains ? form.affected_domains.split(",").map(s => s.trim()) : [],
      affected_persons: form.affected_persons ? form.affected_persons.split(",").map(s => s.trim()) : [],
      affected_entities: form.affected_entities ? form.affected_entities.split(",").map(s => s.trim()) : [],
      affected_professions: form.affected_professions ? form.affected_professions.split(",").map(s => s.trim()) : [],
      record_count: form.record_count ? parseInt(form.record_count) : 0,
      severity_score: form.severity === "critical" ? 95 : form.severity === "high" ? 75 : form.severity === "medium" ? 50 : 25,
      compromise_likelihood: form.severity === "critical" ? 90 : form.severity === "high" ? 70 : 40,
      tags: form.intelligence_types,
    });
  };

  const analyzeWithAI = async (leak) => {
    setGenerating(true);
    setAiAnalysis("");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this dark web leak finding for the ASOSINT platform. Provide a concise threat assessment (under 250 words):
Title: ${leak.title}
Platform: ${leak.source_platform}
Severity: ${leak.severity}
Intelligence Types: ${leak.tags?.join(", ") || "OSINT"}
Affected emails: ${leak.affected_emails?.join(", ") || "unknown"}
Affected domains: ${leak.affected_domains?.join(", ") || "unknown"}
Affected persons: ${leak.affected_persons?.join(", ") || "none"}
Affected entities: ${leak.affected_entities?.join(", ") || "none"}
Affected professions: ${leak.affected_professions?.join(", ") || "none"}
Records: ${leak.record_count || "unknown"}
Threat actor: ${leak.threat_actor || "unknown"}
Excerpt: ${leak.raw_excerpt || "N/A"}

Provide: (1) Immediate risk assessment across all intelligence disciplines, (2) Who/what is most at risk (by type), (3) Top 3 mitigation actions, (4) Confidence level and data authenticity, (5) Cross-domain threat implications.`
    });
    setAiAnalysis(res);
    setGenerating(false);
  };

  const summaryStats = {
    total: leaks.length,
    critical: leaks.filter(l => l.severity === "critical").length,
    new: leaks.filter(l => l.status === "new").length,
    confirmed: leaks.filter(l => l.status === "confirmed").length,
  };

  return (
    <div className="space-y-5 mt-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Leaks", value: summaryStats.total, color: "text-[#00d4ff]" },
          { label: "Critical", value: summaryStats.critical, color: "text-red-400" },
          { label: "New / Unreviewed", value: summaryStats.new, color: "text-[#ffa502]" },
          { label: "Confirmed", value: summaryStats.confirmed, color: "text-[#2ed573]" },
        ].map(s => (
          <div key={s.label} className="bg-[#0d1220] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {["all", "persons", "entities", "professions"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filterType === type
                  ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                  : "bg-white/5 text-gray-400 hover:text-gray-200"
              }`}
            >
              {type === "all" ? "All Intelligence" : type}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
          <Plus className="w-4 h-4" /> Log Finding
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">New Dark Web Finding</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full" placeholder="Title / breach name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.source_platform} onChange={e => setForm({ ...form, source_platform: e.target.value })}>
              {["tor_forum","paste_site","dark_web_market","leak_site","telegram","i2p","public_breach_db","other"].map(v => <option key={v} value={v}>{v.replace(/_/g," ")}</option>)}
            </select>
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {["low","medium","high","critical"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <div className="col-span-full">
              <label className="text-xs text-gray-400 block mb-1.5">Intelligence Types (Multi-select)</label>
              <div className="flex flex-wrap gap-2">
                {["osint","sigint","humint","geoint","techint"].map(type => (
                  <button
                    key={type}
                    onClick={() => setForm({
                      ...form,
                      intelligence_types: form.intelligence_types.includes(type)
                        ? form.intelligence_types.filter(t => t !== type)
                        : [...form.intelligence_types, type]
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                      form.intelligence_types.includes(type)
                        ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Affected emails (comma-separated)" value={form.affected_emails} onChange={e => setForm({ ...form, affected_emails: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Affected domains (comma-separated)" value={form.affected_domains} onChange={e => setForm({ ...form, affected_domains: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Affected persons (comma-separated)" value={form.affected_persons} onChange={e => setForm({ ...form, affected_persons: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Affected entities/orgs (comma-separated)" value={form.affected_entities} onChange={e => setForm({ ...form, affected_entities: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full" placeholder="Affected professions (comma-separated)" value={form.affected_professions} onChange={e => setForm({ ...form, affected_professions: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Threat actor (optional)" value={form.threat_actor} onChange={e => setForm({ ...form, threat_actor: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" type="number" placeholder="Record count" value={form.record_count} onChange={e => setForm({ ...form, record_count: e.target.value })} />
            <textarea className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full h-20 resize-none" placeholder="Raw excerpt / context" value={form.raw_excerpt} onChange={e => setForm({ ...form, raw_excerpt: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400 text-sm">Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || createMutation.isPending} className="bg-[#00d4ff] text-black font-bold text-sm">Log Finding</Button>
          </div>
        </div>
      )}

      {/* Leaks List */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-bold text-white">Dark Web Intelligence Feed</p>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-600 py-4 text-center">Loading...</p>
        ) : leaks.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No dark web findings logged yet.</p>
        ) : (
          <div className="space-y-2">
            {leaks.map(l => {
              const SIcon = STATUS_ICON[l.status] || AlertTriangle;
              return (
                <div key={l.id} className={`rounded-lg bg-[#111827] border ${selected === l.id ? "border-[#00d4ff]/30" : "border-white/5"} overflow-hidden`}>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setSelected(selected === l.id ? null : l.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <SIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{l.title}</p>
                        <p className="text-[10px] text-gray-500">{l.source_platform?.replace(/_/g," ")} · {l.record_count ? `${l.record_count.toLocaleString()} records` : "unknown count"} · {l.threat_actor || "unknown actor"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${SEVERITY_STYLE[l.severity]}`}>{l.severity?.toUpperCase()}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded bg-white/5 text-gray-500 font-mono`}>{l.status}</span>
                    </div>
                  </button>
                  {selected === l.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      {l.affected_emails?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Emails:</span> {l.affected_emails.join(", ")}</p>}
                      {l.affected_domains?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Domains:</span> {l.affected_domains.join(", ")}</p>}
                      {l.affected_persons?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Persons:</span> {l.affected_persons.join(", ")}</p>}
                      {l.affected_entities?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Entities:</span> {l.affected_entities.join(", ")}</p>}
                      {l.affected_professions?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Professions:</span> {l.affected_professions.join(", ")}</p>}
                      {l.tags?.length > 0 && <p className="text-xs text-gray-400"><span className="font-semibold text-gray-300">Intelligence:</span> {l.tags.map(t => t.toUpperCase()).join(", ")}</p>}
                      {l.raw_excerpt && <p className="text-xs text-gray-500 font-mono bg-black/30 rounded p-2 border border-white/5">{l.raw_excerpt}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        {["investigating","confirmed","resolved"].map(s => (
                          <Button key={s} onClick={() => updateMutation.mutate({ id: l.id, data: { status: s } })} className="text-[10px] px-2 py-1 h-auto bg-white/5 hover:bg-white/10 text-gray-400 capitalize">{s}</Button>
                        ))}
                        <Button onClick={() => analyzeWithAI(l)} disabled={generating} className="text-[10px] px-2 py-1 h-auto bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] gap-1">
                          <Bot className="w-3 h-3" />{generating ? "Analyzing..." : "AI Analysis"}
                        </Button>
                      </div>
                      {aiAnalysis && selected === l.id && (
                        <div className="bg-[#0d1220] border border-[#00d4ff]/15 rounded-lg p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
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