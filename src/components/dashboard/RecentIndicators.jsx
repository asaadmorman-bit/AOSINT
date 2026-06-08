import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Globe, Hash, Mail, Link as LinkIcon, Bug, Shield } from "lucide-react";

const typeIcons = {
  ip_address: Globe,
  domain: Globe,
  hash: Hash,
  email: Mail,
  url: LinkIcon,
  cve: Bug,
  ttps: Shield,
  actor: AlertTriangle,
};

const severityStyles = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  informational: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function RecentIndicators({ indicators }) {
  const recent = indicators.slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No indicators yet. Add threat feeds to start collecting intelligence.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((ind) => {
        const Icon = typeIcons[ind.indicator_type] || AlertTriangle;
        return (
          <div key={ind.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
            <div className="p-1.5 rounded-md bg-white/5">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{ind.title}</p>
              <p className="text-xs text-gray-500 font-mono truncate">{ind.value}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${severityStyles[ind.severity] || severityStyles.medium}`}>
              {ind.severity || "medium"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}