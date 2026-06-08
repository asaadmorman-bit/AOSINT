import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, AlertCircle, TrendingDown, Zap, Bell, CheckCircle2,
  ChevronDown, Clock, AlertOctagon, Send
} from "lucide-react";

export default function AnomalyDetectionPanel() {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("active");
  const queryClient = useQueryClient();

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ["anomalies", filter],
    queryFn: () => base44.entities.AnomalyAlert.filter(
      { status: filter },
      "-detection_timestamp",
      100
    ),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources-for-anomalies"],
    queryFn: () => base44.entities.QuantumResourcePool.list(),
  });

  const acknowledgeAnomalyMutation = useMutation({
    mutationFn: (anomalyId) =>
      base44.entities.AnomalyAlert.update(anomalyId, { status: "acknowledged" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });

  const resolveAnomalyMutation = useMutation({
    mutationFn: ({ anomalyId, notes }) =>
      base44.entities.AnomalyAlert.update(anomalyId, {
        status: "resolved",
        resolution_notes: notes,
        end_time: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (anomalyId) => {
      return await base44.functions.invoke("sendAnomalyNotification", {
        anomalyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
  });

  const getAnomalyIcon = (type) => {
    const icons = {
      cost_spike: AlertTriangle,
      performance_drop: TrendingDown,
      usage_deviation: Zap,
      error_rate_increase: AlertOctagon,
      queue_buildup: Clock,
      thermal_throttling: Zap,
      reliability_degradation: AlertCircle,
    };
    return icons[type] || AlertCircle;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: { bg: "bg-blue-900/20", text: "text-blue-400", border: "border-blue-500/20" },
      warning: { bg: "bg-yellow-900/20", text: "text-yellow-400", border: "border-yellow-500/20" },
      critical: { bg: "bg-red-900/20", text: "text-red-400", border: "border-red-500/20" },
    };
    return colors[severity];
  };

  const getResourceName = (poolId) => {
    return resources.find(r => r.id === poolId)?.pool_name || poolId.slice(0, 8);
  };

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading anomalies...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {["active", "acknowledged", "resolved"].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium transition-all capitalize ${
              filter === status
                ? "text-red-400 border-b-2 border-red-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {status}
            {anomalies.length > 0 && (
              <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                {anomalies.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Anomalies List */}
      <div className="space-y-2">
        {anomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
            <p className="text-sm">No {filter} anomalies detected</p>
          </div>
        ) : (
          anomalies.map((anomaly) => {
            const Icon = getAnomalyIcon(anomaly.anomaly_type);
            const severity = getSeverityColor(anomaly.severity);
            const isExpanded = expandedId === anomaly.id;
            const context = JSON.parse(anomaly.context || "{}");

            return (
              <div
                key={anomaly.id}
                className={`rounded-xl border transition-all ${
                  severity.bg
                } ${severity.border} p-4`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${severity.bg} mt-0.5`}>
                      <Icon className={`w-4 h-4 ${severity.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white capitalize">
                          {anomaly.anomaly_type.replace(/_/g, " ")}
                        </h4>
                        <Badge
                          className={`text-[8px] ${severity.bg} ${severity.text} border ${severity.border}`}
                        >
                          {anomaly.severity}
                        </Badge>
                        {anomaly.status === "acknowledged" && (
                          <Badge className="text-[8px] bg-yellow-900/20 text-yellow-300 border-yellow-500/20">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {getResourceName(anomaly.resource_pool_id)} •{" "}
                        {new Date(anomaly.detection_timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="text-right text-[10px] ml-4">
                    <p className={`font-semibold ${severity.text}`}>
                      {anomaly.deviation_percent.toFixed(1)}%
                    </p>
                    <p className="text-gray-500">
                      {anomaly.current_value.toFixed(2)} vs {anomaly.predicted_value.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                  className="text-[9px] text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-2"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  {isExpanded ? "Hide" : "Show"} Details
                </button>

                {/* Details */}
                {isExpanded && (
                  <div className="space-y-3 mt-3 pt-3 border-t border-white/10">
                    {/* Context Metrics */}
                    {Object.keys(context).length > 0 && (
                      <div className="bg-black/20 rounded p-2 text-[9px]">
                        <p className="text-gray-400 mb-2 font-semibold">Context</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(context).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</p>
                              <p className="text-white font-semibold">
                                {typeof value === "number"
                                  ? value.toFixed(value < 100 ? 2 : 0)
                                  : value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Potential Causes */}
                    {anomaly.potential_causes && anomaly.potential_causes.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-[9px] font-semibold mb-2">
                          Potential Causes
                        </p>
                        <ul className="space-y-1">
                          {anomaly.potential_causes.map((cause, idx) => (
                            <li key={idx} className="text-[9px] text-gray-300 flex gap-2">
                              <span className="text-gray-500">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {anomaly.recommended_actions && anomaly.recommended_actions.length > 0 && (
                      <div className="bg-green-900/10 border border-green-500/20 rounded p-2">
                        <p className="text-green-300 text-[9px] font-semibold mb-2">
                          Recommended Actions
                        </p>
                        <ul className="space-y-1">
                          {anomaly.recommended_actions.map((action, idx) => (
                            <li key={idx} className="text-[9px] text-green-200 flex gap-2">
                              <span className="text-green-500">→</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {anomaly.status === "active" && (
                        <>
                          <Button
                            size="xs"
                            onClick={() =>
                              acknowledgeAnomalyMutation.mutate(anomaly.id)
                            }
                            className="text-[9px] bg-yellow-600/50 hover:bg-yellow-600"
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="xs"
                            onClick={() =>
                              sendNotificationMutation.mutate(anomaly.id)
                            }
                            className="text-[9px] bg-cyan-600/50 hover:bg-cyan-600"
                          >
                            <Bell className="w-3 h-3 mr-1" />
                            Notify
                          </Button>
                        </>
                      )}
                      {anomaly.status !== "resolved" && (
                        <Button
                          size="xs"
                          onClick={() =>
                            resolveAnomalyMutation.mutate({
                              anomalyId: anomaly.id,
                              notes: "Manually resolved",
                            })
                          }
                          className="text-[9px] bg-green-600/50 hover:bg-green-600"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}