import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const FRAMEWORKS = [
  { id: "soc2", label: "SOC2 T2", score: 94, status: "passing" },
  { id: "iso27001", label: "ISO 27001", score: 91, status: "passing" },
  { id: "jsig", label: "JSIG", score: 87, status: "warning" },
  { id: "rmf", label: "RMF", score: 89, status: "passing" },
  { id: "cmmc", label: "CMMC L3", score: 82, status: "warning" },
  { id: "fedramp", label: "FedRAMP", score: 76, status: "warning" },
];

export default function ComplianceStatusBar() {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {FRAMEWORKS.map(f => {
        const Icon = f.status === "passing" ? CheckCircle2 : f.status === "warning" ? AlertTriangle : XCircle;
        const color = f.status === "passing" ? "text-[#2ed573] border-[#2ed573]/20 bg-[#2ed573]/5"
          : f.status === "warning" ? "text-[#ffa502] border-[#ffa502]/20 bg-[#ffa502]/5"
          : "text-red-400 border-red-500/20 bg-red-900/10";
        return (
          <div key={f.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${color}`}>
            <Icon className="w-3 h-3" />
            {f.label}
            <span className="ml-0.5 opacity-70">{f.score}%</span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#00d4ff]/20 bg-[#00d4ff]/5 text-[#00d4ff] text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
        Agent scanning live
      </div>
    </div>
  );
}