import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Loader2, Brain, Zap, Shield, AlertTriangle, CheckCircle2, Database } from "lucide-react";

const HUNT_PROFILES = [
  {
    id: "full",
    label: "Full Spectrum Hunt",
    description: "Comprehensive scan across all data: indicators, actors, events, assets, and operational logs",
    icon: Crosshair,
    color: "#ff4757",
    estimatedTime: "60-90 sec",
  },
  {
    id: "ttp_precursors",
    label: "TTP Precursor Hunt",
    description: "Identify early-stage activities that precede known MITRE ATT&CK techniques before they fully materialize",
    icon: Brain,
    color: "#a855f7",
    estimatedTime: "30-45 sec",
  },
  {
    id: "anomaly",
    label: "Anomaly Detection",
    description: "Statistical baseline deviation and behavioral drift analysis across entities and assets",
    icon: Zap,
    color: "#ffa502",
    estimatedTime: "30-45 sec",
  },
  {
    id: "missed_ioc",
    label: "Missed IOC Sweep",
    description: "Cross-correlate existing feeds against global threat intelligence to surface gaps",
    icon: Shield,
    color: "#00d4ff",
    estimatedTime: "20-30 sec",
  },
];

export default function HuntScanner({ onScanComplete }) {
  const [selectedProfile, setSelectedProfile] = useState("full");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: indicators = [] } = useQuery({
    queryKey: ["hunt-indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 100),
  });
  const { data: actors = [] } = useQuery({
    queryKey: ["hunt-actors"],
    queryFn: () => base44.entities.ThreatActor.list("-created_date", 50),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["hunt-events"],
    queryFn: () => base44.entities.OperationalEvent.list("-created_date", 100),
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["hunt-assets"],
    queryFn: () => base44.entities.Asset.list("-created_date", 50),
  });

  const addProgress = (msg, type = "info") => {
    setProgress(p => [...p, { msg, type, ts: new Date().toLocaleTimeString() }]);
  };

  const runScan = async () => {
    setScanning(true);
    setProgress([]);
    setResults(null);

    try {
      addProgress("Initializing AI threat hunting engine…", "info");
      await new Promise(r => setTimeout(r, 400));

      addProgress(`Ingesting ${indicators.length} threat indicators from active feeds`, "info");
      addProgress(`Loading ${actors.length} known threat actors for behavioral profiling`, "info");
      addProgress(`Analyzing ${events.length} operational events for pattern correlation`, "info");
      addProgress(`Scanning ${assets.length} assets for anomalous exposure`, "info");
      await new Promise(r => setTimeout(r, 800));

      addProgress("Running AI multi-layer analysis (OSINT · SIGINT · HUMINT layers)…", "info");

      const profile = HUNT_PROFILES.find(p => p.id === selectedProfile);

      const indicatorSummary = indicators.slice(0, 40).map(i =>
        `[${i.indicator_type}] ${i.value || i.title} (severity:${i.severity}, category:${i.threat_category}, status:${i.status}, tags:${(i.tags||[]).join(",")}, mitre:${(i.mitre_tactics||[]).join(",")})`
      ).join("\n");

      const actorSummary = actors.slice(0, 20).map(a =>
        `${a.name} (type:${a.actor_type}, sectors:${(a.target_sectors||[]).join(",")}, convergence:${a.convergence_score}, ttps:${(a.shared_ttps||[]).join(",")})`
      ).join("\n");

      const eventSummary = events.slice(0, 30).map(e =>
        `${e.title} (type:${e.event_type}, domain:${e.domain}, severity:${e.severity}, status:${e.status}, cross_domain:${e.is_cross_domain})`
      ).join("\n");

      const prompt = `You are an elite proactive threat hunter AI running a "${profile.label}" scan.

CURRENT THREAT INDICATOR DATA (${indicators.length} total):
${indicatorSummary || "No indicators ingested yet."}

KNOWN THREAT ACTORS (${actors.length} total):
${actorSummary || "No actors profiled yet."}

RECENT OPERATIONAL EVENTS (${events.length} total):
${eventSummary || "No events logged yet."}

ASSET COUNT: ${assets.length} assets across digital/physical/hybrid domains

HUNT PROFILE: ${profile.label}
OBJECTIVE: ${profile.description}

Execute a proactive threat hunt. Your job is to find what current detection systems MISS:
1. Anomalous patterns that deviate from baseline behavior
2. Precursor activities that signal upcoming TTP execution before they materialize
3. Indicators of compromise hiding in plain sight across feeds
4. Behavioral drift suggesting insider threat or compromised credentials
5. Infrastructure overlaps linking seemingly unrelated threat actors
6. Gray-zone activities below detection thresholds
7. Supply chain and third-party risk signals

For each finding, assign a hunt_type from: anomalous_pattern, ttp_precursor, missed_ioc, behavioral_drift, lateral_movement, data_staging, c2_beacon

Generate 4-8 actionable intelligence tickets. Each must be specific, evidence-backed, and directly tied to the data provided.`;

      addProgress("AI reasoning across multi-domain intelligence layers…", "info");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            scan_summary: { type: "string" },
            threat_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  hunt_type: { type: "string" },
                  severity: { type: "string" },
                  priority: { type: "string" },
                  description: { type: "string" },
                  ai_reasoning: { type: "string" },
                  evidence: { type: "array", items: { type: "string" } },
                  related_ttps: { type: "array", items: { type: "string" } },
                  related_indicators: { type: "array", items: { type: "string" } },
                  suggested_actions: { type: "array", items: { type: "string" } },
                  hunt_query: { type: "string" },
                  confidence: { type: "number" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      addProgress(`AI identified ${result.findings?.length || 0} findings — persisting tickets…`, "success");

      const saved = [];
      for (const finding of (result.findings || [])) {
        const ticket = await base44.entities.HuntTicket.create({
          ...finding,
          status: "open",
          source_data_summary: `Scan profile: ${profile.label}. Analyzed ${indicators.length} indicators, ${actors.length} actors, ${events.length} events.`,
        });
        saved.push(ticket);
        addProgress(`✓ Ticket created: ${finding.title}`, "success");
      }

      await queryClient.invalidateQueries({ queryKey: ["hunt-tickets"] });
      setResults({ ...result, ticketCount: saved.length });
      addProgress(`Hunt complete. ${saved.length} actionable intelligence tickets generated.`, "success");

    } catch (err) {
      addProgress(`Error: ${err.message}`, "error");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Profile Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {HUNT_PROFILES.map(p => {
          const Icon = p.icon;
          const isSelected = selectedProfile === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              disabled={scanning}
              className={`text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? "border-white/20 bg-white/5"
                  : "border-white/5 bg-[#111827] hover:border-white/10"
              }`}
              style={isSelected ? { borderColor: `${p.color}40`, background: `${p.color}08` } : {}}
            >
              <div className="p-2 rounded-lg w-fit mb-3" style={{ background: `${p.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: p.color }} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{p.label}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{p.description}</p>
              <p className="text-[10px] mt-2" style={{ color: p.color }}>~{p.estimatedTime}</p>
            </button>
          );
        })}
      </div>

      {/* Data Context */}
      <div className="flex items-center gap-4 p-3 bg-white/3 border border-white/5 rounded-lg flex-wrap">
        <Database className="w-4 h-4 text-gray-500 shrink-0" />
        <span className="text-xs text-gray-500">Data in scope:</span>
        <span className="text-xs text-gray-300">{indicators.length} indicators</span>
        <span className="text-xs text-gray-600">·</span>
        <span className="text-xs text-gray-300">{actors.length} threat actors</span>
        <span className="text-xs text-gray-600">·</span>
        <span className="text-xs text-gray-300">{events.length} events</span>
        <span className="text-xs text-gray-600">·</span>
        <span className="text-xs text-gray-300">{assets.length} assets</span>
      </div>

      {/* Launch */}
      <Button
        onClick={runScan}
        disabled={scanning}
        className="w-full bg-[#ff4757]/10 hover:bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30 gap-2 h-11"
      >
        {scanning
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Hunting in progress…</>
          : <><Crosshair className="w-4 h-4" /> Launch {HUNT_PROFILES.find(p => p.id === selectedProfile)?.label}</>
        }
      </Button>

      {/* Progress Log */}
      {progress.length > 0 && (
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
          {progress.map((p, i) => (
            <div key={i} className={`flex gap-3 ${
              p.type === "success" ? "text-[#2ed573]" : p.type === "error" ? "text-[#ff4757]" : "text-gray-400"
            }`}>
              <span className="text-gray-600 shrink-0">{p.ts}</span>
              <span>{p.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="bg-[#111827] border border-[#2ed573]/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-[#2ed573]" />
            <span className="text-sm font-bold text-white">Hunt Complete — {results.ticketCount} tickets generated</span>
            <Badge className={`text-[10px] ml-auto ${
              results.threat_level === "critical" ? "bg-[#ff4757]/10 text-[#ff4757] border-[#ff4757]/20" :
              results.threat_level === "high" ? "bg-[#ffa502]/10 text-[#ffa502] border-[#ffa502]/20" :
              "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20"
            } border`}>
              {results.threat_level?.toUpperCase()} THREAT LEVEL
            </Badge>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{results.scan_summary}</p>
          <Button
            onClick={onScanComplete}
            className="bg-[#2ed573]/10 hover:bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/20 gap-2 text-sm"
          >
            View Intelligence Tickets →
          </Button>
        </div>
      )}
    </div>
  );
}