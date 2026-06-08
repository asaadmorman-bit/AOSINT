import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shield, AlertTriangle, Eye, Search, FileText, TrendingUp, Activity, CheckCircle2, Globe2 } from "lucide-react";
import LinkedInShareButton from "@/components/osint_hub/LinkedInShareButton.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const SEVERITY_COLORS = { low: "#2ed573", medium: "#ffa502", high: "#ff6b35", critical: "#ff4757" };

export default function OsintOverviewDashboard() {
  const { data: entities = [] } = useQuery({ queryKey: ["osint_entities"], queryFn: () => base44.entities.OsintEntity.list("-created_date", 200) });
  const { data: leaks = [] } = useQuery({ queryKey: ["leaks"], queryFn: () => base44.entities.LeakIntelligence.list("-created_date", 100) });
  const { data: investigations = [] } = useQuery({ queryKey: ["investigations"], queryFn: () => base44.entities.OsintInvestigation.list("-created_date", 100) });
  const { data: alerts = [] } = useQuery({ queryKey: ["osint_alerts"], queryFn: () => base44.entities.OsintAlert.list("-created_date", 100) });

  const stats = [
    { label: "Total Indicators", value: entities.length, icon: Globe2, color: "#00d4ff" },
    { label: "Dark Web Leaks", value: leaks.length, icon: Eye, color: "#a855f7" },
    { label: "Active Investigations", value: investigations.filter(i => ["pending","running"].includes(i.status)).length, icon: Search, color: "#ffa502" },
    { label: "Open Alerts", value: alerts.filter(a => a.status === "new").length, icon: AlertTriangle, color: "#ff4757" },
  ];

  const criticalAlerts = alerts.filter(a => a.severity === "critical" && a.status === "new");
  const highAlerts = alerts.filter(a => a.severity === "high" && a.status === "new");

  const entityTypeData = ["domain","ip","email","username","hash","organization"].map(t => ({
    name: t, count: entities.filter(e => e.entity_type === t).length
  })).filter(d => d.count > 0);

  const severityData = ["low","medium","high","critical"].map(s => ({
    name: s, value: alerts.filter(a => a.severity === s).length, color: SEVERITY_COLORS[s]
  })).filter(d => d.value > 0);

  const recentLeaks = leaks.slice(0, 5);

  const insightContext = {
    totalIndicators: entities.length,
    darkWebLeaks: leaks.length,
    activeInvestigations: investigations.filter(i => ["pending","running"].includes(i.status)).length,
    criticalAlerts: criticalAlerts.length,
    highAlerts: highAlerts.length,
    topLeaks: recentLeaks.map(l => l.title).join(", "),
  };

  const insightPrefill = `ASOSINT Security Snapshot: ${entities.length} indicators tracked, ${leaks.length} dark web leaks detected, ${criticalAlerts.length} critical alerts active. #OSINT #ThreatIntelligence #CyberSecurity`;

  return (
    <div className="space-y-5 mt-4">
      <div className="flex justify-end">
        <LinkedInShareButton prefillContent={insightPrefill} report={insightContext} insightMode />
      </div>

      {/* Critical Banner */}
      {criticalAlerts.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-red-300">{criticalAlerts.length} CRITICAL alert{criticalAlerts.length > 1 ? "s" : ""} require immediate attention</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Entity Type Breakdown */}
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3 col-span-2">
          <p className="text-sm font-bold text-white">Indicators by Type</p>
          {entityTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={entityTypeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-600 text-sm">No indicators collected yet</div>
          )}
        </div>

        {/* Alert Severity Pie */}
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">Alert Severity</p>
          {severityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {severityData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-400 capitalize">{s.name}</span>
                    </div>
                    <span className="text-white font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-600 text-sm">No alerts yet</div>
          )}
        </div>
      </div>

      {/* Recent Dark Web Leaks */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-bold text-white">Recent Dark Web Findings</p>
        </div>
        {recentLeaks.length > 0 ? (
          <div className="space-y-2">
            {recentLeaks.map(l => (
              <div key={l.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#111827]">
                <div>
                  <p className="text-xs font-semibold text-gray-200">{l.title}</p>
                  <p className="text-[10px] text-gray-500">{l.source_platform?.replace(/_/g, " ")} · {l.affected_emails?.length || 0} emails · {l.record_count || "?"} records</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  l.severity === "critical" ? "bg-red-900/30 text-red-400 border-red-500/20" :
                  l.severity === "high" ? "bg-orange-900/30 text-orange-400 border-orange-500/20" :
                  l.severity === "medium" ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/20" :
                  "bg-green-900/30 text-green-400 border-green-500/20"
                }`}>{l.severity?.toUpperCase()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 py-4 text-center">No dark web findings yet. Add entities to your watchlist to begin monitoring.</p>
        )}
      </div>

      {/* Agent Status */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00d4ff]" />
          <p className="text-sm font-bold text-white">Agent Status</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { name: "Harvester", status: "active" },
            { name: "Dark Web Monitor", status: "active" },
            { name: "Investigator", status: "active" },
            { name: "Compromise Agent", status: "active" },
            { name: "Reporting Agent", status: "active" },
          ].map(a => (
            <div key={a.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111827]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse shrink-0" />
              <span className="text-xs text-gray-400">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}