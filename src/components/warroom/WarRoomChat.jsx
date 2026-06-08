import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Loader2, Globe2, Shield, Hash, Link2, FileText,
  MessageSquare, AlertTriangle, Pin, ChevronDown, Users
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const TYPE_STYLES = {
  chat: { icon: MessageSquare, color: "#6b7280", label: "Chat" },
  indicator: { icon: Globe2, color: "#00d4ff", label: "Indicator" },
  annotation: { icon: FileText, color: "#a855f7", label: "Annotation" },
  finding: { icon: AlertTriangle, color: "#ff4757", label: "Finding" },
  system: { icon: Shield, color: "#2ed573", label: "System" },
};

const INDICATOR_TYPES = ["ip", "domain", "hash", "url", "cve", "actor", "other"];

function MessageBubble({ msg, currentUserEmail }) {
  const isMe = msg.author_email === currentUserEmail;
  const T = TYPE_STYLES[msg.message_type] || TYPE_STYLES.chat;
  const Icon = T.icon;

  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} mb-3`}>
      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#00d4ff] shrink-0 mt-1">
        {(msg.author_name || msg.author_email || "?")[0].toUpperCase()}
      </div>
      <div className={`max-w-[78%] space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
        <div className="flex items-center gap-1.5">
          {!isMe && <span className="text-[10px] text-gray-500 font-medium">{msg.author_name || msg.author_email}</span>}
          {msg.message_type !== "chat" && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ color: T.color, background: `${T.color}15` }}>
              <Icon className="w-2.5 h-2.5" />{T.label}
            </span>
          )}
          {msg.is_pinned && <Pin className="w-3 h-3 text-[#ffa502]" />}
        </div>

        <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-white" : "bg-white/5 border border-white/5 text-gray-200"}`}>
          {msg.message_type === "indicator" && msg.indicator_value ? (
            <div>
              <span className="text-[10px] uppercase font-bold text-[#00d4ff] block mb-1">{msg.indicator_type} Indicator</span>
              <code className="text-[#00d4ff] font-mono text-xs block mb-1 break-all">{msg.indicator_value}</code>
              {msg.content && <p className="text-xs text-gray-400">{msg.content}</p>}
            </div>
          ) : (
            <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        <span className="text-[9px] text-gray-600">{new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

export default function WarRoomChat({ room, user }) {
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const [text, setText] = useState("");
  const [msgType, setMsgType] = useState("chat");
  const [indicatorType, setIndicatorType] = useState("ip");
  const [indicatorValue, setIndicatorValue] = useState("");
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const T = TYPE_STYLES[msgType];

  const { data: messages = [] } = useQuery({
    queryKey: ["war_room_messages", room.id],
    queryFn: () => base44.entities.WarRoomMessage.filter({ war_room_id: room.id }, "created_date", 200),
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (payload) => base44.entities.WarRoomMessage.create(payload),
    onSuccess: () => {
      qc.invalidateQueries(["war_room_messages", room.id]);
      setText("");
      setIndicatorValue("");
    },
  });

  const handleSend = () => {
    if (!text.trim() && !indicatorValue.trim()) return;
    sendMutation.mutate({
      war_room_id: room.id,
      author_email: user.email,
      author_name: user.full_name || user.email,
      content: text,
      message_type: msgType,
      indicator_type: msgType === "indicator" ? indicatorType : undefined,
      indicator_value: msgType === "indicator" ? indicatorValue : undefined,
    });
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No messages yet. Start the operation briefing.</p>
          </div>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} currentUserEmail={user.email} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-white/5 bg-[#0d1220] p-3 space-y-2">
        {/* Indicator fields */}
        {msgType === "indicator" && (
          <div className="flex gap-2">
            <select
              value={indicatorType}
              onChange={e => setIndicatorType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white w-24"
            >
              {INDICATOR_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <input
              type="text"
              placeholder="Indicator value (e.g. 1.2.3.4, evil.com, CVE-2024-...)"
              value={indicatorValue}
              onChange={e => setIndicatorValue(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4ff]/40"
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Type selector */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-1 px-2 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              style={{ color: T.color }}
            >
              <T.icon className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTypeMenu && (
              <div className="absolute bottom-full mb-1 left-0 bg-[#111827] border border-white/10 rounded-xl shadow-xl z-50 w-40 py-1">
                {Object.entries(TYPE_STYLES).filter(([k]) => k !== "system").map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => { setMsgType(key); setShowTypeMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 text-gray-300"
                  >
                    <val.icon className="w-3.5 h-3.5" style={{ color: val.color }} />
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={msgType === "indicator" ? "Context / notes (optional)" : "Type a message, finding, or annotation… (Enter to send)"}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-600 text-sm resize-none min-h-[40px] max-h-[100px]"
            rows={1}
          />

          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || (!text.trim() && !indicatorValue.trim())}
            className="bg-[#00d4ff] text-black hover:bg-[#0099cc] h-10 w-10 p-0 shrink-0"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}