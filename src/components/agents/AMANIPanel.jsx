import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { AGENT_PROFILES } from "@/components/agents/agentProfiles";

const AMANI = AGENT_PROFILES.AMANI;

const QUICK_PROMPTS_REPORT = [
  "Summarize the key findings",
  "What actions should I take?",
  "Explain the HUMINT layer",
  "How confident is this assessment?",
];

const QUICK_PROMPTS_INDICATOR = [
  "Explain this indicator",
  "What's the risk level?",
  "Related threat actors?",
  "Recommended mitigations?",
];

export default function AMANIPanel({ context, contextType = "report" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const quickPrompts = contextType === "report" ? QUICK_PROMPTS_REPORT : QUICK_PROMPTS_INDICATOR;

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = contextType === "report"
        ? `I'm AMANI. I have full context on this intelligence report — "${context?.title}". Ask me anything about it.`
        : `I'm AMANI. I'm analyzing the indicator: **${context?.title}** (${context?.indicator_type?.replace(/_/g, " ")}, ${context?.severity} severity). What would you like to know?`;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const history = messages.map(m => `${m.role === "user" ? "User" : "AMANI"}: ${m.content}`).join("\n");

    const contextBlock = contextType === "report"
      ? `\n\nINTEL REPORT CONTEXT:\nTitle: ${context?.title}\nType: ${context?.report_type}\nTime Sensitivity: ${context?.time_sensitivity}\nConfidence: ${context?.confidence}%\nOSINT Layer: ${context?.intel_layers?.osint || "N/A"}\nSIGINT Layer: ${context?.intel_layers?.sigint || "N/A"}\nHUMINT Layer: ${context?.intel_layers?.humint || "N/A"}\nKey Findings: ${context?.key_findings?.join("; ") || "N/A"}\nRecommended Actions: ${context?.recommended_actions?.join("; ") || "N/A"}\nSubjective Intent: ${context?.subjective_intent_assessment || "N/A"}\nObjective Intent: ${context?.objective_intent_assessment || "N/A"}`
      : `\n\nINDICATOR CONTEXT:\nTitle: ${context?.title}\nType: ${context?.indicator_type}\nValue: ${context?.value}\nCategory: ${context?.threat_category}\nSeverity: ${context?.severity}\nConfidence: ${context?.confidence}%\nStatus: ${context?.status}\nNotes: ${context?.notes || "N/A"}\nTags: ${context?.tags?.join(", ") || "N/A"}`;

    const prompt = `${AMANI.systemPrompt}${contextBlock}

You are assisting a security analyst with a specific ${contextType}. Answer concisely and actionably. Reference the provided context directly.

Conversation history:
${history}

User: ${userMsg}

Respond as AMANI. Be precise and intelligence-focused.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: contextType === "indicator",
    });

    setMessages(prev => [...prev, { role: "assistant", content: result }]);
    setLoading(false);
  };

  return (
    <div className="border border-[#00d4ff]/20 rounded-xl overflow-hidden bg-[#080d18]">
      {/* Toggle Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#0d1220] hover:bg-[#111827] transition-colors"
      >
        <span className="text-base">🤖</span>
        <div className="flex-1 text-left">
          <span className="text-xs font-bold text-[#00d4ff] tracking-wider">Ask AMANI</span>
          <p className="text-[9px] text-gray-500">AI Intelligence Assistant</p>
        </div>
        <span className="flex items-center gap-1.5 mr-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
          <span className="text-[10px] text-[#2ed573]">ONLINE</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3 text-xs">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "assistant" ? "bg-[#00d4ff]/10" : "bg-purple-500/10"
                }`}>
                  {msg.role === "assistant"
                    ? <Bot className="w-3.5 h-3.5 text-[#00d4ff]" />
                    : <User className="w-3.5 h-3.5 text-purple-400" />
                  }
                </div>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "bg-white/[0.03] text-gray-300 border border-white/5"
                    : "bg-purple-500/10 text-purple-200 border border-purple-500/10"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#00d4ff]/10">
                  <Bot className="w-3.5 h-3.5 text-[#00d4ff]" />
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-[#00d4ff] animate-spin" />
                  <span className="text-[10px] text-gray-500">Analyzing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="text-[10px] px-2 py-1 rounded-md bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-2.5 h-2.5" />
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 pt-1 border-t border-white/5 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about this item..."
              className="bg-white/5 border-white/10 text-white text-xs placeholder:text-gray-600 h-8"
            />
            <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} size="icon"
              className="h-8 w-8 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 text-[#00d4ff]">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}