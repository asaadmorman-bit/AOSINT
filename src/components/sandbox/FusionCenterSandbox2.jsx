import React, { useState, useMemo } from "react";
import { Brain, Link2, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreatContext } from "./ThreatContext";

const MOCK_CORRELATIONS = [
  {
    id: 1,
    title: "Coordinated C2 Infrastructure",
    indicators: ["192.168.1.105", "suspicious-domain.ru", "APT-28"],
    confidence: 92,
    domains: ["cyber"],
    insight: "Three cyber indicators strongly correlated with known APT-28 infrastructure patterns",
  },
  {
    id: 2,
    title: "Multi-Domain Campaign",
    indicators: ["Operation Stealth", "192.168.1.105", "Unknown Staging Area"],
    confidence: 78,
    domains: ["cyber", "physical", "influence"],
    insight: "Cross-domain correlation suggests coordinated cyber attack with physical preparation",
  },
  {
    id: 3,
    title: "Attribution Cluster",
    indicators: ["APT-28 (Fancy Bear)", "Eastern Europe", "C2 Pattern"],
    confidence: 85,
    domains: ["cyber"],
    insight: "Historical patterns and TTPs align with known APT-28 operational signatures",
  },
];

export default function FusionCenterSandbox({ onAnalyzeNext, hideActionButtons = false }) {
  const { selectedThreat, addCorrelation } = useThreatContext();
  const [selectedCorrelation, setSelectedCorrelation] = useState(MOCK_CORRELATIONS[0]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const relevantCorrelations = useMemo(() => {
    if (!selectedThreat) return MOCK_CORRELATIONS;
    
    return MOCK_CORRELATIONS.filter(corr => 
      corr.indicators.some(ind => ind.toLowerCase().includes(selectedThreat.value.toLowerCase()))
    );
  }, [selectedThreat]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#2ed573]/10 border border-[#00d4ff]/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Brain className="w-6 h-6 text-[#00d4ff] flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-2">Fusion Center - Interactive Demo</h3>
            <p className="text-gray-300 text-sm">
              {selectedThreat 
                ? `Analyzing context for "${selectedThreat.value}". Watch how ASOINT correlates this threat across domains to reveal patterns invisible to traditional tools.`
                : "Watch how ASOINT correlates indicators across domains to reveal patterns invisible to traditional tools. This demo shows automated and analyst-driven fusion in action."
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wide">
          Detected Correlations {relevantCorrelations.length < MOCK_CORRELATIONS.length && `(${relevantCorrelations.length} relevant)`}
        </h3>
        {relevantCorrelations.map(correlation => (
          <button
            key={correlation.id}
            onClick={() => {
              setSelectedCorrelation(correlation);
              setShowAnalysis(false);
            }}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              selectedCorrelation.id === correlation.id
                ? "bg-[#00d4ff]/20 border border-[#00d4ff]/40"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold">{correlation.title}</h4>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-[#2ed573]" />
                <span className="text-sm font-bold text-[#2ed573]">{correlation.confidence}%</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {correlation.indicators.map((indicator, idx) => (
                <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded">
                  {indicator}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">{selectedCorrelation.title}</h3>

        <div className="space-y-4">
          <div>
            <p className="text-gray-500 text-sm mb-2">Indicators in Correlation</p>
            <div className="flex flex-wrap gap-2">
              {selectedCorrelation.indicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-lg px-3 py-2"
                >
                  <Link2 className="w-3 h-3 text-[#00d4ff]" />
                  <span className="text-sm">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-sm mb-2">Domains Involved</p>
            <div className="flex flex-wrap gap-2">
              {selectedCorrelation.domains.map((domain, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-white text-sm capitalize">
                  {domain}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-sm mb-2">Confidence Score</p>
            <div className="space-y-2">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#00d4ff] h-2 rounded-full transition-all"
                  style={{ width: `${selectedCorrelation.confidence}%` }}
                />
              </div>
              <p className="text-sm font-bold">{selectedCorrelation.confidence}% Match Confidence</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-gray-500 text-sm mb-2">Intelligence Insight</p>
            <p className="text-gray-300">{selectedCorrelation.insight}</p>
          </div>

          {!showAnalysis && (
            <div className="pt-4 grid grid-cols-2 gap-3">
              <Button
                onClick={() => setShowAnalysis(true)}
                className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20"
              >
                View Analysis
              </Button>
              {!hideActionButtons && onAnalyzeNext && (
                <Button
                  onClick={() => {
                    addCorrelation(selectedCorrelation);
                    onAnalyzeNext();
                  }}
                  className="bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00d4ff]/90 flex items-center justify-center gap-2"
                >
                  Forecast Scenario <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {hideActionButtons && (
                <Button className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10">
                  Export Report
                </Button>
              )}
            </div>
          )}

          {showAnalysis && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3 bg-white/5 p-4 rounded-lg">
              <h4 className="font-bold text-sm">Detailed Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✓ Pattern matches APT-28 known tactics and procedures</li>
                <li>✓ Infrastructure overlap with previous campaigns detected</li>
                <li>✓ Timeline correlates with geopolitical events</li>
                <li>✓ Cross-domain signals suggest coordinated operation</li>
                <li>✓ Physical staging area consistent with cyber operations window</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}