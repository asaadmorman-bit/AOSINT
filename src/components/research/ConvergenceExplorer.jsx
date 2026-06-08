import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2, Network, Plus, Search, ChevronRight, ArrowRight } from "lucide-react";
import { meetsMinTier } from "@/components/shared/tierCapabilities";

const CONVERGENCE_COLORS = {
  shared_infrastructure: "#ff4757",
  shared_ttps: "#ffa502",
  narrative_alignment: "#a855f7",
  timing_correlation: "#00d4ff",
  resource_sharing: "#2ed573",
  personnel_overlap: "#f59e0b",
};

const NODE_TYPE_COLORS = {
  actor: "#ff4757", infrastructure: "#ffa502", narrative: "#a855f7",
  campaign: "#00d4ff", sector: "#2ed573", region: "#6b7280",
};

export default function ConvergenceExplorer({ nodes, userTier }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [form, setForm] = useState({ title: "", node_type: "actor", convergence_type: "shared_ttps", domains_involved: "", evidence_summary: "" });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConvergenceNode.create({
      ...data,
      domains_involved: data.domains_involved ? data.domains_involved.split(",").map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convergence_nodes"] });
      setShowCreate(false);
    },
  });

  const analyzeNode = async (node) => {
    setAnalyzing(node.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this convergence node in the context of the 2026 State of Security:

Title: "${node.title}"
Type: ${node.node_type}
Convergence Type: ${node.convergence_type}
Domains: ${node.domains_involved?.join(", ") || "unknown"}
Evidence: ${node.evidence_summary || "none"}

Provide:
1. How global fragmentation is driving this convergence
2. Sector impact assessment
3. Confidence level (0-100) in convergence attribution
4. What other domains may be drawn in
5. Fragmentation driver summary

SAFETY: High-level research analysis only.`,
      response_json_schema: {
        type: "object",
        properties: {
          evidence_summary: { type: "string" },
          fragmentation_driver: { type: "string" },
          sector_impact: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          convergence_score: { type: "number" },
        }
      }
    });

    await base44.entities.ConvergenceNode.update(node.id, {
      evidence_summary: result.evidence_summary || node.evidence_summary,
      fragmentation_driver: result.fragmentation_driver,
      sector_impact: result.sector_impact,
      confidence: result.confidence,
      convergence_score: result.convergence_score,
    });
    queryClient.invalidateQueries({ queryKey: ["convergence_nodes"] });
    setAnalyzing(null);
  };

  const filtered = nodes.filter(n => {
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || n.node_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search convergence nodes..."
              className="pl-9 bg-white/5 border-white/10 text-white h-9 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-36">
              <SelectValue placeholder="Node Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(NODE_TYPE_COLORS).map(k => (
                <SelectItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"
          className="bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20 hover:bg-[#a855f7]/20 gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> Add Node
        </Button>
      </div>

      {/* Convergence type legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CONVERGENCE_COLORS).map(([type, color]) => (
          <span key={type} className="text-[8px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {type.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-10 text-center">
          <Network className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No convergence nodes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(node => {
            const nodeColor = NODE_TYPE_COLORS[node.node_type] || "#6b7280";
            const convColor = CONVERGENCE_COLORS[node.convergence_type] || "#6b7280";
            const isSelected = selected?.id === node.id;

            return (
              <div key={node.id}
                onClick={() => setSelected(isSelected ? null : node)}
                className={`bg-black/20 border rounded-xl p-4 cursor-pointer transition-all hover:border-white/10 ${
                  isSelected ? "border-[#a855f7]/30" : "border-white/5"
                }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${nodeColor}15`, border: `1px solid ${nodeColor}25` }}>
                      <Network className="w-4 h-4" style={{ color: nodeColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{node.title}</p>
                      <span className="text-[8px] font-bold" style={{ color: nodeColor }}>
                        {node.node_type?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-[#a855f7] hover:bg-[#a855f7]/10 px-2"
                    onClick={e => { e.stopPropagation(); analyzeNode(node); }}
                    disabled={analyzing === node.id}>
                    {analyzing === node.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Brain className="w-2.5 h-2.5" />}
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  {node.domains_involved?.map((d, i) => (
                    <React.Fragment key={d}>
                      <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{d}</span>
                      {i < node.domains_involved.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-gray-600" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${convColor}15`, color: convColor }}>
                    {node.convergence_type?.replace(/_/g, " ")}
                  </span>
                  {node.convergence_score != null && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-white/5 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${node.convergence_score}%`, background: convColor }} />
                      </div>
                      <span className="text-[9px] font-bold" style={{ color: convColor }}>{node.convergence_score}%</span>
                    </div>
                  )}
                </div>

                {isSelected && node.fragmentation_driver && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[9px] text-[#a855f7] uppercase tracking-wider mb-1 font-semibold">Fragmentation Driver</p>
                    <p className="text-xs text-gray-400">{node.fragmentation_driver}</p>
                  </div>
                )}
                {isSelected && node.evidence_summary && (
                  <div className="mt-2 bg-black/30 rounded-lg p-2">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">Evidence</p>
                    <p className="text-xs text-gray-300">{node.evidence_summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Network className="w-4 h-4 text-[#a855f7]" />Add Convergence Node</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-gray-500">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">Node Type</Label>
                <Select value={form.node_type} onValueChange={v => setForm({ ...form, node_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(NODE_TYPE_COLORS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Convergence Type</Label>
                <Select value={form.convergence_type} onValueChange={v => setForm({ ...form, convergence_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CONVERGENCE_COLORS).map(k => <SelectItem key={k} value={k}>{k.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Domains Involved (comma-separated)</Label>
              <Input value={form.domains_involved} onChange={e => setForm({ ...form, domains_involved: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="cyber, influence, physical" />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Evidence Summary</Label>
              <Textarea value={form.evidence_summary} onChange={e => setForm({ ...form, evidence_summary: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}
              className="bg-[#a855f7] text-white hover:bg-[#9333ea]">
              {createMutation.isPending ? "Adding..." : "Add Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}