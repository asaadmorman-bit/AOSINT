import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertTriangle, Clock, Shield } from "lucide-react";

const FRAMEWORKS = ["nist_csf", "iso_27001", "cis_top20", "cjis", "fedramp"];
const FRAMEWORK_LABELS = {
  nist_csf: "NIST Cybersecurity Framework",
  iso_27001: "ISO 27001",
  cis_top20: "CIS Top 20",
  cjis: "CJIS",
  fedramp: "FedRAMP"
};

export default function ComplianceDashboard({ tenantId }) {
  const { data: controls = [] } = useQuery({
    queryKey: ["compliance_controls", tenantId],
    queryFn: () => base44.entities.ComplianceControl.filter({ tenant_id: tenantId }),
  });

  const getStats = (framework) => {
    const fw = controls.filter(c => c.framework === framework);
    return {
      total: fw.length,
      compliant: fw.filter(c => c.status === "compliant").length,
      partial: fw.filter(c => c.status === "partial").length,
      non: fw.filter(c => c.status === "non_compliant").length,
    };
  };

  return (
    <div className="space-y-4">
      {/* Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {FRAMEWORKS.map(fw => {
          const stats = getStats(fw);
          const pct = stats.total === 0 ? 0 : Math.round(stats.compliant / stats.total * 100);
          return (
            <div key={fw} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">
                {FRAMEWORK_LABELS[fw] || fw}
              </p>
              <p className="text-2xl font-bold text-white mb-0.5">{pct}%</p>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#2ed573] rounded-full transition-all"
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-gray-600">
                {stats.compliant} of {stats.total} controls
              </p>
            </div>
          );
        })}
      </div>

      {/* Framework Details */}
      <div className="space-y-3">
        {FRAMEWORKS.map(fw => {
          const fw_controls = controls.filter(c => c.framework === fw);
          return (
            <div key={fw} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> {FRAMEWORK_LABELS[fw] || fw}
              </p>
              <div className="space-y-2">
                {fw_controls.slice(0, 5).map(ctrl => {
                  const statusColor = ctrl.status === "compliant" ? "#2ed573" : ctrl.status === "partial" ? "#ffa502" : "#ff4757";
                  const statusIcon = ctrl.status === "compliant" ? CheckCircle2 : ctrl.status === "partial" ? AlertTriangle : AlertTriangle;
                  const Icon = statusIcon;
                  return (
                    <div key={ctrl.id} className="flex items-center gap-3 py-1.5 border-b border-white/3 last:border-0">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: statusColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{ctrl.control_id}: {ctrl.control_name}</p>
                        <p className="text-[9px] text-gray-600">{ctrl.description?.substring(0, 50)}...</p>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded shrink-0 capitalize font-bold"
                        style={{ background: `${statusColor}10`, color: statusColor }}>
                        {ctrl.status}
                      </span>
                    </div>
                  );
                })}
                {fw_controls.length === 0 && (
                  <p className="text-xs text-gray-600 py-2">No controls defined</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}