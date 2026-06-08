import React from "react";
import { AlertTriangle, Shield, CheckCircle2, Zap, TrendingUp } from "lucide-react";

export default function VulnDashboard({ findings, scans }) {
  const open = findings.filter(f => f.status === "open");
  const critical = findings.filter(f => f.severity === "critical");
  const high = findings.filter(f => f.severity === "high");
  const exploited = findings.filter(f => f.actively_exploited && f.status === "open");
  const inRemediation = findings.filter(f => f.status === "in_remediation");
  const avgCvss = findings.length
    ? (findings.reduce((s, f) => s + (f.cvss_score || 0), 0) / findings.length).toFixed(1)
    : "—";

  const cards = [
    { label: "Open Findings", value: open.length, icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-900/10 border-orange-500/20" },
    { label: "Critical", value: critical.length, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-900/10 border-red-500/20" },
    { label: "High", value: high.length, icon: TrendingUp, color: "text-orange-300", bg: "bg-orange-900/10 border-orange-500/10" },
    { label: "Actively Exploited", value: exploited.length, icon: Zap, color: "text-red-400", bg: "bg-red-900/15 border-red-500/30" },
    { label: "In Remediation", value: inRemediation.length, icon: Shield, color: "text-blue-400", bg: "bg-blue-900/10 border-blue-500/20" },
    { label: "Avg CVSS Score", value: avgCvss, icon: CheckCircle2, color: "text-cyan-400", bg: "bg-cyan-900/10 border-cyan-500/20" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <div key={i} className={`rounded-lg border p-3 ${c.bg}`}>
          <c.icon className={`w-4 h-4 mb-1 ${c.color}`} />
          <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
          <p className="text-[10px] text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}