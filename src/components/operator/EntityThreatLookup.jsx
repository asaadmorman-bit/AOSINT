import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, AlertTriangle, TrendingUp, Users, Activity,
  Bell, Send, User, Mail
} from "lucide-react";

export default function EntityThreatLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("name"); // name, email, alias
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const queryClient = useQueryClient();

  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["entity_search", searchQuery, searchField],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const results = await base44.entities.Entity.filter(
        { [searchField === "email" ? "digital_footprint.emails" : searchField]: searchQuery },
        "-updated_date",
        10
      );
      return results;
    },
    enabled: searchQuery.length > 2,
  });

  const calculateRiskScore = (entity) => {
    if (!entity) return 0;
    let score = 0;

    if (entity.risk_level === "critical") score += 100;
    else if (entity.risk_level === "high") score += 75;
    else if (entity.risk_level === "medium") score += 50;
    else score += 25;

    if (entity.pattern_of_life?.anomalies_detected) score += 10;
    if (entity.golaxy_exposure?.data_categories_exposed?.length) score += 15;
    if (entity.known_locations?.length > 5) score += 5;

    return Math.min(score, 100);
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: "Critical", color: "#ff4757", bg: "#ff4757" };
    if (score >= 60) return { level: "High", color: "#ffa502", bg: "#ffa502" };
    if (score >= 40) return { level: "Medium", color: "#ffd700", bg: "#ffd700" };
    return { level: "Low", color: "#2ed573", bg: "#2ed573" };
  };

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      return await base44.entities.OperationalEvent.create(alertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["op_events"] });
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    },
  });

  const sendNotification = () => {
    if (!selectedEntity) return;
    const riskScore = calculateRiskScore(selectedEntity);
    const riskInfo = getRiskLevel(riskScore);
    
    createAlertMutation.mutate({
      title: `Entity Risk Alert: ${selectedEntity.name}`,
      description: `Threat level ${riskScore}/100 (${riskInfo.level}). Risk factors: ${selectedEntity.classification}. Pattern anomalies: ${selectedEntity.pattern_of_life?.anomalies_detected || 0}. GoLaxy exposure: ${selectedEntity.golaxy_exposure?.data_categories_exposed?.length || 0} categories.`,
      event_type: "cyber_incident",
      domain: "cyber",
      severity: riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : "low",
      status: "active",
      related_actors: [selectedEntity.id],
      tags: ["entity-risk", "manual-alert", selectedEntity.entity_type],
    });
  };

  const riskScore = selectedEntity ? calculateRiskScore(selectedEntity) : 0;
  const riskInfo = getRiskLevel(riskScore);

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder={`Search by ${searchField}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-[#0d1117] border-white/5"
            />
          </div>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="px-3 h-9 rounded-md bg-[#0d1117] border border-white/5 text-sm text-white"
          >
            <option value="name">Name</option>
            <option value="alias">Alias</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Search Results */}
        {searchQuery.length > 2 && (
          <div className="bg-[#0d1117] border border-white/5 rounded-lg max-h-48 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No entities found</div>
            ) : (
              <div className="divide-y divide-white/5">
                {searchResults.map((entity) => {
                  const score = calculateRiskScore(entity);
                  const risk = getRiskLevel(score);
                  return (
                    <button
                      key={entity.id}
                      onClick={() => {
                        setSelectedEntity(entity);
                        setSearchQuery("");
                      }}
                      className="w-full text-left p-3 hover:bg-white/[0.05] transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{entity.name}</p>
                        <p className="text-xs text-gray-500">{entity.entity_type}</p>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{ color: risk.color, background: `${risk.bg}20` }}
                      >
                        {score}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entity Details */}
      {selectedEntity && (
        <div className="bg-[#0d1117] border border-white/5 rounded-lg p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedEntity.name}</h3>
              <p className="text-sm text-gray-400 capitalize">{selectedEntity.entity_type}</p>
              {selectedEntity.aliases?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Aliases: {selectedEntity.aliases.join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-gray-500 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* Risk Score Card */}
          <div className="bg-[#111827] rounded-lg p-4 border border-white/5">
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm font-bold text-gray-400">THREAT LEVEL</span>
              <span
                className="text-3xl font-black"
                style={{ color: riskInfo.color }}
              >
                {riskScore}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${riskScore}%`,
                  background: riskInfo.bg,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Risk Level: <span style={{ color: riskInfo.color }} className="font-bold">{riskInfo.level}</span>
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">Classification:</span>
              <Badge className="text-xs capitalize" variant="outline">{selectedEntity.classification}</Badge>
            </div>

            {selectedEntity.digital_footprint?.emails && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">Emails:</span>
                <span className="text-xs text-white">{selectedEntity.digital_footprint.emails.join(", ")}</span>
              </div>
            )}

            {selectedEntity.known_locations?.length > 0 && (
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="text-sm text-gray-400 block">Known Locations:</span>
                  <div className="text-xs text-gray-300 mt-1 space-y-1">
                    {selectedEntity.known_locations.slice(0, 3).map((loc, i) => (
                      <span key={i} className="block">{loc}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Risk Factors */}
          {(selectedEntity.golaxy_exposure?.data_categories_exposed?.length > 0 ||
            selectedEntity.pattern_of_life?.anomalies_detected > 0) && (
            <div className="bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg p-3">
              <p className="text-sm font-bold text-[#ff4757] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Risk Factors
              </p>
              <ul className="text-xs text-gray-300 space-y-1">
                {selectedEntity.golaxy_exposure?.data_categories_exposed?.length > 0 && (
                  <li>
                    • GoLaxy exposure: {selectedEntity.golaxy_exposure.data_categories_exposed.length} data categories
                  </li>
                )}
                {selectedEntity.pattern_of_life?.anomalies_detected > 0 && (
                  <li>• Pattern anomalies detected: {selectedEntity.pattern_of_life.anomalies_detected}</li>
                )}
                {selectedEntity.known_locations?.length > 5 && (
                  <li>• High mobility: {selectedEntity.known_locations.length} locations</li>
                )}
              </ul>
            </div>
          )}

          {/* Notification Button */}
          <Button
            onClick={sendNotification}
            disabled={createAlertMutation.isPending}
            className="w-full bg-[#ff4757] hover:bg-[#ff4757]/90 text-white font-bold gap-2 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {createAlertMutation.isPending ? "Sending..." : notificationSent ? "Alert Sent ✓" : "Send Threat Alert"}
          </Button>
        </div>
      )}
    </div>
  );
}