import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WarRoomList from "@/components/warroom/WarRoomList";
import WarRoomHeader from "@/components/warroom/WarRoomHeader";
import WarRoomChat from "@/components/warroom/WarRoomChat";
import WarRoomFindings from "@/components/warroom/WarRoomFindings";
import { Loader2, MessageSquare, FileText } from "lucide-react";

export default function WarRooms() {
  const [user, setUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [tab, setTab] = useState("chat");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  if (!activeRoom) {
    return (
      <div className="max-w-2xl mx-auto">
        <WarRoomList onSelect={setActiveRoom} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-[#0a0e1a] border border-white/5 rounded-2xl overflow-hidden">
      <WarRoomHeader
        room={activeRoom}
        onBack={() => setActiveRoom(null)}
        membersCount={activeRoom.members?.length || 1}
      />

      {/* Tab bar */}
      <div className="flex border-b border-white/5 bg-[#0d1220] px-4">
        {[
          { key: "chat", label: "Live Chat", icon: MessageSquare },
          { key: "findings", label: "Findings", icon: FileText },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#00d4ff] text-[#00d4ff]"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "chat" && <WarRoomChat room={activeRoom} user={user} />}
        {tab === "findings" && <WarRoomFindings room={activeRoom} user={user} />}
      </div>
    </div>
  );
}