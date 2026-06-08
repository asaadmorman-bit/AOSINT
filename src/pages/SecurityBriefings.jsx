import React from "react";
import { Shield, FileText } from "lucide-react";
import BriefingBuilder from "@/components/reports/BriefingBuilder";

export default function SecurityBriefings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Security Briefings
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">PDF EXPORT</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate professional intelligence briefings from War Rooms, investigations, and threat data</p>
        </div>
      </div>

      <BriefingBuilder />
    </div>
  );
}