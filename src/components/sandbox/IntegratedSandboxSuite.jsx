import React, { useState } from "react";
import { ThreatContextProvider, useThreatContext } from "./ThreatContext";
import ThreatObservatorySandbox from "./ThreatObservatorySandbox";
import FusionCenterSandbox from "./FusionCenterSandbox";
import ScenarioEngineSandbox from "./ScenarioEngineSandbox";
import { ChevronRight } from "lucide-react";

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-bold transition-all ${
        active
          ? "bg-[#00d4ff] text-[#0a0e1a]"
          : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function IntegratedSandboxContent() {
  const [activeTab, setActiveTab] = useState("observatory");
  const { selectedThreat, correlationHistory } = useThreatContext();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">ASOINT Integrated Demo Suite</h2>
        <p className="text-gray-400 max-w-2xl">
          Experience how ASOINT's modules work together seamlessly. Start by exploring threats in the Observatory, 
          then watch as context flows automatically to the Fusion Center for correlation, and finally to the Scenario Engine for forecasting.
        </p>
      </div>

      {/* Progress Flow */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${selectedThreat ? "bg-[#2ed573] text-[#0a0e1a]" : "bg-white/10 text-gray-400"}`}>
            ✓
          </div>
          <p className="text-sm font-bold">Observatory</p>
        </div>
        <ChevronRight className={`w-4 h-4 ${selectedThreat ? "text-[#2ed573]" : "text-gray-600"}`} />
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${correlationHistory.length > 0 ? "bg-[#2ed573] text-[#0a0e1a]" : "bg-white/10 text-gray-400"}`}>
            ✓
          </div>
          <p className="text-sm font-bold">Fusion Center</p>
        </div>
        <ChevronRight className={`w-4 h-4 ${correlationHistory.length > 0 ? "text-[#2ed573]" : "text-gray-600"}`} />
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${correlationHistory.length > 0 ? "bg-[#2ed573] text-[#0a0e1a]" : "bg-white/10 text-gray-400"}`}>
            3
          </div>
          <p className="text-sm font-bold">Scenario Engine</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 border-b border-white/5 pb-4">
        <TabButton active={activeTab === "observatory"} onClick={() => setActiveTab("observatory")}>
          1. Threat Observatory
        </TabButton>
        <TabButton active={activeTab === "fusion"} onClick={() => setActiveTab("fusion")} disabled={!selectedThreat}>
          2. Fusion Center
        </TabButton>
        <TabButton active={activeTab === "scenario"} onClick={() => setActiveTab("scenario")} disabled={!selectedThreat}>
          3. Scenario Engine
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        {activeTab === "observatory" && (
          <ThreatObservatorySandbox
            onAnalyzeNext={() => setActiveTab("fusion")}
            hideActionButtons={false}
          />
        )}
        {activeTab === "fusion" && (
          <FusionCenterSandbox
            onAnalyzeNext={() => setActiveTab("scenario")}
            hideActionButtons={false}
          />
        )}
        {activeTab === "scenario" && (
          <ScenarioEngineSandbox hideActionButtons={true} />
        )}
      </div>

      {/* Integration Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="font-bold mb-2 text-sm">Observable</h4>
          <p className="text-xs text-gray-400">
            Select a threat indicator and watch it automatically populate downstream modules with full context.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="font-bold mb-2 text-sm">Dynamic Filtering</h4>
          <p className="text-xs text-gray-400">
            Each module filters and prioritizes data relevant to your selected threat, reducing noise.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h4 className="font-bold mb-2 text-sm">Unified Analysis</h4>
          <p className="text-xs text-gray-400">
            Context flows seamlessly: Observatory → Fusion → Scenario for end-to-end threat analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IntegratedSandboxSuite() {
  return (
    <ThreatContextProvider>
      <IntegratedSandboxContent />
    </ThreatContextProvider>
  );
}