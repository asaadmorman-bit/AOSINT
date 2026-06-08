import React from "react";
import { AlertCircle } from "lucide-react";
import CustomAlertRuleBuilder from "@/components/alerts/CustomAlertRuleBuilder";

export default function CustomAlertRuleManagement() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-[#00d4ff]" />
          <h1 className="text-3xl font-bold text-white">Custom Alert Rules</h1>
        </div>
        <p className="text-sm text-gray-400">
          Create sophisticated alert rules using keywords, IP ranges, domain patterns, and threat actor groups. Use AI to help design complex rules.
        </p>
      </div>

      <CustomAlertRuleBuilder />
    </div>
  );
}