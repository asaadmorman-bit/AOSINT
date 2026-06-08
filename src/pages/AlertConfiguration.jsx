import React from "react";
import { Bell } from "lucide-react";
import PermissionGuard from "@/components/auth/PermissionGuard";
import AlertThresholdManager from "@/components/alerts/AlertThresholdManager";

export default function AlertConfiguration() {
  return (
    <PermissionGuard permission="manage_alert_rules">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold">Alert Configuration</h1>
          </div>
          <p className="text-gray-600">
            Configure alert severity thresholds, notification preferences, and filtering rules for different user roles and data types.
          </p>
        </div>

        <AlertThresholdManager />
      </div>
    </PermissionGuard>
  );
}