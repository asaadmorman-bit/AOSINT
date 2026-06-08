import React, { useState } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const SEVERITY_OPTS = ["info", "low", "medium", "high", "critical"];
const SEVERITY_COLORS = { info: "#6b7280", low: "#2ed573", medium: "#ffa502", high: "#ff6b35", critical: "#ff4757" };

export default function MessageComposer({ channel, user, onSent }) {
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState("info");
  const [messageType, setMessageType] = useState("message");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    const authorName = user.full_name || user.email;
    await base44.entities.FeedMessage.create({
      channel_id: channel.id,
      channel_slug: channel.slug,
      author_email: user.email,
      author_name: authorName,
      content: content.trim(),
      message_type: messageType,
      severity,
    });

    // Push to Discord asynchronously (fire-and-forget, don't block UX)
    base44.functions.invoke("pushFeedMessageToDiscord", {
      channel_name: channel.name,
      channel_slug: channel.slug,
      message_type: messageType,
      severity,
      content: content.trim(),
      author_name: authorName,
    }).catch(() => {});

    setContent("");
    setSeverity("info");
    setMessageType("message");
    setSending(false);
    onSent?.();
  };

  return (
    <div className="border-t border-white/5 p-4 bg-[#0d1220]">
      <div className="flex gap-2 mb-2">
        <select
          value={messageType}
          onChange={e => setMessageType(e.target.value)}
          className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300"
        >
          <option value="message">Message</option>
          <option value="alert">Alert</option>
          <option value="update">Update</option>
        </select>
        {(messageType === "alert" || messageType === "update") && (
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1"
            style={{ color: SEVERITY_COLORS[severity] }}
          >
            {SEVERITY_OPTS.map(s => (
              <option key={s} value={s} style={{ color: SEVERITY_COLORS[s] }}>{s.toUpperCase()}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2 items-end">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Post to #${channel.name}... (Enter to send)`}
          rows={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00d4ff] resize-none"
        />
        <Button
          size="icon"
          className="bg-[#00d4ff] text-black hover:bg-[#0099cc] shrink-0"
          onClick={handleSend}
          disabled={sending || !content.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}