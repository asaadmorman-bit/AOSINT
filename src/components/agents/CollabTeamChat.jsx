import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const USER_COLORS = ["#00d4ff", "#2ed573", "#a855f7", "#ff6b35", "#ffa502", "#ec4899", "#ff4757"];
const AVATARS = ["🧑‍💻", "👩‍🔬", "👨‍🔬", "🕵️", "👩‍💼", "👨‍💼", "🧑‍🔭"];

function getColorForEmail(email) {
  let hash = 0;
  for (let c of (email || "x")) hash += c.charCodeAt(0);
  return USER_COLORS[hash % USER_COLORS.length];
}
function getAvatarForEmail(email) {
  let hash = 0;
  for (let c of (email || "x")) hash += c.charCodeAt(0);
  return AVATARS[hash % AVATARS.length];
}

export default function CollabTeamChat({ agentId, agentColor }) {
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ["collabMessages", agentId],
    queryFn: () => base44.entities.AgentCollabMessage.filter({ agent_id: agentId }, "created_date", 50),
    refetchInterval: 3000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.AgentCollabMessage.subscribe((event) => {
      if (event.data?.agent_id === agentId) {
        queryClient.invalidateQueries({ queryKey: ["collabMessages", agentId] });
      }
    });
    return unsub;
  }, [agentId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.AgentCollabMessage.create({
      agent_id: agentId,
      type: "team_chat",
      content,
      author_name: currentUser?.full_name || currentUser?.email?.split("@")[0] || "Analyst",
      author_email: currentUser?.email || "unknown",
      avatar: getAvatarForEmail(currentUser?.email),
      color: getColorForEmail(currentUser?.email),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collabMessages", agentId] }),
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
    setInput("");
  };

  // Get unique active users from recent messages (last 5 min)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const activeUsers = [...new Map(
    messages
      .filter(m => new Date(m.created_date).getTime() > fiveMinAgo)
      .map(m => [m.author_email, m])
  ).values()];

  return (
    <div className="flex flex-col h-full border-l border-white/5">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" style={{ color: agentColor }} />
          <span className="text-[11px] font-bold text-gray-300">Team Chat</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-gray-600" />
          <span className="text-[10px] text-gray-500">{activeUsers.length} active</span>
          {/* Avatar stack */}
          <div className="flex -space-x-1.5 ml-1">
            {activeUsers.slice(0, 4).map(u => (
              <div key={u.author_email} title={u.author_name}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] border border-[#0d1220]"
                style={{ background: `${getColorForEmail(u.author_email)}30` }}>
                {getAvatarForEmail(u.author_email)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <MessageSquare className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-[10px] text-gray-600">No team messages yet.</p>
            <p className="text-[9px] text-gray-700 mt-0.5">Be the first to say something.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.author_email === currentUser?.email;
          const color = msg.color || getColorForEmail(msg.author_email);
          const avatar = msg.avatar || getAvatarForEmail(msg.author_email);
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: `${color}20` }}>
                {avatar}
              </div>
              <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                <div className="flex items-center gap-1.5">
                  {!isMe && <span className="text-[9px] font-bold" style={{ color }}>{msg.author_name}</span>}
                  <span className="text-[8px] text-gray-700">
                    {format(new Date(msg.created_date), "HH:mm")}
                  </span>
                </div>
                <div className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                  isMe
                    ? "text-white border border-white/10"
                    : "bg-white/[0.03] text-gray-300 border border-white/5"
                }`} style={isMe ? { background: `${color}20`, borderColor: `${color}30` } : {}}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-white/5 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Team message..."
          className="bg-white/5 border-white/10 text-white text-xs placeholder:text-gray-600 h-8" />
        <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="h-8 w-8"
          style={{ background: `${agentColor}20`, color: agentColor, border: `1px solid ${agentColor}30` }}>
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}