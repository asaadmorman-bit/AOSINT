import React, { useState, useMemo } from "react";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreatContext } from "./ThreatContext";

const MOCK_SCENARIOS = [
  {
    id: 1,
    title: "Cyber Escalation",
    threat: "APT-28 C2 Expansion",
    currentStatus: "Active Probing",
    days: 0,
    path: [
      { day: 0, event: "Initial C2 probe detected", impact: "Low", likelihood: 100 },
      { day: 3, event: "Second-stage payload staging", impact: "Medium", likelihood: 78 },
      { day: 7, event: "Lateral movement begins", impact: "High", likelihood: 62 },
      { day: 14, event: "Data exfiltration window", impact: "Critical", likelihood: 45 },
    ],
  },
  {
    id: 2,
    title: "Influence Campaign",
    threat: "Operation Stealth Narrative Surge",
    currentStatus: "Dormant",
    days: 0,
    path: [
      { day: 0, event: "Campaign dormant (baseline)", impact: "Low", likelihood: 100 },
      { day: 2, event: "First coordinated posts detected", impact: "Medium", likelihood: 72 },
      { day: 5, event: "Narrative amplification accelerates", impact: "High", likelihood: 58 },
      { day: 10, event: "Peak engagement, policy impact", impact: "Critical", likelihood: 35 },
    ],
  },
  {
    id: 3,
    title: "Hybrid Convergence",
    threat: "Coordinated Cyber + Physical + Influence",
    currentStatus: "Converging",
    days: 0,
    path: [
      { day: 0, event: "All domains showing activity", impact: "High", likelihood: 100 },
      { day: 4, event: "Timing coordination confirmed", impact: "Critical", likelihood: 85 },
      { day: 8, event: "Maximum impact window", impact: "Critical", likelihood: 72 },
      { day: 12, event: "Escalation or wind-down phase", impact: "High", likelihood: 55 },
    ],
  },
];

export default function ScenarioEngineSandbox({ hideActionButtons = false }) {
  const { selectedThreat, correlationHistory } = useThreatContext();
  const [selectedScenario, setSelectedScenario] = useState(MOCK_SCENARIOS[0]);
  const [expandedStep, setExpandedStep] = useState(0);

  const relevantScenarios = useMemo(() => {
    if (!selectedThreat) return MOCK_SCENARIOS;
    
    const threatDomain = selectedThreat.domain;
    if (threatDomain === "cyber") {
      return [MOCK_SCENARIOS[0], MOCK_SCENARIOS[2]];
    } else if (threatDomain === "influence") {
      return [MOCK_SCENARIOS[1], MOCK_SCENARIOS[2]];
    } else if (threatDomain === "physical") {
      return [MOCK_SCENARIOS[2]];
    }
    
    return MOCK_SCENARIOS;
  }, [selectedThreat]);

  const getImpactColor = (impact) => {
    if (impact === "Critical") return "#ff4757";
    if (impact === "High") return "#ffa502";
    if (impact === "Medium") return "#00d4ff";
    return "#2ed573";
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#2ed573]/10 border border-[#00d4ff]/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Zap className="w-6 h-6 text-[#00d4ff] flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-2">Scenario Engine - Interactive Demo</h3>
            <p className="text-gray-300 text-sm">
              {selectedThreat 
                ? `Forecasting escalation scenarios for "${selectedThreat.value}" based on correlated intelligence. Explore how this threat may escalate across 14-day windows.`
                : "Forecast threat escalation across 14-day windows. Explore how threats converge across domains and test defensive strategies with simulated red/blue cell exercises."
              }
            </p>
            {correlationHistory.length > 0 && (
              <p className="text-[#2ed573] text-xs mt-2">
                ✓ {correlationHistory.length} correlation(s) integrated into forecast
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relevantScenarios.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => setSelectedScenario(scenario)}
            className={`p-4 rounded-lg text-left transition-all ${
              selectedScenario.id === scenario.id
                ? "bg-[#00d4ff]/20 border border-[#00d4ff]/40"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <h4 className="font-bold mb-2">{scenario.title}</h4>
            <p className="text-xs text-gray-400 mb-3">{scenario.threat}</p>
            <p className="text-xs px-2 py-1 rounded-full bg-white/10 inline-block">{scenario.currentStatus}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">{selectedScenario.title}</h3>
          <p className="text-gray-400 text-sm">Threat: {selectedScenario.threat}</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wide mb-4">14-Day Escalation Forecast</h4>

          {selectedScenario.path.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setExpandedStep(expandedStep === idx ? -1 : idx)}
              className={`w-full p-4 rounded-lg text-left border transition-all ${
                expandedStep === idx
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">Day {step.day}</span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: getImpactColor(step.impact) + "20", color: getImpactColor(step.impact) }}>
                      {step.impact} Impact
                    </span>
                  </div>
                  <p className="text-white font-bold">{step.event}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Likelihood</p>
                  <p className="font-bold text-[#00d4ff]">{step.likelihood}%</p>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-1">
                <div
                  className="bg-[#00d4ff] h-1 rounded-full"
                  style={{ width: `${step.likelihood}%` }}
                />
              </div>

              {expandedStep === idx && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="space-y-3 text-sm text-gray-300">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Defensive Implications</p>
                      <p>
                        {idx === 0 && "Early detection window. Begin elevated monitoring of infrastructure indicators."}
                        {idx === 1 && "Increase incident response readiness. Stage containment teams and backup systems."}
                        {idx === 2 && "Activate full incident response. Assume breach and begin forensics."}
                        {idx === 3 && "Maximize data protection and coordinate with stakeholders on disclosure."}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Recommended Actions</p>
                      <ul className="space-y-1">
                        <li>✓ Increase log aggregation and review</li>
                        <li>✓ Monitor threat intelligence feeds</li>
                        <li>✓ Test backup and restoration procedures</li>
                        <li>✓ Brief leadership on timeline</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <Button className="w-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
            Launch Red/Blue Cell Exercise
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-[#ff4757] flex-shrink-0 mt-0.5" />
            <h4 className="font-bold text-sm">Critical Window</h4>
          </div>
          <p className="text-xs text-gray-300">Maximum convergence between days 7-10. Prepare for peak incident load during this period.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#00d4ff] flex-shrink-0 mt-0.5" />
            <h4 className="font-bold text-sm">Escalation Indicators</h4>
          </div>
          <p className="text-xs text-gray-300">Monitor infrastructure changes, social media velocity, and physical movements as leading indicators.</p>
        </div>
      </div>
    </div>
  );
}