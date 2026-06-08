import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users, MessageSquare, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AVATAR_COLORS = ["#00d4ff", "#2ed573", "#a855f7", "#ffa502", "#ff6b35", "#ec4899", "#ff4757"];
function avatarColor(email) {
  let h = 0;
  for (let c of (email || "")) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (email || "?")[0].toUpperCase();
}

export default function ScenarioTeamChat({ scenarioId, scenarioTitle }) {
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef(null);

  // Load current user
  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Register/refresh presence
  useEffect(() => {
    if (!currentUser || !scenarioId) return;
    const upsertPresence = () => {
      base44.entities.CollabPresence.filter({ scenario_id: scenarioId, user_email: currentUser.email })
        .then(existing => {
          const data = { scenario_id: scenarioId, user_email: currentUser.email, user_name: currentUser.full_name || currentUser.email, last_seen: new Date().toISOString(), status: "active" };
          if (existing.length > 0) base44.entities.CollabPresence.update(existing[0].id, data);
          else base44.entities.CollabPresence.create(data);
        });
    };
    upsertPresence();
    const interval = setInterval(upsertPresence, 15000);
    return () => clearInterval(interval);
  }, [currentUser, scenarioId]);

  // Subscribe to messages in real-time
  useEffect(() => {
    if (!scenarioId) return;
    base44.entities.CollabMessage.filter({ scenario_id: scenarioId }, "created_date", 50)
      .then(setMessages);

    const unsub = base44.entities.CollabMessage.subscribe((event) => {
      if (event.data?.scenario_id !== scenarioId) return;
      if (event.type === "create") setMessages(prev => [...prev, event.data]);
      if (event.type === "delete") setMessages(prev => prev.filter(m => m.id !== event.id));
    });
    return () => unsub();
  }, [scenarioId]);

  // Subscribe to presence in real-time
  useEffect(() => {
    if (!scenarioId) return;
    base44.entities.CollabPresence.filter({ scenario_id: scenarioId }).then(setPresence);

    const unsub = base44.entities.CollabPresence.subscribe((event) => {
      if (event.data?.scenario_id !== scenarioId) return;
      setPresence(prev => {
        const without = prev.filter(p => p.id !== event.id);
        if (event.type === "delete") return without;
        return [...without, event.data];
      });
    });
    return () => unsub();
  }, [scenarioId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, collapsed]);

  const send = async () => {
    if (!input.trim() || !currentUser) return;
    const content = input.trim();
    setInput("");
    await base44.entities.CollabMessage.create({
      scenario_id: scenarioId,
      author_email: currentUser.email,
      author_name: currentUser.full_name || currentUser.email,
      content,
      message_type: "chat",
    });
  };

  // Active users = seen in last 2 minutes
  const activeUsers = presence.filter(p => {
    if (!p.last_seen) return false;
    return (Date.now() - new Date(p.last_seen).getTime()) < 2 * 60 * 1000;
  });

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 px-3 py-2 bg-[#0d1220] border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all">
        <MessageSquare className="w-3.5 h-3.5 text-[#00d4ff]" />
        Team Chat
        {messages.length > 0 && (
          <span className="bg-[#00d4ff]/20 text-[#00d4ff] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{messages.length}</span>
        )}
        <span className="flex items-center gap-1 ml-1">
          <Circle className="w-1.5 h-1.5 fill-[#2ed573] text-[#2ed573]" />
          <span className="text-[9px] text-[#2ed573]">{activeUsers.length}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="bg-[#0d1220] border border-white/10 rounded-xl overflow-hidden flex flex-col" style={{ height: 360 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span className="text-xs font-bold text-white">Team Chat</span>
          <span className="text-[9px] text-gray-600 truncate max-w-[100px]">{scenarioTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Active users avatars */}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-600" />
            <div className="flex -space-x-1">
              {activeUsers.slice(0, 4).map(u => (
                <div key={u.id} title={u.user_name}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-[#0d1220]"
                  style={{ background: avatarColor(u.user_email) }}>
                  {initials(u.user_name, u.user_email)}
                </div>
              ))}
              {activeUsers.length > 4 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-gray-400 bg-white/10 border border-[#0d1220]">+{activeUsers.length - 4}</div>
              )}
            </div>
            <span className="text-[9px] text-[#2ed573] font-bold">{activeUsers.length} live</span>
          </div>
          <button onClick={() => setCollapsed(true)} className="text-gray-600 hover:text-gray-300 text-[10px] px-1">—</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs mt-4">
            No messages yet. Start the team conversation.
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.author_email === currentUser?.email;
          const color = avatarColor(msg.author_email);
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: color }}>
                {initials(msg.author_name, msg.author_email)}
              </div>
              <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="text-[9px] text-gray-600 px-1">{msg.author_name || msg.author_email}</span>
                )}
                <div className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                  isMe ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/20" : "bg-white/5 text-gray-300 border border-white/5"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[8px] text-gray-700 px-1">
                  {msg.created_date ? formatDistanceToNow(new Date(msg.created_date), { addSuffix: true }) : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-white/5 flex gap-1.5">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={currentUser ? "Message your team..." : "Sign in to chat..."}
          disabled={!currentUser}
          className="bg-white/5 border-white/10 text-white text-xs placeholder:text-gray-700 h-8" />
        <Button onClick={send} disabled={!input.trim() || !currentUser} size="icon"
          className="h-8 w-8 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 text-[#00d4ff] shrink-0">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}