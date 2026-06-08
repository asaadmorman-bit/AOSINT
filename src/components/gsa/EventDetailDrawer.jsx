import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Tag, Zap, Users, AlertTriangle, Globe, TrendingUp, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";

const SEV_COLORS = {
  critical: "#ff1744", high: "#ff6d00", medium: "#ffd600",
  low: "#00b0ff", informational: "#546e7a",
};

const DOMAIN_COLORS = {
  cyber: "#00e5ff", geopolitical: "#ff1744", influence: "#d500f9",
  hybrid: "#ff9100", physical: "#ff5252", supply_chain: "#00e676",
};

function Section({ icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-white/5 pt-2 mt-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full mb-1.5 group">
        <div className="flex items-center gap-1.5">
          <span className="text-[#00e5ff]/60">{icon}</span>
          <span className="text-[8px] font-black tracking-[0.2em] text-gray-600 uppercase group-hover:text-gray-400 transition-colors">{title}</span>
        </div>
        {open ? <ChevronUp className="w-2.5 h-2.5 text-gray-700" /> : <ChevronDown className="w-2.5 h-2.5 text-gray-700" />}
      </button>
      {open && children}
    </div>
  );
}

function Fact({ label, value, color }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-2 py-0.5">
      <span className="text-[8px] text-gray-700 shrink-0">{label}</span>
      <span className="text-[9px] text-right" style={{ color: color || "#94a3b8" }}>{value}</span>
    </div>
  );
}

function FactList({ items, color }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-0.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[9px]" style={{ color: color || "#64748b" }}>
          <span className="mt-0.5 shrink-0" style={{ color: "#00e5ff" }}>›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function EventDetailDrawer({ event, onClose }) {
  const [aiDeepDive, setAiDeepDive] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState("intel");

  if (!event) return null;

  const sevColor = SEV_COLORS[event.severity] || "#aaa";
  const domColor = DOMAIN_COLORS[event.domain] || sevColor;

  const fetchDeepDive = async () => {
    setAiLoading(true);
    setTab("deepdive");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Eye of Shauntze — a senior global intelligence analyst. Provide a comprehensive deep-dive analysis on this event:

TITLE: ${event.title}
DOMAIN: ${event.domain}
SEVERITY: ${event.severity}
REGION: ${event.region || "Unknown"}
DESCRIPTION: ${event.description}
PARTIES: ${JSON.stringify(event.parties_involved || event.related_actors || [])}
KEY FACTS: ${JSON.stringify(event.key_facts || [])}

Provide:
1. commander_assessment: 3-4 sentence current situation assessment
2. historical_context: 2-3 sentences on how this developed
3. key_actors: array of 4 key actors/parties with their role/position
4. risk_trajectory: "ESCALATING" | "STABLE" | "DE-ESCALATING" | "UNCERTAIN"  
5. regional_impacts: array of 3 nearby regions affected and how
6. watch_indicators: array of 4 specific things to monitor for escalation
7. recommended_actions: array of 3 actionable intelligence recommendations
8. related_conflicts: array of 2-3 related events/conflicts globally`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          commander_assessment: { type: "string" },
          historical_context: { type: "string" },
          key_actors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" } } } },
          risk_trajectory: { type: "string" },
          regional_impacts: { type: "array", items: { type: "string" } },
          watch_indicators: { type: "array", items: { type: "string" } },
          recommended_actions: { type: "array", items: { type: "string" } },
          related_conflicts: { type: "array", items: { type: "string" } },
        }
      }
    });
    setAiDeepDive(res);
    setAiLoading(false);
  };

  const TRAJ_COLOR = { ESCALATING: "#ff1744", STABLE: "#ffd600", "DE-ESCALATING": "#00e676", UNCERTAIN: "#ff9100" };

  return (
    <div
      className="absolute bottom-[40px] left-[130px] right-[290px] z-[2000] flex flex-col"
      style={{
        background: "rgba(2,5,9,0.98)",
        border: `1px solid ${sevColor}30`,
        backdropFilter: "blur(24px)",
        boxShadow: `0 0 40px ${sevColor}18, 0 -1px 0 ${sevColor}25`,
        fontFamily: "ui-monospace, 'SF Mono', monospace",
        maxHeight: "52vh",
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3 p-3 shrink-0" style={{ borderBottom: `1px solid ${sevColor}20` }}>
        <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: sevColor, boxShadow: `0 0 8px ${sevColor}` }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 tracking-widest"
              style={{ color: sevColor, background: sevColor + "15", border: `1px solid ${sevColor}35` }}>
              {event.severity}
            </span>
            <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: domColor }}>{event.domain}</span>
            {event._layer && <span className="text-[8px] text-gray-700 uppercase">{event._layer?.replace(/_/g, " ")}</span>}
            {event.source && <span className="text-[8px] text-gray-700">SRC: {event.source}</span>}
            {event.region && (
              <span className="flex items-center gap-1 text-[8px] text-gray-600">
                <MapPin className="w-2 h-2" />{event.region}
              </span>
            )}
          </div>
          <h2 className="text-[13px] font-bold text-white leading-tight">{event.title}</h2>
          {event.description && <p className="text-[10px] text-gray-500 leading-relaxed mt-1 line-clamp-2">{event.description}</p>}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Deep dive button */}
          <button onClick={fetchDeepDive} disabled={aiLoading}
            className="flex items-center gap-1 px-2 py-1 rounded-sm text-[8px] font-bold tracking-widest transition-all"
            style={{ background: "#00e5ff15", color: "#00e5ff", border: "1px solid #00e5ff30" }}>
            <Zap className="w-2.5 h-2.5" />
            {aiLoading ? "ANALYZING..." : "DEEP DIVE"}
          </button>
          <button onClick={onClose} className="text-gray-700 hover:text-white transition-colors p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {["intel", "deepdive"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-[8px] font-bold tracking-widest transition-all ${
              tab === t ? "text-[#00e5ff] border-b border-[#00e5ff]" : "text-gray-700 hover:text-gray-500"
            }`}>
            {t === "intel" ? "INTEL SUMMARY" : "AI DEEP DIVE"}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {tab === "intel" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0">

            {/* Col 1: Core facts */}
            <div>
              <Fact label="COORDINATES" value={`${event.lat?.toFixed(3)}° · ${event.lng?.toFixed(3)}°`} />
              {event.timestamp && (
                <Fact label="TIMESTAMP" value={formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })} />
              )}
              {event.event_type && <Fact label="EVENT TYPE" value={event.event_type} />}
              {event.casualties && <Fact label="CASUALTIES" value={event.casualties} color="#ff6d00" />}
              {event.current_phase && <Fact label="PHASE" value={event.current_phase} color="#00e5ff" />}
              {event.affected_population && <Fact label="AFFECTED POP" value={event.affected_population} color="#ff9100" />}
              {event.response_status && <Fact label="RESPONSE" value={event.response_status} color="#00e676" />}
              {event.threat_actor && <Fact label="THREAT ACTOR" value={event.threat_actor} color="#ff1744" />}
              {event.attribution && <Fact label="ATTRIBUTION" value={event.attribution} color="#ff6d00" />}
              {event.economic_impact && <Fact label="ECON IMPACT" value={event.economic_impact} color="#ffd600" />}
            </div>

            {/* Col 2: Parties + significance */}
            <div>
              {event.parties_involved?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">PARTIES INVOLVED</div>
                  {event.parties_involved.map((p, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-center gap-1">
                      <span style={{ color: "#00e5ff" }}>›</span>{p}
                    </div>
                  ))}
                </div>
              )}
              {event.related_actors?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">RELATED ACTORS</div>
                  {event.related_actors.map((a, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-center gap-1">
                      <span style={{ color: "#d500f9" }}>›</span>{a}
                    </div>
                  ))}
                </div>
              )}
              {event.affected_sectors?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">SECTORS AFFECTED</div>
                  {event.affected_sectors.map((s, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-center gap-1">
                      <span style={{ color: "#ffd600" }}>›</span>{s}
                    </div>
                  ))}
                </div>
              )}
              {event.ttps?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">TTPs</div>
                  {event.ttps.slice(0,4).map((t, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-center gap-1">
                      <span style={{ color: "#ff1744" }}>›</span>{t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 3: Key facts + geopolitical significance */}
            <div>
              {event.key_facts?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">KEY FACTS</div>
                  {event.key_facts.map((f, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-start gap-1 mb-0.5">
                      <span className="shrink-0 mt-0.5" style={{ color: "#00ff88" }}>›</span>{f}
                    </div>
                  ))}
                </div>
              )}
              {event.recent_developments?.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">RECENT DEVELOPMENTS</div>
                  {event.recent_developments.slice(0,3).map((d, i) => (
                    <div key={i} className="text-[9px] text-gray-400 flex items-start gap-1 mb-0.5">
                      <span className="shrink-0 mt-0.5" style={{ color: "#ffd600" }}>›</span>{d}
                    </div>
                  ))}
                </div>
              )}
              {event.geopolitical_significance && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">GEO SIGNIFICANCE</div>
                  <div className="text-[9px] text-gray-500 leading-relaxed">{event.geopolitical_significance}</div>
                </div>
              )}
              {event.strategic_implications && (
                <div className="mb-2">
                  <div className="text-[8px] text-gray-700 tracking-widest mb-1">STRATEGIC IMPLICATIONS</div>
                  <div className="text-[9px] text-gray-500 leading-relaxed">{event.strategic_implications}</div>
                </div>
              )}
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.tags.map((t, i) => (
                    <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-sm bg-white/4 text-gray-600 border border-white/6">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "deepdive" && (
          <div>
            {aiLoading && (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="w-4 h-4 border border-[#00e5ff]/30 border-t-[#00e5ff] rounded-full animate-spin" />
                <span className="text-[10px] text-[#00e5ff]/60 animate-pulse tracking-widest">EYE OF SHAUNTZE ANALYZING…</span>
              </div>
            )}
            {!aiLoading && !aiDeepDive && (
              <div className="text-center py-8">
                <div className="text-[10px] text-gray-600 mb-3">Click DEEP DIVE for AI-powered intelligence analysis</div>
                <button onClick={fetchDeepDive}
                  className="px-4 py-2 text-[9px] font-bold tracking-widest"
                  style={{ background: "#00e5ff15", color: "#00e5ff", border: "1px solid #00e5ff30" }}>
                  LAUNCH ANALYSIS
                </button>
              </div>
            )}
            {!aiLoading && aiDeepDive && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
                <div className="col-span-2 sm:col-span-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[8px] font-black tracking-widest text-gray-600">COMMANDER'S ASSESSMENT</div>
                    {aiDeepDive.risk_trajectory && (
                      <span className="text-[8px] font-black px-2 py-0.5 tracking-widest"
                        style={{ color: TRAJ_COLOR[aiDeepDive.risk_trajectory] || "#ffd600", border: `1px solid ${TRAJ_COLOR[aiDeepDive.risk_trajectory] || "#ffd600"}40` }}>
                        {aiDeepDive.risk_trajectory}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{aiDeepDive.commander_assessment}</p>
                </div>

                <div>
                  {aiDeepDive.historical_context && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1">HISTORICAL CONTEXT</div>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{aiDeepDive.historical_context}</p>
                    </div>
                  )}
                  {aiDeepDive.key_actors?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1.5">KEY ACTORS</div>
                      {aiDeepDive.key_actors.map((a, i) => (
                        <div key={i} className="flex items-start gap-1.5 mb-1">
                          <span className="text-[8px] font-black mt-0.5" style={{ color: "#00e5ff" }}>›</span>
                          <div><div className="text-[9px] text-white">{a.name}</div><div className="text-[8px] text-gray-600">{a.role}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  {aiDeepDive.regional_impacts?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1">REGIONAL IMPACTS</div>
                      <FactList items={aiDeepDive.regional_impacts} color="#ff9100" />
                    </div>
                  )}
                  {aiDeepDive.related_conflicts?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1">RELATED EVENTS</div>
                      <FactList items={aiDeepDive.related_conflicts} color="#d500f9" />
                    </div>
                  )}
                </div>

                <div>
                  {aiDeepDive.watch_indicators?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1">WATCH INDICATORS</div>
                      <FactList items={aiDeepDive.watch_indicators} color="#ffd600" />
                    </div>
                  )}
                  {aiDeepDive.recommended_actions?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[8px] text-gray-700 tracking-widest mb-1">RECOMMENDED ACTIONS</div>
                      <FactList items={aiDeepDive.recommended_actions} color="#00e676" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}