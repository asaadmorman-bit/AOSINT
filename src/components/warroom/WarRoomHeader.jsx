import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, ArrowLeft, Pin, Edit3, Check, X, Lock } from "lucide-react";

const CLASS_COLOR = { unclassified: "#6b7280", sensitive: "#ffa502", confidential: "#ff4757", restricted: "#a855f7" };

export default function WarRoomHeader({ room, onBack, membersCount }) {
  const qc = useQueryClient();
  const [editingPin, setEditingPin] = useState(false);
  const [pinText, setPinText] = useState(room.pinned_summary || "");

  const savePinMutation = useMutation({
    mutationFn: (text) => base44.entities.WarRoom.update(room.id, { pinned_summary: text }),
    onSuccess: () => { qc.invalidateQueries(["war_rooms"]); setEditingPin(false); },
  });

  return (
    <div className="border-b border-white/5 bg-[#0a0e1a] px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{room.name}</span>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
              style={{ color: CLASS_COLOR[room.classification], background: `${CLASS_COLOR[room.classification]}15` }}>
              {room.classification}
            </span>
            {room.status === "locked" && <Lock className="w-3 h-3 text-[#ffa502] shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">{membersCount} member{membersCount !== 1 ? "s" : ""}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[10px] text-[#2ed573]">LIVE</span>
          </div>
        </div>
      </div>

      {/* Pinned summary */}
      <div className="bg-[#ffa502]/5 border border-[#ffa502]/15 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase text-[#ffa502] flex items-center gap-1"><Pin className="w-2.5 h-2.5" /> Mission Brief</span>
          <button onClick={() => setEditingPin(!editingPin)} className="text-[#ffa502]/50 hover:text-[#ffa502] transition-colors">
            {editingPin ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
          </button>
        </div>
        {editingPin ? (
          <div className="flex gap-1">
            <input
              value={pinText}
              onChange={e => setPinText(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none"
              placeholder="Set shared mission context, objectives, or notes…"
            />
            <button onClick={() => savePinMutation.mutate(pinText)} className="text-[#2ed573] hover:opacity-80">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400">{room.pinned_summary || <span className="text-gray-600 italic">No mission brief set. Click ✏️ to add shared context.</span>}</p>
        )}
      </div>
    </div>
  );
}