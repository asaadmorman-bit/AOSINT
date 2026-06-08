import React from "react";
import SOCDashboard from "@/components/security/SOCDashboard";

export default function SecurityOperationsCenter() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="p-6 lg:p-8">
        <SOCDashboard />
      </div>
    </div>
  );
}