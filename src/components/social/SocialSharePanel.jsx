import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Share2, Send, CheckCircle2, Loader2, ExternalLink, Shield,
  MessageSquare, Facebook, Twitter, Linkedin, Globe2, AlertCircle, Info
} from "lucide-react";

const PLATFORMS = [
  {
    key: "discord",
    label: "Discord",
    icon: MessageSquare,
    color: "#5865F2",
    description: "Post to your connected Discord server or webhook",
    connected: true, // Discord is always available via bot token
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    description: "Share to your LinkedIn profile or organization page",
    connected: true,
  },
  {
    key: "facebook",
    label: "Facebook / Meta",
    icon: Facebook,
    color: "#1877F2",
    description: "Post to your Facebook page or profile",
    connected: false,
    comingSoon: true,
  },
  {
    key: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    color: "#000000",
    description: "Post a thread or tweet to X",
    connected: false,
    comingSoon: true,
  },
];

const EDS_SIGNATURE = `\n\n🛡️ Powered by ASOSINT — Threat Intelligence Platform by Emerging Defense Solutions\n🔗 asosint.eds-360.com`;

export default function SocialSharePanel({ initialContent = "", contentType = "threat_intel" }) {
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState(initialContent || "");
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState({});
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showWebhook, setShowWebhook] = useState(false);

  const fullMessage = message + EDS_SIGNATURE;
  const charCount = fullMessage.length;

  const togglePlatform = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handlePost = async () => {
    if (!message.trim() || selected.length === 0) return;
    setPosting(true);
    setResults({});

    const newResults = {};
    for (const platform of selected) {
      try {
        const res = await base44.functions.invoke("postToSocials", {
          platform,
          message: fullMessage,
          content_type: contentType,
          webhook_url: platform === "discord" ? webhookUrl : undefined,
        });
        newResults[platform] = { success: true, data: res.data };
      } catch (err) {
        newResults[platform] = { success: false, error: err.message };
      }
    }
    setResults(newResults);
    setPosting(false);
  };

  const anySelected = selected.length > 0;
  const allDone = Object.keys(results).length > 0;

  return (
    <div className="space-y-5">
      {/* Platform selector */}
      <div>
        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-widest">Select Platforms</p>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const isSelected = selected.includes(p.key);
            const result = results[p.key];
            return (
              <button
                key={p.key}
                disabled={p.comingSoon}
                onClick={() => !p.comingSoon && togglePlatform(p.key)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  p.comingSoon
                    ? "opacity-40 cursor-not-allowed bg-white/[0.02] border-white/5"
                    : isSelected
                    ? "border-opacity-60 bg-opacity-10"
                    : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                }`}
                style={isSelected ? { borderColor: `${p.color}60`, background: `${p.color}10` } : {}}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${p.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">{p.label}</div>
                  {p.comingSoon && <span className="text-[9px] text-[#ffa502] font-bold uppercase">Coming Soon</span>}
                </div>
                {result && (
                  <div className="shrink-0">
                    {result.success
                      ? <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
                {isSelected && !result && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discord webhook (optional) */}
      {selected.includes("discord") && (
        <div className="space-y-1">
          <button
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
            onClick={() => setShowWebhook(!showWebhook)}
          >
            <Info className="w-3 h-3" /> {showWebhook ? "Hide" : "Add"} custom webhook URL (optional)
          </button>
          {showWebhook && (
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#5865F2]/40"
            />
          )}
        </div>
      )}

      {/* Message */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-widest">Your Message</p>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Share a threat alert, intelligence update, or security advisory…"
          className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-[#00d4ff]/40 min-h-[100px] text-sm resize-none"
        />
        {/* Preview of signature */}
        <div className="bg-slate-900/60 border border-white/5 rounded-lg p-3 text-[11px] text-gray-500 whitespace-pre-wrap leading-relaxed">
          <span className="text-[#00d4ff] font-semibold text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Auto-appended signature
          </span>
          {EDS_SIGNATURE.trim()}
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Always verified & attributed to ASOSINT by Emerging Defense Solutions</span>
          <span className={charCount > 2800 ? "text-red-400" : ""}>{charCount} chars</span>
        </div>
      </div>

      {/* Post button */}
      <Button
        onClick={handlePost}
        disabled={posting || !message.trim() || !anySelected}
        className="w-full bg-[#00d4ff] text-black font-bold hover:bg-[#0099cc] h-11 gap-2"
      >
        {posting
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
          : allDone
          ? <><CheckCircle2 className="w-4 h-4" /> Posted to {Object.keys(results).length} platform{Object.keys(results).length > 1 ? "s" : ""}</>
          : <><Send className="w-4 h-4" /> Post to {selected.length || "Selected"} Platform{selected.length !== 1 ? "s" : ""}</>
        }
      </Button>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <div className="space-y-2">
          {Object.entries(results).map(([platform, result]) => {
            const p = PLATFORMS.find(pl => pl.key === platform);
            return (
              <div key={platform} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${result.success ? "bg-[#2ed573]/10 border-[#2ed573]/20 text-[#2ed573]" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {result.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                <span className="font-semibold">{p?.label}:</span>
                <span>{result.success ? "Posted successfully" : result.error || "Failed"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}