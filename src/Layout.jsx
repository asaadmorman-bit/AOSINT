import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Shield, LayoutDashboard, Radar, Database, Target, GitBranch,

  FileBarChart, ChevronLeft, ChevronRight, Menu, Bell, Search,
  Users, Cpu, FileText, Eye, HelpCircle, MessageSquare,
  LifeBuoy, Settings, Skull, Globe2, BookOpen, Home, DollarSign,
  FlaskConical, Smartphone, Crown, Zap, Bot, TestTube2, CreditCard,
  CheckCircle2, Award, Layers, Network, Sword, Crosshair, Server, Brain, LogOut, UserCircle,
  BarChart3, AlertCircle, TrendingUp, Bug, ArrowLeft, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search/SearchBar";
import NotificationBell from "@/components/notifications/NotificationBell";
import PWAInstallPrompt from "@/components/mobile/PWAInstallPrompt";
import BottomNav from "@/components/mobile/BottomNav";
import PageTransition from "@/components/mobile/PageTransition";
import Footer from "@/components/shared/Footer";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";

const buildNavGroups = (user) => [
  {
    label: "Platform",
    items: [
      { name: "Home", page: "Homepage", icon: Home },
      { name: "Capabilities", page: "CapabilityShowcase", icon: Zap },
      { name: "System Requirements", page: "SystemRequirements", icon: Server },
      { name: "Master Blueprint", page: "MasterBlueprint", icon: BookOpen },
      { name: "vs. OSINT Tools", page: "Comparison", icon: Shield },
      { name: "Integration Hub", page: "IntegrationHub", icon: Zap },
      { name: "Data Flows & Workflows", page: "DataFlowsAndWorkflows", icon: Network },
    ]
  },
  {
    label: "Command",
    items: [
      { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
      { name: "Unified SA Dashboard", page: "SaDashboard", icon: Crosshair },
      { name: "Intel Feeds", page: "IntelFeeds", icon: MessageSquare },
      { name: "Intel Reports", page: "IntelReports", icon: FileText },
      { name: "Security Briefings", page: "SecurityBriefings", icon: FileText },
      { name: "Discord Servers", page: "DiscordServerManagement", icon: Zap },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { name: "Investigations", page: "Investigations", icon: Crosshair },
      { name: "Watchlist Keywords", page: "WatchlistConfig", icon: Bell },
      { name: "Modules", page: "Modules", icon: Layers },
      { name: "War Rooms", page: "WarRooms", icon: Sword },
      { name: "OSINT Intelligence Hub", page: "OsintHub", icon: Globe2 },
      { name: "OSINT Workbench", page: "OsintWorkbench", icon: Layers },
      { name: "SOCMINT Intelligence", page: "SocialMediaIntelligence", icon: Users },
      { name: "Team Sync", page: "TeamSync", icon: MessageSquare },
      { name: "Global Threat Observatory", page: "GlobalThreatObservatory", icon: Globe2 },
      { name: "Eye of Shauntze V2", page: "EyeOfShauntzeV2", icon: Eye },
      { name: "Operator Dashboard", page: "OperatorDashboard", icon: Crosshair },
      { name: "Gov & Allied Intel Feeds", page: "GovIntelFeeds", icon: Shield },
      { name: "Threat by Region", page: "ThreatIntelByRegion", icon: Globe2 },
      { name: "Threat Feeds", page: "ThreatFeeds", icon: Radar },
      { name: "Indicators", page: "Indicators", icon: Database },
      { name: "Threat Actors", page: "ThreatActors", icon: Skull },
      { name: "Transforms", page: "Transforms", icon: GitBranch },
    ]
  },
  {
    label: "Analysis",
    items: [
      { name: "Security Dashboard", page: "SecurityDashboard", icon: BarChart3 },
      { name: "Person OSINT Search", page: "PersonOsintSearch", icon: Users },
      { name: "Analytic Questions", page: "AnalyticQuestions", icon: HelpCircle },
      { name: "Entity Graph", page: "EntityGraph", icon: Globe2 },
      { name: "Assets", page: "Assets", icon: Target },
      { name: "TTP Analysis", page: "TTPAnalysis", icon: Cpu },
      { name: "MITRE ATT&CK Matrix", page: "MitreAttackDashboard", icon: Crosshair },
      { name: "Adversary Emulation", page: "AdversaryEmulation", icon: Sword },
      { name: "Vulnerability Mgmt", page: "VulnerabilityManagement", icon: Shield },
      { name: "Threat Intel Correlation", page: "ThreatIntelCorrelation", icon: Globe2 },
      { name: "Threat Geo-Timeline", page: "ThreatGeoTimeline", icon: Globe2 },
      { name: "Custom Alert Rules", page: "CustomAlertRuleManagement", icon: AlertCircle },
      ...(user?.role === 'admin' || user?.email?.endsWith('@eds-360.com') ? [{ name: "SEO & Retention", page: "SEOAndRetention", icon: TrendingUp }] : []),
      ...(user?.role === 'admin' || user?.email?.endsWith('@eds-360.com') ? [{ name: "DevOps & App Readiness", page: "DevOpsDashboard", icon: Bug }] : []),
    ]
  },
  {
    label: "AI Agents & Training",
    items: [
      { name: "Agent Ops", page: "AgentOps", icon: Cpu },
      { name: "Model Lifecycle", page: "ModelLifecycleManagement", icon: Brain },
      { name: "Threat Hunting", page: "ThreatHunting", icon: Crosshair },
      { name: "Quantum Ops", page: "QuantumOps", icon: Zap },
      { name: "Quantum Orchestration", page: "QuantumOrchestration", icon: Zap },
      { name: "Assessments", page: "Assessments", icon: Eye },
      { name: "Research Hub", page: "ResearchHub", icon: FlaskConical },
      { name: "Certification Engine", page: "CertificationEngine", icon: Award },
      { name: "Question Lab", page: "QuestionLab", icon: HelpCircle },
      { name: "Demo Mode", page: "DemoMode", icon: FlaskConical },
    ]
  },
  {
    label: "Command Center",
    items: [
      { name: "Executive Dashboard", page: "ExecutiveDashboard", icon: Crown },
      { name: "Operator Mode", page: "OperatorMode", icon: Zap },
    ]
  },
  {
    label: "Agents & Testing",
    items: [
      { name: "Agent Marketplace", page: "AgentMarketplace", icon: Bot },
      { name: "Agent Roster", page: "AgentRoster", icon: Bot },
      { name: "Testing Suite", page: "TestingSuite", icon: TestTube2 },
    ]
  },
  {
    label: "Briefing & Mobile",
    items: [
      { name: "Briefing Engine", page: "BriefingEngine", icon: Globe2 },
      { name: "Mobile Companion", page: "MobileCompanion", icon: Smartphone },
    ]
  },
  {
    label: "Community & Support",
    items: [
      { name: "Feed Subscriptions", page: "FeedSubscriptions", icon: Bell },
      { name: "Social Sharing", page: "SocialSharing", icon: Share2 },
      { name: "Submit a Report", page: "CommunityReporting", icon: AlertCircle },
      { name: "Forum", page: "Forum", icon: MessageSquare },
      { name: "Notion Intel Sync", page: "NotionSync", icon: Database },
      { name: "Discord Integration", page: "DiscordIntegrationHub", icon: MessageSquare },
      { name: "Support", page: "Support", icon: LifeBuoy },
    ]
  },
  {
    label: "Admin",
    items: [
      { name: "Account Management", page: "AccountManagement", icon: Users },
      { name: "Account Settings", page: "AccountSettings", icon: UserCircle },
      { name: "Team Management", page: "TeamManagement", icon: Users },
      { name: "Admin Console", page: "AdminConsole", icon: Settings },
      { name: "Report Verification", page: "CommunityReportAdmin", icon: Shield },
    ]
  },
  {
    label: "Testing & QA",
    items: [
      { name: "Brand Identity", page: "BrandIdentity", icon: Shield },
      { name: "UAT Script", page: "UATScript", icon: FileText },
      { name: "Test Report", page: "UATReportTemplate", icon: FileBarChart },
      { name: "UAT Sign-Off", page: "UATSignOff", icon: CheckCircle2 },
    ]
  },
  {
    label: "Compliance & Security",
    items: [
      { name: "Compliance Controls", page: "ComplianceControls", icon: Shield },
      { name: "Compliance & Documentation", page: "ComplianceDocumentation", icon: BarChart3 },
      { name: "Acceptable Use Enforcement", page: "AcceptableUseEnforcement", icon: AlertCircle },
    ]
  },
  {
    label: "Legal & Docs",
    items: [
      { name: "Self & Cloud Hosting", page: "SelfHostingGuide", icon: Server },
      { name: "Documentation", page: "Documentation", icon: BookOpen },
      { name: "Privacy Policy", page: "PrivacyPolicy", icon: Shield },
      { name: "Terms of Service", page: "TermsOfService", icon: FileText },
      { name: "Acceptable Use Policy", page: "AcceptableUsePolicy", icon: CheckCircle2 },
    ]
  },
];

const TIER_META = {
  community: { color: "#6b7280", label: "Community" },
  pro: { color: "#00d4ff", label: "Pro" },
  enterprise: { color: "#a855f7", label: "Enterprise" },
  gov: { color: "#f59e0b", label: "Gov/CI" },
};

// Android dark-mode: apply 'dark' class to <html> based on system preference
if (typeof window !== "undefined") {
  const applyDarkMode = (matches) => {
    document.documentElement.classList.toggle("dark", matches);
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  applyDarkMode(mq.matches);
  if (!mq._asosintListened) {
    mq.addEventListener("change", (e) => applyDarkMode(e.matches));
    mq._asosintListened = true;
  }
}

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  }, [currentPageName]);

  // Scroll to top on every page change
  useEffect(() => {
    const el = document.getElementById("main-scroll");
    if (el) el.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }, [currentPageName]);

  // Public pages render without sidebar
  const publicPages = [
    "Homepage", "Home", "WhyAsoint", "UAT_Briefing",
    "AboutEDS", "Careers", "FounderBios", "Partners",
    "TrialSignup", "PrivacyPolicy", "TermsOfService",
    "AcceptableUsePolicy", "Documentation",
    "Comparison", "ComplianceDocumentation"
  ];
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  // If not authenticated and not on a public page, redirect to login
  if (authChecked && !user) {
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-[#00d4ff] text-sm animate-pulse">Authenticating...</div>
      </div>
    );
  }

  const tierMeta = TIER_META[user?.subscription_tier || "pro"] || TIER_META.pro;
  const navGroups = buildNavGroups(user);
  const allNavItems = navGroups.flatMap(g => g.items);

  // Sub-pages are anything that's not the top-level landing pages
  const topLevelPages = ["Dashboard", "Homepage", "IntelFeeds", "ThreatActors", "Indicators", "SecurityDashboard", "UserProfile", "OsintHub"];
  const isSubPage = !topLevelPages.includes(currentPageName);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 flex">
      <style>{`
        :root {
          --accent: #00d4ff;
          --accent-dim: #0099cc;
          --danger: #ff4757;
          --warning: #ffa502;
          --success: #2ed573;
          --surface: #111827;
          --surface-elevated: #1a2235;
          --border: rgba(255,255,255,0.06);
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      <PWAInstallPrompt />

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen
        bg-[#0d1220] border-r border-white/5
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? "w-[68px]" : "w-56"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        style={{ paddingTop: mobileOpen ? "env(safe-area-inset-top)" : undefined }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/5 shrink-0 ${collapsed ? "justify-center px-2" : "px-4"}`}>
          <div className="relative">
            <Shield className="w-7 h-7 text-[#00d4ff] shrink-0" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="text-lg font-black tracking-tight text-white">ASOSINT</span>
              <span className="text-[9px] text-[#00d4ff] block -mt-0.5 font-medium tracking-widest">ASAAD & SHAUNTZE'S OSINT</span>
            </div>
          )}
        </div>

        {/* User display */}
        {!collapsed && user?.full_name && (
          <div className="px-4 py-2 border-b border-white/5">
            <span className="text-[9px] text-gray-500 truncate block px-2">{user.full_name}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto space-y-3">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-1 mt-1">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => { setMobileOpen(false); const el = document.getElementById("main-scroll"); if (el) el.scrollTop = 0; window.scrollTo({ top: 0 }); }}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                        ${isActive
                          ? "bg-[#00d4ff]/10 text-[#00d4ff] shadow-[inset_0_0_0_1px_rgba(0,212,255,0.15)]"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#00d4ff]" : ""}`} />
                      {!collapsed && <span className="text-sm truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout + Collapse */}
        <div className="hidden lg:flex flex-col p-2 border-t border-white/5 shrink-0 gap-1">
          <Link
            to={createPageUrl("UserProfile")}
            className={`w-full flex items-center gap-2 p-2 rounded-lg text-gray-400 hover:text-[#00d4ff] hover:bg-white/5 transition-colors ${collapsed ? "justify-center" : "px-3"}`}
            title="My Profile"
          >
            <UserCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-xs">My Profile</span>}
          </Link>
          <button
            onClick={() => base44.auth.logout(createPageUrl("Homepage"))}
            className={`w-full flex items-center gap-2 p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-white/5 transition-colors ${collapsed ? "justify-center" : "px-3"}`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-xs">Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header
          className="border-b border-white/5 bg-[#0d1220]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shrink-0 gap-4"
          style={{
            paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
            paddingBottom: "0.75rem",
            minHeight: "calc(3.5rem + env(safe-area-inset-top))"
          }}
        >
          <div className="flex items-center gap-3">
            {isSubPage ? (
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 h-11 w-11" onClick={() => window.history.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 h-11 w-11" onClick={() => setMobileOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-sm font-semibold text-white hidden sm:block">
              {allNavItems.find(i => i.page === currentPageName)?.name || currentPageName}
            </h1>
          </div>
          <SearchBar />
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
              <span className="text-[9px] text-gray-500 font-mono">OSINT·SIGINT·HUMINT</span>
            </div>
            <NotificationBell />
            <Link to={createPageUrl("UserProfile")} className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors" title="My Profile">
              <div className="w-7 h-7 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] text-xs font-black shrink-0">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
              </div>
              {user?.full_name && <span className="text-xs text-gray-400 hidden lg:block max-w-[100px] truncate">{user.full_name}</span>}
            </Link>
          </div>
        </header>

        <main id="main-scroll" className="flex-1 overflow-x-hidden overflow-y-auto min-w-0 pb-[calc(4rem+56px+env(safe-area-inset-bottom))] lg:pb-16">
          <PullToRefresh onRefresh={async () => window.location.reload()}>
            <div className="p-3 sm:p-4 lg:p-6">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </PullToRefresh>
        </main>

        <Footer />
      </div>

      <BottomNav currentPageName={currentPageName} />
    </div>
  );
}