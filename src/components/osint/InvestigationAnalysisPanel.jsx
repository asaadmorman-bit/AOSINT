import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Brain, Zap, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvestigationAnalysisPanel({ investigation, onAnalysisUpdate }) {
  const [analysisTab, setAnalysisTab] = useState("findings");

  const analyzeFindings = useMutation({
    mutationFn: () => base44.functions.invoke("analyzeInvestigationFindings", { investigationId: investigation.id }),
    onSuccess: (res) => {
      if (res.data.success) {
        onAnalysisUpdate?.();
      }
    }
  });

  const correlateIndicators = useMutation({
    mutationFn: () => base44.functions.invoke("correlateInvestigationIndicators", { investigationId: investigation.id }),
  });

  const generateProfile = useMutation({
    mutationFn: (actorName) => base44.functions.invoke("generateThreatActorProfile", { investigationId: investigation.id, actorName }),
  });

  return (
    <div className="space-y-4">
      {/* Analysis Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        <button
          onClick={() => setAnalysisTab("findings")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            analysisTab === "findings"
              ? "border-[#00d4ff] text-[#00d4ff]"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Brain className="w-4 h-4 inline mr-1" /> Deep Analysis
        </button>
        <button
          onClick={() => setAnalysisTab("indicators")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            analysisTab === "indicators"
              ? "border-[#00d4ff] text-[#00d4ff]"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Zap className="w-4 h-4 inline mr-1" /> Indicator Correlation
        </button>
        <button
          onClick={() => setAnalysisTab("actor")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            analysisTab === "actor"
              ? "border-[#00d4ff] text-[#00d4ff]"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <AlertCircle className="w-4 h-4 inline mr-1" /> Threat Actor
        </button>
      </div>

      {/* Deep Analysis Tab */}
      {analysisTab === "findings" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">AI-powered deep analysis of investigation findings, patterns, and threat landscape assessment.</p>
          {investigation.analyst_notes ? (
            <div className="bg-black/30 border border-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
              <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{investigation.analyst_notes}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-4 text-center">No deep analysis yet.</p>
          )}
          <Button
            onClick={() => analyzeFindings.mutate()}
            disabled={analyzeFindings.isPending}
            className="w-full text-xs bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20"
          >
            {analyzeFindings.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Analyzing...</>
            ) : (
              <><Brain className="w-3.5 h-3.5 mr-2" /> Generate Deep Analysis</>
            )}
          </Button>
        </div>
      )}

      {/* Indicator Correlation Tab */}
      {analysisTab === "indicators" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Automatic extraction and correlation of IPs, domains, emails, and other indicators.</p>
          {correlateIndicators.data?.data?.correlationData ? (
            <div className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
              <div>
                <p className="text-[10px] font-bold text-[#00d4ff] uppercase mb-2">Indicators Found ({correlateIndicators.data.data.correlationData.indicators?.length || 0})</p>
                <div className="space-y-1">
                  {correlateIndicators.data.data.correlationData.indicators?.slice(0, 10).map((ind, i) => (
                    <div key={i} className="text-xs bg-[#111827] p-2 rounded border border-white/5">
                      <p className="font-mono text-[#00d4ff]">{ind.value}</p>
                      <p className="text-gray-500 text-[9px]">{ind.type} • {ind.risk} • {ind.confidence}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00d4ff] uppercase mb-2">Correlation Patterns</p>
                <div className="space-y-1">
                  {correlateIndicators.data.data.correlationData.correlationPatterns?.map((pattern, i) => (
                    <p key={i} className="text-xs text-gray-400">• {pattern}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#00d4ff] uppercase mb-1">Threat Cluster</p>
                <p className="text-xs text-gray-400">{correlateIndicators.data.data.correlationData.threatCluster}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-4 text-center">No correlation analysis yet.</p>
          )}
          <Button
            onClick={() => correlateIndicators.mutate()}
            disabled={correlateIndicators.isPending}
            className="w-full text-xs bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20"
          >
            {correlateIndicators.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Correlating...</>
            ) : (
              <><Zap className="w-3.5 h-3.5 mr-2" /> Extract & Correlate Indicators</>
            )}
          </Button>
        </div>
      )}

      {/* Threat Actor Tab */}
      {analysisTab === "actor" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Generate detailed threat actor profile based on gathered intelligence.</p>
          {generateProfile.data?.data?.actorProfile ? (
            <div className="bg-black/30 border border-white/5 rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Actor Name</p>
                  <p className="text-sm font-bold text-[#00d4ff]">{generateProfile.data.data.actorProfile.name}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Type</p>
                  <p className="text-xs text-gray-300 capitalize">{generateProfile.data.data.actorProfile.actor_type}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Status</p>
                  <p className="text-xs text-gray-300 capitalize">{generateProfile.data.data.actorProfile.status}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Confidence</p>
                  <p className="text-xs text-gray-300">{generateProfile.data.data.actorProfile.confidence}%</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Attributed Country</p>
                <p className="text-xs text-gray-300">{generateProfile.data.data.actorProfile.attributed_country || "Unknown"}</p>
              </div>
              {generateProfile.data.data.actorProfile.target_sectors?.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Target Sectors</p>
                  <p className="text-xs text-gray-300">{generateProfile.data.data.actorProfile.target_sectors.join(", ")}</p>
                </div>
              )}
              {generateProfile.data.data.actorProfile.mitre_groups?.length > 0 && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">MITRE Groups</p>
                  <p className="text-xs text-gray-300">{generateProfile.data.data.actorProfile.mitre_groups.join(", ")}</p>
                </div>
              )}
              {generateProfile.data.data.actorProfile.notes && (
                <div>
                  <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Profile Notes</p>
                  <p className="text-xs text-gray-300 line-clamp-3">{generateProfile.data.data.actorProfile.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-600 py-4 text-center">No threat actor profile yet.</p>
          )}
          <Button
            onClick={() => generateProfile.mutate(investigation.title)}
            disabled={generateProfile.isPending}
            className="w-full text-xs bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20"
          >
            {generateProfile.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Generating...</>
            ) : (
              <><AlertCircle className="w-3.5 h-3.5 mr-2" /> Generate Threat Actor Profile</>
            )}
          </Button>
          {generateProfile.data?.data?.createdActorId && (
            <div className="bg-[#2ed573]/10 border border-[#2ed573]/20 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2ed573] shrink-0" />
              <p className="text-xs text-[#2ed573]">Actor profile created successfully</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}