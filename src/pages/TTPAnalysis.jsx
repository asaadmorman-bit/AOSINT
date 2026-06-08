import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Zap, Brain, Shield, AlertTriangle, TrendingUp, Users,
  Loader2, RefreshCw, Download, Network, CheckCircle2,
  Target, Lightbulb, Lock
} from "lucide-react";

export default function TTPAnalysis() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedActorProfile, setSelectedActorProfile] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const { data: threatActors = [] } = useQuery({
    queryKey: ["threat_actors"],
    queryFn: () => base44.entities.ThreatActor.list(),
  });

  const runTTPAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await base44.functions.invoke("analyzeTTPCorrelation", {});
      setAnalysisResults(response.data);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const generateActorProfile = async (actorId) => {
    setIsLoadingProfile(true);
    try {
      const response = await base44.functions.invoke("generateThreatActorProfile", {
        actor_id: actorId,
      });
      setSelectedActorProfile(response.data);
    } catch (error) {
      console.error("Profile generation failed:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07091a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-3xl font-black text-white">AI-Powered TTP Analysis</h1>
          </div>
          <p className="text-gray-400">Deep intelligence analysis using AI to correlate tactics, identify patterns, and generate threat actor profiles.</p>
        </div>

        {/* Analysis Controls */}
        <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#00d4ff]" /> Advanced TTP Correlation
            </h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Analyze TTPs across all threat actors and campaigns to identify correlations, emerging techniques, and defensive measures.
          </p>
          <Button
            onClick={runTTPAnalysis}
            disabled={isLoadingAnalysis}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-bold gap-2"
          >
            {isLoadingAnalysis ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" /> Run AI Analysis
              </>
            )}
          </Button>
        </div>

        {/* TTP Analysis Results */}
        {analysisResults && (
          <div className="space-y-6 mb-8">
            {/* TTP Correlations */}
            {analysisResults.analysis.ttp_correlations && (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-[#00d4ff]" /> TTP Correlations
                </h3>
                <div className="space-y-3">
                  {analysisResults.analysis.ttp_correlations.slice(0, 5).map((corr, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-white">{corr.tactic}</p>
                        <span className="text-xs px-2 py-1 bg-[#00d4ff]/20 text-[#00d4ff] rounded">
                          {corr.frequency}% adoption
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        Used by: {corr.actors.join(", ")}
                      </p>
                      {corr.variants && (
                        <div className="flex flex-wrap gap-1">
                          {corr.variants.slice(0, 3).map((v, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-white/5 rounded text-gray-300">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emerging TTPs */}
            {analysisResults.analysis.emerging_ttps && (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#ffa502]" /> Emerging TTPs
                </h3>
                <div className="space-y-3">
                  {analysisResults.analysis.emerging_ttps.map((ttp, idx) => (
                    <div key={idx} className={`bg-white/5 border rounded p-3 ${
                      ttp.risk_level === "critical" ? "border-[#ff4757]" :
                      ttp.risk_level === "high" ? "border-[#ffa502]" : "border-white/10"
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-white">{ttp.technique}</p>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          ttp.risk_level === "critical" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                          ttp.risk_level === "high" ? "bg-[#ffa502]/20 text-[#ffa502]" :
                          "bg-[#ffd700]/20 text-[#ffd700]"
                        }`}>
                          {ttp.risk_level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{ttp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Defensive Measures */}
            {analysisResults.analysis.defensive_measures && (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#2ed573]" /> Recommended Defensive Measures
                </h3>
                <div className="space-y-3">
                  {analysisResults.analysis.defensive_measures.slice(0, 5).map((measure, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-white">{measure.measure}</p>
                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                          measure.priority === "critical" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                          measure.priority === "high" ? "bg-[#ffa502]/20 text-[#ffa502]" :
                          "bg-[#ffd700]/20 text-[#ffd700]"
                        }`}>
                          {measure.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">Against: {measure.against_tactic}</p>
                      <p className="text-xs text-gray-500">{measure.implementation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IOCs to Monitor */}
            {analysisResults.analysis.iocs_to_monitor && (
              <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#a855f7]" /> Indicators of Compromise (IOCs)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResults.analysis.iocs_to_monitor.slice(0, 6).map((ioc, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1 font-mono">{ioc.type.toUpperCase()}</p>
                      <p className="text-sm font-mono text-[#00d4ff] break-all mb-2">{ioc.indicator}</p>
                      <p className="text-xs text-gray-400">{ioc.associated_actors.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Threat Actor Profiles */}
        <div className="bg-[#0d1220] border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00d4ff]" /> Generate Threat Actor Profiles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {threatActors.map((actor) => (
              <Button
                key={actor.id}
                onClick={() => generateActorProfile(actor.id)}
                disabled={isLoadingProfile}
                variant="outline"
                className="border-white/10 hover:bg-white/5 justify-start text-left h-auto p-3"
              >
                <div className="flex-1">
                  <p className="font-bold text-white">{actor.name}</p>
                  <p className="text-xs text-gray-500">{actor.description?.substring(0, 50)}...</p>
                </div>
                {isLoadingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#00d4ff] shrink-0 ml-2" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-gray-500 shrink-0 ml-2" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Actor Profile */}
        {selectedActorProfile && selectedActorProfile.profile && (
          <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">{selectedActorProfile.actor_name}</h2>
                <p className="text-gray-400">{selectedActorProfile.profile.executive_summary}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded font-bold ${
                selectedActorProfile.profile.threat_level === "critical" ? "bg-[#ff4757]/20 text-[#ff4757]" :
                selectedActorProfile.profile.threat_level === "high" ? "bg-[#ffa502]/20 text-[#ffa502]" :
                "bg-[#ffd700]/20 text-[#ffd700]"
              }`}>
                {selectedActorProfile.profile.threat_level.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="text-sm text-white font-medium capitalize">{selectedActorProfile.profile.actor_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Country of Origin</p>
                    <p className="text-sm text-white font-medium">{selectedActorProfile.profile.country_of_origin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Operational Tempo</p>
                    <p className="text-sm text-white font-medium">{selectedActorProfile.profile.operational_tempo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Capabilities</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Malware Development</p>
                    <p className="text-xs text-gray-300">{selectedActorProfile.profile.technical_capabilities?.malware_development}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Exploitation Skills</p>
                    <p className="text-xs text-gray-300">{selectedActorProfile.profile.technical_capabilities?.exploitation_skills}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Target Profile</h3>
                {selectedActorProfile.profile.target_preferences && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sectors</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedActorProfile.profile.target_preferences.sectors?.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-white/10 rounded text-gray-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Defensive Priorities</h3>
                <div className="space-y-1">
                  {selectedActorProfile.profile.defensive_priorities?.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-[#2ed573] mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-300">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}