import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Play, BookOpen, Zap, Layers, Search, Plus, Copy,
  Clock, Target, Lightbulb, AlertTriangle, CheckCircle2,
  ChevronRight, Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

const REAL_WORLD_CASES = [
  {
    id: "solarwinds-2020",
    title: "SolarWinds Supply Chain Attack (2020)",
    description: "Nation-state compromise of SolarWinds Orion platform, affecting 18,000+ customers including US government",
    threat_actor: "APT-Nexus",
    attack_vector: "supply-chain",
    difficulty: "advanced",
    impact: "critical",
    year: "2020",
    lessons: ["Supply chain attacks are stealthier than direct attacks", "Trust boundaries must be continually verified", "Detection takes months"],
    ttps: ["T1195 - Supply Chain Compromise", "T1574 - Hijack Execution Flow", "T1078 - Valid Accounts"],
  },
  {
    id: "kaseya-ransomware-2021",
    title: "Kaseya VSA Ransomware (2021)",
    description: "REvil ransomware deployed via Kaseya VSA software update, affecting 1500+ organizations in coordinated attack",
    threat_actor: "RansomSyndicate-X",
    attack_vector: "supply-chain",
    difficulty: "advanced",
    impact: "critical",
    year: "2021",
    lessons: ["Patch management is a double-edged sword", "MFA on critical systems is non-negotiable", "Incident response playbooks must be updated"],
    ttps: ["T1195 - Supply Chain Compromise", "T1486 - Data Encrypted for Impact", "T1490 - Inhibit System Recovery"],
  },
  {
    id: "colonial-pipeline-2021",
    title: "Colonial Pipeline Ransomware (2021)",
    description: "DarkSide ransomware attack forced temporary shutdown of major US fuel pipeline, highlighting critical infrastructure vulnerability",
    threat_actor: "RansomSyndicate-X",
    attack_vector: "credential-theft",
    difficulty: "intermediate",
    impact: "critical",
    year: "2021",
    lessons: ["Legacy systems require segmentation", "Credential rotation is essential", "Recovery plans must be tested"],
    ttps: ["T1078 - Valid Accounts", "T1486 - Data Encrypted for Impact", "T1570 - Lateral Tool Transfer"],
  },
  {
    id: "uber-breach-2022",
    title: "Uber Security Breach (2022)",
    description: "Social engineering and MFA fatigue used to compromise Uber employee accounts and gain admin access",
    threat_actor: "Unknown",
    attack_vector: "phishing",
    difficulty: "beginner",
    impact: "high",
    year: "2022",
    lessons: ["MFA fatigue is a real attack vector", "Social engineering remains highly effective", "Privileged access needs additional controls"],
    ttps: ["T1566 - Phishing", "T1110 - Brute Force", "T1098 - Account Manipulation"],
  },
];

export default function DemoMode() {
  const [activeTab, setActiveTab] = useState("library"); // library, builder, active
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["demo_scenarios"],
    queryFn: () => base44.entities.DemoScenario.list(),
  });

  const userScenarios = scenarios.filter(s => s.is_custom);
  const activeScenarios = scenarios.filter(s => s.status === "active");

  const filteredCases = REAL_WORLD_CASES.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === "all" || c.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-[#07091a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-3xl font-black text-white">Demo & Learning Mode</h1>
          </div>
          <p className="text-gray-400">Learn threat intelligence through real-world cases, build custom scenarios, and practice detection skills.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {[
            { id: "library", label: "Real-World Case Library", icon: BookOpen },
            { id: "builder", label: "Scenario Builder", icon: Layers },
            { id: "active", label: "Active Scenarios", icon: Play, count: activeScenarios.length },
            { id: "my-scenarios", label: "My Scenarios", icon: Lightbulb, count: userScenarios.length },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#00d4ff] text-[#00d4ff]"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Real-World Case Library Tab */}
        {activeTab === "library" && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#0d1220] border-white/10"
                />
              </div>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#0d1220] border border-white/10 text-sm text-white"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="grid gap-4">
              {filteredCases.map(case_ => (
                <div key={case_.id} className="bg-[#0d1220] border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{case_.title}</h3>
                      <p className="text-sm text-gray-400">{case_.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${
                        case_.difficulty === "beginner" ? "bg-[#2ed573]/20 text-[#2ed573]" :
                        case_.difficulty === "intermediate" ? "bg-[#ffa502]/20 text-[#ffa502]" :
                        "bg-[#ff4757]/20 text-[#ff4757]"
                      }`}>
                        {case_.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Threat Actor</p>
                      <p className="text-sm font-medium text-white">{case_.threat_actor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Attack Vector</p>
                      <p className="text-sm font-medium text-white capitalize">{case_.attack_vector.replace("-", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Year</p>
                      <p className="text-sm font-medium text-white">{case_.year}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Key Lessons Learned:</p>
                    <div className="flex flex-wrap gap-2">
                      {case_.lessons.map((lesson, i) => (
                        <span key={i} className="px-2 py-1 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded text-xs text-[#00d4ff]">
                          {lesson}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setSelectedCase(case_)} className="flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-bold gap-2">
                      <Play className="w-4 h-4" /> Launch Scenario
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Copy className="w-4 h-4" /> Fork & Customize
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scenario Builder Tab */}
        {activeTab === "builder" && (
          <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6">
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Build Custom Scenarios</h3>
              <p className="text-gray-400 mb-6">Create your own threat scenarios using real indicators, assets, and actors.</p>
              <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-bold gap-2">
                <Plus className="w-4 h-4" /> Create New Scenario
              </Button>
            </div>
          </div>
        )}

        {/* Active Scenarios Tab */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeScenarios.length === 0 ? (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active scenarios. Launch one from the library or create a new one.</p>
              </div>
            ) : (
              activeScenarios.map(scenario => (
                <div key={scenario.id} className="bg-[#0d1220] border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{scenario.title}</h3>
                      <p className="text-sm text-gray-400">{scenario.description}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#2ed573]/20 rounded text-[#2ed573] text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Scenarios Tab */}
        {activeTab === "my-scenarios" && (
          <div className="space-y-4">
            {userScenarios.length === 0 ? (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No custom scenarios yet. Create one from the builder or fork a real-world case.</p>
              </div>
            ) : (
              userScenarios.map(scenario => (
                <div key={scenario.id} className="bg-[#0d1220] border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{scenario.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{scenario.description}</p>
                      <div className="flex gap-2">
                        {scenario.learning_objectives?.map((obj, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300">{obj}</span>
                        ))}
                      </div>
                    </div>
                    <Button className="gap-2">
                      <Play className="w-4 h-4" /> Launch
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}