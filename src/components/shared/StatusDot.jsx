import React from "react";

const colors = {
  active: "#2ed573",
  inactive: "#6b7280",
  error: "#ff4757",
  pending: "#ffa502",
  resolved: "#00d4ff",
  investigating: "#a855f7",
  false_positive: "#6b7280",
  draft: "#6b7280",
  in_progress: "#ffa502",
  completed: "#2ed573",
  archived: "#4b5563",
  compliant: "#2ed573",
  non_compliant: "#ff4757",
  partial: "#ffa502",
  unknown: "#6b7280",
};

export default function StatusDot({ status, showLabel = true }) {
  const color = colors[status] || "#6b7280";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping" style={{ background: color }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium capitalize" style={{ color }}>
          {(status || "unknown").replace(/_/g, " ")}
        </span>
      )}
    </span>
  );
}