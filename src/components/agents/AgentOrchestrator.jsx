import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, CheckCircle2, AlertCircle, Clock, Cpu, ChevronDown, ChevronUp } from "lucide-react";

const AGENT_TYPES = [
  { id: "osint_collector", label: "OSINT Collector", color: "#00d4ff", desc: "Aggregate open-source intelligence" },
  { id: "sigint_correlator", label: "SIGINT Correlator", color: "#ffa502", desc: "Signals correlation & pattern detection" },
  { id: "humint_processor", label: "HUMINT Processor", color: "#ff4757", desc: "Source assessment & intent analysis" },
  { id: "threat_modeler", label: "Threat Modeler", color: "#a855f7", desc: "Custom threat model generation" },
  { id: "defense_advisor", label: "Defense Advisor", color: "#2ed573", desc: "Autonomous defensive recommendations" },
  { id: "scenario_runner", label: "Scenario Runner", color: "#ff6b35", desc: "Wargame & adversary simulation" },
];

export default function AgentOrchestrator({ scenario, onComplete }) {
  const [agentLogs, setAgentLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState({});

  const runOrchestration = async () => {
    if (!scenario || running) return;
    setRunning(true);
    setAgentLogs([]);

    const addLog = (agentId, status, message, result = null) => {
      setAgentLogs(prev => {
        const existing = prev.findIndex(l => l.agentId === agentId);
        const entry = { agentId, status, message, result, timestamp: new Date().toLocaleTimeString() };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = entry;
          return updated;
        }
        return [...prev, entry];
      });
    };

    // Sequential multi-step agent chain
    for (const agent of AGENT_TYPES) {
      addLog(agent.id, "running", `${agent.label} initializing...`);

      const prompt = `You are the ${agent.label} agent in a multi-agent intelligence system.

Scenario: ${scenario.title}
Type: ${scenario.scenario_type}
Domain: ${scenario.domain}
Conflict Level: ${scenario.conflict_level || "below_threshold"}
Threat Actor: ${scenario.threat_actor || "Unknown APT"}

Your specific role (${agent.label}): ${agent.desc}

Execute your role for this scenario. Provide:
1. Specific findings from your domain
2. How your output feeds the next agent
3. Key intelligence gaps
4. Confidence level (0-100)

Be specific, technical, and actionable. 2-3 sentences per point.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            findings: { type: "array", items: { type: "string" } },
            handoff_to_next: { type: "string" },
            gaps: { type: "array", items: { type: "string" } },
            confidence: { type: "number" }
          }
        }
      });

      addLog(agent.id, "complete", `${agent.label} completed`, result);
    }

    setRunning(false);
    if (onComplete) onComplete(agentLogs);
  };

  const statusIcon = (status) => {
    if (status === "running") return <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ffa502]" />;
    if (status === "complete") return <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />;
    if (status === "error") return <AlertCircle className="w-3.5 h-3.5 text-[#ff4757]" />;
    return <Clock className="w-3.5 h-3.5 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#a855f7]" />
          <span className="text-sm font-bold text-gray-300">Agent Orchestration Chain</span>
          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
            {AGENT_TYPES.length} Agents
          </Badge>
        </div>
        <Button onClick={runOrchestration} disabled={running || !scenario}
          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 gap-2 h-8 text-xs">
          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {running ? "Running..." : "Execute Chain"}
        </Button>
      </div>

      {/* Agent pipeline visualization */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {AGENT_TYPES.map((agent, i) => {
          const log = agentLogs.find(l => l.agentId === agent.id);
          return (
            <React.Fragment key={agent.id}>
              <div className="flex flex-col items-center gap-1 min-w-[72px]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
                  style={{
                    background: log?.status === "complete" ? `${agent.color}15` : log?.status === "running" ? `${agent.color}25` : "rgba(255,255,255,0.03)",
                    borderColor: log?.status ? `${agent.color}40` : "rgba(255,255,255,0.06)"
                  }}>
                  {statusIcon(log?.status)}
                </div>
                <span className="text-[9px] text-center text-gray-500 leading-tight">{agent.label.split(" ")[0]}</span>
              </div>
              {i < AGENT_TYPES.length - 1 && (
                <div className="w-4 h-px mt-[-12px]"
                  style={{ background: agentLogs.findIndex(l => l.agentId === agent.id) >= 0 ? agent.color : "rgba(255,255,255,0.08)" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Logs */}
      {agentLogs.length > 0 && (
        <div className="space-y-2">
          {agentLogs.map(log => {
            const agent = AGENT_TYPES.find(a => a.id === log.agentId);
            const isExpanded = expanded[log.agentId];
            return (
              <div key={log.agentId} className="bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                  onClick={() => setExpanded(e => ({ ...e, [log.agentId]: !e[log.agentId] }))}
                >
                  {statusIcon(log.status)}
                  <span className="text-xs font-medium text-gray-300 flex-1">{agent?.label}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{log.timestamp}</span>
                  {log.result && (
                    <span className="text-[10px] font-bold" style={{ color: agent?.color }}>
                      {log.result.confidence}% conf
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                </button>
                {isExpanded && log.result && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {log.result.findings?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Findings</p>
                        <ul className="space-y-1">
                          {log.result.findings.map((f, i) => (
                            <li key={i} className="text-xs text-gray-400 flex gap-2">
                              <span style={{ color: agent?.color }}>▸</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {log.result.gaps?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Intelligence Gaps</p>
                        <ul className="space-y-1">
                          {log.result.gaps.map((g, i) => (
                            <li key={i} className="text-xs text-gray-500 flex gap-2">
                              <span className="text-[#ffa502]">◦</span>{g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {log.result.handoff_to_next && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Handoff</p>
                        <p className="text-xs text-[#00d4ff]">{log.result.handoff_to_next}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}