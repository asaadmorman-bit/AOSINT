import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function DiscordPushTester() {
  const [pushResult, setPushResult] = useState(null);
  const [hoursBack, setHoursBack] = useState(4);

  const pushMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('pushRecentThreatDataToDiscord', {
        forcePush: true,
        hoursBack,
        includeTypes: ['alerts', 'indicators', 'threats'],
      });
      return res.data;
    },
    onSuccess: (data) => {
      setPushResult(data);
    },
  });

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-[#00d4ff]" />
        </div>
        <div>
          <h3 className="font-bold text-white">Discord Data Push (Testing)</h3>
          <p className="text-xs text-gray-500">Immediately push recent threats to Discord channels</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Look Back Hours</label>
          <select
            value={hoursBack}
            onChange={(e) => setHoursBack(parseInt(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value={1}>Last 1 Hour</option>
            <option value={4}>Last 4 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
          </select>
        </div>

        <Button
          onClick={() => pushMutation.mutate()}
          disabled={pushMutation.isPending}
          className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc] font-bold gap-2"
        >
          {pushMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Pushing to Discord...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Push Recent Data Now
            </>
          )}
        </Button>

        {pushResult && (
          <div className={`p-4 rounded-lg border ${pushResult.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <div className="flex items-start gap-2 mb-2">
              {pushResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-bold text-white">{pushResult.message}</p>
                <p className="text-gray-400 mt-1">
                  {pushResult.results.channels_updated} channels updated
                </p>
              </div>
            </div>

            {pushResult.data_summary && (
              <div className="grid grid-cols-3 gap-2 text-[10px] mt-3 pt-3 border-t border-white/10">
                <div>
                  <span className="text-gray-400">Alerts</span>
                  <p className="font-bold text-white">{pushResult.data_summary.alerts_found}</p>
                </div>
                <div>
                  <span className="text-gray-400">Indicators</span>
                  <p className="font-bold text-white">{pushResult.data_summary.indicators_found}</p>
                </div>
                <div>
                  <span className="text-gray-400">Threats</span>
                  <p className="font-bold text-white">{pushResult.data_summary.threats_found}</p>
                </div>
              </div>
            )}

            {pushResult.results.errors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[10px] font-bold text-red-300 mb-1">Errors:</p>
                <ul className="text-[9px] text-red-400 space-y-0.5">
                  {pushResult.results.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}