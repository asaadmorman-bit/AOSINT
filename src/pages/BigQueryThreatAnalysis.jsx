import React from "react";
import BigQueryThreatAnalysisComponent from "@/components/security/BigQueryThreatAnalysis";

export default function BigQueryThreatAnalysis() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="p-6 lg:p-8">
        <BigQueryThreatAnalysisComponent />
      </div>
    </div>
  );
}