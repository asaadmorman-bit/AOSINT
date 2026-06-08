import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, Activity, CheckCircle2, Clock, TrendingUp,
  Eye, Lock, AlertCircle, Zap, Server, Users, FileText, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThreatIntelligenceFeedsPanel from "@/components/security/ThreatIntelligenceFeedsPanel";

export default function SOCDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  // Fetch all security data
  const { data: auditLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ["socAuditLogs"],
    queryFn: () =>
      base44.entities.SecurityAuditLog.filter({}, "-timestamp", 500),
    refetchInterval: refreshInterval * 1000,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["socIncidents"],
    queryFn: () =>
      base44.entities.IncidentResponse.filter({}, "-detection_timestamp", 200),
    refetchInterval: refreshInterval * 1000,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["socPolicies"],
    queryFn: () =>
      base44.entities.SecurityPolicy.filter({ status: "active" }, null, 100),
    refetchInterval: 60000,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["socRules"],
    queryFn: () =>
      base44.entities.ThreatDetectionRule.filter({ enabled: true }, null, 100),
    refetchInterval: 60000,
  });

  // Process time-based data
  const getTimeRangeData = (data, field, hoursBack = 24) => {
    const now = new Date();
    const cutoff = new Date(now - hoursBack * 60 * 60 * 1000);

    return data
      .filter((item) => new Date(item[field]) > cutoff)
      .reduce((acc, item) => {
        const date = new Date(item[field]).toLocaleDateString();
        const existing = acc.find((d) => d.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, []);
  };

  // Calculate metrics
  const activeThreats = incidents.filter((i) => i.status === "detected" || i.status === "investigating").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "critical").length;
  const policyViolations = auditLogs.filter((log) => log.status === "blocked").length;
  const complianceScore = Math.max(
    0,
    100 - (policyViolations / Math.max(auditLogs.length, 1)) * 100
  );

  const incidentTrendData = getTimeRangeData(incidents, "detection_timestamp", 24);
  const auditTrendData = getTimeRangeData(auditLogs, "timestamp", 24);

  // Severity distribution
  const severityData = [
    {
      name: "Critical",
      value: incidents.filter((i) => i.severity === "critical").length,
    },
    {
      name: "High",
      value: incidents.filter((i) => i.severity === "high").length,
    },
    {
      name: "Medium",
      value: incidents.filter((i) => i.severity === "medium").length,
    },
    {
      name: "Low",
      value: incidents.filter((i) => i.severity === "low").length,
    },
  ].filter((d) => d.value > 0);

  const COLORS = ["#ff4757", "#ffa502", "#ffc107", "#2ed573"];

  // Status distribution
  const statusData = [
    {
      name: "Detected",
      value: incidents.filter((i) => i.status === "detected").length,
    },
    {
      name: "Investigating",
      value: incidents.filter((i) => i.status === "investigating").length,
    },
    {
      name: "Contained",
      value: incidents.filter((i) => i.status === "contained").length,
    },
    {
      name: "Resolved",
      value: incidents.filter((i) => i.status === "recovered" || i.status === "closed").length,
    },
  ];

  // Recent critical incidents
  const recentCritical = incidents
    .filter((i) => i.severity === "critical")
    .sort((a, b) => new Date(b.detection_timestamp) - new Date(a.detection_timestamp))
    .slice(0, 5);

  // Policy compliance by type
  const complianceByType = policies.reduce((acc, policy) => {
    const existing = acc.find((p) => p.name === policy.policy_type);
    if (existing) {
      existing.total++;
    } else {
      acc.push({ name: policy.policy_type, total: 1, active: 1 });
    }
    return acc;
  }, []);

  // Top threat types
  const threatTypes = incidents.reduce((acc, inc) => {
    const existing = acc.find((t) => t.name === inc.incident_type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: inc.incident_type, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Security Operations Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time security monitoring and threat intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchLogs();
            }}
            className="text-[12px]"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-xs"
          >
            <option value={10}>Every 10s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 1m</option>
            <option value={300}>Every 5m</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          title="Security Score"
          value={Math.round(complianceScore)}
          suffix="%"
          icon={<Shield className="w-5 h-5" />}
          trend={complianceScore > 80 ? "up" : "down"}
          color={complianceScore > 80 ? "green" : complianceScore > 60 ? "yellow" : "red"}
        />
        <MetricCard
          title="Active Threats"
          value={activeThreats}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={activeThreats > 0 ? "red" : "green"}
          trend={activeThreats > 0 ? "down" : "up"}
        />
        <MetricCard
          title="Critical Incidents"
          value={criticalIncidents}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <MetricCard
          title="Policy Violations"
          value={policyViolations}
          icon={<Lock className="w-5 h-5" />}
          color={policyViolations > 5 ? "red" : "yellow"}
        />
        <MetricCard
          title="Detection Rules"
          value={rules.length}
          icon={<Eye className="w-5 h-5" />}
          color="cyan"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Incident Trend */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Incident Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={incidentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-4">
        {/* Incident Status */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Incident Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#00d4ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Audit Log Trend */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Audit Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={auditTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Threats */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Top Threat Types</h3>
          <div className="space-y-2">
            {threatTypes.map((threat, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 truncate">{threat.name}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 rounded-full px-2 py-0.5">
                    <span className="text-cyan-400 font-semibold text-xs">{threat.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Incidents & Audit Summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Critical Incidents */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Recent Critical Incidents
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentCritical.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">No critical incidents</p>
            ) : (
              recentCritical.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-black/20 border border-red-500/20 rounded p-2 text-xs"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-white font-semibold truncate flex-1">
                      {incident.incident_title}
                    </h4>
                    <Badge className="text-[7px] bg-red-900/30 text-red-300 border-red-500/20 ml-1">
                      {incident.status}
                    </Badge>
                  </div>
                  <p className="text-gray-400">{incident.incident_id}</p>
                  <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(incident.detection_timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Summary */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Audit Log Summary
          </h3>
          <div className="space-y-3 text-sm">
            <SummaryItem
              label="Total Logs"
              value={auditLogs.length}
              icon={<FileText className="w-4 h-4" />}
            />
            <SummaryItem
              label="Blocked Actions"
              value={auditLogs.filter((l) => l.status === "blocked").length}
              icon={<AlertTriangle className="w-4 h-4" />}
              highlight
            />
            <SummaryItem
              label="Policy Events"
              value={auditLogs.filter((l) => l.event_type === "policy_violation").length}
              icon={<Lock className="w-4 h-4" />}
            />
            <SummaryItem
              label="Data Access Events"
              value={auditLogs.filter((l) => l.event_type === "data_access").length}
              icon={<Eye className="w-4 h-4" />}
            />
            <SummaryItem
              label="Unique Users"
              value={new Set(auditLogs.map((l) => l.user_id)).size}
              icon={<Users className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Policy Compliance */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Policy Compliance Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {complianceByType.map((policy, idx) => (
            <div
              key={idx}
              className="bg-black/20 border border-white/10 rounded p-3 text-xs"
            >
              <p className="text-gray-400 mb-2 capitalize">{policy.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-cyan-400">
                  {policy.active}/{policy.total}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Intelligence Feeds */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <ThreatIntelligenceFeedsPanel />
      </div>
    </div>
  );
}

function MetricCard({ title, value, suffix = "", icon, color = "cyan", trend }) {
  const colorClasses = {
    cyan: "bg-cyan-900/20 border-cyan-500/30 text-cyan-400",
    red: "bg-red-900/20 border-red-500/30 text-red-400",
    yellow: "bg-yellow-900/20 border-yellow-500/30 text-yellow-400",
    green: "bg-green-900/20 border-green-500/30 text-green-400",
  }[color];

  return (
    <div className={`${colorClasses} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {value}
            {suffix}
          </p>
        </div>
        <div className="text-2xl opacity-50">{icon}</div>
      </div>
      {trend && (
        <div className="mt-2 text-[10px] flex items-center gap-1">
          <TrendingUp className={`w-3 h-3 ${trend === "up" ? "text-green-400" : "text-red-400"}`} />
          <span className={trend === "up" ? "text-green-400" : "text-red-400"}>
            {trend === "up" ? "Improving" : "Declining"}
          </span>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value, icon, highlight }) {
  return (
    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
      <div className="flex items-center gap-2">
        <div className={highlight ? "text-orange-400" : "text-gray-400"}>{icon}</div>
        <span className="text-gray-400">{label}</span>
      </div>
      <span className={`font-semibold ${highlight ? "text-orange-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}