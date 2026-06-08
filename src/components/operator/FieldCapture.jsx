import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, MapPin, Loader2 } from "lucide-react";

const PRIORITY_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };
const TYPE_LABELS = {
  observation: "Observation", incident: "Incident", surveillance: "Surveillance",
  asset_check: "Asset Check", route_assessment: "Route", intelligence_note: "Intel Note"
};

export default function FieldCapture({ fieldReports, userTier }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", report_type: "observation", priority: "medium", location: "" });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FieldReport.create({ ...data, status: "submitted", submitted_at: new Date().toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["op_field_reports"] }); setShowForm(false); setForm({ title: "", body: "", report_type: "observation", priority: "medium", location: "" }); },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">{fieldReports.length} field reports</span>
        <Button size="sm" onClick={() => setShowForm(!showForm)}
          className="h-7 text-xs bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/20 gap-1.5">
          <Plus className="w-3 h-3" /> New Report
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#0d1117] border border-[#2ed573]/15 rounded-xl p-4 space-y-3">
          <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Report title..." className="h-8 bg-black/30 border-white/10 text-sm text-white" />
          <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            placeholder="Field observations, incident details, intelligence notes..."
            className="w-full h-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 resize-none focus:outline-none focus:border-[#2ed573]/30" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.report_type} onChange={e => setForm(p => ({ ...p, report_type: e.target.value }))}
              className="h-8 bg-black/30 border border-white/10 rounded-lg px-2 text-xs text-gray-400 focus:outline-none">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              className="h-8 bg-black/30 border border-white/10 rounded-lg px-2 text-xs text-gray-400 focus:outline-none">
              {["critical", "high", "medium", "low"].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
            </select>
          </div>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-700" />
            <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="Location (optional)..." className="h-8 pl-8 bg-black/30 border-white/10 text-sm text-white" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs text-gray-500">Cancel</Button>
            <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}
              className="h-7 text-xs bg-[#2ed573]/15 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/25 gap-1.5">
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Submit
            </Button>
          </div>
        </div>
      )}

      {fieldReports.length === 0 && !showForm && (
        <div className="text-center py-12">
          <FileText className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No field reports submitted</p>
        </div>
      )}

      {fieldReports.map((r, i) => {
        const color = PRIORITY_COLORS[r.priority] || "#6b7280";
        return (
          <div key={r.id || i} className="p-3 bg-[#0d1117] border border-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: `${color}15`, color }}>{r.priority?.toUpperCase()}</span>
                <span className="text-[9px] text-gray-600">{TYPE_LABELS[r.report_type] || r.report_type}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.status === "submitted" ? "bg-[#ffa502]/10 text-[#ffa502]" : "bg-white/5 text-gray-500"}`}>{r.status}</span>
            </div>
            <p className="text-xs font-medium text-white">{r.title}</p>
            {r.location && <p className="text-[9px] text-gray-600 flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" />{r.location}</p>}
          </div>
        );
      })}
    </div>
  );
}