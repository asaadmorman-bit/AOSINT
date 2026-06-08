import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Skull, Globe2, Loader2, Brain, Zap, Trash2, AlertTriangle } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";

const ACTOR_TYPES = ["nation_state", "criminal", "hacktivist", "insider", "hybrid", "unknown"];
const ACTOR_TYPE_COLORS = {
  nation_state: "#f59e0b", criminal: "#ff4757", hacktivist: "#00d4ff",
  insider: "#a855f7", hybrid: "#ff6b35", unknown: "#6b7280"
};

export default function ThreatActors() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [enriching, setEnriching] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ name: "", actor_type: "unknown", attributed_country: "", target_sectors: "", target_regions: "", notes: "" });
  const queryClient = useQueryClient();

  const { data: actors = [], isLoading } = useQuery({
    queryKey: ["threat_actors"],
    queryFn: () => base44.entities.ThreatActor.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThreatActor.create({
      ...data,
      target_sectors: data.target_sectors ? data.target_sectors.split(",").map(s => s.trim()).filter(Boolean) : [],
      target_regions: data.target_regions ? data.target_regions.split(",").map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["threat_actors"] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ThreatActor.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["threat_actors"] }); setSelected(null); },
  });

  const enrichActor = async (actor) => {
    setEnriching(actor.id);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a threat intelligence analyst. Provide a comprehensive OSINT profile for threat actor: "${actor.name}" (type: ${actor.actor_type}, country: ${actor.attributed_country || "unknown"}).

Include:
1. Convergence score (0-100): how much this actor bridges state/criminal/influence domains
2. Fragmentation index: how much this actor exploits geopolitical fragmentation
3. Warning time median in hours
4. Shared TTPs, infrastructure patterns
5. Narrative alignment with state interests
6. Associated campaigns and known aliases
7. Target sectors and regions
8. MITRE ATT&CK group mappings if applicable`,
        model: "gemini_3_flash",
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            convergence_score: { type: "number" },
            fragmentation_index: { type: "number" },
            warning_time_median_hrs: { type: "number" },
            shared_ttps: { type: "array", items: { type: "string" } },
            narrative_alignment: { type: "string" },
            associated_campaigns: { type: "array", items: { type: "string" } },
            aliases: { type: "array", items: { type: "string" } },
            mitre_groups: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          }
        }
      });
      await base44.entities.ThreatActor.update(actor.id, result);
      queryClient.invalidateQueries({ queryKey: ["threat_actors"] });
    } catch (err) {
      console.error("Enrich failed:", err?.response?.data || err.message);
    } finally {
      setEnriching(null);
    }
  };

  const filtered = filterType === "all" ? actors : actors.filter(a => a.actor_type === filterType);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Track and profile threat actors — convergence scoring, warning time, campaign links</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Add Actor
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === "all" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>All</button>
        {ACTOR_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize`}
            style={filterType === t ? { background: `${ACTOR_TYPE_COLORS[t]}20`, color: ACTOR_TYPE_COLORS[t], border: `1px solid ${ACTOR_TYPE_COLORS[t]}30` } : { color: "#6b7280" }}>
            {t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading actors...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <Skull className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No threat actors tracked yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(actor => {
            const typeColor = ACTOR_TYPE_COLORS[actor.actor_type] || "#6b7280";
            return (
              <div key={actor.id} className={`bg-[#111827] border rounded-xl p-5 hover:border-white/10 transition-all cursor-pointer group ${selected?.id === actor.id ? "border-[#00d4ff]/30" : "border-white/5"}`}
                onClick={() => setSelected(selected?.id === actor.id ? null : actor)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{actor.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: `${typeColor}20`, color: typeColor }}>{actor.actor_type?.replace(/_/g, " ")}</span>
                      {actor.attributed_country && <span className="text-[11px] text-gray-500 flex items-center gap-1"><Globe2 className="w-2.5 h-2.5" />{actor.attributed_country}</span>}
                    </div>
                  </div>
                  <StatusDot status={actor.status} showLabel={false} />
                </div>

                {/* Convergence Score */}
                {actor.convergence_score != null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Convergence Score</span>
                      <span className="font-bold" style={{ color: actor.convergence_score >= 70 ? "#ff4757" : actor.convergence_score >= 40 ? "#ffa502" : "#2ed573" }}>{actor.convergence_score}/100</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${actor.convergence_score}%`, background: actor.convergence_score >= 70 ? "#ff4757" : actor.convergence_score >= 40 ? "#ffa502" : "#2ed573" }} />
                    </div>
                  </div>
                )}

                {actor.warning_time_median_hrs && (
                  <div className="text-xs text-gray-500 mb-3">
                    <Zap className="w-3 h-3 inline mr-1 text-[#ffa502]" />
                    Warning time: <span className="text-[#ffa502] font-semibold">{actor.warning_time_median_hrs}hr median</span>
                  </div>
                )}

                {actor.target_sectors?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {actor.target_sectors.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[#00d4ff] hover:bg-[#00d4ff]/10"
                    onClick={e => { e.stopPropagation(); enrichActor(actor); }}
                    disabled={enriching === actor.id}>
                    {enriching === actor.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    {enriching === actor.id ? "Enriching..." : "AI Enrich"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-400 hover:bg-red-500/10"
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(actor.id); }}>
                    <Trash2 className="w-3 h-3" /> Remove
                  </Button>
                </div>

                {/* Expanded detail */}
                {selected?.id === actor.id && actor.narrative_alignment && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Narrative Alignment</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{actor.narrative_alignment}</p>
                    {actor.mitre_groups?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">MITRE Groups</p>
                        <div className="flex flex-wrap gap-1">{actor.mitre_groups.map((g, i) => <span key={i} className="text-[9px] bg-[#ffa502]/10 text-[#ffa502] px-2 py-0.5 rounded border border-[#ffa502]/20">{g}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Skull className="w-4 h-4 text-red-400" />Add Threat Actor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Actor Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. APT29, Lazarus Group" />
              </div>
              <div>
                <Label className="text-gray-400">Actor Type</Label>
                <Select value={form.actor_type} onValueChange={v => setForm({ ...form, actor_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Attributed Country</Label>
              <Input value={form.attributed_country} onChange={e => setForm({ ...form, attributed_country: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Russia, China, North Korea" />
            </div>
            <div>
              <Label className="text-gray-400">Target Sectors (comma-separated)</Label>
              <Input value={form.target_sectors} onChange={e => setForm({ ...form, target_sectors: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. energy, healthcare, defense" />
            </div>
            <div>
              <Label className="text-gray-400">Target Regions (comma-separated)</Label>
              <Input value={form.target_regions} onChange={e => setForm({ ...form, target_regions: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Europe, North America" />
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {createMutation.isPending ? "Adding..." : "Add Actor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}