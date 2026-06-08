import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

export default function TrialExtensionDialog({ trial, onClose, onSuccess }) {
  const [days, setDays] = useState(30);
  
  const currentExpiry = trial.trial_expires ? new Date(trial.trial_expires) : new Date();
  const newExpiry = addDays(currentExpiry, days);

  const extendMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.TrialSignup.update(trial.id, {
        trial_expires: newExpiry.toISOString(),
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0d1220] border border-white/5 rounded-lg max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Extend Trial Period</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Extend by (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 30))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00d4ff]"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Current Expiry</p>
            <p className="text-sm text-white font-medium">
              {format(currentExpiry, "MMM d, yyyy")}
            </p>
          </div>

          <div className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-lg p-3">
            <p className="text-xs text-gray-300 mb-1">New Expiry</p>
            <p className="text-sm text-[#00d4ff] font-medium">
              {format(newExpiry, "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={extendMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => extendMutation.mutate()}
            className="flex-1 bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black"
            disabled={extendMutation.isPending}
          >
            {extendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Extending...
              </>
            ) : (
              "Extend Trial"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}