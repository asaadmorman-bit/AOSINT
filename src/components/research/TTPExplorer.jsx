import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Shield, Search, Plus, ChevronDown, ChevronUp, Tag, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { meetsMinTier } from "@/components/shared/tierCapabilities";

const DOMAIN_COLORS = {
  cyber: "#00d4ff", physical: "#ffa502", influence: "#a855f7", hybrid: "#ff6b35"
};
const PREVALENCE_COLORS = {
  widespread: "#ff4757", targeted: "#ffa502", emerging: "#00d4ff", declining: "#6b7280"
};
const TREND_ICONS = {
  increasing: TrendingUp, stable: Minus, decreasing: TrendingDown, mutating: Brain
};

export default function TTPExplorer({ clusters, userTier }) {
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterPrevalence, setFilterPrevalence] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [form, setForm] = useState({ name: "", domain: "cyber", description: "", target_sectors: "", mitre_tactics: "" });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TTPCluster.create({
      ...data,
      target_sectors: data.target_sectors ? data.target_sectors.split(",").map(s => s.trim()).filter(Boolean) : [],
      mitre_tactics: data.mitre_tactics ? data.mitre_tactics.split(",").map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ttp_clusters"] });
      setShowCreate(false);
      setForm({ name: "", domain: "cyber", description: "", target_sectors: "", mitre_tactics: "" });
    },
  });

  const analyzeCluster = async (cluster) => {
    setAnalyzing(cluster.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior threat intelligence analyst. Provide a safe, high-level, non-sensitive research summary for this TTP cluster.

TTP Cluster: "${cluster.name}"
Domain: ${cluster.domain}
Description: ${cluster.description || "Not specified"}
Target Sectors: ${cluster.target_sectors?.join(", ") || "multiple"}
MITRE Tactics: ${cluster.mitre_tactics?.join(", ") || "unknown"}

Provide:
1. High-level behavior patterns (no operational exploit details)
2. Sector targeting trends and why
3. How global fragmentation (2026 State of Security) is influencing this TTP cluster
4. Evolution trend assessment
5. Convergence score (0-100) with other threat domains
6. Key mitigation considerations at a strategic level

SAFETY: Only include high-level, research-oriented summaries. No exploit instructions, no sensitive operational details.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          evolution_trend: { type: "string" },
          convergence_score: { type: "number" },
          fragmentation_link: { type: "string" },
          prevalence: { type: "string" },
        }
      }
    });

    await base44.entities.TTPCluster.update(cluster.id, {
      summary: result.summary,
      evolution_trend: result.evolution_trend || cluster.evolution_trend,
      convergence_score: result.convergence_score,
      fragmentation_link: result.fragmentation_link,
      prevalence: result.prevalence || cluster.prevalence,
    });
    queryClient.invalidateQueries({ queryKey: ["ttp_clusters"] });
    setAnalyzing(null);
  };

  const filtered = clusters.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = filterDomain === "all" || c.domain === filterDomain;
    const matchPrev = filterPrevalence === "all" || c.prevalence === filterPrevalence;
    return matchSearch && matchDomain && matchPrev;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search TTP clusters..."
              className="pl-9 bg-white/5 border-white/10 text-white h-9 text-sm" />
          </div>
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-36">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="cyber">Cyber</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="influence">Influence</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPrevalence} onValueChange={setFilterPrevalence}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-36">
              <SelectValue placeholder="Prevalence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prevalence</SelectItem>
              <SelectItem value="widespread">Widespread</SelectItem>
              <SelectItem value="targeted">Targeted</SelectItem>
              <SelectItem value="emerging">Emerging</SelectItem>
              <SelectItem value="declining">Declining</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {meetsMinTier(userTier, "pro") && (
          <Button onClick={() => setShowCreate(true)} size="sm"
            className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1.5 h-9">
            <Plus className="w-3.5 h-3.5" /> Add Cluster
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-10 text-center">
          <Shield className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">No TTP clusters yet</p>
          <p className="text-gray-600 text-xs">Add TTP clusters to begin researching behavior patterns</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(cluster => {
            const domainColor = DOMAIN_COLORS[cluster.domain] || "#6b7280";
            const prevColor = PREVALENCE_COLORS[cluster.prevalence] || "#6b7280";
            const TrendIcon = TREND_ICONS[cluster.evolution_trend] || Minus;
            const isExpanded = expanded === cluster.id;

            return (
              <div key={cluster.id}
                className="bg-black/20 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : cluster.id)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${domainColor}15`, border: `1px solid ${domainColor}25` }}>
                    <Shield className="w-4 h-4" style={{ color: domainColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${domainColor}20`, color: domainColor }}>
                        {cluster.domain?.toUpperCase()}
                      </span>
                      {cluster.prevalence && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${prevColor}20`, color: prevColor }}>
                          {cluster.prevalence}
                        </span>
                      )}
                      {cluster.evolution_trend && (
                        <span className="text-[9px] text-gray-400 flex items-center gap-1">
                          <TrendIcon className="w-2.5 h-2.5" />{cluster.evolution_trend}
                        </span>
                      )}
                      {cluster.convergence_score != null && (
                        <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded">
                          Conv: {cluster.convergence_score}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{cluster.name}</p>
                    {cluster.description && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cluster.description}</p>
                    )}
                    {cluster.target_sectors?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Tag className="w-2.5 h-2.5 text-gray-600" />
                        <span className="text-[9px] text-gray-500">{cluster.target_sectors.slice(0, 3).join(" · ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[#00d4ff] hover:bg-[#00d4ff]/10"
                      onClick={e => { e.stopPropagation(); analyzeCluster(cluster); }}
                      disabled={analyzing === cluster.id}>
                      {analyzing === cluster.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                      Analyze
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
                    {cluster.description && (
                      <p className="text-xs text-gray-300 leading-relaxed">{cluster.description}</p>
                    )}
                    {cluster.summary && (
                      <div className="bg-black/30 rounded-lg p-3">
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">AI Analysis</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{cluster.summary}</p>
                      </div>
                    )}
                    {cluster.fragmentation_link && (
                      <div className="bg-[#a855f7]/5 border border-[#a855f7]/15 rounded-lg p-3">
                        <p className="text-[9px] text-[#a855f7] uppercase tracking-wider mb-1 font-semibold">Fragmentation Link</p>
                        <p className="text-xs text-gray-300">{cluster.fragmentation_link}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {cluster.mitre_tactics?.length > 0 && (
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">MITRE Tactics</p>
                          <div className="flex flex-wrap gap-1">
                            {cluster.mitre_tactics.map((t, i) => (
                              <span key={i} className="text-[9px] text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded font-mono">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {cluster.target_sectors?.length > 0 && (
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Target Sectors</p>
                          <div className="flex flex-wrap gap-1">
                            {cluster.target_sectors.map((s, i) => (
                              <span key={i} className="text-[9px] text-gray-300 bg-white/5 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#00d4ff]" />Add TTP Cluster</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-gray-500">Cluster Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Living-off-the-Land Techniques" />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Domain</Label>
              <Select value={form.domain} onValueChange={v => setForm({ ...form, domain: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cyber">Cyber</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="influence">Influence</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">MITRE Tactics (comma-separated)</Label>
              <Input value={form.mitre_tactics} onChange={e => setForm({ ...form, mitre_tactics: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Initial Access, Execution, Persistence" />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Target Sectors (comma-separated)</Label>
              <Input value={form.target_sectors} onChange={e => setForm({ ...form, target_sectors: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="energy, healthcare, finance" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {createMutation.isPending ? "Creating..." : "Add Cluster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}