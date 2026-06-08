import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, AlertTriangle, CheckCircle2, Clock, Trash2, Plus,
  Activity, GitBranch, Eye
} from "lucide-react";

export default function SecurityHardeningDashboard() {
  const [activeTab, setActiveTab] = useState("policies");
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery({
    queryKey: ["securityPolicies"],
    queryFn: () =>
      base44.entities.SecurityPolicy.filter(
        { status: "active" },
        null,
        100
      ),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () =>
      base44.entities.SecurityAuditLog.filter(
        {},
        "-timestamp",
        50
      ),
  });

  const { data: detectionRules = [] } = useQuery({
    queryKey: ["detectionRules"],
    queryFn: () =>
      base44.entities.ThreatDetectionRule.filter(
        { enabled: true },
        null,
        100
      ),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: () =>
      base44.entities.IncidentResponse.filter(
        {},
        "-detection_timestamp",
        50
      ),
  });

  const createPolicyMutation = useMutation({
    mutationFn: (policyData) =>
      base44.entities.SecurityPolicy.create(policyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityPolicies"] });
      setShowPolicyForm(false);
    },
  });

  // Security metrics
  const violationCount = auditLogs.filter(
    (log) => log.status === "blocked"
  ).length;
  const criticalIncidents = incidents.filter(
    (inc) => inc.severity === "critical"
  ).length;
  const activeRules = detectionRules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          Security Hardening
        </h2>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Active Policies"
          value={policies.length}
          icon={<Lock className="w-5 h-5 text-cyan-400" />}
          color="cyan"
        />
        <MetricCard
          title="Policy Violations"
          value={violationCount}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          color={violationCount > 0 ? "red" : "green"}
        />
        <MetricCard
          title="Detection Rules"
          value={activeRules}
          icon={<Eye className="w-5 h-5 text-purple-400" />}
          color="purple"
        />
        <MetricCard
          title="Critical Incidents"
          value={criticalIncidents}
          icon={<Activity className="w-5 h-5 text-orange-400" />}
          color={criticalIncidents > 0 ? "orange" : "green"}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: "policies", label: "Policies", icon: Lock },
          { id: "rules", label: "Detection Rules", icon: Eye },
          { id: "audit", label: "Audit Logs", icon: Activity },
          { id: "incidents", label: "Incidents", icon: AlertTriangle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
              activeTab === id
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "policies" && (
          <PoliciesSection
            policies={policies}
            onCreateClick={() => setShowPolicyForm(!showPolicyForm)}
            showForm={showPolicyForm}
            onCreatePolicy={(data) =>
              createPolicyMutation.mutate(data)
            }
            isLoading={createPolicyMutation.isPending}
          />
        )}

        {activeTab === "rules" && (
          <RulesSection rules={detectionRules} />
        )}

        {activeTab === "audit" && (
          <AuditSection logs={auditLogs} />
        )}

        {activeTab === "incidents" && (
          <IncidentsSection incidents={incidents} />
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorClass = {
    cyan: "bg-cyan-900/20 border-cyan-500/30 text-cyan-400",
    red: "bg-red-900/20 border-red-500/30 text-red-400",
    green: "bg-green-900/20 border-green-500/30 text-green-400",
    purple: "bg-purple-900/20 border-purple-500/30 text-purple-400",
    orange: "bg-orange-900/20 border-orange-500/30 text-orange-400",
  }[color];

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function PoliciesSection({ policies, onCreateClick, showForm, onCreatePolicy, isLoading }) {
  const [formData, setFormData] = useState({
    policy_name: "",
    policy_type: "access_control",
    description: "",
    enforcement_level: "mandatory",
    encryption_required: false,
    audit_logging_enabled: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Security Policies</h3>
        <Button
          size="sm"
          onClick={onCreateClick}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Policy
        </Button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Policy name"
            value={formData.policy_name}
            onChange={(e) =>
              setFormData({ ...formData, policy_name: e.target.value })
            }
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm h-20"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => onCreatePolicy(formData)}
              disabled={isLoading || !formData.policy_name}
              className="bg-cyan-600 hover:bg-cyan-700 flex-1"
            >
              Create
            </Button>
            <Button onClick={onCreateClick} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {policies.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No policies yet</p>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {policy.policy_name}
                  </h4>
                  <p className="text-[10px] text-gray-400 mb-2">
                    {policy.description}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="text-[8px] bg-cyan-900/20 text-cyan-300 border-cyan-500/20">
                      {policy.policy_type}
                    </Badge>
                    <Badge className="text-[8px] bg-yellow-900/20 text-yellow-300 border-yellow-500/20">
                      {policy.enforcement_level}
                    </Badge>
                    {policy.encryption_required && (
                      <Badge className="text-[8px] bg-green-900/20 text-green-300 border-green-500/20">
                        Encrypted
                      </Badge>
                    )}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RulesSection({ rules }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Detection Rules</h3>
      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No detection rules</p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {rule.rule_name}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    {rule.description}
                  </p>
                </div>
                <Badge
                  className={`text-[8px] ${
                    rule.severity === "critical"
                      ? "bg-red-900/20 text-red-300 border-red-500/20"
                      : "bg-yellow-900/20 text-yellow-300 border-yellow-500/20"
                  }`}
                >
                  {rule.severity}
                </Badge>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Badge className="text-[8px] bg-cyan-900/20 text-cyan-300 border-cyan-500/20">
                  {rule.rule_type}
                </Badge>
                <span className="text-[9px] text-gray-500">
                  Triggered {rule.trigger_count || 0} times
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuditSection({ logs }) {
  const violations = logs.filter((log) => log.status === "blocked");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Audit Logs ({logs.length})
      </h3>
      <div className="space-y-2">
        {logs.slice(0, 20).map((log) => (
          <div
            key={log.id}
            className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-white">
                {log.event_type}
              </span>
              <Badge
                className={`text-[8px] ${
                  log.status === "blocked"
                    ? "bg-red-900/20 text-red-300 border-red-500/20"
                    : "bg-green-900/20 text-green-300 border-green-500/20"
                }`}
              >
                {log.status}
              </Badge>
            </div>
            <p className="text-[10px] text-gray-400">
              {log.user_email} • {log.entity_type} • {log.action}
            </p>
            <p className="text-[9px] text-gray-500 mt-1">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IncidentsSection({ incidents }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        Incidents ({incidents.length})
      </h3>
      <div className="space-y-2">
        {incidents.slice(0, 20).map((incident) => (
          <div
            key={incident.id}
            className="bg-white/5 border border-white/10 rounded-lg p-3"
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-white text-sm">
                {incident.incident_title}
              </h4>
              <Badge
                className={`text-[8px] ${
                  incident.severity === "critical"
                    ? "bg-red-900/20 text-red-300 border-red-500/20"
                    : incident.severity === "high"
                    ? "bg-orange-900/20 text-orange-300 border-orange-500/20"
                    : "bg-yellow-900/20 text-yellow-300 border-yellow-500/20"
                }`}
              >
                {incident.severity}
              </Badge>
            </div>
            <p className="text-[10px] text-gray-400 mb-1">
              ID: {incident.incident_id}
            </p>
            <div className="flex gap-2 items-center text-[9px]">
              <Badge className="bg-white/5 text-gray-300 border-white/10">
                {incident.status}
              </Badge>
              <Badge className="bg-white/5 text-gray-300 border-white/10">
                {incident.incident_type}
              </Badge>
              <span className="text-gray-500">
                {new Date(incident.detection_timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}