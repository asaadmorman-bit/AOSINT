import React, { useState, useEffect } from "react";
import { AGENT_PROFILES, CORE_AGENTS, ADDON_AGENTS, VOICE_OPTIONS, ACCENT_OPTIONS } from "@/components/agents/agentProfiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Settings, MessageSquare, Bot, Lock, Volume2, Mic, Save, RotateCcw, ChevronRight, Sparkles, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CollabTeamChat from "@/components/agents/CollabTeamChat";

// ── Chat Interface ──────────────────────────────────────────────────────────
function AgentChat({ agent, userPrefs }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: agent.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const history = messages.map(m => `${m.role === "user" ? "User" : agent.name}: ${m.content}`).join("\n");
    const customInstructions = userPrefs?.customInstructions ? `\nCustom user instructions: ${userPrefs.customInstructions}` : "";
    const accentNote = userPrefs?.accent ? `\nAdapt your tone and communication style to reflect a ${userPrefs.accent} sensibility.` : "";

    const prompt = `${agent.systemPrompt}${customInstructions}${accentNote}

Conversation history:
${history}

User: ${userMsg}

Respond as ${agent.name}. Stay fully in character. Be concise but complete.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: false });
    setMessages(prev => [...prev, { role: "assistant", content: result }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm ${msg.role === "assistant" ? agent.accentBg : "bg-white/10"}`}>
              {msg.role === "assistant" ? agent.avatar : "👤"}
            </div>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
              msg.role === "assistant"
                ? `bg-white/[0.03] text-gray-300 border ${agent.accentBorder}`
                : "bg-white/10 text-white border border-white/10"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${agent.accentBg}`}>{agent.avatar}</div>
            <div className={`rounded-xl px-3.5 py-2.5 border ${agent.accentBorder} flex items-center gap-2`}>
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: agent.color }} />
              <span className="text-[10px] text-gray-500">{agent.name} is thinking...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-white/5 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={`Message ${agent.name}...`}
          className="bg-white/5 border-white/10 text-white text-xs placeholder:text-gray-600" />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon"
          style={{ background: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}30` }}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Customize Panel ─────────────────────────────────────────────────────────
function AgentCustomize({ agent, prefs, onSave }) {
  const [form, setForm] = useState({
    nickname: prefs?.nickname || "",
    customInstructions: prefs?.customInstructions || "",
    voice: prefs?.voice || agent.defaultVoice,
    accent: prefs?.accent || agent.defaultAccent,
    personality_override: prefs?.personality_override || "",
    focus_areas: prefs?.focus_areas || "",
  });

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[520px]">
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[10px] text-gray-500">
        <Sparkles className="w-3 h-3 inline mr-1" style={{ color: agent.color }} />
        Customizations are saved locally and shape how {agent.name} interacts with you.
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Nickname (optional)</label>
        <Input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })}
          placeholder={`e.g. "My ${agent.name}"`}
          className="bg-white/5 border-white/10 text-white text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Custom Instructions</label>
        <Textarea value={form.customInstructions} onChange={e => setForm({ ...form, customInstructions: e.target.value })}
          placeholder={`Tell ${agent.name} how you'd like them to behave, what to focus on, or any preferences...`}
          className="bg-white/5 border-white/10 text-white text-sm h-24 resize-none" />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Focus Areas</label>
        <Input value={form.focus_areas} onChange={e => setForm({ ...form, focus_areas: e.target.value })}
          placeholder="e.g. Financial sector, Asia-Pacific region, ransomware threats"
          className="bg-white/5 border-white/10 text-white text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Volume2 className="w-3 h-3" /> Voice
        </label>
        <Select value={form.voice} onValueChange={v => setForm({ ...form, voice: v })}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map(v => (
              <SelectItem key={v.id} value={v.label}>
                <div>
                  <span className="font-medium">{v.label}</span>
                  <span className="text-gray-500 text-[10px] ml-2">{v.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Mic className="w-3 h-3" /> Accent & Communication Style
        </label>
        <Select value={form.accent} onValueChange={v => setForm({ ...form, accent: v })}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCENT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-[9px] text-gray-600 mt-1">The selected accent shapes {agent.name}'s communication tone and phrasing style.</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave(form)} className="flex-1 gap-2" style={{ background: `${agent.color}20`, color: agent.color, border: `1px solid ${agent.color}30` }}>
          <Save className="w-3.5 h-3.5" /> Save Preferences
        </Button>
        <Button variant="ghost" onClick={() => setForm({ nickname: "", customInstructions: "", voice: agent.defaultVoice, accent: agent.defaultAccent, personality_override: "", focus_areas: "" })}
          className="gap-2 text-gray-500 hover:text-gray-300">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>
    </div>
  );
}

// ── Agent Card (sidebar) ────────────────────────────────────────────────────
function AgentCard({ agent, isActive, onClick, prefs }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-3.5 rounded-xl border transition-all ${
      isActive ? `border-opacity-50 bg-white/[0.04]` : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
    }`} style={isActive ? { borderColor: agent.color } : {}}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${agent.accentBg} border ${agent.accentBorder}`}>
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white">{prefs?.nickname || agent.name}</p>
            {agent.category === "core" && <Lock className="w-2.5 h-2.5 text-gray-600" />}
          </div>
          <p className="text-[10px] truncate" style={{ color: agent.color }}>{agent.role}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
      </div>
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AgentRoster() {
  const [activeAgent, setActiveAgent] = useState("AMANI");
  const [tab, setTab] = useState("chat"); // "chat" | "customize" | "collab"
  const [savedPrefs, setSavedPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("agentPrefs") || "{}"); } catch { return {}; }
  });
  const [saveMsg, setSaveMsg] = useState("");
  const [showCollab, setShowCollab] = useState(false);

  const agent = AGENT_PROFILES[activeAgent];
  const prefs = savedPrefs[activeAgent] || {};

  const handleSavePrefs = (form) => {
    const updated = { ...savedPrefs, [activeAgent]: form };
    setSavedPrefs(updated);
    localStorage.setItem("agentPrefs", JSON.stringify(updated));
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3 mb-0.5">
          <Bot className="w-5 h-5 text-[#00d4ff]" />
          <h1 className="text-xl font-bold tracking-tight">ASOSINT Agent Roster</h1>
          <Badge className="text-[10px] px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
            {Object.keys(AGENT_PROFILES).length} Agents
          </Badge>
        </div>
        <p className="text-xs text-gray-500">Your personalized AI agent team — each with a unique role, personality, voice, and accent</p>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-72 border-r border-white/5 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold px-1 mb-2">Core Agents</p>
            <div className="space-y-1.5">
              {CORE_AGENTS.map(id => (
                <AgentCard key={id} agent={AGENT_PROFILES[id]} isActive={activeAgent === id}
                  onClick={() => { setActiveAgent(id); setTab("chat"); }}
                  prefs={savedPrefs[id]} />
              ))}
            </div>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold px-1 mb-2">Add-On Agents</p>
            <div className="space-y-1.5">
              {ADDON_AGENTS.map(id => (
                <AgentCard key={id} agent={AGENT_PROFILES[id]} isActive={activeAgent === id}
                  onClick={() => { setActiveAgent(id); setTab("chat"); }}
                  prefs={savedPrefs[id]} />
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Agent Header */}
          <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between`}
            style={{ background: `${agent.color}08` }}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${agent.accentBg} border ${agent.accentBorder}`}>
                {agent.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-wide" style={{ color: agent.color }}>
                    {savedPrefs[activeAgent]?.nickname || agent.name}
                  </h2>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
                  <span className="text-[9px] text-[#2ed573]">ACTIVE</span>
                </div>
                <p className="text-xs text-gray-400">{agent.role}</p>
                <p className="text-[10px] text-gray-600 italic mt-0.5">"{agent.tagline}"</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Voice/Accent display */}
              <div className="hidden md:flex flex-col items-end text-right">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Volume2 className="w-3 h-3" />
                  {savedPrefs[activeAgent]?.voice || agent.defaultVoice}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-600">
                  <Mic className="w-2.5 h-2.5" />
                  {savedPrefs[activeAgent]?.accent || agent.defaultAccent}
                </div>
              </div>
              {saveMsg && <span className="text-[10px] text-[#2ed573] font-bold">{saveMsg}</span>}
              {/* Collab toggle */}
              <button onClick={() => setShowCollab(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${showCollab ? "text-white" : "text-gray-500 hover:text-gray-300 border-white/10"}`}
                style={showCollab ? { background: `${agent.color}20`, color: agent.color, borderColor: `${agent.color}30` } : {}}>
                <Users className="w-3 h-3" /> Team
              </button>
              {/* Tab switcher */}
              <div className="flex rounded-lg overflow-hidden border border-white/10">
                <button onClick={() => setTab("chat")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold transition-colors ${tab === "chat" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                  style={tab === "chat" ? { background: `${agent.color}25`, color: agent.color } : {}}>
                  <MessageSquare className="w-3 h-3" /> Chat
                </button>
                <button onClick={() => setTab("customize")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold transition-colors border-l border-white/10 ${tab === "customize" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                  style={tab === "customize" ? { background: `${agent.color}25`, color: agent.color } : {}}>
                  <Settings className="w-3 h-3" /> Customize
                </button>
              </div>
            </div>
          </div>

          {/* Capabilities Bar */}
          <div className="px-5 py-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto">
            {agent.capabilities.map(cap => (
              <span key={cap} className="text-[9px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0"
                style={{ color: agent.color, borderColor: `${agent.color}25`, background: `${agent.color}08` }}>
                {cap}
              </span>
            ))}
            {savedPrefs[activeAgent]?.focus_areas && (
              <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-gray-500 whitespace-nowrap shrink-0">
                📍 {savedPrefs[activeAgent].focus_areas}
              </span>
            )}
          </div>

          {/* Content — split with collab panel when active */}
          <div className="flex-1 min-h-0 overflow-hidden flex">
            <div className={`flex flex-col min-h-0 overflow-hidden transition-all ${showCollab ? "flex-1" : "w-full"}`}>
              {tab === "chat"
                ? <AgentChat key={`${activeAgent}-${JSON.stringify(prefs)}`} agent={agent} userPrefs={prefs} />
                : <AgentCustomize agent={agent} prefs={prefs} onSave={handleSavePrefs} />
              }
            </div>
            {showCollab && (
              <div className="w-72 shrink-0 flex flex-col min-h-0">
                <CollabTeamChat agentId={activeAgent} agentColor={agent.color} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}