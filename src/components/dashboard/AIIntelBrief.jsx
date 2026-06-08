import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Brain, RefreshCw, AlertTriangle, TrendingUp, Zap, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export default function AIIntelBrief({ indicators = [], feeds = [], events = [], assets = [] }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);

  const criticalAlerts = indicators.filter(i => i.severity === "critical" || i.severity === "high").slice(0, 5);
  const activeFeeds = feeds.filter(f => f.status === "active");

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are SENTINEL-AI, an intelligence analyst for the ASOSINT platform. 
Analyze the following threat intelligence snapshot and produce a concise operational brief.

ACTIVE FEEDS: ${activeFeeds.length} feeds active (${feeds.length} total)
TOTAL INDICATORS: ${indicators.length} (${criticalAlerts.length} critical/high severity)
OPERATIONAL EVENTS: ${events.length} recent events
MONITORED ASSETS: ${assets.length}

TOP CRITICAL INDICATORS:
${criticalAlerts.map(i => `- [${i.severity?.toUpperCase()}] ${i.title} (${i.indicator_type}) - Feed: ${i.feed_name || "Unknown"}`).join("\n") || "- No critical indicators at this time"}

RECENT EVENTS (last 10):
${events.slice(0, 10).map(e => `- [${e.severity}] ${e.title} | Domain: ${e.domain} | Status: ${e.status}`).join("\n") || "- No recent events"}

FEED CATEGORIES:
${[...new Set(feeds.map(f => f.feed_type))].join(", ") || "None configured"}

Produce a sharp, concise intelligence brief with:
1. executive_summary: 2-3 sentence situation overview for leadership (plain language, no jargon)
2. critical_alerts: array of up to 3 most urgent items, each with "title" and "why_it_matters" (1 sentence)
3. emerging_patterns: array of up to 3 trend observations across feeds, each with "pattern" and "implication"
4. recommended_actions: array of up to 3 prioritized actions for the analyst team, each as a string
5. threat_level: "LOW" | "GUARDED" | "ELEVATED" | "HIGH" | "CRITICAL"
6. confidence: number 0-100`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            critical_alerts: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, why_it_matters: { type: "string" } } }
            },
            emerging_patterns: {
              type: "array",
              items: { type: "object", properties: { pattern: { type: "string" }, implication: { type: "string" } } }
            },
            recommended_actions: { type: "array", items: { type: "string" } },
            threat_level: { type: "string" },
            confidence: { type: "number" },
          }
        }
      });
      setBrief(result);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to generate brief. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [indicators, feeds, events, assets]);

  const THREAT_LEVEL_COLORS = {
    LOW: "#2ed573", GUARDED: "#00d4ff", ELEVATED: "#ffa502",
    HIGH: "#ff6b35", CRITICAL: "#ff4757"
  };
  const levelColor = THREAT_LEVEL_COLORS[brief?.threat_level] || "#6b7280";

  return (
    <div className="bg-[#0d1220] border border-[#a855f7]/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-gradient-to-r from-[#a855f7]/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <Brain className="w-4 h-4 text-[#a855f7]" />
          <span className="text-sm font-bold text-white">AI Intelligence Brief</span>
          {brief && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border" style={{ color: levelColor, borderColor: `${levelColor}30`, background: `${levelColor}10` }}>
              {brief.threat_level}
            </span>
          )}
          {brief && (
            <span className="text-[11px] text-gray-600">Confidence: {brief.confidence}%</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {generated && (
            <button onClick={generate} disabled={loading} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          )}
          {brief && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {!generated && !loading && (
          <div className="text-center py-6 space-y-3">
            <Brain className="w-10 h-10 text-[#a855f7]/40 mx-auto" />
            <p className="text-sm text-gray-400">SENTINEL-AI will analyze your current intelligence picture and surface critical alerts, emerging patterns, and recommended actions.</p>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <button onClick={generate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#a855f7] hover:bg-[#a855f7]/80 text-white text-sm font-bold rounded-lg transition-colors">
              <Brain className="w-4 h-4" /> Generate AI Brief
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#a855f7]" />
            <span className="text-sm">Analyzing intelligence feeds...</span>
          </div>
        )}

        {brief && expanded && (
          <div className="space-y-5">
            {/* Executive Summary */}
            <div className="bg-white/3 border border-white/5 rounded-lg p-4">
              <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Executive Summary</p>
              <p className="text-sm text-gray-200 leading-relaxed">{brief.executive_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Critical Alerts */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff4757]" />
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest">Critical Alerts</p>
                </div>
                {brief.critical_alerts?.length > 0 ? brief.critical_alerts.map((a, i) => (
                  <div key={i} className="bg-[#ff4757]/5 border border-[#ff4757]/15 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-white">{a.title}</p>
                    <p className="text-[11px] text-gray-400 leading-snug">{a.why_it_matters}</p>
                  </div>
                )) : (
                  <p className="text-xs text-gray-600 italic">No critical alerts surfaced</p>
                )}
              </div>

              {/* Emerging Patterns */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#ffa502]" />
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest">Emerging Patterns</p>
                </div>
                {brief.emerging_patterns?.length > 0 ? brief.emerging_patterns.map((p, i) => (
                  <div key={i} className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-white">{p.pattern}</p>
                    <p className="text-[11px] text-gray-400 leading-snug">{p.implication}</p>
                  </div>
                )) : (
                  <p className="text-xs text-gray-600 italic">No patterns detected</p>
                )}
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#2ed573]" />
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest">Recommended Actions</p>
                </div>
                {brief.recommended_actions?.length > 0 ? brief.recommended_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-lg p-3">
                    <span className="text-[11px] font-black text-[#2ed573] bg-[#2ed573]/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-[11px] text-gray-300 leading-snug">{action}</p>
                  </div>
                )) : (
                  <p className="text-xs text-gray-600 italic">No actions recommended</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}