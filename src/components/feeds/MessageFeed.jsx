import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Radio, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AlertDetailModal from "./AlertDetailModal";

const SEVERITY_COLORS = { info: "#6b7280", low: "#2ed573", medium: "#ffa502", high: "#ff6b35", critical: "#ff4757" };
const TYPE_ICONS = { message: MessageSquare, alert: AlertTriangle, update: Radio, system: Info };

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
}

function AlertCard({ msg, onClick }) {
  const Icon = TYPE_ICONS[msg.message_type] || AlertTriangle;
  const severityColor = SEVERITY_COLORS[msg.severity || "info"];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 hover:opacity-90 active:scale-[0.99] transition-all bg-[#111827] cursor-pointer"
      style={{ borderColor: `${severityColor}40` }}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${severityColor}20` }}>
          <Icon className="w-4 h-4" style={{ color: severityColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: severityColor }}>
                {msg.message_type?.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${severityColor}20`, color: severityColor }}>
                {(msg.severity || "info").toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-gray-500">{formatTime(msg.created_date)}</span>
          </div>
          <div className="text-xs text-gray-300 leading-relaxed line-clamp-3">
            <ReactMarkdown className="prose prose-invert prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-xs [&_p]:text-gray-300">
              {msg.content}
            </ReactMarkdown>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
            <span className="font-medium text-gray-500">{msg.author_name || "ASOSINT Intel Engine"}</span>
            <span className="text-[#00d4ff] ml-auto">Tap for full report →</span>
          </p>
        </div>
      </div>
    </button>
  );
}

function ChatBubble({ msg, isOwn }) {
  return (
    <div className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isOwn ? "bg-[#00d4ff] text-black" : "bg-[#1a2235] text-gray-300"}`}>
        {initials(msg.author_name)}
      </div>
      <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          {!isOwn && <span className="text-xs font-semibold text-gray-300">{msg.author_name || msg.author_email}</span>}
          <span className="text-[10px] text-gray-600">{formatTime(msg.created_date)}</span>
        </div>
        <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${isOwn ? "bg-[#00d4ff]/15 border border-[#00d4ff]/20 text-gray-100" : "bg-[#111827] border border-white/5 text-gray-200"}`}>
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function MessageFeed({ messages, currentUserEmail }) {
  const bottomRef = useRef(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
        No messages yet.
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => {
          const isAlert = msg.message_type !== "message";
          const isOwn = msg.author_email === currentUserEmail;

          return isAlert
            ? <AlertCard key={msg.id} msg={msg} onClick={() => setSelectedAlert(msg)} />
            : <ChatBubble key={msg.id} msg={msg} isOwn={isOwn} />;
        })}
        <div ref={bottomRef} />
      </div>

      {selectedAlert && (
        <AlertDetailModal message={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </>
  );
}