import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Brain, Shield, Crosshair, Code, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";

const STATUS_OPTIONS = ["open", "investigating", "confirmed", "false_positive", "resolved"];

const SEVERITY_COLORS = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#00d4ff",
  low: "#6b7280",
};

export default function HuntTicketDetail({ ticket, onClose, onUpdated }) {
  const [status, setStatus] = useState(ticket.status);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.HuntTicket.update(ticket.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunt-tickets"] });
      onUpdated();
    },
  });

  const sevColor = SEVERITY_COLORS[ticket.severity] || "#6b7280";

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${sevColor}15`, color: sevColor, border: `1px solid ${sevColor}30` }}
              >
                {ticket.severity?.toUpperCase()}
              </span>
              <Badge className="text-[10px] bg-white/5 text-gray-400 border-white/10">
                {ticket.hunt_type?.replace(/_/g, " ")}
              </Badge>
              {ticket.confidence && (
                <span className="text-[10px] text-gray-500 ml-auto">
                  {ticket.confidence}% AI confidence
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white leading-snug">{ticket.title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-300 h-7 w-7 shrink-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Status control */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-gray-500">Status:</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-7 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            onClick={() => updateMutation.mutate({ status })}
            disabled={status === ticket.status || updateMutation.isPending}
            className="bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/20 text-xs h-7 px-3"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Description */}
        {ticket.description && (
          <Section title="Finding Description" icon={<Crosshair className="w-3.5 h-3.5 text-[#ff4757]" />}>
            <p className="text-xs text-gray-300 leading-relaxed">{ticket.description}</p>
          </Section>
        )}

        {/* AI Reasoning */}
        {ticket.ai_reasoning && (
          <Section title="AI Reasoning Chain" icon={<Brain className="w-3.5 h-3.5 text-[#a855f7]" />}>
            <p className="text-xs text-gray-300 leading-relaxed">{ticket.ai_reasoning}</p>
          </Section>
        )}

        {/* Evidence */}
        {ticket.evidence?.length > 0 && (
          <Section title="Supporting Evidence" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#ffa502]" />}>
            <ul className="space-y-1.5">
              {ticket.evidence.map((e, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300">
                  <ChevronRight className="w-3.5 h-3.5 text-[#ffa502] shrink-0 mt-0.5" />
                  {e}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Related TTPs */}
        {ticket.related_ttps?.length > 0 && (
          <Section title="Related MITRE TTPs" icon={<Shield className="w-3.5 h-3.5 text-[#00d4ff]" />}>
            <div className="flex flex-wrap gap-1.5">
              {ticket.related_ttps.map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Suggested Actions */}
        {ticket.suggested_actions?.length > 0 && (
          <Section title="Suggested Actions" icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />}>
            <ol className="space-y-2">
              {ticket.suggested_actions.map((a, i) => (
                <li key={i} className="flex gap-3 text-xs text-gray-300">
                  <span className="text-[#2ed573] font-bold w-4 shrink-0">{i + 1}.</span>
                  {a}
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Detection Query */}
        {ticket.hunt_query && (
          <Section title="Detection Hunt Query" icon={<Code className="w-3.5 h-3.5 text-[#a855f7]" />}>
            <pre className="text-[10px] text-[#a855f7] bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              {ticket.hunt_query}
            </pre>
          </Section>
        )}

        {/* Tags */}
        {ticket.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ticket.tags.map((tag, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}