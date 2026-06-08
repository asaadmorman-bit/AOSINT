import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Shield, Loader2, CheckCircle2, XCircle, Eye, Zap, Filter, RefreshCw, AlertTriangle, Bug, Globe2, Bot, Send, X } from "lucide-react";

const STATUS_STYLE = {
  pending: "bg-gray-800 text-gray-300 border-gray-600/30",
  under_review: "bg-yellow-900/20 text-yellow-300 border-yellow-500/30",
  verified: "bg-green-900/20 text-green-300 border-green-500/30",
  rejected: "bg-red-900/20 text-red-300 border-red-500/30",
  duplicate: "bg-purple-900/20 text-purple-300 border-purple-500/30"
};

const SEV_STYLE = {
  critical: "bg-red-900/20 text-red-300 border-red-500/30",
  high: "bg-orange-900/20 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-900/20 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-900/20 text-blue-300 border-blue-500/30"
};

const TYPE_ICON = { vulnerability: Bug, incident: AlertTriangle, threat_intelligence: Globe2 };

function AgentValidatorPanel({ report, onClose }) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Auto-start validation when panel opens
    (async () => {
      setSending(true);
      const conv = await base44.agents.createConversation({
        agent_name: "community_report_validator",
        metadata: { name: `Validate: ${report.title}` }
      });
      setConversation(conv);

      const autoPrompt = `Please validate this community-submitted report:\n\nType: ${report.report_type}\nTitle: ${report.title}\nSeverity: ${report.severity}\nDescription: ${report.description}${report.cve_id ? `\nCVE: ${report.cve_id}` : ""}${report.indicator_value ? `\nIndicator (${report.indicator_type}): ${report.indicator_value}` : ""}${report.affected_systems ? `\nSystems: ${report.affected_systems}` : ""}${report.source_reference ? `\nSource: ${report.source_reference}` : ""}\n\nReport ID (for updating): ${report.id}\n\nSearch for corroboration, check against CVE databases, zero-day feeds, known threat actors, and IOC repositories. Provide your credibility score and recommendation.`;

      const updated = await base44.agents.addMessage(conv, { role: "user", content: autoPrompt });
      setMessages(updated.messages || []);
      setSending(false);
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return unsub;
  }, [conversation?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    const msg = input;
    setInput("");
    setSending(true);
    const updated = await base44.agents.addMessage(conversation, { role: "user", content: msg });
    setMessages(updated.messages || []);
    setSending(false);
  };

  const agentMessages = messages.filter(m => m.role !== "system");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-2xl bg-[#0d1220] border border-cyan-500/20 rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Validation Agent</p>
            <p className="text-[10px] text-gray-500 truncate">Cross-checking: {report.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {agentMessages.length === 0 && sending && (
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Starting validation against CVE databases, zero-day feeds, and threat intel…
            </div>
          )}
          {agentMessages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role !== "user" && (
                <div className="w-6 h-6 rounded-lg bg-cyan-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-cyan-400" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-slate-900 border border-white/5 text-gray-300"}`}>
                {msg.role === "user"
                  ? <p>{msg.content}</p>
                  : <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content || "…"}</ReactMarkdown>
                }
                {msg.tool_calls?.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {msg.tool_calls.map((tc, ti) => (
                      <div key={ti} className="flex items-center gap-1.5 text-[9px] text-gray-500">
                        <Zap className="w-2.5 h-2.5 text-yellow-500 shrink-0" />
                        <span className="font-mono">{tc.name}</span>
                        {tc.status === "running" || tc.status === "in_progress" ? <Loader2 className="w-2.5 h-2.5 animate-spin ml-auto" /> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 shrink-0 flex gap-2">
          <input
            className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40"
            placeholder="Ask agent to dig deeper, check specific IOCs…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={sending || !conversation}
          />
          <Button size="sm" className="bg-cyan-700 hover:bg-cyan-600 px-3 shrink-0" onClick={sendMessage} disabled={sending || !input.trim() || !conversation}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityReportAdmin() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [agentReport, setAgentReport] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["community-reports", statusFilter],
    queryFn: () => statusFilter === "all"
      ? base44.entities.CommunityReport.list("-created_date", 100)
      : base44.entities.CommunityReport.filter({ verification_status: statusFilter }, "-created_date", 100),
    refetchInterval: 30000
  });

  const aiVerifyMutation = useMutation({
    mutationFn: async (reportId) => {
      setVerifyingId(reportId);
      const res = await base44.functions.invoke("verifyCommunityReport", { report_id: reportId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-reports"] });
      setVerifyingId(null);
    },
    onError: () => setVerifyingId(null)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const user = await base44.auth.me();
      return base44.entities.CommunityReport.update(id, {
        verification_status: status,
        verification_notes: notes || undefined,
        verified_by: user?.email,
        verified_at: new Date().toISOString(),
        promoted_to_feed: status === "verified"
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-reports"] });
      setSelectedReport(null);
    }
  });

  const counts = { pending: 0, under_review: 0, verified: 0, rejected: 0 };
  reports.forEach(r => { if (counts[r.verification_status] !== undefined) counts[r.verification_status]++; });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-bold text-white">Community Report Verification</h1>
            <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">ADMIN</Badge>
          </div>
          <p className="text-xs text-gray-500">Review, AI-verify, and moderate subscriber-submitted reports</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 text-gray-400 gap-1" onClick={() => qc.invalidateQueries({ queryKey: ["community-reports"] })}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "pending", label: "Pending", color: "text-gray-300" },
          { key: "under_review", label: "Under Review", color: "text-yellow-400" },
          { key: "verified", label: "Verified", color: "text-green-400" },
          { key: "rejected", label: "Rejected", color: "text-red-400" }
        ].map(item => (
          <div key={item.key} className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setStatusFilter(item.key)}>
            <p className={`text-2xl font-black ${item.color}`}>{counts[item.key]}</p>
            <p className="text-[10px] text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        {["all", "pending", "under_review", "verified", "rejected", "duplicate"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${statusFilter === s ? "bg-cyan-700/30 border-cyan-500/40 text-cyan-300" : "bg-slate-800/40 border-white/5 text-gray-500 hover:text-gray-300"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      )}

      {/* Report list */}
      <div className="space-y-3">
        {reports.map(r => {
          const TypeIcon = TYPE_ICON[r.report_type] || Shield;
          const isExpanded = selectedReport === r.id;
          return (
            <div key={r.id} className="border border-white/5 bg-slate-900/40 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-900/60 transition-colors" onClick={() => setSelectedReport(isExpanded ? null : r.id)}>
                <TypeIcon className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">{r.title}</span>
                    <Badge className={`text-[8px] border ${SEV_STYLE[r.severity]}`}>{r.severity}</Badge>
                    <Badge className={`text-[8px] border ${STATUS_STYLE[r.verification_status]}`}>{r.verification_status?.replace("_", " ")}</Badge>
                    {r.verification_score !== undefined && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border ${r.verification_score >= 70 ? "text-green-400 bg-green-900/10 border-green-500/20" : r.verification_score >= 40 ? "text-yellow-400 bg-yellow-900/10 border-yellow-500/20" : "text-red-400 bg-red-900/10 border-red-500/20"}`}>
                        AI Score: {r.verification_score}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600 capitalize">{r.report_type?.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{r.description}</p>
                  {r.cve_id && <span className="text-[9px] font-mono text-cyan-500">{r.cve_id}</span>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/10"
                    disabled={verifyingId === r.id}
                    onClick={e => { e.stopPropagation(); aiVerifyMutation.mutate(r.id); }}>
                    {verifyingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1" />Quick Check</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-900/10"
                    onClick={e => { e.stopPropagation(); setAgentReport(r); }}>
                    <Bot className="w-3 h-3 mr-1" />Agent
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-4 bg-slate-950/20 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">Full Description</p>
                      <p className="text-gray-300 leading-relaxed">{r.description}</p>
                    </div>
                    <div className="space-y-2">
                      {r.affected_systems && <div><span className="text-gray-500">Systems: </span><span className="text-gray-300">{r.affected_systems}</span></div>}
                      {r.affected_versions && <div><span className="text-gray-500">Versions: </span><span className="text-gray-300">{r.affected_versions}</span></div>}
                      {r.indicator_value && <div><span className="text-gray-500">Indicator: </span><span className="text-gray-300 font-mono">{r.indicator_type}: {r.indicator_value}</span></div>}
                      {r.source_reference && <div><span className="text-gray-500">Source: </span><a href={r.source_reference} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline truncate block">{r.source_reference}</a></div>}
                      {r.submitter_email && !r.is_anonymous && <div><span className="text-gray-500">Submitted by: </span><span className="text-gray-300">{r.submitter_name || r.submitter_email}</span></div>}
                      {r.is_anonymous && <div className="text-gray-500 italic">Anonymous submission</div>}
                    </div>
                  </div>

                  {r.verification_notes && (
                    <div className="bg-slate-900/60 rounded-lg p-3 text-xs border border-white/5">
                      <p className="text-[9px] text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> AI Assessment</p>
                      <p className="text-gray-300">{r.verification_notes}</p>
                    </div>
                  )}

                  {/* Manual review actions */}
                  {r.verification_status !== "verified" && r.verification_status !== "rejected" && (
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" className="bg-green-800 hover:bg-green-700 gap-1 text-xs h-8"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: "verified" })}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Verify
                      </Button>
                      <Button size="sm" className="bg-yellow-800 hover:bg-yellow-700 gap-1 text-xs h-8"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: "under_review" })}>
                        <Eye className="w-3.5 h-3.5" /> Flag for Review
                      </Button>
                      <Button size="sm" className="bg-purple-900 hover:bg-purple-800 gap-1 text-xs h-8"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: "duplicate" })}>
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-900/10 gap-1 text-xs h-8"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: r.id, status: "rejected" })}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                  {r.verification_status === "verified" && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <CheckCircle2 className="w-4 h-4" /> Verified{r.verified_by ? ` by ${r.verified_by}` : ""}{r.promoted_to_feed ? " · Promoted to feed" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && reports.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm bg-slate-900/40 rounded-xl border border-white/5">
            No reports matching this filter.
          </div>
        )}
      </div>

      {agentReport && (
        <AgentValidatorPanel
          report={agentReport}
          onClose={() => { setAgentReport(null); qc.invalidateQueries({ queryKey: ["community-reports"] }); }}
        />
      )}
    </div>
  );
}