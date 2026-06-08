import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Calendar, Mail, Building2, Globe, X, Loader2 } from "lucide-react";
import TrialExtensionDialog from "@/components/trials/TrialExtensionDialog";
import VerificationReviewModal from "@/components/trials/VerificationReviewModal";

export default function TrialDetailsPanel({ trial, onRefresh, onClose }) {
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Status/Approval mutation
  const approveMutation = useMutation({
    mutationFn: async (status) => {
      await base44.entities.TrialSignup.update(trial.id, { status });
    },
    onSuccess: () => {
      onRefresh();
      setShowVerifyModal(false);
    },
  });

  const isExpired = trial.trial_expires && new Date(trial.trial_expires) < new Date();
  const daysRemaining = trial.trial_expires
    ? Math.ceil((new Date(trial.trial_expires) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      <div className="border border-white/5 rounded-lg bg-[#0d1220] p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{trial.company_name}</h2>
            <p className="text-sm text-gray-400">{trial.company_domain}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <Card className="bg-white/5 border-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs text-gray-400">Email</span>
            </div>
            <p className="text-sm text-white font-medium">{trial.email}</p>
          </Card>

          <Card className="bg-white/5 border-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs text-gray-400">Contact</span>
            </div>
            <p className="text-sm text-white font-medium">{trial.full_name}</p>
          </Card>

          <Card className="bg-white/5 border-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs text-gray-400">Domain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {trial.domain_validated ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">Pending</span>
                </>
              )}
            </div>
          </Card>

          <Card className="bg-white/5 border-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs text-gray-400">Trial Status</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white font-medium">
                Status: <span className="capitalize text-[#00d4ff]">{trial.status}</span>
              </p>
              {trial.trial_expires && (
                <p className={`text-sm ${isExpired ? "text-red-500" : "text-gray-300"}`}>
                  Expires: {format(new Date(trial.trial_expires), "MMM d, yyyy")}
                  {daysRemaining !== null && (
                    <span className="ml-2 text-xs">
                      ({isExpired ? "Expired" : `${daysRemaining} days left`})
                    </span>
                  )}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          {trial.status === "pending" && (
            <>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="w-full px-3 py-2 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/15 text-[#00d4ff] text-sm font-medium rounded-lg transition-colors"
              >
                Review & Approve/Reject
              </button>
            </>
          )}

          {trial.status === "approved" && (
            <button
              onClick={() => setShowExtendDialog(true)}
              className="w-full px-3 py-2 bg-green-500/10 hover:bg-green-500/15 text-green-500 text-sm font-medium rounded-lg transition-colors"
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                "Extend Trial Period"
              )}
            </button>
          )}

          {trial.status !== "converted" && trial.status !== "rejected" && (
            <button
              onClick={() =>
                approveMutation.mutate("converted")
              }
              className="w-full px-3 py-2 bg-[#2ed573]/10 hover:bg-[#2ed573]/15 text-[#2ed573] text-sm font-medium rounded-lg transition-colors"
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 inline mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                "Mark as Converted"
              )}
            </button>
          )}

          {trial.status === "pending" && (
            <button
              onClick={() => approveMutation.mutate("rejected")}
              className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/15 text-red-500 text-sm font-medium rounded-lg transition-colors"
              disabled={approveMutation.isPending}
            >
              Reject Trial
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-white/5">
          <p>Created: {format(new Date(trial.created_at), "MMM d, yyyy HH:mm")}</p>
          <p>Tier: <span className="text-gray-400 capitalize">{trial.tier}</span></p>
          {trial.use_case && <p>Use Case: <span className="text-gray-400">{trial.use_case}</span></p>}
        </div>
      </div>

      {/* Dialogs */}
      {showExtendDialog && (
        <TrialExtensionDialog
          trial={trial}
          onClose={() => setShowExtendDialog(false)}
          onSuccess={onRefresh}
        />
      )}
      {showVerifyModal && (
        <VerificationReviewModal
          trial={trial}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}