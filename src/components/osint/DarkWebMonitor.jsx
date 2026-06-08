import React, { useState } from "react";
import { AlertTriangle, TrendingUp, Eye, Lock, Shield, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SEVERITY_STYLES = {
  critical: "bg-red-900/30 text-red-300 border-red-500/30",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/30",
};

export default function DarkWebMonitor({ personName, darkWebFindings }) {
  if (!darkWebFindings || darkWebFindings.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-cyan-400" /> Dark Web Monitoring
        </h3>
        <p className="text-xs text-gray-500">No dark web findings detected for this subject.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/40 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-red-400" /> Dark Web Exposure
        </h3>
        <Badge className="bg-red-900/20 text-red-300 border-red-500/20 text-[10px]">
          {darkWebFindings.length} finding{darkWebFindings.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      
      <div className="px-6 py-4 space-y-3">
        {darkWebFindings.map((finding, i) => (
          <div key={i} className={`rounded-lg p-3 border ${SEVERITY_STYLES[finding.severity?.toLowerCase()] || SEVERITY_STYLES.low}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  {finding.type === "credentials" && <Lock className="w-3 h-3" />}
                  {finding.type === "discussion" && <AlertCircle className="w-3 h-3" />}
                  {finding.type === "darkmarket" && <Zap className="w-3 h-3" />}
                  {finding.type || "Dark Web Finding"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{finding.source || "Unknown source"}</p>
              </div>
              <Badge className={`text-[8px] ${SEVERITY_STYLES[finding.severity?.toLowerCase()] || SEVERITY_STYLES.low}`}>
                {finding.severity}
              </Badge>
            </div>
            <p className="text-xs text-gray-300 mb-1">{finding.description}</p>
            {finding.found_date && (
              <p className="text-[9px] text-gray-500">Found: {new Date(finding.found_date).toLocaleDateString()}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}