import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, XCircle, FileCheck, Loader2 } from "lucide-react";

export default function VerificationReviewModal({ trial, onClose, onSuccess }) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState(null); // 'approve' or 'reject'

  const reviewMutation = useMutation({
    mutationFn: async (newStatus) => {
      await base44.entities.TrialSignup.update(trial.id, {
        status: newStatus,
        domain_validated: newStatus === "approved" ? true : trial.domain_validated,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleApprove = () => {
    setAction("approve");
    reviewMutation.mutate("approved");
  };

  const handleReject = () => {
    setAction("reject");
    reviewMutation.mutate("rejected");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0d1220] border border-white/5 rounded-lg max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="text-lg font-bold text-white">Verification Review</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trial Info */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Company Name</p>
              <p className="text-sm font-medium text-white">{trial.company_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Contact Email</p>
              <p className="text-sm font-medium text-white">{trial.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Contact Name</p>
              <p className="text-sm font-medium text-white">{trial.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Company Domain</p>
              <p className="text-sm font-medium text-white">{trial.company_domain}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tier Requested</p>
              <p className="text-sm font-medium text-white capitalize">{trial.tier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Use Case</p>
              <p className="text-sm font-medium text-white">{trial.use_case || "—"}</p>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Review Notes (Optional)
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add any notes about this verification review..."
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00d4ff] resize-none"
            rows="4"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={reviewMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            className="flex-1 bg-red-500/10 hover:bg-red-500/15 text-red-500 border border-red-500/20"
            disabled={reviewMutation.isPending || action === "approve"}
          >
            {reviewMutation.isPending && action === "reject" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </>
            )}
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1 bg-green-500/10 hover:bg-green-500/15 text-green-500 border border-green-500/20"
            disabled={reviewMutation.isPending || action === "reject"}
          >
            {reviewMutation.isPending && action === "approve" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}