import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, CheckCircle2, Loader2, X, Tag, FileText } from "lucide-react";

const SEV_COLOR = { critical: "#ff4757", high: "#ff6b35", medium: "#ffa502", low: "#2ed573", informational: "#6b7280" };
const STATUS_BADGE = { open: "bg-blue-500/20 text-blue-300", confirmed: "bg-green-500/20 text-green-300", disputed: "bg-yellow-500/20 text-yellow-300", resolved: "bg-gray-500/20 text-gray-400" };
const FINDING_TYPES = ["indicator", "vulnerability", "actor", "ttp", "evidence", "note"];

export default function WarRoomFindings({ room, user }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", severity: "medium", finding_type: "note", indicators: "" });

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ["war_room_findings", room.id],
    queryFn: () => base44.entities.WarRoomFinding.filter({ war_room_id: room.id }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.WarRoomFinding.create({
      war_room_id: room.id,
      submitted_by: user.email,
      title: form.title,
      content: form.content,
      severity: form.severity,
      finding_type: form.finding_type,
      indicators: form.indicators ? form.indicators.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "open",
    }),
    onSuccess: () => {
      qc.invalidateQueries(["war_room_findings", room.id]);
      setShowForm(false);
      setForm({ title: "", content: "", severity: "medium", finding_type: "note", indicators: "" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.WarRoomFinding.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["war_room_findings", room.id]),
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#a855f7]" /> Shared Findings
        </h3>
        <Button onClick={() => setShowForm(!showForm)} className="h-7 text-xs bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/30 gap-1">
          <Plus className="w-3 h-3" /> Add Finding
        </Button>
      </div>

      {showForm && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-300">New Finding</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
          <Input placeholder="Finding title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-xs" />
          <Textarea placeholder="Detailed notes, context, or annotation…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-xs min-h-[70px] resize-none" />
          <Input placeholder="IOC values (comma-separated, optional)" value={form.indicators} onChange={e => setForm({ ...form, indicators: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-xs" />
          <div className="flex gap-2">
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
              {Object.keys(SEV_COLOR).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.finding_type} onChange={e => setForm({ ...form, finding_type: e.target.value })}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
              {FINDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!form.title.trim() || createMutation.isPending}
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs h-8 gap-1">
            {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Save Finding
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#a855f7]" /></div>
      ) : findings.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-xs">No findings yet. Add the first one.</div>
      ) : (
        <div className="space-y-2">
          {findings.map(f => (
            <div key={f.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-white">{f.title}</span>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: SEV_COLOR[f.severity], background: `${SEV_COLOR[f.severity]}15` }}>{f.severity}</span>
                    <span className="text-[9px] text-gray-500 font-medium uppercase">{f.finding_type}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${STATUS_BADGE[f.status]}`}>{f.status}</span>
                  </div>
                </div>
                <select
                  value={f.status}
                  onChange={e => updateStatus.mutate({ id: f.id, status: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 px-1.5 py-1 shrink-0"
                >
                  <option value="open">Open</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="disputed">Disputed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{f.content}</p>
              {f.indicators?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {f.indicators.map((ioc, i) => (
                    <code key={i} className="text-[10px] bg-[#00d4ff]/10 text-[#00d4ff] px-1.5 py-0.5 rounded font-mono">{ioc}</code>
                  ))}
                </div>
              )}
              <p className="text-[9px] text-gray-600">by {f.submitted_by} · {new Date(f.created_date).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}