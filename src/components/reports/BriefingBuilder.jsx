import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Download, Shield, Loader2, Check,
  ChevronDown, ChevronRight, Sword, Search, BarChart3
} from "lucide-react";

const TEMPLATES = [
  { id: "full_briefing", label: "Full Security Briefing", desc: "All sections: findings, indicators, timeline, recommendations", icon: Shield },
  { id: "executive_summary", label: "Executive Summary", desc: "High-level risk overview for C-suite / leadership", icon: BarChart3 },
  { id: "war_room_debrief", label: "War Room Debrief", desc: "Chat log, findings, and annotated IOCs from a War Room", icon: Sword },
  { id: "investigation_report", label: "Investigation Report", desc: "Detailed timeline and analyst notes from an investigation", icon: Search },
];

const CLASSIFICATIONS = ["unclassified", "sensitive", "confidential", "restricted"];

export default function BriefingBuilder() {
  const [form, setForm] = useState({
    template: "full_briefing",
    customTitle: "",
    classification: "sensitive",
    audience: "Executive / Senior Leadership",
    warRoomId: "",
    investigationId: "",
    reportId: "",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const { data: warRooms = [] } = useQuery({
    queryKey: ["war_rooms_select"],
    queryFn: () => base44.entities.WarRoom.list("-created_date", 30),
  });
  const { data: investigations = [] } = useQuery({
    queryKey: ["investigations_select"],
    queryFn: () => base44.entities.OsintInvestigation.list("-created_date", 30),
  });
  const { data: intelReports = [] } = useQuery({
    queryKey: ["intel_reports_select"],
    queryFn: () => base44.entities.IntelligenceReport.list("-created_date", 30),
  });

  const generate = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const resp = await base44.functions.invoke("generateSecurityBriefing", {
        template: form.template,
        customTitle: form.customTitle || undefined,
        classification: form.classification,
        audience: form.audience,
        warRoomId: form.warRoomId || undefined,
        investigationId: form.investigationId || undefined,
        reportId: form.reportId || undefined,
      });

      // resp.data is already a blob / arraybuffer from axios
      const blob = new Blob([resp.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (form.customTitle || "ASOSINT_Briefing").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50);
      a.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || err.message || "Export failed");
      setStatus("error");
    }
  };

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: config */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00d4ff]" /> Briefing Configuration
          </h2>
          <p className="text-xs text-gray-500">Compose a professional PDF briefing from your intelligence data.</p>
        </div>

        {/* Template picker */}
        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Template</Label>
          <div className="space-y-1.5">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setForm({ ...form, template: t.id })}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${form.template === t.id ? "bg-[#00d4ff]/10 border-[#00d4ff]/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}
              >
                <t.icon className={`w-4 h-4 mt-0.5 shrink-0 ${form.template === t.id ? "text-[#00d4ff]" : "text-gray-500"}`} />
                <div>
                  <p className={`text-xs font-bold ${form.template === t.id ? "text-[#00d4ff]" : "text-white"}`}>{t.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                </div>
                {form.template === t.id && <Check className="w-3.5 h-3.5 text-[#00d4ff] ml-auto mt-0.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Custom Title (optional)</Label>
          <Input value={form.customTitle} onChange={e => setForm({ ...form, customTitle: e.target.value })}
            placeholder="e.g. Q1 2026 Threat Landscape Briefing"
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm" />
        </div>

        {/* Classification */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Classification</Label>
          <div className="flex gap-1.5 flex-wrap">
            {CLASSIFICATIONS.map(c => (
              <button key={c} onClick={() => setForm({ ...form, classification: c })}
                className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase transition-all ${form.classification === c ? "bg-[#ffa502]/20 border-[#ffa502]/40 text-[#ffa502]" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Audience</Label>
          <Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm" />
        </div>

        {/* Data sources */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase text-gray-500 tracking-wider">Data Sources (optional)</Label>

          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-medium">War Room</p>
            <select value={form.warRoomId} onChange={e => setForm({ ...form, warRoomId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
              <option value="">None</option>
              {warRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-medium">Investigation</p>
            <select value={form.investigationId} onChange={e => setForm({ ...form, investigationId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
              <option value="">None</option>
              {investigations.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-medium">Intelligence Report</p>
            <select value={form.reportId} onChange={e => setForm({ ...form, reportId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white">
              <option value="">None</option>
              {intelReports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <Button onClick={generate} disabled={status === "loading"}
          className="w-full bg-[#00d4ff] text-black hover:bg-[#00bfe6] font-bold gap-2 h-11">
          {status === "loading"
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            : status === "done"
            ? <><Check className="w-4 h-4" /> Downloaded!</>
            : <><Download className="w-4 h-4" /> Export PDF Briefing</>
          }
        </Button>
        {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
      </div>

      {/* Right: preview card */}
      <div className="lg:col-span-3">
        <div className="bg-[#0d1220] border border-white/5 rounded-2xl overflow-hidden h-full">
          {/* Mock cover page */}
          <div className="bg-gradient-to-b from-[#0a0e1a] to-[#0d1220] p-8 border-b border-white/5 space-y-4">
            <div className="h-1 w-full rounded bg-gradient-to-r from-[#00d4ff] to-[#a855f7]" />
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#00d4ff] tracking-widest">ASOSINT · EMERGING DEFENSE SOLUTIONS</p>
              <h3 className="text-lg font-black text-white leading-tight">
                {form.customTitle || "Security Intelligence Briefing"}
              </h3>
              <p className="text-xs text-gray-400">{selectedTemplate?.label}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Classification</p>
                <p className="text-white font-bold uppercase">{form.classification}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Audience</p>
                <p className="text-white font-bold truncate">{form.audience}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Date</p>
                <p className="text-white font-bold">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Reference</p>
                <p className="text-[#00d4ff] font-mono text-[10px]">ASOSINT-{Date.now().toString(36).toUpperCase().slice(-6)}</p>
              </div>
            </div>
            <div className="h-0.5 w-full rounded bg-gradient-to-r from-[#00d4ff] to-transparent" />
          </div>

          {/* Sections preview */}
          <div className="p-5 space-y-3">
            <p className="text-[9px] uppercase text-gray-600 tracking-wider font-bold">Included Sections</p>
            {[
              { label: "01 · Executive Summary / Risk Overview", active: true },
              { label: "02 · War Room Findings", active: !!form.warRoomId },
              { label: "03 · Intelligence Layers (OSINT · SIGINT · HUMINT)", active: !!form.reportId },
              { label: "04 · Key Findings & Recommended Actions", active: !!form.reportId },
              { label: "05 · Investigation Timeline", active: !!form.investigationId },
              { label: "06 · Threat Indicator Snapshot", active: true },
              { label: "07 · War Room Activity Log", active: !!form.warRoomId && form.template !== "executive_summary" },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-2 ${s.active ? "" : "opacity-30"}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.active ? "bg-[#2ed573]" : "bg-gray-600"}`} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}