import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, TrendingUp, AlertCircle } from "lucide-react";

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-500", label: "Pending" },
  approved: { icon: CheckCircle2, color: "bg-green-500/10 text-green-500", label: "Active" },
  rejected: { icon: XCircle, color: "bg-red-500/10 text-red-500", label: "Rejected" },
  converted: { icon: TrendingUp, color: "bg-[#2ed573]/10 text-[#2ed573]", label: "Converted" },
};

const tierConfig = {
  pro: { color: "bg-[#00d4ff]/10 text-[#00d4ff]", label: "Pro" },
  enterprise: { color: "bg-purple-500/10 text-purple-500", label: "Enterprise" },
  gov: { color: "bg-orange-500/10 text-orange-500", label: "Gov/CI" },
};

export default function TrialListTable({ trials, selectedTrialId, onSelectTrial }) {
  const isExpired = (trial) => {
    if (!trial.trial_expires) return false;
    return new Date(trial.trial_expires) < new Date();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Company</th>
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Email</th>
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Tier</th>
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Status</th>
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Trial Expires</th>
            <th className="text-left py-3 px-3 font-semibold text-xs text-gray-400">Domain Verified</th>
          </tr>
        </thead>
        <tbody>
          {trials.map(trial => {
            const expired = isExpired(trial);
            const config = statusConfig[trial.status] || statusConfig.pending;
            const tierBadge = tierConfig[trial.tier] || tierConfig.pro;
            const Icon = config.icon;
            
            return (
              <tr
                key={trial.id}
                onClick={() => onSelectTrial(trial.id)}
                className={`border-b border-white/5 cursor-pointer transition-colors ${
                  selectedTrialId === trial.id
                    ? "bg-[#00d4ff]/5"
                    : "hover:bg-white/5"
                }`}
              >
                <td className="py-3 px-3">
                  <div>
                    <p className="font-medium text-white truncate">{trial.company_name}</p>
                    <p className="text-xs text-gray-500">{trial.company_domain}</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-300 truncate text-xs">{trial.email}</td>
                <td className="py-3 px-3">
                  <Badge className={tierBadge.color}>{tierBadge.label}</Badge>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-xs">
                  {trial.trial_expires ? (
                    <div className="flex items-center gap-1.5">
                      {expired && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span className={expired ? "text-red-500 font-medium" : "text-gray-300"}>
                        {format(new Date(trial.trial_expires), "MMM d, yyyy")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  {trial.domain_validated ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-500" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}