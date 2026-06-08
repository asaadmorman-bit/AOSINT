import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe2, Plus, Eye, Star, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const RISK_COLORS = { low: "text-[#2ed573]", medium: "text-[#ffa502]", high: "text-orange-400", critical: "text-red-400" };
const TYPE_ICONS = { domain: "🌐", ip: "🔌", email: "📧", username: "👤", hash: "#️⃣", organization: "🏢", url: "🔗", phone: "📱" };

export default function EntityMonitorDashboard() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterWatchlist, setFilterWatchlist] = useState(false);
  const [form, setForm] = useState({ entity_type: "domain", indicator_value: "", label: "", risk_level: "low", watchlist: false, notes: "" });

  const { data: entities = [], isLoading } = useQuery({ queryKey: ["osint_entities"], queryFn: () => base44.entities.OsintEntity.list("-created_date", 500) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OsintEntity.create({ ...data, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries(["osint_entities"]); setShowForm(false); setForm({ entity_type: "domain", indicator_value: "", label: "", risk_level: "low", watchlist: false, notes: "" }); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OsintEntity.update(id, data),
    onSuccess: () => qc.invalidateQueries(["osint_entities"])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.OsintEntity.delete(id),
    onSuccess: () => qc.invalidateQueries(["osint_entities"])
  });

  const filtered = entities.filter(e =>
    (filterType === "all" || e.entity_type === filterType) &&
    (!filterWatchlist || e.watchlist)
  );

  const TYPES = ["all", "domain", "ip", "email", "username", "hash", "organization", "url"];

  return (
    <div className="space-y-5 mt-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filterType === t ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>
              {t === "all" ? "All" : `${TYPE_ICONS[t]} ${t}`}
            </button>
          ))}
          <button onClick={() => setFilterWatchlist(!filterWatchlist)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${filterWatchlist ? "bg-yellow-900/30 border-yellow-500/30 text-yellow-400" : "border-white/10 text-gray-500 hover:text-gray-300"}`}>
            ⭐ Watchlist
          </button>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Entity
        </Button>
      </div>

      {showForm && (
        <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">Add Entity to Monitor</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })}>
              {["domain","ip","email","username","hash","organization","url","phone"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Indicator value (e.g. evil.com, 1.2.3.4)" value={form.indicator_value} onChange={e => setForm({ ...form, indicator_value: e.target.value })} />
            <input className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Label (optional)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
            <select className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}>
              {["low","medium","high","critical"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <textarea className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white col-span-full h-16 resize-none" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center gap-2 col-span-full text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={form.watchlist} onChange={e => setForm({ ...form, watchlist: e.target.checked })} className="rounded" />
              Add to watchlist
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400 text-sm">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.indicator_value || createMutation.isPending} className="bg-[#00d4ff] text-black font-bold text-sm">Add Entity</Button>
          </div>
        </div>
      )}

      <div className="bg-[#0d1220] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#00d4ff]" />
          <p className="text-sm font-bold text-white">Monitored Entities ({filtered.length})</p>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-600 py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600 py-8 text-center">No entities yet. Add one above to start monitoring.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                <span className="text-lg shrink-0">{TYPE_ICONS[e.entity_type] || "🔍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-200 truncate">{e.indicator_value}</p>
                  {e.label && <p className="text-[10px] text-gray-500">{e.label}</p>}
                </div>
                <span className={`text-xs font-bold ${RISK_COLORS[e.risk_level]}`}>{e.risk_level}</span>
                <span className="text-[10px] text-gray-600 hidden md:block">{e.entity_type}</span>
                <button onClick={() => updateMutation.mutate({ id: e.id, data: { watchlist: !e.watchlist } })}
                  className={`shrink-0 ${e.watchlist ? "text-yellow-400" : "text-gray-700 hover:text-gray-400"}`}>
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMutation.mutate(e.id)} className="shrink-0 text-gray-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}