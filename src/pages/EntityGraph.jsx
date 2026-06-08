import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, User, Building, Wifi, Loader2, AlertTriangle, Eye, Network } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";
import AgentTerminal from "@/components/agents/AgentTerminal";
import NetworkGraph from "@/components/graph/NetworkGraph";

const ENTITY_TYPES = ["organization", "individual", "infrastructure", "family_member", "entourage", "vehicle", "facility", "digital_identity"];
const CLASSIFICATIONS = ["principal", "associate", "target", "friendly", "neutral", "unknown"];

const typeIcons = { organization: Building, individual: User, infrastructure: Wifi, family_member: Users, entourage: Users };
const riskColors = { critical: "#ff4757", high: "#ff6b35", medium: "#ffa502", low: "#2ed573" };

export default function EntityGraph() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showPOL, setShowPOL] = useState(false);
  const [polLoading, setPolLoading] = useState(false);
  const [polResult, setPolResult] = useState(null);
  const [form, setForm] = useState({ name: "", entity_type: "individual", classification: "unknown", risk_level: "medium", notes: "" });

  const queryClient = useQueryClient();

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: () => base44.entities.Entity.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Entity.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["entities"] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Entity.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["entities"] }); setSelected(null); },
  });

  const runPatternOfLife = async (entity) => {
    setPolLoading(true);
    setPolResult(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Pattern of Life analyst. Conduct a comprehensive Pattern of Life assessment for the following entity:

Name: ${entity.name}
Type: ${entity.entity_type}
Classification: ${entity.classification}
Risk Level: ${entity.risk_level}
Digital Footprint: ${JSON.stringify(entity.digital_footprint || {})}
GoLaxy Exposure: ${JSON.stringify(entity.golaxy_exposure || {})}
Notes: ${entity.notes || "None"}

Analyze and provide:
1. Routine behavior patterns (daily/weekly/monthly)
2. Predictability score (0-100)
3. Detected anomalies
4. SUBJECTIVE INTENT: What they claim/appear to intend
5. OBJECTIVE INTENT: What their actions actually suggest
6. Speed-of-action correlation (how fast from intent to action)
7. GoLaxy/PRC data exposure risk for this entity specifically
8. Below-threshold activity indicators
9. Threat correlation with known actors or campaigns
10. Recommended protective/counterintel actions`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          routine_behaviors: { type: "array", items: { type: "object", properties: { behavior: { type: "string" }, frequency: { type: "string" }, confidence: { type: "number" }, time_window: { type: "string" } } } },
          predictability_score: { type: "number" },
          anomalies: { type: "array", items: { type: "object", properties: { description: { type: "string" }, severity: { type: "string" }, potential_meaning: { type: "string" } } } },
          subjective_intent: { type: "string" },
          objective_intent: { type: "string" },
          speed_of_action_score: { type: "number" },
          golaxy_risk: { type: "string" },
          below_threshold_indicators: { type: "array", items: { type: "string" } },
          threat_correlation: { type: "string" },
          recommended_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    await base44.entities.PatternOfLife.create({
      entity_id: entity.id,
      entity_name: entity.name,
      analysis_date: new Date().toISOString(),
      routine_behaviors: result.routine_behaviors,
      anomalies: result.anomalies,
      predictability_score: result.predictability_score,
      subjective_intent: result.subjective_intent,
      objective_intent: result.objective_intent,
      speed_of_action_score: result.speed_of_action_score,
      threat_correlation: result.threat_correlation,
      ai_analysis: result.golaxy_risk,
    });

    setPolResult(result);
    setPolLoading(false);
    queryClient.invalidateQueries({ queryKey: ["patternOfLife"] });
  };

  const { data: actors = [] } = useQuery({
    queryKey: ["threat_actors_graph"],
    queryFn: () => base44.entities.ThreatActor.list(),
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns_graph"],
    queryFn: () => base44.entities.Campaign.list(),
  });
  const { data: indicators = [] } = useQuery({
    queryKey: ["indicators_graph"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 30),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Track principals, associates, family, entourage & digital identities</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Add Entity
        </Button>
      </div>

      {/* Network Graph */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Network className="w-3 h-3 text-[#00d4ff]" /> Relationship Network Graph
        </p>
        <NetworkGraph entities={entities} actors={actors} campaigns={campaigns} indicators={indicators} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Entity List */}
        <div className="space-y-2 lg:col-span-1">
          {entities.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No entities added</p>
            </div>
          ) : entities.map(entity => {
            const Icon = typeIcons[entity.entity_type] || User;
            const color = riskColors[entity.risk_level] || "#6b7280";
            return (
              <button key={entity.id} onClick={() => { setSelected(entity); setPolResult(null); }}
                className={`w-full text-left bg-[#111827] border rounded-xl p-4 transition-all ${
                  selected?.id === entity.id ? "border-[#00d4ff]/30" : "border-white/5 hover:border-white/10"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{entity.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{entity.entity_type?.replace(/_/g, " ")} · {entity.classification}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                    {entity.risk_level}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>

        {/* Entity Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
              <div>
                <Eye className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select an entity to view profile and run Pattern of Life analysis</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">
                      {selected.entity_type?.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">
                      {selected.classification}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => runPatternOfLife(selected)} disabled={polLoading}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 gap-1.5 h-8 text-xs">
                    {polLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    {polLoading ? "Analyzing..." : "Pattern of Life"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-red-400 hover:text-red-300"
                    onClick={() => deleteMutation.mutate(selected.id)}>
                    Remove
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="profile" className="p-5">
                <TabsList className="bg-white/5 border border-white/5">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="pol">Pattern of Life</TabsTrigger>
                  <TabsTrigger value="agent">AI Agent</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4 space-y-4">
                  {selected.notes && (
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Notes / Biography</p>
                      <p className="text-sm text-gray-300">{selected.notes}</p>
                    </div>
                  )}
                  {selected.aliases?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Known Aliases</p>
                      <div className="flex flex-wrap gap-1">{selected.aliases.map((a, i) => <Badge key={i} variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{a}</Badge>)}</div>
                    </div>
                  )}
                  {selected.golaxy_exposure?.uses_golaxy && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <p className="text-xs font-semibold text-red-400">GoLaxy Exposure Detected</p>
                      </div>
                      <p className="text-xs text-gray-400">{selected.golaxy_exposure.risk_summary}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pol" className="mt-4">
                  {!polResult ? (
                    <div className="text-center py-8">
                      <Eye className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Click "Pattern of Life" to run AI analysis</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Intent Duality */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                          <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2">Subjective Intent</p>
                          <p className="text-xs text-gray-300">{polResult.subjective_intent}</p>
                        </div>
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                          <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-2">Objective Intent</p>
                          <p className="text-xs text-gray-300">{polResult.objective_intent}</p>
                        </div>
                      </div>
                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-[#00d4ff]">{polResult.predictability_score}/100</p>
                          <p className="text-[10px] text-gray-500">Predictability</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-[#ffa502]">{polResult.speed_of_action_score}/100</p>
                          <p className="text-[10px] text-gray-500">Speed of Action</p>
                        </div>
                      </div>
                      {polResult.anomalies?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Anomalies Detected</p>
                          <div className="space-y-2">
                            {polResult.anomalies.map((a, i) => (
                              <div key={i} className="bg-black/20 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs font-medium text-yellow-300">{a.description}</span>
                                </div>
                                <p className="text-[10px] text-gray-500">{a.potential_meaning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {polResult.below_threshold_indicators?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Below-Threshold Indicators</p>
                          <ul className="space-y-1">{polResult.below_threshold_indicators.map((b, i) => (
                            <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-[#ffa502]">◦</span>{b}</li>
                          ))}</ul>
                        </div>
                      )}
                      {polResult.recommended_actions?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recommended Actions</p>
                          <ul className="space-y-1">{polResult.recommended_actions.map((r, i) => (
                            <li key={i} className="text-xs text-[#00d4ff] flex gap-2"><span>▸</span>{r}</li>
                          ))}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="agent" className="mt-4">
                  <div className="h-[420px]">
                    <AgentTerminal entityContext={selected} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add Entity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Entity Type</Label>
                <Select value={form.entity_type} onValueChange={v => setForm({ ...form, entity_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Classification</Label>
                <Select value={form.classification} onValueChange={v => setForm({ ...form, classification: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Risk Level</Label>
              <Select value={form.risk_level} onValueChange={v => setForm({ ...form, risk_level: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Notes / Biography</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Add Entity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}