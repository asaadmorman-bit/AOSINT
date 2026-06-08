import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Shield, Linkedin, MessageSquare, Rss, Users, CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeedSubscriptionManager from "@/components/subscriptions/FeedSubscriptionManager";

const COMMUNITY_LINKS = [
  {
    platform: "LinkedIn",
    handle: "@EmerginDefenseSolutions",
    url: "https://www.linkedin.com/company/emerging-defense-solutions",
    color: "#0077B5",
    bg: "bg-[#0077B5]/10 border-[#0077B5]/20",
    iconBg: "#0077B5",
    icon: Linkedin,
    description: "Public security advisories, threat intelligence briefings, and platform updates.",
    benefits: ["Public vulnerability disclosures", "Threat intelligence briefs", "Security industry insights", "ASOSINT feature announcements"],
  },
  {
    platform: "Discord",
    handle: "ASOSINT Community",
    url: "https://discord.gg/asosint",
    color: "#7289da",
    bg: "bg-[#7289da]/10 border-[#7289da]/20",
    iconBg: "#7289da",
    icon: MessageSquare,
    description: "Real-time threat discussions, analyst community, and exclusive intel drops.",
    benefits: ["Live threat actor tracking", "Real-time feed alerts", "Community analyst discussions", "Exclusive intelligence drops"],
  },
];

const ALERT_EXAMPLES = [
  { severity: "critical", title: "RCE in Apache Struts 2 (CVE-2024-XXXX)", time: "Just now", asset: "prod-web-01" },
  { severity: "high", title: "Privilege Escalation in Linux Kernel", time: "2h ago", asset: "k8s-node-03" },
  { severity: "critical", title: "Zero-day in Cisco IOS XE", time: "Yesterday", asset: "core-router-1" },
];

export default function FeedSubscriptions() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("alerts");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Page Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Bell className="w-6 h-6 text-[#00d4ff]" />
          <h1 className="text-2xl font-black text-white">Intelligence Feed Subscriptions</h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
          Get instant email alerts when critical vulnerabilities hit your monitored feeds. Configure which feeds, alert types, and delivery frequency match your team's workflow.
        </p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-white/5 border border-white/5 rounded-xl p-1">
        {[
          { id: "alerts", label: "Email Alerts", icon: Mail },
          { id: "community", label: "Follow Us", icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Subscription Manager */}
          <div className="lg:col-span-3">
            <FeedSubscriptionManager />
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#0d1220] border-white/5 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Alert Preview</p>
              <div className="space-y-2">
                {ALERT_EXAMPLES.map((ex, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                    ex.severity === "critical"
                      ? "bg-red-500/5 border-red-500/10"
                      : "bg-orange-500/5 border-orange-500/10"
                  }`}>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                      ex.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                    }`}>{ex.severity.toUpperCase()}</span>
                    <div>
                      <p className="text-xs text-white font-medium leading-tight">{ex.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Asset: {ex.asset} · {ex.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-[#0d1220] border-white/5 p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">What You Get</p>
              {[
                "Instant email on critical/high vulns",
                "Direct link to the affected asset",
                "CVE ID, CVSS score, and patch status",
                "Actively exploited warnings",
                "Remediation guidance included",
                "Choose your delivery frequency",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573] shrink-0" />
                  <span className="text-xs text-gray-300">{item}</span>
                </div>
              ))}
            </Card>

            <Card className="bg-[#0d1220] border-[#00d4ff]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-xs font-bold text-[#00d4ff]">Security Team Setup</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Configure custom feeds for your environment in <strong className="text-gray-200">Threat Feeds</strong>, then subscribe your team members here. Each analyst can choose their own severity filters and delivery frequency.
              </p>
              <button
                onClick={() => window.location.href = "/ThreatFeeds"}
                className="mt-3 text-xs text-[#00d4ff] flex items-center gap-1 hover:underline"
              >
                Manage Threat Feeds <ArrowRight className="w-3 h-3" />
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* Community Tab */}
      {activeTab === "community" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400 text-center">
            Follow ASOSINT's public channels for security advisories, threat briefings, and exclusive content.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {COMMUNITY_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <Card key={link.platform} className={`border p-6 space-y-4 ${link.bg} bg-opacity-50`} style={{ borderColor: `${link.color}30` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${link.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: link.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{link.platform}</p>
                      <p className="text-xs text-gray-400">{link.handle}</p>
                    </div>
                    <Badge className="ml-auto text-[10px]" style={{ background: `${link.color}20`, color: link.color, borderColor: `${link.color}30` }}>
                      Free
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-300">{link.description}</p>

                  <div className="space-y-2">
                    {link.benefits.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
                        <span className="text-xs text-gray-300">{b}</span>
                      </div>
                    ))}
                  </div>

                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full font-bold text-sm" style={{ background: link.color, color: "#fff" }}>
                      Follow on {link.platform}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                </Card>
              );
            })}
          </div>

          {/* Public advisory note */}
          <Card className="bg-[#0d1220] border-white/5 p-5">
            <div className="flex items-start gap-3">
              <Rss className="w-5 h-5 text-[#00d4ff] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white mb-1">Public Security Advisories Only</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Content published to LinkedIn and Discord is limited exclusively to <strong className="text-gray-200">public vendor advisories and threat intelligence</strong> sourced from NVD, vendor bulletins, and open-source feeds. Internal organization vulnerability data, asset details, and remediation plans are never shared publicly.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}