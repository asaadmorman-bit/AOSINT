import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Users, Lock, Activity, ChevronRight, Loader2, X, AlertTriangle } from "lucide-react";

const STATUS_COLOR = { active: "#2ed573", locked: "#ffa502", closed: "#6b7280" };
const CLASS_COLOR = { unclassified: "#6b7280", sensitive: "#ffa502", confidential: "#ff4757", restricted: "#a855f7" };

export default function WarRoomList({ onSelect }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", classification: "sensitive" });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["war_rooms"],
    queryFn: () => base44.entities.WarRoom.list("-created_date", 50),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.WarRoom.create({ ...data, created_by: user.email, members: [user.email], status: "active" });
    },
    onSuccess: (room) => {
      qc.invalidateQueries(["war_rooms"]);
      setShowCreate(false);
      setForm({ name: "", description: "", classification: "sensitive" });
      onSelect(room);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" /> War Rooms
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Persistent collaborative investigation environments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 gap-1 text-xs h-8">
          <Plus className="w-3.5 h-3.5" /> New War Room
        </Button>
      </div>

      {showCreate && (
        <div className="bg-[#0d1220] border border-red-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Create War Room</span>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
          </div>
          <Input
            placeholder="Operation name (e.g. Op Phantom Pulse)"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm"
          />
          <Input
            placeholder="Brief description or objective"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm"
          />
          <select
            value={form.classification}
            onChange={e => setForm({ ...form, classification: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="unclassified">Unclassified</option>
            <option value="sensitive">Sensitive</option>
            <option value="confidential">Confidential</option>
            <option value="restricted">Restricted</option>
          </select>
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.name.trim() || createMutation.isPending}
            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm h-9"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Initiate War Room
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No active war rooms. Initiate one to begin a collaborative investigation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => onSelect(room)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#0d1220] border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{room.name}</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: CLASS_COLOR[room.classification], background: `${CLASS_COLOR[room.classification]}15` }}>{room.classification}</span>
                </div>
                {room.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{room.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><Users className="w-3 h-3" />{room.members?.length || 1}</span>
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: STATUS_COLOR[room.status] }}>
                    <Activity className="w-3 h-3" />{room.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}