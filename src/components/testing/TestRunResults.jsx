import React, { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Shield, Download, BarChart2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SUITE_LABELS = {
  pages_navigation: "Pages & Navigation",
  data_entities: "Data Layer & Entities",
  feeds_connectivity: "Feed Health & Connectivity",
  analytics_logic: "Analytics & Intelligence Logic",
  security_governance: "Security & Governance",
  agent_ecosystem: "Agent Ecosystem",
  performance: "Performance & Load",
  // legacy
  ingestion: "Ingestion & Feed Reliability",
  knowledge_graph: "Knowledge Graph Integrity",
  analytics: "Analytics Accuracy",
  dashboard_ui: "Dashboard & UI",
  scenario_engine: "Scenario Engine",
  mobile: "Mobile App Sync",
  manual_entry: "Manual Data Entry",
  full_system: "Full System",
};

const SUITE_COLORS = {
  pages_navigation: "#00d4ff",
  data_entities: "#a855f7",
  feeds_connectivity: "#ffa502",
  analytics_logic: "#2ed573",
  security_governance: "#ff4757",
  agent_ecosystem: "#a855f7",
  performance: "#ff6b35",
};

export default function TestRunResults({ runs }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  if (runs.length === 0) return (
    <div className="text-center py-12 text-gray-600">No test runs yet. Run a suite above.</div>
  );

  // Aggregate stats
  const totalTests = runs.reduce((s, r) => s + (r.total_tests || 0), 0);
  const totalPassed = runs.reduce((s, r) => s + (r.passed || 0), 0);
  const totalFailed = runs.reduce((s, r) => s + (r.failed || 0), 0);
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  const overallStatus = totalFailed === 0 ? "PRODUCTION READY" : totalPassed / totalTests > 0.85 ? "MOSTLY READY" : "NEEDS ATTENTION";
  const overallColor = totalFailed === 0 ? "#2ed573" : totalPassed / totalTests > 0.85 ? "#ffa502" : "#ff4757";

  const filtered = filter === "all" ? runs : runs.filter(r => r.status === filter);

  const exportReport = () => {
    const lines = [
      "ASOSINT PRODUCTION READINESS REPORT",
      `Generated: ${new Date().toISOString()}`,
      `Overall Status: ${overallStatus}`,
      `Pass Rate: ${passRate}% (${totalPassed}/${totalTests})`,
      "",
      "=== TEST RUN SUMMARY ===",
      ...runs.map(r => `[${r.status?.toUpperCase()}] ${r.run_name} — ${r.passed}/${r.total_tests} passed`),
      "",
      "=== FAILED TESTS ===",
      ...runs.flatMap(r => (r.results || []).filter(t => t.status === "failed").map(t => `${r.suite}: ${t.test} — ${t.error}`)),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `asosint-test-report-${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: `${overallColor}30`, background: `${overallColor}08` }}>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Production Readiness Assessment</p>
          <p className="text-2xl font-black font-mono" style={{ color: overallColor }}>{overallStatus}</p>
          <p className="text-xs text-gray-400 mt-1">{passRate}% pass rate · {totalPassed} passed · {totalFailed} failed · {runs.length} suites run</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Pass Rate", value: `${passRate}%`, color: overallColor },
              { label: "Passed", value: totalPassed, color: "#2ed573" },
              { label: "Failed", value: totalFailed, color: totalFailed > 0 ? "#ff4757" : "#6b7280" },
            ].map(s => (
              <div key={s.label} className="bg-black/20 rounded-lg px-3 py-2">
                <p className="text-lg font-black font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={exportReport} className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white border border-white/10 px-3 py-2 rounded-lg transition-colors hover:border-white/20">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-2">
        {["all", "passed", "partial", "failed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[10px] font-bold rounded capitalize transition-colors ${filter === f ? "bg-white/10 text-white" : "text-gray-600 hover:text-gray-300"}`}>
            {f === "all" ? `All (${runs.length})` : `${f} (${runs.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Run List */}
      <div className="space-y-2">
        {filtered.map((run, i) => {
          const passRate = run.total_tests > 0 ? (run.passed / run.total_tests * 100).toFixed(0) : 0;
          const isOpen = expanded === (run.id || i);
          const statusColor = run.status === "passed" ? "#2ed573" : run.status === "partial" ? "#ffa502" : "#ff4757";
          const suiteColor = SUITE_COLORS[run.suite] || "#6b7280";

          return (
            <div key={run.id || i} className="bg-[#0d1117] border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : (run.id || i))}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/2 transition-colors text-left">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{run.run_name}</p>
                  <p className="text-[9px] text-gray-600">{SUITE_LABELS[run.suite] || run.suite}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Mini pass bar */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${passRate}%`, background: statusColor }} />
                    </div>
                    <span className="text-[9px] font-mono" style={{ color: statusColor }}>{passRate}%</span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">{run.passed}/{run.total_tests}</span>
                  {run.duration_ms && <span className="text-[9px] text-gray-700 font-mono">{run.duration_ms}ms</span>}
                  {run.created_date && (
                    <span className="hidden md:block text-[9px] text-gray-700 font-mono">
                      {formatDistanceToNow(new Date(run.created_date), { addSuffix: true })}
                    </span>
                  )}
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                </div>
              </button>

              {isOpen && run.results?.length > 0 && (
                <div className="border-t border-white/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${run.safety_passed ? "bg-[#2ed573]/10 text-[#2ed573]" : "bg-[#ff4757]/10 text-[#ff4757]"}`}>
                      <Shield className="w-2.5 h-2.5" /> Safety {run.safety_passed ? "PASSED" : "FAILED"}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[#00d4ff]/10 text-[#00d4ff]">
                      ENV: {run.environment || "dev"}
                    </span>
                    {run.summary && <span className="text-[9px] text-gray-600">{run.summary}</span>}
                  </div>

                  {/* Failed first */}
                  {[...run.results].sort((a, b) => (a.status === "failed" ? -1 : 1)).map((r, j) => (
                    <div key={j} className="flex items-start gap-2.5 text-[11px]">
                      {r.status === "passed"
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573] shrink-0 mt-0.5" />
                        : <XCircle className="w-3.5 h-3.5 text-[#ff4757] shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <span className={r.status === "passed" ? "text-gray-400" : "text-white font-medium"}>{r.test}</span>
                        {r.error && <p className="text-[9px] text-[#ff4757] mt-0.5 font-mono">{r.error}</p>}
                      </div>
                      <span className="text-[9px] text-gray-700 font-mono shrink-0">{r.duration_ms}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}