import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Shield, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const ROLE_COLORS = {
  admin: "#ff4757", analyst: "#00d4ff", operator: "#2ed573",
  ep: "#ffa502", leo: "#a855f7", leadership: "#f59e0b", viewer: "#6b7280"
};

const SEAT_PRICES = { pro: 9, enterprise: 15, gov: 25 };

export default function SeatManagement({ subscription, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("analyst");
  const [inviting, setInviting] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["users_list"],
    queryFn: () => base44.entities.User.list(),
  });

  const seatPrice = SEAT_PRICES[subscription?.tier] || 0;
  const maxSeats = subscription?.max_seats || 1;
  const usedSeats = users.length;
  const availableSeats = Math.max(0, maxSeats - usedSeats);

  async function handleInvite(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(email.trim(), role === "admin" ? "admin" : "user");
    setEmail("");
    setInviting(false);
    onInvite?.();
  }

  return (
    <div className="space-y-4">
      {/* Seat stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Used Seats", value: usedSeats, color: "#00d4ff" },
          { label: "Available", value: availableSeats, color: "#2ed573" },
          { label: "Seat Cost", value: seatPrice ? `$${seatPrice}/seat/mo` : "Free", color: "#a855f7" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0d1117] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-[9px] text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Invite form */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Plus className="w-3 h-3" /> Invite Team Member
        </p>
        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
          <Input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="colleague@org.com" type="email"
            className="flex-1 h-8 bg-black/30 border-white/10 text-sm text-white placeholder:text-gray-700 min-w-0" />
          <select value={role} onChange={e => setRole(e.target.value)}
            className="h-8 px-2 rounded-lg bg-black/30 border border-white/10 text-xs text-gray-300 outline-none">
            {["analyst", "operator", "ep", "leo", "leadership", "viewer"].map(r => (
              <option key={r} value={r} className="bg-[#0d1117] capitalize">{r}</option>
            ))}
          </select>
          <Button type="submit" disabled={inviting || !email.trim() || availableSeats === 0}
            className="h-8 px-3 text-xs bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1">
            {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Invite
          </Button>
        </form>
        {availableSeats === 0 && (
          <p className="text-[10px] text-[#ffa502] mt-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> No seats available. Upgrade or add seat capacity.
          </p>
        )}
      </div>

      {/* Current users */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Users className="w-3 h-3" /> Team Members ({users.length})
        </p>
        <div className="space-y-2">
          {users.slice(0, 20).map((user, i) => {
            const roleColor = ROLE_COLORS[user.role] || "#6b7280";
            return (
              <div key={user.id || i} className="flex items-center gap-3 py-2 border-b border-white/3 last:border-0">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {(user.full_name || user.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user.full_name || user.email}</p>
                  <p className="text-[9px] text-gray-600 truncate">{user.email}</p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded capitalize font-bold shrink-0"
                  style={{ background: `${roleColor}10`, color: roleColor }}>
                  {user.role || "user"}
                </span>
              </div>
            );
          })}
          {users.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">No team members yet</p>}
        </div>
      </div>
    </div>
  );
}