import React, { useState } from "react";
import { Globe2, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreatContext } from "./ThreatContext";

const MOCK_THREATS = [
  { id: 1, type: "ip_address", value: "192.168.1.105", severity: "high", domain: "cyber", region: "North America", indicator: "C2 Command & Control" },
  { id: 2, type: "domain", value: "suspicious-domain.ru", severity: "critical", domain: "cyber", region: "Eastern Europe", indicator: "Malware Distribution" },
  { id: 3, type: "actor", value: "APT-28 (Fancy Bear)", severity: "critical", domain: "cyber", region: "Russia", indicator: "Attribution" },
  { id: 4, type: "campaign", value: "Operation Stealth", severity: "high", domain: "influence", region: "Global", indicator: "Narrative Campaign" },
  { id: 5, type: "physical_location", value: "Unknown Staging Area", severity: "medium", domain: "physical", region: "Middle East", indicator: "Asset Location" },
];

export default function ThreatObservatorySandbox({ onAnalyzeNext, hideActionButtons = false }) {
  const { selectedThreat: contextThreat, updateThreat } = useThreatContext();
  const [localThreat, setLocalThreat] = useState(MOCK_THREATS[0]);
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const selectedThreat = contextThreat || localThreat;

  const handleSelectThreat = (threat) => {
    setLocalThreat(threat);
    updateThreat(threat);
  };

  const filteredThreats = MOCK_THREATS.filter(threat => {
    const domainMatch = filterDomain === "all" || threat.domain === filterDomain;
    const severityMatch = filterSeverity === "all" || threat.severity === filterSeverity;
    return domainMatch && severityMatch;
  });

  const getSeverityColor = (severity) => {
    if (severity === "critical") return "#ff4757";
    if (severity === "high") return "#ffa502";
    return "#2ed573";
  };

  const getSeverityLabel = (severity) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#2ed573]/10 border border-[#00d4ff]/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Globe2 className="w-6 h-6 text-[#00d4ff] flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-2">Global Threat Observatory - Interactive Demo</h3>
            <p className="text-gray-300 text-sm">
              Explore real-time threat observations across cyber, physical, influence, and geopolitical domains. 
              This demo shows how ASOINT surfaces threats from a unified global view.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-sm text-gray-400 block mb-2">Domain</label>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All Domains</option>
            <option value="cyber">Cyber</option>
            <option value="physical">Physical</option>
            <option value="influence">Influence</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-400 block mb-2">Severity</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredThreats.map(threat => (
            <button
              key={threat.id}
              onClick={() => handleSelectThreat(threat)}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                selectedThreat.id === threat.id
                  ? "bg-[#00d4ff]/20 border border-[#00d4ff]/40"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{threat.value}</p>
                  <p className="text-xs text-gray-400">{threat.indicator}</p>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ color: getSeverityColor(threat.severity), backgroundColor: getSeverityColor(threat.severity) + "20" }}
                >
                  {getSeverityLabel(threat.severity)}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">{selectedThreat.value}</h3>

          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm mb-1">Type</p>
              <p className="text-white capitalize">{selectedThreat.type.replace(/_/g, " ")}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Domain</p>
              <p className="text-white capitalize">{selectedThreat.domain}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Severity</p>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" style={{ color: getSeverityColor(selectedThreat.severity) }} />
                <p className="text-white">{getSeverityLabel(selectedThreat.severity)}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Indicator</p>
              <p className="text-white">{selectedThreat.indicator}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Region</p>
              <p className="text-white">{selectedThreat.region}</p>
            </div>

            {!hideActionButtons && (
              <div className="pt-4 border-t border-white/5 space-y-2">
                <Button className="w-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
                  View Full Details
                </Button>
                {onAnalyzeNext && (
                  <Button
                    onClick={onAnalyzeNext}
                    className="w-full bg-[#00d4ff] text-[#0a0e1a] hover:bg-[#00d4ff]/90 flex items-center justify-center gap-2"
                  >
                    Analyze in Fusion Center <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#00d4ff]">{MOCK_THREATS.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Observations</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">2</p>
          <p className="text-xs text-gray-400 mt-1">Critical Threats</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#2ed573]">5</p>
          <p className="text-xs text-gray-400 mt-1">Domains Covered</p>
        </div>
      </div>
    </div>
  );
}