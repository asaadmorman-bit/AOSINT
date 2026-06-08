import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, Lock, LogIn, Map, Radio, AlertTriangle, Eye, Crosshair,
  Activity, Users, ChevronRight, MapPin, Navigation, Wifi, Signal,
  Bell, Settings, LogOut, Menu, X, Cpu, Globe2, Zap, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EvasionMap from "@/components/operator/EvasionMap";
import LiveDataFeed from "@/components/operator/LiveDataFeed";

const ROLES = {
  field_agent: { label: "Field Agent", color: "#00d4ff", access: ["map", "feeds", "alerts"] },
  command_staff: { label: "Command Staff", color: "#a855f7", access: ["map", "feeds", "alerts", "intel", "admin"] },
  admin: { label: "System Admin", color: "#ff4757", access: ["map", "feeds", "alerts", "intel", "admin", "config"] },
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Activity, roles: ["field_agent", "command_staff", "admin"] },
  { id: "map", label: "E&E Routes", icon: Map, roles: ["field_agent", "command_staff", "admin"] },
  { id: "feeds", label: "Live Feeds", icon: Radio, roles: ["field_agent", "command_staff", "admin"] },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, roles: ["field_agent", "command_staff", "admin"] },
  { id: "intel", label: "Intel Board", icon: Eye, roles: ["command_staff", "admin"] },
  { id: "admin", label: "Admin", icon: Settings, roles: ["admin"] },
];

export default function OperatorDashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", role: "field_agent" });
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthChecked(true);
    }).catch(() => {
      setUser(null);
      setAuthChecked(true);
    });
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      base44.auth.redirectToLogin(window.location.href);
    } catch {
      setLoginError("Authentication failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
          <p className="text-[#00d4ff]/60 text-xs font-mono tracking-widest">AUTHENTICATING…</p>
        </div>
      </div>
    );
  }

  // Login portal
  if (!user) {
    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center px-4 relative overflow-hidden">
        {/* BG effects */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px'}} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00d4ff]/4 rounded-full blur-[100px]" />

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/25 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#00d4ff]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">ASOSINT OPERATOR</h1>
            <p className="text-[10px] font-mono text-[#00d4ff]/60 tracking-widest mt-1">SECURE ACCESS PORTAL · COP SYSTEM</p>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">Access Level</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  key={key}
                  onClick={() => setLoginForm(f => ({ ...f, role: key }))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${loginForm.role === key ? 'text-black' : 'border-white/10 text-gray-500 bg-transparent hover:border-white/20'}`}
                  style={loginForm.role === key ? { backgroundColor: r.color, borderColor: r.color } : {}}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth card */}
          <div className="rounded-2xl border border-white/8 bg-[#0d1220]/80 backdrop-blur-xl p-6 shadow-[0_0_60px_rgba(0,212,255,0.06)]">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs font-bold text-white">Secure Authentication Required</span>
              <span className="ml-auto text-[8px] font-mono text-[#2ed573] bg-[#2ed573]/10 border border-[#2ed573]/20 px-2 py-0.5 rounded">TLS 1.3</span>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase tracking-widest block mb-1">Operator ID / Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({...f, email: e.target.value}))}
                  placeholder="operator@eds-360.com"
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/40 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-600 uppercase tracking-widest block mb-1">Passphrase</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({...f, password: e.target.value}))}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/40 font-mono"
                />
              </div>
            </div>

            {loginError && <p className="text-red-400 text-xs mb-4">{loginError}</p>}

            <Button
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full bg-[#00d4ff] text-black hover:bg-[#38bfff] font-black h-11"
            >
              {loggingIn ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Authenticating…</span>
              ) : (
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Authenticate & Enter</span>
              )}
            </Button>
          </div>

          <p className="text-center text-[10px] text-gray-700 mt-4 font-mono">
            AUTHORIZED ACCESS ONLY · ACTIVITY IS MONITORED AND LOGGED · EDS-360.COM
          </p>
        </div>
      </div>
    );
  }

  const userRole = user?.role === "admin" ? "admin" : "command_staff";
  const roleMeta = ROLES[userRole] || ROLES.command_staff;
  const allowedTabs = NAV_ITEMS.filter(n => n.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-[#060a14] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} shrink-0 transition-all duration-300 bg-[#0a0f1e] border-r border-white/5 flex flex-col h-screen sticky top-0 z-30`}>
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-white/5 shrink-0 ${sidebarOpen ? "px-4 gap-3" : "justify-center"}`}>
          <Shield className="w-6 h-6 text-[#00d4ff] shrink-0" />
          {sidebarOpen && <span className="text-sm font-black tracking-tight">COP OPERATOR</span>}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-white/5">
            <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: roleMeta.color}} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{color: roleMeta.color}}>{roleMeta.label}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {allowedTabs.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-[#00d4ff]/10 text-[#00d4ff]" : "text-gray-500 hover:text-gray-200 hover:bg-white/5"} ${!sidebarOpen ? "justify-center" : ""}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="text-xs truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/5 space-y-1 shrink-0">
          <button
            onClick={() => base44.auth.logout("/")}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-white/5 transition-colors ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="text-xs">Sign Out</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl flex items-center px-4 gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
            <span className="text-[10px] font-mono text-gray-500 tracking-widest">COP · LIVE · {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
              <Signal className="w-3 h-3 text-[#2ed573]" />
              <span className="text-[9px] font-mono text-gray-600">FEEDS ACTIVE</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] text-xs font-black">
              {user?.full_name?.[0]?.toUpperCase() || "O"}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {activeTab === "overview" && <OverviewTab user={user} roleMeta={roleMeta} setActiveTab={setActiveTab} />}
          {activeTab === "map" && <EvasionMap />}
          {activeTab === "feeds" && <LiveDataFeed />}
          {activeTab === "alerts" && <AlertsTab />}
          {activeTab === "intel" && <IntelTab />}
          {activeTab === "admin" && <AdminTab user={user} />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ user, roleMeta, setActiveTab }) {
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h2 className="text-lg font-black text-white">Welcome, {user?.full_name?.split(" ")[0] || "Operator"}</h2>
        <p className="text-xs text-gray-600 font-mono mt-0.5">Access Level: <span style={{color: roleMeta.color}}>{roleMeta.label}</span> · Session Active</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active IOCs", val: "2,847", color: "#ff4757", icon: AlertTriangle },
          { label: "E&E Routes", val: "6 Active", color: "#2ed573", icon: Navigation },
          { label: "Feed Sources", val: "14 Live", color: "#00d4ff", icon: Radio },
          { label: "Threat Level", val: "ELEVATED", color: "#ffa502", icon: TrendingUp },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-[#0d1220] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5" style={{color}} />
              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-black" style={{color}}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => setActiveTab("map")} className="p-5 rounded-xl border border-[#2ed573]/20 bg-[#2ed573]/5 hover:bg-[#2ed573]/8 text-left transition-all group">
          <Map className="w-6 h-6 text-[#2ed573] mb-3" />
          <h3 className="font-bold text-white mb-1">Escape & Evasion Routes</h3>
          <p className="text-xs text-gray-500">Live threat-weighted routing with AR overlay. 6 routes currently active.</p>
          <div className="flex items-center gap-1 mt-3 text-[#2ed573] text-xs font-bold">Open Map <ChevronRight className="w-3.5 h-3.5" /></div>
        </button>
        <button onClick={() => setActiveTab("feeds")} className="p-5 rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/5 hover:bg-[#00d4ff]/8 text-left transition-all group">
          <Radio className="w-6 h-6 text-[#00d4ff] mb-3" />
          <h3 className="font-bold text-white mb-1">Live Intelligence Feeds</h3>
          <p className="text-xs text-gray-500">Social media, police scanner, and traffic APIs streaming in real-time.</p>
          <div className="flex items-center gap-1 mt-3 text-[#00d4ff] text-xs font-bold">Open Feeds <ChevronRight className="w-3.5 h-3.5" /></div>
        </button>
      </div>
    </div>
  );
}

function AlertsTab() {
  const alerts = [
    { sev: "critical", msg: "New IOC cluster detected: 3 IPs flagged near principal's route", time: "0m ago", type: "IOC" },
    { sev: "high", msg: "Anomalous movement pattern detected: Entity BRAVO-7", time: "2m ago", type: "Behavioral" },
    { sev: "high", msg: "Police scanner: Heavy activity reported at Checkpoint Alpha", time: "5m ago", type: "Scanner" },
    { sev: "medium", msg: "Social media spike: Keywords matching operation area", time: "8m ago", type: "SOCMINT" },
    { sev: "medium", msg: "Traffic API: Route 1 compromised — alternate suggested", time: "11m ago", type: "Traffic" },
    { sev: "low", msg: "New domain registration matching watchlist pattern", time: "18m ago", type: "IOC" },
  ];
  const sevColor = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#2ed573" };
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h2 className="text-base font-black text-white">Active Alerts</h2>
      {alerts.map((a, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-white/5 bg-[#0d1220]">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{backgroundColor: sevColor[a.sev]}} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200">{a.msg}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] font-mono text-gray-600">{a.time}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border" style={{color: sevColor[a.sev], borderColor: `${sevColor[a.sev]}30`, backgroundColor: `${sevColor[a.sev]}10`}}>{a.type}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IntelTab() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-base font-black text-white">Intel Board</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { title: "Threat Actor: PHANTOM-9", level: "HIGH", summary: "Active reconnaissance observed. 4 IOCs linked. Last seen 14 min ago in sector 3.", color: "#ff4757" },
          { title: "Op Area: Sector 7 — Elevated Risk", level: "HIGH", summary: "Crowd density above threshold. Social sentiment trending negative. Recommend E&E Route B.", color: "#ffa502" },
          { title: "OSINT Fusion Report #2847", level: "MEDIUM", summary: "14 new IoCs extracted from dark web forums. 3 match active watchlist entities.", color: "#00d4ff" },
          { title: "Pattern of Life: Entity FOXTROT", level: "LOW", summary: "Behavioral baseline deviation detected. Morning routine anomaly logged — 22% deviation score.", color: "#2ed573" },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-xl border border-white/5 bg-[#0d1220]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-white text-sm">{c.title}</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{color: c.color, backgroundColor: `${c.color}12`, border: `1px solid ${c.color}25`}}>{c.level}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{c.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminTab({ user }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-base font-black text-white">System Administration</h2>
      <div className="p-5 rounded-xl border border-white/5 bg-[#0d1220]">
        <p className="text-xs font-mono text-gray-600 mb-3 uppercase tracking-widest">Current Session</p>
        <div className="space-y-2">
          {[["Operator", user?.full_name || "—"], ["Email", user?.email || "—"], ["Role", user?.role || "—"], ["Session Started", new Date().toLocaleString()]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-gray-600">{k}</span>
              <span className="text-gray-300 font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}