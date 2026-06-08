import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

const STATUS_ICON = {
  completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  running: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
  failed: <AlertTriangle className="w-4 h-4 text-red-400" />,
  queued: <Loader2 className="w-4 h-4 text-gray-400" />,
};

export default function VulnScanHistory({ scans }) {
  if (!scans.length) return (
    <div className="text-center py-12 text-gray-500 text-sm">No scans run yet</div>
  );

  return (
    <div className="space-y-2">
      {scans.map(scan => (
        <div key={scan.id} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            {STATUS_ICON[scan.status] || STATUS_ICON.queued}
            <span className="font-semibold text-sm text-white flex-1">{scan.scan_name}</span>
            <Badge className="bg-slate-700/30 text-gray-400 border-slate-600/20 text-[8px]">{scan.scan_type}</Badge>
            <span className="text-xs text-gray-500">{scan.started_at ? new Date(scan.started_at).toLocaleString() : '—'}</span>
          </div>
          {scan.status === "completed" && (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
              <Stat label="Assets" value={scan.total_assets_scanned} />
              <Stat label="Total" value={scan.vulnerabilities_found} />
              <Stat label="Critical" value={scan.critical_count} color="text-red-400" />
              <Stat label="High" value={scan.high_count} color="text-orange-400" />
              <Stat label="Medium" value={scan.medium_count} color="text-yellow-400" />
              <Stat label="Exploited" value={scan.actively_exploited_count} color="text-red-300" />
              <Stat label="Tasks" value={scan.remediation_tasks_created} color="text-cyan-400" />
            </div>
          )}
          {scan.initiated_by && <p className="text-[10px] text-gray-600 mt-2">by {scan.initiated_by}</p>}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, color = "text-white" }) {
  return (
    <div className="text-center bg-slate-800/30 rounded p-1.5">
      <p className={`text-base font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-[9px] text-gray-600">{label}</p>
    </div>
  );
}