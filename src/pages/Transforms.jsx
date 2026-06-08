import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, GitBranch, Loader2, Trash2, Zap } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";

const TRANSFORM_TYPES = ["enrich_ip", "enrich_domain", "enrich_hash", "enrich_email", "enrich_cve", "correlate_indicators", "geolocation", "whois_lookup", "threat_actor_profile", "campaign_mapping", "risk_scoring", "custom"];
const INPUT_TYPES = ["ip_address", "domain", "hash", "email", "url", "cve", "actor", "any"];

export default function Transforms() {
  const [showCreate, setShowCreate] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [selectedTransform, setSelectedTransform] = useState(null);
  const [runInput, setRunInput] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);

  const [form, setForm] = useState({
    name: "", transform_type: "enrich_ip", input_type: "ip_address",
    description: "", status: "active"
  });

  const queryClient = useQueryClient();

  const { data: transforms = [] } = useQuery({
    queryKey: ["transforms"],
    queryFn: () => base44.entities.Transform.list("-created_date"),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transform.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["transforms"] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transform.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transforms"] }),
  });

  const runTransform = async () => {
    if (!selectedTransform || !runInput) return;
    setRunning(true);
    setRunResult(null);

    const prompt = `You are a cybersecurity OSINT analyst. Run a "${selectedTransform.transform_type.replace(/_/g, " ")}" transform on the following input: "${runInput}".

Provide a detailed intelligence enrichment report including:
- Summary of findings
- Risk assessment (score 0-100)
- Related threat actors or campaigns
- Recommended actions
- Relevant MITRE ATT&CK techniques if applicable
- Geographic attribution if relevant

Format as a structured analysis.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          risk_score: { type: "number" },
          threat_actors: { type: "array", items: { type: "string" } },
          mitre_techniques: { type: "array", items: { type: "string" } },
          geographic_attribution: { type: "string" },
          recommended_actions: { type: "array", items: { type: "string" } },
          additional_context: { type: "string" },
        },
      },
    });

    setRunResult(result);

    // Update transform run count
    await base44.entities.Transform.update(selectedTransform.id, {
      run_count: (selectedTransform.run_count || 0) + 1,
      last_run: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["transforms"] });
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Data enrichment and correlation transforms for OSINT analysis</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Create Transform
        </Button>
      </div>

      {transforms.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No transforms configured</p>
          <p className="text-gray-600 text-xs mt-1">Create transforms to enrich and correlate threat data</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {transforms.map(t => (
            <Card key={t.id} className="bg-[#111827] border-white/5 p-5 hover:border-white/10 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t.transform_type?.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <StatusDot status={t.status} />
              </div>
              {t.description && <p className="text-xs text-gray-500 mb-3">{t.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span>Input: {t.input_type?.replace(/_/g, " ")}</span>
                <span>Runs: {t.run_count || 0}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-0"
                  onClick={() => { setSelectedTransform(t); setShowRun(true); setRunResult(null); setRunInput(""); }}>
                  <Play className="w-3 h-3 mr-1" /> Run
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(t.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Create Transform</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. IP Enrichment" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Transform Type</Label>
                <Select value={form.transform_type} onValueChange={v => setForm({ ...form, transform_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TRANSFORM_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Input Type</Label>
                <Select value={form.input_type} onValueChange={v => setForm({ ...form, input_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{INPUT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Dialog */}
      <Dialog open={showRun} onOpenChange={setShowRun}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Run: {selectedTransform?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Input Value</Label>
              <Input value={runInput} onChange={e => setRunInput(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1"
                placeholder={`Enter ${selectedTransform?.input_type?.replace(/_/g, " ") || "value"} to analyze...`} />
            </div>
            <Button onClick={runTransform} disabled={running || !runInput} className="bg-purple-600 hover:bg-purple-700 gap-2 w-full">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Analyzing..." : "Execute Transform"}
            </Button>

            {runResult && (
              <div className="bg-black/30 rounded-xl p-5 space-y-4 border border-white/5">
                <h4 className="text-sm font-semibold text-[#00d4ff]">Transform Results</h4>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Summary</p>
                  <p className="text-sm text-gray-200">{runResult.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Risk Score</p>
                    <p className="text-2xl font-bold" style={{ color: runResult.risk_score >= 70 ? "#ff4757" : runResult.risk_score >= 40 ? "#ffa502" : "#2ed573" }}>
                      {runResult.risk_score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Geographic Attribution</p>
                    <p className="text-sm text-gray-200">{runResult.geographic_attribution || "N/A"}</p>
                  </div>
                </div>
                {runResult.threat_actors?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Threat Actors</p>
                    <div className="flex flex-wrap gap-1">{runResult.threat_actors.map((a, i) => <Badge key={i} variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{a}</Badge>)}</div>
                  </div>
                )}
                {runResult.mitre_techniques?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">MITRE ATT&CK Techniques</p>
                    <div className="flex flex-wrap gap-1">{runResult.mitre_techniques.map((t, i) => <Badge key={i} variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">{t}</Badge>)}</div>
                  </div>
                )}
                {runResult.recommended_actions?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Recommended Actions</p>
                    <ul className="space-y-1">{runResult.recommended_actions.map((a, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-2"><span className="text-[#00d4ff] mt-0.5">•</span>{a}</li>)}</ul>
                  </div>
                )}
                {runResult.additional_context && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Additional Context</p>
                    <p className="text-xs text-gray-300">{runResult.additional_context}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}