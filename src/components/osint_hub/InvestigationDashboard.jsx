import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Bot, Clock, CheckCircle2, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import InvestigationAnalysisPanel from "@/components/osint/InvestigationAnalysisPanel";
import { Button } from "@/components/ui/button";

const STATUS_COLORS = {
  pending: "text-gray-400 bg-gray-900/30 border-gray-700",
  running: "text-[#00d4ff] bg-[#00d4ff]/10 border-[#00d4ff]/20",
  completed: "text-[#2ed573] bg-[#2ed573]/10 border-[#2ed573]/20",
  failed: "text-red-400 bg-red-900/30 border-red-500/20",
  archived: "text-gray-600 bg-gray-900/20 border-gray-800",
};

export default function InvestigationDashboard() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ title: "", query: "", investigation_type: "domain", priority: "normal" });

  const { data: investigations = [], isLoading } = useQuery({
    queryKey: ["investigations"],
    queryFn: () => base44.entities.OsintInvestigation.list("-created_date", 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OsintInvestigation.create({ ...data, status: "pending", started_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(["investigations"]); setShowForm(false); setForm({ title: "", query: "", investigation_type: "domain", priority: "normal" }); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OsintInvestigation.update(id, data),
    onSuccess: () => qc.invalidateQueries(["investigations"])
  });

  const runAIInvestigation = async (inv) => {
    setGenerating(true);
    updateMutation.mutate({ id: inv.id, data: { status: "running" } });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert OSINT investigator. Conduct a thorough investigation on this target:
Target: ${inv.query || inv.title}
Type: ${inv.investigation_type}

Provide a structured investigation report including:
1. EXECUTIVE SUMMARY (2-3 sentences)
2. KEY FINDINGS (bullet points with confidence scores)
3. TIMELINE (chronological events if applicable)
4. RISK ASSESSMENT (score 0-100, rationale)
5. RELATED INDICATORS (IPs, domains, emails, usernames that should be investigated further)
6. RECOMMENDED NEXT STEPS (specific, actionable)
7. CONFIDENCE SCORE (overall 0-100)

Keep findings factual and clearly labeled as OSINT-derived intelligence. Note any limitations.`,
      add_context_from_internet: true,
    });
    await base44.entities.OsintInvestigation.update(inv.id, {
      status: "completed",
      findings_summary: res,
      completed_at: new Date().toISOString(),
      risk_score: 50,
      confidence_score: 75,
    });
    qc.invalidateQueries(["investigations"]);
    setGenerating(false);
  };

  return (
    <div className="space-y-5 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Investigation
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">Launch Investigation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full" placeholder="Investigation title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full" placeholder='Query (e.g. "Investigate domain evil.com" or "Profile username h4x0r")' value={form.query} onChange={e => setForm({ ...form, query: e.target.value })} />
            <MobileSelect
              value={form.investigation_type}
              onValueChange={(v) => setForm({ ...form, investigation_type: v })}
              placeholder="Investigation Type"
              options={["domain","ip","email","username","entity","campaign","dark_web","custom"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            />
            <MobileSelect
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
              placeholder="Priority"
              options={["low","normal","high","critical"].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400 text-sm">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="bg-[#00d4ff] text-black font-bold text-sm">Create</Button>
          </div>
        </div>
      )}

      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#00d4ff]" />
          <p className="text-sm font-bold text-white">Investigations ({investigations.length})</p>
        </div>
        {isLoading ? <p className="text-sm text-gray-600 py-4 text-center">Loading...</p> :
          investigations.length === 0 ? <p className="text-sm text-gray-600 py-4 text-center">No investigations yet. Launch one above.</p> :
          <div className="space-y-2">
            {investigations.map(inv => (
              <div key={inv.id} className={`rounded-lg bg-[#111827] border ${selected === inv.id ? "border-[#00d4ff]/30" : "border-white/5"} overflow-hidden`}>
                <button className="w-full flex items-center justify-between px-4 py-3 text-left" onClick={() => setSelected(selected === inv.id ? null : inv.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{inv.title}</p>
                      <p className="text-[10px] text-gray-500">{inv.investigation_type} · {inv.query || "No query"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${STATUS_COLORS[inv.status]}`}>{inv.status?.toUpperCase()}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-600 transition-transform ${selected === inv.id ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {selected === inv.id && (
                   <div className="px-4 pb-4 pt-3 border-t border-white/5 space-y-3">
                     {inv.findings_summary ? (
                       <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                         <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{inv.findings_summary}</p>
                       </div>
                     ) : (
                       <p className="text-xs text-gray-600">No findings yet. Run AI investigation to generate results.</p>
                     )}
                     {inv.recommended_actions?.length > 0 && (
                       <div className="space-y-1">
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Recommended Actions</p>
                         {inv.recommended_actions.map((a, i) => <p key={i} className="text-xs text-gray-300">• {a}</p>)}
                       </div>
                     )}
                     <div className="flex gap-2 flex-wrap mb-3">
                       <Button onClick={() => runAIInvestigation(inv)} disabled={generating || inv.status === "running"} className="text-xs gap-1.5 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20">
                         <Bot className="w-3.5 h-3.5" />{generating ? "Investigating..." : "Run AI Investigation"}
                       </Button>
                       <Button onClick={() => updateMutation.mutate({ id: inv.id, data: { status: "archived" } })} className="text-xs bg-white/5 hover:bg-white/10 text-gray-500">Archive</Button>
                     </div>
                     <InvestigationAnalysisPanel 
                       investigation={inv}
                       onAnalysisUpdate={() => qc.invalidateQueries(["investigations"])}
                     />
                   </div>
                 )}
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}