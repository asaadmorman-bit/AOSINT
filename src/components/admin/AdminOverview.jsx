import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users, Shield, AlertTriangle, Activity, Database, CheckCircle2,
  Clock, TrendingUp, Eye, Zap, FileText, Bell, Radio
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

function StatCard({ icon: Icon, label, value, sub, color = "#00d4ff" }) {
  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value ?? "—"}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SeverityBadge({ s }) {
  const colors = { critical: "#ff4757", high: "#ffa502", medium: "#ffd32a", low: "#2ed573", informational: "#6b7280" };
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ color: colors[s] || "#6b7280", background: `${colors[s] || "#6b7280"}15` }}>
      {s}
    </span>
  );
}

export default function AdminOverview() {
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => base44.entities.OsintAlert.list("-created_date", 50),
  });

  const { data: indicators = [] } = useQuery({
    queryKey: ["admin-indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 100),
  });

  const { data: feeds = [] } = useQuery({
    queryKey: ["admin-feeds"],
    queryFn: () => base44.entities.ThreatFeed.list(),
  });

  const { data: actors = [] } = useQuery({
    queryKey: ["admin-actors"],
    queryFn: () => base44.entities.ThreatActor.list("-created_date", 50),
  });

  const { data: investigations = [] } = useQuery({
    queryKey: ["admin-investigations"],
    queryFn: () => base44.entities.OsintInvestigation.list("-created_date", 50),
  });

  const activeFeeds = feeds.filter(f => f.status === "active").length;
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
  const openAlerts = alerts.filter(a => ["new", "in_progress"].includes(a.status)).length;
  const activeIndicators = indicators.filter(i => i.status === "active").length;
  const activeActors = actors.filter(a => a.status === "active").length;
  const adminUsers = users.filter(u => u.role === "admin").length;
  const recentAlerts = alerts.slice(0, 8);
  const recentIndicators = indicators.slice(0, 8);

  // Severity distribution
  const severityDist = ["critical", "high", "medium", "low"].map(s => ({
    label: s,
    count: indicators.filter(i => i.severity === s).length,
    color: { critical: "#ff4757", high: "#ffa502", medium: "#ffd32a", low: "#2ed573" }[s],
  }));
  const maxSev = Math.max(...severityDist.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* System Health Banner */}
      <div className="bg-gradient-to-r from-[#0d1117] to-[#111827] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
          <span className="text-sm font-semibold text-white">ASOSINT Platform — Admin View</span>
          <span className="text-[10px] text-gray-500 font-mono hidden sm:block">
            {format(new Date(), "PPpp")}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-[#2ed573]" /> {activeFeeds} feeds live</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-[#ffa502]" /> {criticalAlerts} critical</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-[#00d4ff]" /> {users.length} users</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}         label="Total Users"         value={users.length}        sub={`${adminUsers} admin`}           color="#00d4ff" />
        <StatCard icon={Bell}          label="Open Alerts"         value={openAlerts}          sub={`${criticalAlerts} critical`}    color="#ff4757" />
        <StatCard icon={Database}      label="Active Indicators"   value={activeIndicators}    sub={`of ${indicators.length} total`} color="#ffa502" />
        <StatCard icon={Shield}        label="Threat Actors"       value={activeActors}        sub={`of ${actors.length} tracked`}   color="#a855f7" />
        <StatCard icon={Radio}         label="Active Feeds"        value={activeFeeds}         sub={`of ${feeds.length} configured`} color="#2ed573" />
        <StatCard icon={Eye}           label="Investigations"      value={investigations.length} sub="total open"                  color="#ffd32a" />
        <StatCard icon={Activity}      label="All Indicators"      value={indicators.length}   sub="in database"                    color="#00d4ff" />
        <StatCard icon={TrendingUp}    label="Total Alerts"        value={alerts.length}       sub="all time"                       color="#ff6b35" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Indicator Severity Breakdown */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Indicator Severity Breakdown
          </p>
          <div className="space-y-3">
            {severityDist.map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 w-16 capitalize">{label}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(count / maxSev) * 100}%`, background: color }} />
                </div>
                <span className="text-xs font-bold w-6 text-right" style={{ color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Roster */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> User Roster
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.slice(0, 12).map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] text-[10px] font-bold shrink-0">
                    {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium leading-none">{u.full_name || "Unnamed"}</p>
                    <p className="text-gray-600 text-[10px]">{u.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${u.role === "admin" ? "bg-[#00d4ff]/10 text-[#00d4ff]" : "bg-white/5 text-gray-500"}`}>
                  {u.role || "user"}
                </span>
              </div>
            ))}
            {users.length === 0 && <p className="text-xs text-gray-600">No users found</p>}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4 flex items-center gap-1.5">
            <Bell className="w-3 h-3" /> Recent Alerts
          </p>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {recentAlerts.map(a => (
              <div key={a.id} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{a.title}</p>
                  <p className="text-[10px] text-gray-600">
                    {a.alert_type?.replace(/_/g, " ")} · {a.created_date ? formatDistanceToNow(new Date(a.created_date), { addSuffix: true }) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <SeverityBadge s={a.severity} />
                  <span className="text-[9px] text-gray-600 capitalize">{a.status}</span>
                </div>
              </div>
            ))}
            {recentAlerts.length === 0 && <p className="text-xs text-gray-600">No alerts found</p>}
          </div>
        </div>

        {/* Recent Indicators */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4 flex items-center gap-1.5">
            <Database className="w-3 h-3" /> Recent Indicators
          </p>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {recentIndicators.map(i => (
              <div key={i.id} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{i.title || i.value}</p>
                  <p className="text-[10px] text-gray-600 font-mono truncate">{i.value}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <SeverityBadge s={i.severity} />
                  <span className="text-[9px] text-gray-600">{i.indicator_type?.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
            {recentIndicators.length === 0 && <p className="text-xs text-gray-600">No indicators found</p>}
          </div>
        </div>
      </div>

      {/* Feed Status */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-4 flex items-center gap-1.5">
          <Radio className="w-3 h-3" /> Threat Feed Status
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {feeds.slice(0, 12).map(f => {
            const statusColor = { active: "#2ed573", inactive: "#6b7280", error: "#ff4757", pending: "#ffa502" }[f.status] || "#6b7280";
            return (
              <div key={f.id} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                  <span className="text-xs text-gray-300 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-gray-600">{f.feed_type}</span>
                  <span className="text-[9px] font-bold capitalize" style={{ color: statusColor }}>{f.status}</span>
                </div>
              </div>
            );
          })}
          {feeds.length === 0 && <p className="text-xs text-gray-600 col-span-3">No feeds configured</p>}
        </div>
      </div>
    </div>
  );
}