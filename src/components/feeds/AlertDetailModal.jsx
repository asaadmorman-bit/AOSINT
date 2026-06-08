import React from "react";
import { X, AlertTriangle, Info, Radio, MessageSquare, Tag, Clock, User, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SEVERITY_COLORS = { info: "#6b7280", low: "#2ed573", medium: "#ffa502", high: "#ff6b35", critical: "#ff4757" };
const SEVERITY_BG = { info: "#6b728020", low: "#2ed57320", medium: "#ffa50220", high: "#ff6b3520", critical: "#ff475720" };
const TYPE_ICONS = { message: MessageSquare, alert: AlertTriangle, update: Radio, system: Info };

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString([], { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AlertDetailModal({ message, onClose }) {
  if (!message) return null;

  const Icon = TYPE_ICONS[message.message_type] || MessageSquare;
  const severityColor = SEVERITY_COLORS[message.severity || "info"];
  const severityBg = SEVERITY_BG[message.severity || "info"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#0d1220] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5" style={{ background: severityBg }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: `${severityColor}25` }}>
              <Icon className="w-5 h-5" style={{ color: severityColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: severityColor }}>
                  {message.message_type?.toUpperCase()} · {(message.severity || "info").toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTime(message.created_date)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Author */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <User className="w-3.5 h-3.5" />
            <span className="font-semibold text-gray-300">{message.author_name || message.author_email || "ASOSINT Intel Engine"}</span>
          </div>

          {/* Severity bar */}
          <div className="h-1 w-full rounded-full bg-white/5">
            <div className="h-1 rounded-full transition-all" style={{
              background: severityColor,
              width: message.severity === "critical" ? "100%" : message.severity === "high" ? "80%" : message.severity === "medium" ? "60%" : message.severity === "low" ? "40%" : "20%"
            }} />
          </div>

          {/* Content */}
          <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {message.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {message.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attachments</p>
              {message.attachments.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#00d4ff] hover:underline">
                  <ExternalLink className="w-3 h-3" /> {a.label || a.url}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-black/20">
          <p className="text-[10px] text-gray-600 text-center">ASOSINT Intel Feed · {message.channel_slug || "intelligence"}</p>
        </div>
      </div>
    </div>
  );
}