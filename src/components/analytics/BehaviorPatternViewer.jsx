import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, TrendingUp } from "lucide-react";

export default function BehaviorPatternViewer({ patterns, targetProfiles }) {
  const [expandedPattern, setExpandedPattern] = useState(null);

  const patternsByType = {
    communication: patterns.filter((p) => p.pattern_type === "communication"),
    activity: patterns.filter((p) => p.pattern_type === "activity"),
    schedule: patterns.filter((p) => p.pattern_type === "schedule"),
    decision_making: patterns.filter((p) => p.pattern_type === "decision_making"),
    trust: patterns.filter((p) => p.pattern_type === "trust"),
    resource_usage: patterns.filter((p) => p.pattern_type === "resource_usage"),
  };

  const getTypeColor = (type) => {
    const colors = {
      communication: "bg-blue-900/20 text-blue-300 border-blue-500/20",
      activity: "bg-purple-900/20 text-purple-300 border-purple-500/20",
      schedule: "bg-yellow-900/20 text-yellow-300 border-yellow-500/20",
      decision_making: "bg-red-900/20 text-red-300 border-red-500/20",
      trust: "bg-pink-900/20 text-pink-300 border-pink-500/20",
      resource_usage: "bg-green-900/20 text-green-300 border-green-500/20",
    };
    return colors[type] || "bg-gray-900/20 text-gray-300 border-gray-500/20";
  };

  return (
    <div className="space-y-4">
      {Object.entries(patternsByType).map(([type, typePatterns]) => (
        <div key={type} className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white capitalize">
              {type.replace(/_/g, " ")} Patterns ({typePatterns.length})
            </h3>
          </div>

          {typePatterns.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No patterns found</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {typePatterns.map((pattern) => (
                <div key={pattern.id} className="p-4 hover:bg-slate-800/30 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{pattern.pattern_name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{pattern.description}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {pattern.confidence_score || 0}%
                      </p>
                      <p className="text-xs text-gray-400">confidence</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={`${getTypeColor(pattern.pattern_type)} text-[8px]`}>
                      {pattern.pattern_type}
                    </Badge>
                    <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/30 text-[8px]">
                      Observed: {pattern.observed_count || 0}×
                    </Badge>
                    <Badge className="bg-green-900/20 text-green-300 border-green-500/20 text-[8px]">
                      Last: {pattern.last_observed ? new Date(pattern.last_observed).toLocaleDateString() : "N/A"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                    <div className="bg-slate-800/50 p-2 rounded">
                      <p className="text-gray-400">Frequency</p>
                      <p className="text-white font-semibold">{pattern.frequency || "N/A"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <p className="text-gray-400">Timing</p>
                      <p className="text-white font-semibold">{pattern.timing || "Variable"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <p className="text-gray-400">Success Rate</p>
                      <p className="text-green-400 font-semibold">
                        {pattern.success_rate_history
                          ? JSON.parse(pattern.success_rate_history).recent_rate || "N/A"
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() =>
                      setExpandedPattern(
                        expandedPattern?.id === pattern.id ? null : pattern
                      )
                    }
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ChevronDown
                      className={`w-4 h-4 mr-2 transition ${
                        expandedPattern?.id === pattern.id ? "rotate-180" : ""
                      }`}
                    />
                    {expandedPattern?.id === pattern.id ? "Hide" : "Show"} Exploitation Opportunity
                  </Button>

                  {expandedPattern?.id === pattern.id && (
                    <div className="mt-3 p-3 bg-red-900/10 border border-red-500/20 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-300 mb-1">
                            Exploitation Opportunity
                          </p>
                          <p className="text-sm text-gray-300">
                            {pattern.exploitation_opportunity}
                          </p>
                          <div className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-400">
                            <p className="mb-1">
                              <strong>Triggers:</strong> {pattern.triggers?.join(", ") || "N/A"}
                            </p>
                            <p>
                              <strong>Deviation Indicators:</strong>{" "}
                              {pattern.deviation_indicators?.join(", ") || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}