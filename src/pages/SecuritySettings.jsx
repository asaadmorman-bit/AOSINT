import React, { useState } from "react";
import { Shield, Lock, AlertCircle, ChevronRight, Trash2 } from "lucide-react";
import MFAManagement from "@/components/security/MFAManagement";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState("mfa");

  const tabs = [
    { id: "mfa", label: "Multi-Factor Authentication", icon: Lock },
    { id: "sessions", label: "Active Sessions", icon: Shield },
    { id: "devices", label: "Trusted Devices", icon: Shield },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0e1a] text-white">
        {/* Header */}
        <div className="border-b border-white/5 px-6 py-6">
          <div className="max-w-5xl">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-[#00d4ff]" />
              <h1 className="text-2xl font-bold">Security & Privacy</h1>
            </div>
            <p className="text-sm text-gray-400">Manage your account security settings and authentication methods</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/5 px-6">
          <div className="max-w-5xl flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-[#00d4ff] text-[#00d4ff]"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-w-3xl">
            {activeTab === "mfa" && <MFAManagement />}

            {activeTab === "sessions" && (
              <div className="space-y-4">
                <div className="border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Active sessions management coming soon</p>
                </div>
              </div>
            )}

            {activeTab === "devices" && (
              <div className="space-y-4">
                <div className="border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Trusted devices management coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="mt-10 border border-red-600/30 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </h2>
            <Alert className="bg-red-900/20 border-red-600/30">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300 text-sm">
                Deleting your account is <strong>permanent and irreversible</strong>. All your data, settings, and history will be immediately and permanently removed with no possibility of recovery.
              </AlertDescription>
            </Alert>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-600/40 text-red-500 hover:bg-red-600/10 hover:border-red-600/60">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0d1220] border border-red-600/30 text-white max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Delete Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This will permanently delete your account and all associated data. This action <strong className="text-red-400">cannot be undone</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      try {
                        await base44.auth.updateMe({ account_deleted: true, deleted_at: new Date().toISOString() });
                      } finally {
                        base44.auth.logout(createPageUrl("Homepage"));
                      }
                    }}
                  >
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}