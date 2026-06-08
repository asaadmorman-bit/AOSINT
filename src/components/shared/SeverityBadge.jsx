import React from "react";
import { Badge } from "@/components/ui/badge";

const styles = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  informational: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function SeverityBadge({ severity }) {
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[severity] || styles.medium}`}>
      {severity || "medium"}
    </Badge>
  );
}