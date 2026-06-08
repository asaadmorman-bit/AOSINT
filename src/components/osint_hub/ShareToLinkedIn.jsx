import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Linkedin, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShareToLinkedIn({ prefillText = "" }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(prefillText);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const generatePost = async () => {
    setGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a professional LinkedIn post (under 280 characters) sharing an OSINT intelligence insight from the ASOSINT platform. 
Context: ${prefillText || "General OSINT and cybersecurity threat intelligence insight"}
Make it engaging, informative, and include 2-3 relevant hashtags like #OSINT #CyberSecurity #ThreatIntelligence.`
    });
    setText(typeof res === 'string' ? res : JSON.stringify(res));
    setGenerating(false);
  };

  const handlePost = async () => {
    setPosting(true);
    setError("");
    try {
      const res = await base44.functions.invoke('shareToLinkedIn', { text });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => { setOpen(false); setSuccess(false); setText(prefillText); }, 2000);
      } else {
        setError(res.data?.error || "Failed to post.");
      }
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <>
      <Button onClick={() => { setOpen(true); setText(prefillText); }}
        className="bg-[#0077b5]/20 border border-[#0077b5]/30 text-[#0077b5] hover:bg-[#0077b5]/30 gap-2 text-sm">
        <Linkedin className="w-4 h-4" /> Share to LinkedIn
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0d1220] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                <p className="text-sm font-bold text-white">Share OSINT Insight to LinkedIn</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 resize-none h-36 focus:outline-none focus:border-[#0077b5]/40"
              placeholder="What OSINT insight do you want to share?"
              value={text}
              onChange={e => setText(e.target.value)}
            />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs ${text.length > 3000 ? "text-red-400" : "text-gray-500"}`}>{text.length} / 3000</span>
                <Button onClick={generatePost} disabled={generating}
                  className="text-xs gap-1.5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5">
                  <Sparkles className="w-3 h-3" />{generating ? "Generating..." : "AI Draft"}
                </Button>
              </div>
              <Button onClick={handlePost} disabled={!text.trim() || posting || text.length > 3000}
                className="bg-[#0077b5] hover:bg-[#005e93] text-white font-bold text-sm gap-2">
                <Send className="w-4 h-4" />{posting ? "Posting..." : success ? "Posted! ✓" : "Post"}
              </Button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}