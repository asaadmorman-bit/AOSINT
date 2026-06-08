import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Terminal, Loader2, Bot, User } from "lucide-react";
import { AGENT_PROFILES } from "@/components/agents/agentProfiles";

const AMANI = AGENT_PROFILES.AMANI;

export default function AgentTerminal({ entityContext = null }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: AMANI.greeting }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const history = messages.map(m => `${m.role === "user" ? "User" : "AMANI"}: ${m.content}`).join("\n");
    const contextBlock = entityContext ? `\nCurrent context: ${JSON.stringify(entityContext)}` : "";

    const prompt = `${AMANI.systemPrompt}${contextBlock}

Conversation history:
${history}

User: ${userMsg}

Respond as AMANI. Be helpful, warm, and precise.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
    });

    setMessages(prev => [...prev, { role: "assistant", content: result }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#080d18] rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0d1220]">
        <span className="text-lg">🤖</span>
        <div>
          <span className="text-sm font-bold text-[#00d4ff] tracking-wider">AMANI</span>
          <p className="text-[9px] text-gray-600">AI Guide & Intelligence Assistant</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
          <span className="text-[10px] text-[#2ed573]">ONLINE</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === "assistant" ? "bg-[#00d4ff]/10" : "bg-purple-500/10"
            }`}>
              {msg.role === "assistant"
                ? <Bot className="w-4 h-4 text-[#00d4ff]" />
                : <User className="w-4 h-4 text-purple-400" />
              }
            </div>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-white/[0.03] text-gray-300 border border-white/5"
                : "bg-purple-500/10 text-purple-200 border border-purple-500/10"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00d4ff]/10">
              <Bot className="w-4 h-4 text-[#00d4ff]" />
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-[#00d4ff] animate-spin" />
              <span className="text-[10px] text-gray-500">Processing intelligence chain...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/5 bg-[#0d1220] flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask AMANI anything..."
          className="bg-white/5 border-white/10 text-white text-xs font-mono placeholder:text-gray-600"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon"
          className="bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 text-[#00d4ff]">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}