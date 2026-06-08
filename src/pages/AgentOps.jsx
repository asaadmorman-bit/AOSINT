import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Cpu, Sword, Shield, Loader2, Trash2, ChevronRight, Bot, Brain, Users } from "lucide-react";
import AgentTerminal from "@/components/agents/AgentTerminal";
import AgentOrchestrator from "@/components/agents/AgentOrchestrator";
import StatusDot from "@/components/shared/StatusDot";
import ScenarioTeamChat from "@/components/collab/ScenarioTeamChat";

const SCENARIO_TYPES = ["red_team", "blue_team", "wargame", "tabletop", "autonomous_response", "influence_campaign", "below_threshold_conflict"];
const DOMAINS = ["cyber", "physical", "influence", "hybrid", "supply_chain"];
const CONFLICT_LEVELS = ["gray_zone", "below_threshold", "coercive", "escalatory", "full_spectrum"];

const typeColors = {
  red_team: "#ff4757",
  blue_team: "#00d4ff",
  wargame: "#ffa502",
  tabletop: "#a855f7",
  autonomous_response: "#2ed573",
  influence_campaign: "#ff6b35",
  below_threshold_conflict: "#ff4757",
};

export default function AgentOps() {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [form, setForm] = useState({
    title: "", scenario_type: "below_threshold_conflict", domain: "hybrid",
    conflict_level: "below_threshold", threat_actor: "PRC-aligned APT"
  });

  const queryClient = useQueryClient();

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios"],
    queryFn: () => base44.entities.AgentScenario.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AgentScenario.create(data),
    onSuccess: (newScenario) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setShowCreate(false);
      setSelected(newScenario);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AgentScenario.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["scenarios"] }); setSelected(null); },
  });

  const generateIntelReport = async () => {
    if (!selected) return;
    setGeneratingReport(true);
    setReportResult(null);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an autonomous intelligence agent executing multi-step reasoning for a security scenario.

SCENARIO: ${selected.title}
TYPE: ${selected.scenario_type}
DOMAIN: ${selected.domain}
CONFLICT LEVEL: ${selected.conflict_level}
THREAT ACTOR: ${selected.threat_actor || "Unknown"}

Execute autonomous multi-step reasoning:

STEP 1 — OSINT Layer: What open-source intelligence exists about this threat vector?
STEP 2 — SIGINT Layer: What signals/behavioral indicators would be visible?
STEP 3 — HUMINT Layer: What human factors and insider risks apply?
STEP 4 — Pattern Analysis: What pattern of life deviations would signal this activity?
STEP 5 — Intent Assessment: Separate subjective intent (stated) from objective intent (behavioral evidence)
STEP 6 — Speed of Action: At what velocity would this threat materialize?
STEP 7 — GoLaxy/PRC Vector: How could commercial data aggregation accelerate this scenario?
STEP 8 — Below-Threshold Indicators: What gray zone activities precede escalation?
STEP 9 — Defense Playbook: Autonomous defensive actions ordered by priority
STEP 10 — Strategic Countermeasures: Long-term resilience against strategic competition

Provide a comprehensive autonomous intelligence report.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          osint_assessment: { type: "string" },
          sigint_indicators: { type: "array", items: { type: "string" } },
          humint_factors: { type: "array", items: { type: "string" } },
          pattern_deviations: { type: "array", items: { type: "string" } },
          subjective_intent: { type: "string" },
          objective_intent: { type: "string" },
          speed_of_action: { type: "string" },
          golaxy_vector: { type: "string" },
          below_threshold_indicators: { type: "array", items: { type: "string" } },
          defense_playbook: { type: "array", items: { type: "object", properties: { action: { type: "string" }, priority: { type: "string" }, timeline: { type: "string" } } } },
          strategic_countermeasures: { type: "array", items: { type: "string" } },
          overall_confidence: { type: "number" }
        }
      }
    });

    await base44.entities.AgentScenario.update(selected.id, {
      status: "completed",
      ai_reasoning_chain: JSON.stringify(result),
      confidence_score: result.overall_confidence,
    });

    setReportResult(result);
    setGeneratingReport(false);
    queryClient.invalidateQueries({ queryKey: ["scenarios"] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">AI Agent Operating System — Autonomous intelligence, wargames & defense strategies</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> New Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scenario List */}
        <div className="space-y-2">
          {scenarios.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
              <Cpu className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No scenarios</p>
              <p className="text-gray-600 text-xs mt-1">Create a scenario to simulate adversary actions and test defenses</p>
            </div>
          ) : scenarios.map(s => {
            const color = typeColors[s.scenario_type] || "#6b7280";
            return (
              <button key={s.id} onClick={() => { setSelected(s); setReportResult(null); }}
                className={`w-full text-left bg-[#111827] border rounded-xl p-4 transition-all ${
                  selected?.id === s.id ? "border-[#00d4ff]/30" : "border-white/5 hover:border-white/10"
                }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg mt-0.5" style={{ background: `${color}15` }}>
                    {s.scenario_type?.includes("red") ? <Sword className="w-4 h-4" style={{ color }} /> : <Shield className="w-4 h-4" style={{ color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{s.scenario_type?.replace(/_/g, " ")} · {s.domain}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusDot status={s.status} showLabel={false} />
                      <span className="text-[10px] text-gray-500 capitalize">{s.conflict_level?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 mt-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
              <div>
                <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Select a scenario to run autonomous agent analysis</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">{selected.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{selected.scenario_type?.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{selected.domain}</Badge>
                    <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{selected.conflict_level?.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400 h-8 w-8" onClick={() => deleteMutation.mutate(selected.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Tabs defaultValue="orchestrate" className="p-5">
                <TabsList className="bg-white/5 border border-white/5">
                  <TabsTrigger value="orchestrate">Agent Chain</TabsTrigger>
                  <TabsTrigger value="report">Intelligence Report</TabsTrigger>
                  <TabsTrigger value="terminal">Agent Terminal</TabsTrigger>
                  <TabsTrigger value="collab" className="gap-1.5">
                    <Users className="w-3 h-3" />Team
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orchestrate" className="mt-5">
                  <AgentOrchestrator scenario={selected} />
                </TabsContent>

                <TabsContent value="report" className="mt-5 space-y-4">
                  <Button onClick={generateIntelReport} disabled={generatingReport}
                    className="bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/20 gap-2 w-full">
                    {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    {generatingReport ? "Executing Multi-Step Reasoning..." : "Generate Autonomous Intelligence Report"}
                  </Button>

                  {reportResult && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00d4ff] rounded-full" style={{ width: `${reportResult.overall_confidence}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[#00d4ff]">{reportResult.overall_confidence}% confidence</span>
                      </div>

                      {/* Intent Duality */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Subjective Intent</p>
                          <p className="text-xs text-gray-300">{reportResult.subjective_intent}</p>
                        </div>
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                          <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">Objective Intent</p>
                          <p className="text-xs text-gray-300">{reportResult.objective_intent}</p>
                        </div>
                      </div>

                      {reportResult.osint_assessment && (
                        <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-lg p-4">
                          <p className="text-[10px] text-[#00d4ff] uppercase tracking-wider mb-2">OSINT Assessment (Base Layer)</p>
                          <p className="text-xs text-gray-300">{reportResult.osint_assessment}</p>
                        </div>
                      )}

                      {reportResult.golaxy_vector && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                          <p className="text-[10px] text-red-400 uppercase tracking-wider mb-2">GoLaxy / PRC Data Vector</p>
                          <p className="text-xs text-gray-300">{reportResult.golaxy_vector}</p>
                        </div>
                      )}

                      {reportResult.speed_of_action && (
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                          <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Speed of Action</p>
                          <p className="text-xs text-gray-300">{reportResult.speed_of_action}</p>
                        </div>
                      )}

                      {reportResult.below_threshold_indicators?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#ffa502] uppercase tracking-wider mb-2">Below-Threshold Indicators</p>
                          <ul className="space-y-1">{reportResult.below_threshold_indicators.map((b, i) => (
                            <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-[#ffa502]">◦</span>{b}</li>
                          ))}</ul>
                        </div>
                      )}

                      {reportResult.defense_playbook?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#2ed573] uppercase tracking-wider mb-2">Autonomous Defense Playbook</p>
                          <div className="space-y-2">
                            {reportResult.defense_playbook.map((d, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                <span className="text-[10px] font-bold text-[#2ed573] mt-0.5 w-6">{i + 1}</span>
                                <div>
                                  <p className="text-xs text-gray-200">{d.action}</p>
                                  <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                                    <span>Priority: {d.priority}</span>
                                    <span>Timeline: {d.timeline}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {reportResult.strategic_countermeasures?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Strategic Countermeasures</p>
                          <ul className="space-y-1">{reportResult.strategic_countermeasures.map((s, i) => (
                            <li key={i} className="text-xs text-gray-300 flex gap-2"><span className="text-[#00d4ff]">▸</span>{s}</li>
                          ))}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="terminal" className="mt-5">
                  <div className="h-[480px]">
                    <AgentTerminal entityContext={selected} />
                  </div>
                </TabsContent>

                <TabsContent value="collab" className="mt-5">
                  <ScenarioTeamChat
                    scenarioId={selected.id}
                    scenarioTitle={selected.title}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Create Scenario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Scenario Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. GoLaxy-Assisted Executive Targeting" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Type</Label>
                <Select value={form.scenario_type} onValueChange={v => setForm({ ...form, scenario_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCENARIO_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Domain</Label>
                <Select value={form.domain} onValueChange={v => setForm({ ...form, domain: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Conflict Level</Label>
                <Select value={form.conflict_level} onValueChange={v => setForm({ ...form, conflict_level: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONFLICT_LEVELS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Threat Actor</Label>
                <Input value={form.threat_actor} onChange={e => setForm({ ...form, threat_actor: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. APT41" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Create Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}