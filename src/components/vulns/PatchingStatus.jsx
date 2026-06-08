import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Loader2,
  ChevronDown, ChevronRight, Package, Zap, Shield, Target
} from "lucide-react";

const TASK_STATUS_META = {
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle2 },
  running:   { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Loader2 },
  pending:   { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  failed:    { label: "Failed", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
  paused:    { label: "Paused", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20", icon: Clock },
};

const SEV_COLORS = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  informational: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const MISSION_COLORS = [
  "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "bg-pink-500/10 text-pink-300 border-pink-500/20",
  "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
];

function ProgressBar({ value, color = "bg-[#00d4ff]", label }) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
          <span>{label}</span>
          <span className="font-mono">{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function AdvisoryRow({ advisory, tasks }) {
  const [expanded, setExpanded] = useState(false);

  // Find linked tasks via remediation_task_id on findings, or match by advisory title in task name
  const linkedTasks = useMemo(() => {
    return tasks.filter(t =>
      t.task_type === "remediate" &&
      (
        (advisory.title && t.task_name?.includes(advisory.title?.slice(0, 30))) ||
        (advisory.cve_ids?.some(cve => t.task_name?.includes(cve))) ||
        (advisory.vendor_name && t.target?.toLowerCase().includes(advisory.vendor_name?.toLowerCase()))
      )
    );
  }, [advisory, tasks]);

  const total = linkedTasks.length;
  const completed = linkedTasks.filter(t => t.status === "completed").length;
  const running = linkedTasks.filter(t => t.status === "running").length;
  const failed = linkedTasks.filter(t => t.status === "failed").length;
  const pending = linkedTasks.filter(t => t.status === "pending").length;
  const progress = total > 0 ? (completed / total) * 100 : advisory.status === "resolved" ? 100 : 0;

  const progressColor =
    progress === 100 ? "bg-green-400" :
    failed > 0 ? "bg-red-400" :
    running > 0 ? "bg-blue-400" :
    "bg-[#00d4ff]";

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/3 transition-colors"
      >
        <div className="mt-0.5 text-gray-500 shrink-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-white truncate">{advisory.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${SEV_COLORS[advisory.severity] || SEV_COLORS.medium}`}>
                  {advisory.severity?.toUpperCase()}
                </span>
                {advisory.status === "resolved" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">RESOLVED</span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{advisory.vendor_name} · {advisory.advisory_type?.replace(/_/g, " ")}</p>
            </div>

            {/* Task count pill */}
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-gray-400">
                {total > 0 ? `${completed}/${total} tasks` : advisory.status === "resolved" ? "Resolved" : "No tasks"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar value={progress} color={progressColor} />

          {/* Mini stats */}
          {total > 0 && (
            <div className="flex items-center gap-3 text-[10px] flex-wrap">
              {completed > 0 && <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{completed} done</span>}
              {running > 0 && <span className="text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />{running} running</span>}
              {pending > 0 && <span className="text-yellow-400 flex items-center gap-1"><Clock className="w-3 h-3" />{pending} pending</span>}
              {failed > 0 && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" />{failed} failed</span>}
            </div>
          )}

          {/* Mission sets */}
          {advisory.mission_sets?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {advisory.mission_sets.map((ms, i) => (
                <span key={ms} className={`text-[9px] px-1.5 py-0.5 rounded border ${MISSION_COLORS[i % MISSION_COLORS.length]}`}>{ms}</span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Expanded task list */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-3 pt-2 space-y-2">
          {advisory.cve_ids?.length > 0 && (
            <p className="text-[10px] text-[#00d4ff] font-mono">{advisory.cve_ids.join(" · ")}</p>
          )}
          {advisory.fix_instructions && (
            <p className="text-[10px] text-gray-500 leading-relaxed">{advisory.fix_instructions}</p>
          )}

          {linkedTasks.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic">No remediation tasks linked yet. Trigger the workflow to create them.</p>
          ) : (
            <div className="space-y-1.5">
              {linkedTasks.map(task => {
                const meta = TASK_STATUS_META[task.status] || TASK_STATUS_META.pending;
                const Icon = meta.icon;
                return (
                  <div key={task.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${meta.bg}`}>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color} ${task.status === "running" ? "animate-spin" : ""}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white truncate">{task.task_name}</p>
                      {task.target && <p className="text-[10px] text-gray-500">{task.target}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold shrink-0 ${meta.color}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MissionSetProgressPanel({ advisories, tasks }) {
  const missionData = useMemo(() => {
    const map = {};
    advisories.forEach(adv => {
      (adv.mission_sets || []).forEach(ms => {
        if (!map[ms]) map[ms] = { total: 0, resolved: 0, in_remediation: 0, pending: 0 };
        map[ms].total++;
        if (adv.status === "resolved") map[ms].resolved++;
        else if (adv.status === "in_remediation") map[ms].in_remediation++;
        else map[ms].pending++;
      });
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [advisories]);

  if (missionData.length === 0) return null;

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-white">Patch Deployment by Mission Set</span>
      </div>
      <div className="space-y-3">
        {missionData.map(([ms, data], i) => {
          const pct = data.total > 0 ? (data.resolved / data.total) * 100 : 0;
          const color =
            pct === 100 ? "bg-green-400" :
            pct >= 50 ? "bg-[#00d4ff]" :
            pct > 0 ? "bg-yellow-400" :
            "bg-red-400";
          return (
            <div key={ms}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${MISSION_COLORS[i % MISSION_COLORS.length]}`}>{ms}</span>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="text-green-400">{data.resolved} resolved</span>
                  {data.in_remediation > 0 && <span className="text-blue-400">{data.in_remediation} remediating</span>}
                  {data.pending > 0 && <span className="text-gray-500">{data.pending} pending</span>}
                </div>
              </div>
              <ProgressBar value={pct} color={color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PatchingStatus() {
  const [filterMission, setFilterMission] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: advisories = [], isLoading: loadingAdv } = useQuery({
    queryKey: ["vendor-advisories-patching"],
    queryFn: () => base44.entities.VendorAdvisory.list("-created_date", 200),
    refetchInterval: 30000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["agent-tasks-remediate"],
    queryFn: () => base44.entities.AgentTask.filter({ task_type: "remediate" }, "-created_date", 300),
    refetchInterval: 20000,
  });

  const allMissions = useMemo(() => {
    const s = new Set();
    advisories.forEach(a => (a.mission_sets || []).forEach(ms => s.add(ms)));
    return ["all", ...Array.from(s).sort()];
  }, [advisories]);

  const filtered = useMemo(() => {
    return advisories.filter(a => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterMission !== "all" && !(a.mission_sets || []).includes(filterMission)) return false;
      return true;
    });
  }, [advisories, filterStatus, filterMission]);

  // Overall stats
  const stats = useMemo(() => {
    const total = advisories.length;
    const resolved = advisories.filter(a => a.status === "resolved").length;
    const inRem = advisories.filter(a => a.status === "in_remediation").length;
    const critical = advisories.filter(a => a.severity === "critical" && a.status !== "resolved").length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    return { total, resolved, inRem, critical, totalTasks, completedTasks };
  }, [advisories, tasks]);

  const isLoading = loadingAdv || loadingTasks;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Advisories", value: stats.total, icon: Package, color: "text-gray-400" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-400" },
          { label: "In Remediation", value: stats.inRem, icon: Zap, color: "text-blue-400" },
          { label: "Open Critical", value: stats.critical, icon: AlertTriangle, color: "text-red-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d1220] border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <div className="text-lg font-black text-white">{value}</div>
              <div className="text-[10px] text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall patch deployment progress */}
      {stats.total > 0 && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Overall Patch Deployment</span>
            <span className="text-xs text-gray-400">
              {stats.completedTasks}/{stats.totalTasks} remediation tasks complete
            </span>
          </div>
          <ProgressBar
            value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}
            color={stats.resolved === stats.total && stats.total > 0 ? "bg-green-400" : "bg-[#00d4ff]"}
            label={`Advisory resolution: ${stats.resolved} of ${stats.total}`}
          />
          {stats.totalTasks > 0 && (
            <ProgressBar
              value={(stats.completedTasks / stats.totalTasks) * 100}
              color="bg-purple-400"
              label={`Agent task completion: ${stats.completedTasks} of ${stats.totalTasks}`}
            />
          )}
        </div>
      )}

      {/* Mission Set Breakdown */}
      <MissionSetProgressPanel advisories={advisories} tasks={tasks} />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Mission</span>
          <div className="flex flex-wrap gap-1">
            {allMissions.map(ms => (
              <button
                key={ms}
                onClick={() => setFilterMission(ms)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  filterMission === ms
                    ? "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30"
                    : "bg-white/3 text-gray-500 border-white/5 hover:text-gray-300"
                }`}
              >
                {ms === "all" ? "All" : ms}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Status</span>
          {["all", "new", "triaged", "in_remediation", "resolved", "accepted_risk"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                filterStatus === s
                  ? "bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30"
                  : "bg-white/3 text-gray-500 border-white/5 hover:text-gray-300"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-600">{filtered.length} advisories</span>
      </div>

      {/* Advisory rows */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Shield className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No advisories match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => (
            <AdvisoryRow key={a.id} advisory={a} tasks={tasks} />
          ))}
        </div>
      )}
    </div>
  );
}