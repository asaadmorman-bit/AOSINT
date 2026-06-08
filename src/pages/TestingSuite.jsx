import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Play, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
import TestSuiteRunner from "@/components/testing/TestSuiteRunner.jsx";
import TestRunResults from "@/components/testing/TestRunResults.jsx";

const TABS = [
  { id: "run", label: "Run Tests", icon: Play },
  { id: "results", label: "Results", icon: CheckCircle2 },
];

export default function TestingSuite() {
  const [tab, setTab] = useState("run");

  const { data: runs = [], refetch } = useQuery({
    queryKey: ["test_runs"],
    queryFn: () => base44.entities.TestRun.list("-created_date", 50),
  });

  const passed = runs.filter(r => r.status === "passed").length;
  const failed = runs.filter(r => r.status === "failed" || r.status === "partial").length;
  const totalTests = runs.reduce((s, r) => s + (r.total_tests || 0), 0);
  const totalPassed = runs.reduce((s, r) => s + (r.passed || 0), 0);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <FlaskConical className="w-5 h-5 text-[#2ed573]" />
            <h1 className="text-xl font-bold tracking-tight">SOINT Full-System Testing Suite</h1>
            <Badge className="text-[10px] px-2 py-0.5 bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20">
              Production-Grade
            </Badge>
          </div>
          <p className="text-xs text-gray-500">Comprehensive test harness across all SOINT modules, tiers, agents, and governance layers</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Runs", value: runs.length, color: "#00d4ff" },
            { label: "Passed", value: passed, color: "#2ed573" },
            { label: "Failed", value: failed, color: "#ff4757" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0d1117] border border-white/5 rounded-xl px-3 py-2">
              <p className="text-base font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-[9px] text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall pass rate */}
      {totalTests > 0 && (
        <div className="px-6 py-2 border-b border-white/5 flex items-center gap-4">
          <span className="text-[10px] text-gray-500">Overall Pass Rate</span>
          <div className="flex-1 max-w-xs h-1.5 bg-white/5 rounded-full">
            <div className="h-full rounded-full bg-[#2ed573] transition-all"
              style={{ width: `${(totalPassed / totalTests * 100).toFixed(0)}%` }} />
          </div>
          <span className="text-xs font-bold font-mono text-[#2ed573]">
            {(totalPassed / totalTests * 100).toFixed(0)}% ({totalPassed}/{totalTests})
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-[#2ed573] text-[#2ed573]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === "results" && runs.length > 0 && (
              <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 rounded font-mono">{runs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {tab === "run" && (
          <div className="space-y-4">
            <div className="bg-[#2ed573]/5 border border-[#2ed573]/10 rounded-xl p-3 flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#2ed573] shrink-0 mt-0.5" />
              <div className="text-[11px] text-gray-500 space-y-0.5">
                <p className="font-semibold text-gray-400">Safety & Governance</p>
                <p>All tests are non-destructive, read-only where possible, and include safety compliance checks and tier gating validation on every run.</p>
              </div>
            </div>
            <TestSuiteRunner onRunComplete={() => { setTab("results"); refetch(); }} />
          </div>
        )}
        {tab === "results" && <TestRunResults runs={runs} />}
      </div>
    </div>
  );
}