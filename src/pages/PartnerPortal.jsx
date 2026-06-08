import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Building2, TrendingUp, Award, BarChart3, Settings,
  Shield, LogIn, Clock, CheckCircle2, ArrowRight, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PartnerDashboard from "@/components/partner/PartnerDashboard.jsx";
import DealManagement from "@/components/partner/DealManagement.jsx";
import AnalyticsPanel from "@/components/partner/AnalyticsPanel.jsx";
import CertificationCenter from "@/components/partner/CertificationCenter.jsx";
import PartnerSettings from "@/components/partner/PartnerSettings.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "deals", label: "Deal Pipeline", icon: TrendingUp },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "certifications", label: "Training & Certs", icon: Award },
  { id: "settings", label: "Settings", icon: Settings },
];

const TIER_COLORS = {
  registered: "#6b7280",
  silver: "#64748b",
  gold: "#d97706",
  elite: "#a855f7",
  gov: "#f59e0b",
};

export default function PartnerPortal() {
  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthChecked(true);
    }).catch(() => {
      setUser(null);
      setAuthChecked(true);
    });
  }, []);

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner_record", user?.email],
    queryFn: () => base44.entities.Partner.filter({ contact_email: user.email }).then(r => r[0]),
    enabled: !!user,
  });

  // Loading auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#00d4ff] text-sm animate-pulse">Checking access...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#00d4ff]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Partner Portal</h1>
          <p className="text-gray-400 mb-8">Sign in with your approved partner account to access your dashboard, deal pipeline, and resources.</p>
          <Button
            size="lg"
            className="bg-[#00d4ff] text-black hover:bg-[#0099cc] w-full h-12 font-bold gap-2"
            onClick={() => base44.auth.redirectToLogin(createPageUrl("PartnerPortal"))}
          >
            <LogIn className="w-5 h-5" /> Sign In to Partner Portal
          </Button>
          <p className="text-sm text-gray-500 mt-6">
            Not a partner yet?{" "}
            <Link to={createPageUrl("Partners")} className="text-[#00d4ff] hover:underline">Apply to join →</Link>
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but loading partner record
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#00d4ff] text-sm animate-pulse">Loading your partner profile...</div>
      </div>
    );
  }

  // Authenticated but no approved partner record
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Application Under Review</h1>
          <p className="text-gray-400 mb-4 leading-relaxed">
            Hi <strong className="text-white">{user.full_name || user.email}</strong>, your partner application is currently being reviewed by our team. We'll notify you at <span className="text-[#00d4ff]">{user.email}</span> once your account is approved.
          </p>
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 mb-8 text-left space-y-3">
            <p className="text-sm font-semibold text-white">What happens next?</p>
            {[
              "Our partnerships team reviews your application (5–7 business days)",
              "You'll receive an email confirmation with onboarding instructions",
              "Your partner portal access will be activated upon approval",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                {step}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl("Partners")}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 gap-2">
                <ChevronLeft className="w-4 h-4" /> Back to Partners
              </Button>
            </Link>
            <a href="mailto:partners@eds-360.com">
              <Button className="bg-[#00d4ff] text-black hover:bg-[#0099cc] gap-2">
                Contact Partnerships Team <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Approved partner — check status
  if (partner.status !== "active") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Account {partner.status}</h2>
          <p className="text-gray-400 mb-6">Your partner account is currently {partner.status}. Please contact <a href="mailto:partners@eds-360.com" className="text-[#00d4ff]">partners@eds-360.com</a> for assistance.</p>
          <Link to={createPageUrl("Partners")}>
            <Button variant="outline" className="border-white/20 text-white">Back to Partners</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Full portal — approved + active partner
  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 bg-[#0d1220]/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6" style={{ color: TIER_COLORS[partner.tier] || "#6b7280" }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{partner.company_name}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {partner.partner_type?.replace("_", " ").toUpperCase()} · {partner.tier?.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm text-gray-400">YTD Revenue</div>
              <div className="text-xl font-bold">${(partner.ytd_revenue_usd || 0).toLocaleString()}</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-gray-400">Active Tenants</div>
              <div className="text-xl font-bold">{partner.active_tenant_count || 0}</div>
            </div>
            <button
              onClick={() => base44.auth.logout(createPageUrl("Partners"))}
              className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 border border-white/10 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: TIER_COLORS[partner.tier] || "#6b7280" }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TIER_COLORS[partner.tier] || "#6b7280" }}>
            {partner.tier} tier
          </span>
          <span className="text-[10px] text-[#2ed573] ml-auto">✓ Active Partner</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {tab === "dashboard" && <PartnerDashboard partner={partner} />}
        {tab === "deals" && <DealManagement partner={partner} />}
        {tab === "analytics" && <AnalyticsPanel partner={partner} />}
        {tab === "certifications" && <CertificationCenter partner={partner} />}
        {tab === "settings" && <PartnerSettings partner={partner} />}
      </div>
    </div>
  );
}