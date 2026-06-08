import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Edit2, Trash2, Settings, Zap, Target, User } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function AgentCustomizer({ agentId, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [agentData, setAgentData] = useState({
    agent_name: "",
    agent_type: "threat_hunter",
    operator_id: "",
    target_type: "infrastructure",
    target_scope: [],
    capabilities: ["reconnaissance", "threat_hunting"],
    autonomy_level: "supervised",
    decision_rules: "{}",
    escalation_policy: "{}",
    data_sources: [],
    access_level: "read_only",
    custom_instructions: "",
  });
  const [newTarget, setNewTarget] = useState("");

  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agentProfile", agentId],
    queryFn: () => agentId ? base44.entities.AgentProfile.list({ id: agentId }).then(r => r[0]) : null,
    enabled: !!agentId,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (agentId && agent) {
        return base44.entities.AgentProfile.update(agentId, agentData);
      } else {
        return base44.entities.AgentProfile.create(agentData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentProfile"] });
      setIsEditing(false);
      onSave?.();
    },
  });

  React.useEffect(() => {
    if (agent) {
      setAgentData({
        agent_name: agent.agent_name || "",
        agent_type: agent.agent_type || "threat_hunter",
        operator_id: agent.operator_id || "",
        target_type: agent.target_type || "infrastructure",
        target_scope: agent.target_scope || [],
        capabilities: agent.capabilities || ["reconnaissance"],
        autonomy_level: agent.autonomy_level || "supervised",
        decision_rules: agent.decision_rules || "{}",
        escalation_policy: agent.escalation_policy || "{}",
        data_sources: agent.data_sources || [],
        access_level: agent.access_level || "read_only",
        custom_instructions: agent.custom_instructions || "",
      });
    }
  }, [agent]);

  const addTarget = () => {
    if (newTarget.trim()) {
      setAgentData({
        ...agentData,
        target_scope: [...agentData.target_scope, newTarget.trim()],
      });
      setNewTarget("");
    }
  };

  const removeTarget = (idx) => {
    setAgentData({
      ...agentData,
      target_scope: agentData.target_scope.filter((_, i) => i !== idx),
    });
  };

  const toggleCapability = (cap) => {
    setAgentData({
      ...agentData,
      capabilities: agentData.capabilities.includes(cap)
        ? agentData.capabilities.filter(c => c !== cap)
        : [...agentData.capabilities, cap],
    });
  };

  if (isLoading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Agent Customization
        </h3>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Agent Name</p>
              <p className="text-white font-semibold">{agentData.agent_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Type</p>
              <Badge className="bg-cyan-900/30 text-cyan-300 border-cyan-500/20 mt-1">
                {agentData.agent_type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400">Operator</p>
              <p className="text-white text-sm">{agentData.operator_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target Type</p>
              <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20 mt-1">
                {agentData.target_type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400">Autonomy Level</p>
              <Badge className={`mt-1 ${agentData.autonomy_level === 'fully_autonomous' ? 'bg-red-900/30 text-red-300 border-red-500/20' : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'}`}>
                {agentData.autonomy_level.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400">Access Level</p>
              <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20 mt-1">
                {agentData.access_level}
              </Badge>
            </div>
          </div>

          {agentData.target_scope.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Target Scope</p>
              <div className="flex flex-wrap gap-1">
                {agentData.target_scope.map((target, idx) => (
                  <Badge key={idx} className="bg-blue-900/30 text-blue-300 border-blue-500/20">
                    {target}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {agentData.capabilities.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                {agentData.capabilities.map((cap, idx) => (
                  <Badge key={idx} className="bg-green-900/30 text-green-300 border-green-500/20">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {agentData.custom_instructions && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Custom Instructions</p>
              <p className="text-white text-sm bg-black/30 p-2 rounded border border-white/5">
                {agentData.custom_instructions}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Edit Mode
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Agent Name</label>
              <input
                type="text"
                value={agentData.agent_name}
                onChange={(e) => setAgentData({ ...agentData, agent_name: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Agent Type</label>
              <MobileSelect
                value={agentData.agent_type}
                onValueChange={(v) => setAgentData({ ...agentData, agent_type: v })}
                placeholder="Agent Type"
                options={[
                  { value: "threat_hunter", label: "Threat Hunter" },
                  { value: "analyst", label: "Analyst" },
                  { value: "operator", label: "Operator" },
                  { value: "investigator", label: "Investigator" },
                  { value: "monitor", label: "Monitor" },
                  { value: "responder", label: "Responder" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Operator ID</label>
              <input
                type="text"
                value={agentData.operator_id}
                onChange={(e) => setAgentData({ ...agentData, operator_id: e.target.value })}
                placeholder="operator@example.com"
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Target Type</label>
              <MobileSelect
                value={agentData.target_type}
                onValueChange={(v) => setAgentData({ ...agentData, target_type: v })}
                placeholder="Target Type"
                options={[
                  { value: "infrastructure", label: "Infrastructure" },
                  { value: "network", label: "Network" },
                  { value: "application", label: "Application" },
                  { value: "endpoint", label: "Endpoint" },
                  { value: "data", label: "Data" },
                  { value: "user", label: "User" },
                  { value: "threat_actor", label: "Threat Actor" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Autonomy Level</label>
              <MobileSelect
                value={agentData.autonomy_level}
                onValueChange={(v) => setAgentData({ ...agentData, autonomy_level: v })}
                placeholder="Autonomy Level"
                options={[
                  { value: "supervised", label: "Supervised" },
                  { value: "semi_autonomous", label: "Semi-Autonomous" },
                  { value: "fully_autonomous", label: "Fully Autonomous" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Access Level</label>
              <MobileSelect
                value={agentData.access_level}
                onValueChange={(v) => setAgentData({ ...agentData, access_level: v })}
                placeholder="Access Level"
                options={[
                  { value: "read_only", label: "Read-Only" },
                  { value: "read_write", label: "Read-Write" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </div>
          </div>

          {/* Target Scope */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Target Scope</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTarget()}
                placeholder="e.g., 192.168.1.0/24, api.example.com"
                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
              <Button onClick={addTarget} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {agentData.target_scope.map((target, idx) => (
                <Badge
                  key={idx}
                  className="bg-blue-900/30 text-blue-300 border-blue-500/20 cursor-pointer"
                  onClick={() => removeTarget(idx)}
                >
                  {target} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Capabilities</label>
            <div className="grid grid-cols-2 gap-2">
              {["reconnaissance", "threat_hunting", "incident_response", "forensics", "monitoring", "reporting", "automation", "remediation"].map((cap) => (
                <label key={cap} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentData.capabilities.includes(cap)}
                    onChange={() => toggleCapability(cap)}
                    className="rounded"
                  />
                  <span className="text-xs text-gray-400 capitalize">{cap.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Custom Instructions</label>
            <textarea
              value={agentData.custom_instructions}
              onChange={(e) => setAgentData({ ...agentData, custom_instructions: e.target.value })}
              placeholder="Provide custom behavior instructions for the agent..."
              rows="3"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-3 h-3 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}