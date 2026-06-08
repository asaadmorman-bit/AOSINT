import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEV_STYLE = {
  low: "border-green-500/20 bg-green-900/10 text-green-400",
  medium: "border-yellow-500/20 bg-yellow-900/10 text-yellow-400",
  high: "border-orange-500/20 bg-orange-900/10 text-orange-400",
  critical: "border-red-500/20 bg-red-900/10 text-red-400",
};

export default function AlertsDashboard() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", alert_type: "credential_leak", severity: "medium" });

  const { data: alerts = [], isLoading } = useQuery({ queryKey: ["osint_alerts"], queryFn: () => base44.entities.OsintAlert.list("-created_date", 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OsintAlert.create({ ...data, status: "new", triggered_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(["osint_alerts"]); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OsintAlert.update(id, data),
    onSuccess: () => qc.invalidateQueries(["osint_alerts"])
  });

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter || a.status === filter);

  return (
    <div className="space-y-5 mt-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1">
          {["all","critical","high","medium","low","new","resolved"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filter === f ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Alert
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">Create Alert</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full" placeholder="Alert title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.alert_type} onChange={e => setForm({ ...form, alert_type: e.target.value })}>
              {["credential_leak","domain_compromise","ip_reputation","threat_actor_mention","correlation_cluster","repeated_breach","suspicious_activity","new_indicator"].map(v => <option key={v} value={v}>{v.replace(/_/g," ")}</option>)}
            </select>
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {["low","medium","high","critical"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <textarea className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full h-16 resize-none" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400 text-sm">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="bg-[#00d4ff] text-black font-bold text-sm">Create Alert</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? <p className="text-sm text-gray-600 text-center py-8">Loading...</p> :
          filtered.length === 0 ? <p className="text-sm text-gray-600 text-center py-8">No alerts match this filter.</p> :
          filtered.map(a => (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${SEV_STYLE[a.severity]}`}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-200">{a.title}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${SEV_STYLE[a.severity]}`}>{a.severity?.toUpperCase()}</span>
                </div>
                {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-gray-600">{a.alert_type?.replace(/_/g," ")}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{a.status}</span>
                  {a.status === "new" && (
                    <button onClick={() => updateMutation.mutate({ id: a.id, data: { status: "acknowledged", acknowledged_at: new Date().toISOString() } })}
                      className="text-[10px] text-[#00d4ff] hover:underline">Acknowledge</button>
                  )}
                  {a.status !== "resolved" && (
                    <button onClick={() => updateMutation.mutate({ id: a.id, data: { status: "resolved", resolved_at: new Date().toISOString() } })}
                      className="text-[10px] text-[#2ed573] hover:underline">Resolve</button>
                  )}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}