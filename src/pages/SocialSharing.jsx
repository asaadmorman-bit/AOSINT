import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Share2, Shield, Zap, Globe2, MessageSquare, Linkedin, TrendingUp, AlertCircle, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SocialSharePanel from "@/components/social/SocialSharePanel";

const TEMPLATES = [
  {
    label: "Threat Alert",
    icon: AlertCircle,
    color: "#ff4757",
    content: "🚨 THREAT ALERT: New critical vulnerability detected targeting [SYSTEM/VENDOR]. CVE: [ID] — CVSS Score: [SCORE]. Immediate patching recommended. Organizations running [AFFECTED VERSION] should prioritize remediation. Full details and indicators available on ASOSINT.",
    type: "threat_alert",
  },
  {
    label: "Threat Actor Profile",
    icon: Users,
    color: "#a855f7",
    content: "🕵️ THREAT ACTOR SPOTLIGHT: [Actor Name] — a [nation-state/criminal/hacktivist] group attributed to [country]. Known for targeting [sectors]. Recent activity includes [campaign]. TTPs mapped to MITRE ATT&CK. Track this actor on ASOSINT.",
    type: "threat_actor",
  },
  {
    label: "Security Advisory",
    icon: Shield,
    color: "#00d4ff",
    content: "🛡️ SECURITY ADVISORY: [Vendor] has released a patch for [vulnerability]. Affected products: [list]. Severity: [CRITICAL/HIGH]. Organizations should apply this update immediately. Remediation guidance available on ASOSINT.",
    type: "advisory",
  },
  {
    label: "Intel Briefing",
    icon: TrendingUp,
    color: "#2ed573",
    content: "📊 WEEKLY THREAT BRIEFING: Key intelligence highlights for the week of [DATE]:\n• [Top threat 1]\n• [Top threat 2]\n• [Top threat 3]\n\nFull analysis, indicators, and recommended actions available on ASOSINT.",
    type: "briefing",
  },
  {
    label: "EDS Spotlight",
    icon: Building2,
    color: "#f59e0b",
    content: "🏢 Did you know? Emerging Defense Solutions (EDS) builds ASOSINT — a full-spectrum threat intelligence platform designed for security teams, federal agencies, and critical infrastructure operators. Our mission: democratize elite threat intelligence. Learn more and join our community beta.",
    type: "eds_spotlight",
  },
];

export default function SocialSharing() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customContent, setCustomContent] = useState("");

  const content = selectedTemplate !== null ? TEMPLATES[selectedTemplate].content : customContent;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Share2 className="w-6 h-6 text-[#00d4ff]" /> Social Intelligence Sharing
        </h1>
        <p className="text-sm text-gray-500">
          Share verified threat intelligence across your social channels. All posts are automatically attributed to <span className="text-[#00d4ff] font-semibold">ASOSINT by Emerging Defense Solutions</span> to build credibility and grow our collective security community.
        </p>
      </div>

      {/* EDS Brand Banner */}
      <div className="bg-gradient-to-r from-[#00d4ff]/10 via-[#a855f7]/5 to-[#f59e0b]/10 border border-[#00d4ff]/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff]/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">Emerging Defense Solutions</div>
          <div className="text-xs text-gray-400">Every post you share automatically carries the ASOSINT + EDS brand, helping grow community awareness of verified threat intelligence.</div>
        </div>
        <Badge className="bg-[#2ed573]/15 text-[#2ed573] border-[#2ed573]/20 shrink-0 text-[10px]">Verified</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Templates */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Message Templates</h2>
          <div className="space-y-2">
            {TEMPLATES.map((t, i) => {
              const Icon = t.icon;
              const isActive = selectedTemplate === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedTemplate(isActive ? null : i);
                    setCustomContent("");
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? "border-opacity-50"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                  }`}
                  style={isActive ? { borderColor: `${t.color}50`, background: `${t.color}08` } : {}}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${t.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: t.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.content.substring(0, 60)}…</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Why share section */}
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 mt-4">
            <h3 className="text-xs font-bold text-[#00d4ff] uppercase tracking-widest mb-3">Why Share Intel?</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-2"><Zap className="w-3 h-3 text-[#ffa502] mt-0.5 shrink-0" />Build your personal brand as a threat intelligence expert</li>
              <li className="flex items-start gap-2"><Globe2 className="w-3 h-3 text-[#2ed573] mt-0.5 shrink-0" />Alert your community to real threats before they escalate</li>
              <li className="flex items-start gap-2"><Building2 className="w-3 h-3 text-[#00d4ff] mt-0.5 shrink-0" />Help grow Emerging Defense Solutions' mission & reach</li>
              <li className="flex items-start gap-2"><Shield className="w-3 h-3 text-[#a855f7] mt-0.5 shrink-0" />All posts verified & attributed — never unverified rumors</li>
            </ul>
          </div>
        </div>

        {/* Right: Share Panel */}
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00d4ff]" /> Compose & Share
          </h2>
          <SocialSharePanel
            initialContent={content}
            contentType={selectedTemplate !== null ? TEMPLATES[selectedTemplate].type : "custom"}
          />
        </div>
      </div>
    </div>
  );
}