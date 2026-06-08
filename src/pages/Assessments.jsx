import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus, FileBarChart, Loader2, Trash2, ChevronRight, AlertTriangle,
  CheckCircle2, Shield, Zap, BarChart2, RefreshCw, Download, Bot
} from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";
import RiskGauge from "@/components/dashboard/RiskGauge";
import AssetRiskMatrix from "@/components/assessments/AssetRiskMatrix";
import AssetScoreTable from "@/components/assessments/AssetScoreTable";
import DataSourceMap from "@/components/assessments/DataSourceMap";
import GapRadar from "@/components/assessments/GapRadar";

const TYPES = ["full", "cyber", "physical", "influence", "supply_chain", "targeted"];
const FRAMEWORKS = ["NIST CSF 2.0", "ISO 27001", "CIS Controls v8", "SOC 2", "CMMC 2.0", "MITRE ATT&CK"];

export default function Assessments() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [form, setForm] = useState({ title: "", assessment_type: "full", framework: "NIST CSF 2.0" });
  const [assetScores, setAssetScores] = useState({});

  const queryClient = useQueryClient();

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ["assessments"],
    queryFn: () => base44.entities.RiskAssessment.list("-created_date"),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 200),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ["feeds"],
    queryFn: () => base44.entities.ThreatFeed.list(),
  });

  // Sync selected assessment with updated data
  useEffect(() => {
    if (selectedAssessment && assessments.length > 0) {
      const updated = assessments.find(a => a.id === selectedAssessment.id);
      if (updated) setSelectedAssessment(updated);
    }
  }, [assessments]);

  // Build per-asset reliability & exploitation scores
  useEffect(() => {
    const scores = {};
    assets.forEach(asset => {
      const linkedIndicators = indicators.filter(ind =>
        ind.value?.includes(asset.ip_address || "___NONE___") ||
        ind.tags?.some(t => asset.name?.toLowerCase().includes(t.toLowerCase()))
      );
      const critMap = { critical: 85, high: 65, medium: 45, low: 25 };
      const base = critMap[asset.criticality] || 45;
      const exploitation = Math.min(100, base + linkedIndicators.length * 5);
      const reliability = Math.max(10, (asset.compliance_status === "compliant" ? 80 : asset.compliance_status === "partial" ? 55 : 35) - linkedIndicators.length * 3);
      scores[asset.id] = { reliability, exploitation };
    });
    setAssetScores(scores);
  }, [assets, indicators]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RiskAssessment.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      if (selectedAssessment?.id === id) setSelectedAssessment(null);
    },
  });

  const buildPrompt = (type, framework, extra = "") => {
    const indicatorSummary = indicators.slice(0, 60).map(i =>
      `${i.title} [${i.severity}/${i.threat_category}]`
    ).join("; ");
    const assetSummary = assets.map(a =>
      `${a.name} (type:${a.asset_type}, domain:${a.domain}, criticality:${a.criticality}, compliance:${a.compliance_status || "unknown"}, risk:${assetScores[a.id]?.exploitation || "?"}/100)`
    ).join("; ");
    const feedSummary = feeds.map(f => `${f.name} (${f.feed_type}, ${f.status})`).join("; ");

    return `You are a senior security consultant. Generate a comprehensive AI-powered ${type} risk assessment.

LIVE INTELLIGENCE CONTEXT:
- Threat feeds (${feeds.length}): ${feedSummary || "None"}
- Indicators (${indicators.length}): ${indicatorSummary || "None"}
- Assets (${assets.length}): ${assetSummary || "None"}
- Compliance framework: ${framework}
${extra}

ASSESSMENT REQUIREMENTS:
1. Risk scores 0-100 for: overall, cyber, physical, influence, supply_chain domains
2. Finding counts: critical, high, medium, low
3. Gap analysis (min 6 gaps) mapped to ${framework} controls with current/target maturity (1-5 scale)
4. Remediation plan (min 8 actions) with priority, owner, due_date, estimated_cost, impact_area
5. Per-asset reliability scores (data integrity/uptime) and exploitation risk scores (0-100)
6. Data source distribution across threat categories
7. Executive summary covering: 2026 global fragmentation threats, GoLaxy/PRC data harvesting risks, below-threshold conflict indicators, AI-accelerated adversary operations
8. Compliance gap summary mapped to ${framework}`;
  };

  const runGenerate = async (assessmentId, type, framework) => {
    const prompt = buildPrompt(type, framework);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          overall_risk_score: { type: "number" },
          cyber_risk_score: { type: "number" },
          physical_risk_score: { type: "number" },
          influence_risk_score: { type: "number" },
          supply_chain_risk_score: { type: "number" },
          critical_findings: { type: "number" },
          high_findings: { type: "number" },
          medium_findings: { type: "number" },
          low_findings: { type: "number" },
          gaps_identified: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                severity: { type: "string" },
                framework_reference: { type: "string" },
                current_maturity: { type: "number" },
                target_maturity: { type: "number" }
              }
            }
          },
          remediation_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                priority: { type: "string" },
                owner: { type: "string" },
                due_date: { type: "string" },
                status: { type: "string" },
                estimated_cost: { type: "string" },
                impact_area: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    await base44.entities.RiskAssessment.update(assessmentId, {
      ...result,
      status: "completed",
      completed_date: new Date().toISOString(),
      ai_analysis: result.summary,
      assets_assessed: assets.length,
    });

    await queryClient.invalidateQueries({ queryKey: ["assessments"] });
    return result;
  };

  const generateAssessment = async () => {
    setGenerating(true);
    const newAssessment = await base44.entities.RiskAssessment.create({
      title: form.title,
      assessment_type: form.assessment_type,
      status: "in_progress",
      assets_assessed: assets.length,
    });
    await runGenerate(newAssessment.id, form.assessment_type, form.framework);
    const refreshed = await base44.entities.RiskAssessment.list("-created_date");
    const found = refreshed.find(a => a.id === newAssessment.id);
    if (found) setSelectedAssessment(found);
    setGenerating(false);
    setShowCreate(false);
  };

  const regenerateAssessment = async () => {
    if (!selectedAssessment) return;
    setRegenerating(true);
    await base44.entities.RiskAssessment.update(selectedAssessment.id, { status: "in_progress" });
    await runGenerate(selectedAssessment.id, selectedAssessment.assessment_type, form.framework || "NIST CSF 2.0");
    const refreshed = await base44.entities.RiskAssessment.list("-created_date");
    const found = refreshed.find(a => a.id === selectedAssessment.id);
    if (found) setSelectedAssessment(found);
    setRegenerating(false);
  };

  const exportReport = () => {
    if (!selectedAssessment) return;
    const data = {
      title: selectedAssessment.title,
      type: selectedAssessment.assessment_type,
      generated: new Date().toISOString(),
      risk_scores: {
        overall: selectedAssessment.overall_risk_score,
        cyber: selectedAssessment.cyber_risk_score,
        physical: selectedAssessment.physical_risk_score,
        influence: selectedAssessment.influence_risk_score,
        supply_chain: selectedAssessment.supply_chain_risk_score,
      },
      findings: { critical: selectedAssessment.critical_findings, high: selectedAssessment.high_findings, medium: selectedAssessment.medium_findings, low: selectedAssessment.low_findings },
      gaps: selectedAssessment.gaps_identified,
      remediation: selectedAssessment.remediation_plan,
      summary: selectedAssessment.ai_analysis,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selectedAssessment.title?.replace(/\s+/g, "_")}_assessment.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const detail = selectedAssessment;
  const totalFindings = detail ? (detail.critical_findings || 0) + (detail.high_findings || 0) + (detail.medium_findings || 0) + (detail.low_findings || 0) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-400">AI-powered risk assessments — reliability & exploitation scoring, gap analysis, remediation</p>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> New Assessment
        </Button>
      </div>

      {/* Data Source Overview (always visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Data Source Distribution</p>
          <DataSourceMap indicators={indicators} feeds={feeds} />
        </div>
        <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Asset Reliability vs Exploitation Risk Matrix</p>
          <AssetRiskMatrix assets={assets.map(a => ({ ...a, ...assetScores[a.id] }))} />
        </div>
      </div>

      {/* Asset Scores Table */}
      {assets.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Per-Asset Reliability & Exploitation Scores</p>
          <AssetScoreTable assets={assets} assetScores={assetScores} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Assessment List */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest px-1">Assessments</p>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : assessments.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
              <FileBarChart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No assessments yet</p>
              <Button onClick={() => setShowCreate(true)} size="sm" className="mt-3 bg-[#00d4ff] text-black text-xs">
                <Plus className="w-3 h-3 mr-1" /> Generate First Assessment
              </Button>
            </div>
          ) : assessments.map(a => (
            <button key={a.id} onClick={() => setSelectedAssessment(a)}
              className={`w-full text-left bg-[#111827] border rounded-xl p-4 transition-all ${
                detail?.id === a.id ? "border-[#00d4ff]/30 bg-[#00d4ff]/5" : "border-white/5 hover:border-white/10"
              }`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{a.title}</h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{a.assessment_type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusDot status={a.status} showLabel={false} />
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {a.overall_risk_score != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${a.overall_risk_score}%`,
                      background: a.overall_risk_score >= 70 ? "#ff4757" : a.overall_risk_score >= 40 ? "#ffa502" : "#2ed573"
                    }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">{a.overall_risk_score}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Assessment Detail */}
        <div className="lg:col-span-2">
          {!detail ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
              <div>
                <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Select an assessment to view details</p>
                <p className="text-gray-600 text-xs mt-1">or generate a new one</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">{detail.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] bg-white/5 text-gray-400 border-white/10">{detail.assessment_type}</Badge>
                      <StatusDot status={detail.status} />
                      {detail.completed_date && (
                        <span className="text-[10px] text-gray-500">{new Date(detail.completed_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-400 hover:text-white gap-1.5"
                      onClick={regenerateAssessment} disabled={regenerating}>
                      {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Refresh
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-[#00d4ff] hover:text-white gap-1.5"
                      onClick={exportReport}>
                      <Download className="w-3 h-3" /> Export
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400"
                      onClick={() => deleteMutation.mutate(detail.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="p-5">
                <TabsList className="bg-white/5 border border-white/5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="charts">Visualizations</TabsTrigger>
                  <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
                  <TabsTrigger value="remediation">Remediation</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="mt-5 space-y-5">
                  <div className="flex flex-wrap justify-around gap-4">
                    <RiskGauge score={detail.overall_risk_score || 0} label="Overall" />
                    <RiskGauge score={detail.cyber_risk_score || 0} label="Cyber" />
                    <RiskGauge score={detail.physical_risk_score || 0} label="Physical" />
                    <RiskGauge score={detail.influence_risk_score || 0} label="Influence" />
                    <RiskGauge score={detail.supply_chain_risk_score || 0} label="Supply Chain" />
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Critical", count: detail.critical_findings, color: "#ff4757" },
                      { label: "High", count: detail.high_findings, color: "#ff6b81" },
                      { label: "Medium", count: detail.medium_findings, color: "#ffa502" },
                      { label: "Low", count: detail.low_findings, color: "#00d4ff" },
                    ].map(f => (
                      <div key={f.label} className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                        <p className="text-2xl font-bold" style={{ color: f.color }}>{f.count || 0}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{f.label}</p>
                        {totalFindings > 0 && (
                          <p className="text-[10px] text-gray-600 mt-0.5">{Math.round(((f.count || 0) / totalFindings) * 100)}%</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {detail.ai_analysis && (
                    <div className="bg-black/20 rounded-xl p-5 border border-white/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="w-4 h-4 text-[#00d4ff]" />
                        <h4 className="text-xs text-[#00d4ff] uppercase tracking-wider font-bold">AI Executive Summary</h4>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{detail.ai_analysis}</p>
                    </div>
                  )}
                </TabsContent>

                {/* VISUALIZATIONS TAB */}
                <TabsContent value="charts" className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Gap Maturity Radar</p>
                      <GapRadar gaps={detail.gaps_identified} />
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Intelligence Data Sources</p>
                      <DataSourceMap indicators={indicators} feeds={feeds} />
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Asset Reliability vs. Exploitation Risk</p>
                    <AssetRiskMatrix assets={assets.map(a => ({ ...a, ...assetScores[a.id] }))} />
                  </div>
                  {/* Severity breakdown as horizontal bars */}
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Finding Severity Breakdown</p>
                    <div className="space-y-3">
                      {[
                        { label: "Critical", count: detail.critical_findings || 0, color: "#ff4757" },
                        { label: "High", count: detail.high_findings || 0, color: "#ff6b35" },
                        { label: "Medium", count: detail.medium_findings || 0, color: "#ffa502" },
                        { label: "Low", count: detail.low_findings || 0, color: "#00d4ff" },
                      ].map(f => (
                        <div key={f.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16">{f.label}</span>
                          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: totalFindings > 0 ? `${(f.count / totalFindings) * 100}%` : "0%", background: f.color, boxShadow: `0 0 6px ${f.color}50` }} />
                          </div>
                          <span className="text-xs font-bold w-6 text-right" style={{ color: f.color }}>{f.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* GAPS TAB */}
                <TabsContent value="gaps" className="mt-5">
                  {detail.gaps_identified?.length > 0 ? (
                    <div className="space-y-3">
                      {detail.gaps_identified.map((gap, i) => (
                        <div key={i} className="bg-black/20 rounded-xl p-4 border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                              <h4 className="text-sm font-semibold text-white">{gap.category}</h4>
                            </div>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${
                              gap.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              gap.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                              "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>{gap.severity}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{gap.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            {gap.framework_reference && (
                              <span className="text-[#00d4ff] text-[10px] bg-[#00d4ff]/10 px-2 py-0.5 rounded">{gap.framework_reference}</span>
                            )}
                            <span>Maturity: {gap.current_maturity}/5 → {gap.target_maturity}/5</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-600 w-16">Current</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#ffa502] rounded-full" style={{ width: `${(gap.current_maturity / 5) * 100}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-600 w-16">Target</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#2ed573] rounded-full" style={{ width: `${(gap.target_maturity / 5) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No gaps identified yet.</p>
                      <Button size="sm" onClick={regenerateAssessment} disabled={regenerating} className="mt-3 bg-white/5 text-gray-300 hover:bg-white/10 gap-1.5">
                        {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Generate Gap Analysis
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* REMEDIATION TAB */}
                <TabsContent value="remediation" className="mt-5">
                  {detail.remediation_plan?.length > 0 ? (
                    <div className="space-y-3">
                      {detail.remediation_plan.map((item, i) => (
                        <div key={i} className="bg-black/20 rounded-xl p-4 border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#00d4ff] shrink-0" />
                              <h4 className="text-sm font-medium text-white">{item.action}</h4>
                            </div>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${
                              item.priority === "critical" || item.priority === "high" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              item.priority === "medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                              "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            }`}>{item.priority}</Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                            {item.owner && <div>Owner: <span className="text-gray-300">{item.owner}</span></div>}
                            {item.due_date && <div>Due: <span className="text-gray-300">{item.due_date}</span></div>}
                            {item.estimated_cost && <div>Cost: <span className="text-gray-300">{item.estimated_cost}</span></div>}
                            {item.impact_area && <div>Impact: <span className="text-gray-300">{item.impact_area}</span></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No remediation plan yet.</p>
                      <Button size="sm" onClick={regenerateAssessment} disabled={regenerating} className="mt-3 bg-white/5 text-gray-300 hover:bg-white/10 gap-1.5">
                        {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Generate Remediation Plan
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={v => { if (!generating) setShowCreate(v); }}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#00d4ff]" /> Generate AI Risk Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Assessment Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Q1 2026 Full Security Assessment" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Assessment Type</Label>
                <Select value={form.assessment_type} onValueChange={v => setForm({ ...form, assessment_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Framework</Label>
                <Select value={form.framework} onValueChange={v => setForm({ ...form, framework: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{FRAMEWORKS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-lg p-4 text-xs text-gray-400 space-y-1.5">
              <p className="text-[#00d4ff] font-semibold">AI will analyze:</p>
              <p>• <span className="text-white">{feeds.length}</span> threat feeds ({feeds.filter(f => f.status === "active").length} active)</p>
              <p>• <span className="text-white">{indicators.length}</span> threat indicators</p>
              <p>• <span className="text-white">{assets.length}</span> registered assets with live scores</p>
              <p>• Mapped to <span className="text-white">{form.framework}</span> controls</p>
              <p className="text-gray-500 mt-1">Includes: gap analysis, remediation plan, reliability & exploitation scoring, data source mapping.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400" disabled={generating}>Cancel</Button>
            <Button onClick={generateAssessment} disabled={!form.title || generating}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}