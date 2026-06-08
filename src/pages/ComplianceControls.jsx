import React, { useState } from "react";
import ComplianceFrameworkGrid from "@/components/compliance/ComplianceFrameworkGrid.jsx";
import AgentComplianceScanner from "@/components/compliance/AgentComplianceScanner.jsx";
import CloudDeploymentMatrix from "@/components/compliance/CloudDeploymentMatrix.jsx";
import IPPolicyWatcher from "@/components/compliance/IPPolicyWatcher.jsx";
import ComplianceStatusBar from "@/components/compliance/ComplianceStatusBar.jsx";
import { Shield, Bot, Cloud, BookOpen, Eye } from "lucide-react";

const TABS = [
  { id: "overview", label: "Compliance Overview", icon: Shield },
  { id: "agent", label: "Agentic Scanner", icon: Bot },
  { id: "cloud", label: "Cloud & Deployment", icon: Cloud },
  { id: "ip", label: "IP & Policy Watcher", icon: Eye },
];

export default function ComplianceControls() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-[#060a0f] text-white space-y-0">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#00d4ff]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Compliance & Security Controls</h1>
            <p className="text-xs text-gray-500">SOC2 · ISO 27001 · JSIG · RMF · CMMC · FedRAMP — Agentic continuous compliance monitoring</p>
          </div>
        </div>
        <ComplianceStatusBar />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {tab === "overview" && <ComplianceFrameworkGrid />}
        {tab === "agent" && <AgentComplianceScanner />}
        {tab === "cloud" && <CloudDeploymentMatrix />}
        {tab === "ip" && <IPPolicyWatcher />}
      </div>
    </div>
  );
}