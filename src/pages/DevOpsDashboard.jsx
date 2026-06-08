import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Zap, AlertCircle, CheckCircle2, Loader2,
  RefreshCw, Smartphone, GitBranch, Bug, Rocket, Bell,
  ChevronDown, ChevronUp, Clock, AlertTriangle, Info
} from "lucide-react";

const SEVERITY_CONFIG = {
  critical: { color: "#ff4757", bg: "bg-[#ff4757]/10", border: "border-[#ff4757]/30", label: "CRITICAL" },
  high:     { color: "#ffa502", bg: "bg-[#ffa502]/10", border: "border-[#ffa502]/30", label: "HIGH" },
  medium:   { color: "#ffd700", bg: "bg-[#ffd700]/10", border: "border-[#ffd700]/30", label: "MEDIUM" },
  low:      { color: "#2ed573", bg: "bg-[#2ed573]/10", border: "border-[#2ed573]/30", label: "LOW" },
  info:     { color: "#00d4ff", bg: "bg-[#00d4ff]/10", border: "border-[#00d4ff]/30", label: "INFO" },
};

const STATUS_ICON = {
  pass: <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />,
  warn: <AlertTriangle className="w-3.5 h-3.5 text-[#ffa502]" />,
  fail: <AlertCircle className="w-3.5 h-3.5 text-[#ff4757]" />,
};

function ScoreRing({ score, label, size = 80 }) {
  const color = score >= 80 ? "#2ed573" : score >= 60 ? "#ffa502" : "#ff4757";
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x="35" y="40" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function CheckItem({ item, type }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.info;
  const statusKey = item.status || (item.severity === 'critical' || item.severity === 'high' ? 'fail' : item.severity === 'medium' ? 'warn' : 'pass');
  return (
    <div className={`rounded-lg border p-3 transition-all ${type === 'vuln' ? `${sev.bg} ${sev.border}` : 'bg-white/[0.03] border-white/5'}`}>
      <div className="flex items-start gap-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className="mt-0.5 shrink-0">{STATUS_ICON[statusKey] || STATUS_ICON.pass}</span>
        <span className="text-xs text-gray-200 flex-1">{item.check}</span>
        {type === 'vuln' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${sev.color}20`, color: sev.color }}>{sev.label}</span>
        )}
        {(item.detail || item.action) && (
          <span className="text-gray-600 shrink-0">{open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
        )}
      </div>
      {open && (item.detail || item.action) && (
        <div className="mt-2 ml-5 space-y-1">
          {item.detail && <p className="text-[11px] text-gray-400">{item.detail}</p>}
          {item.action && <p className="text-[11px] text-[#00d4ff]">→ {item.action}</p>}
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, score, status, statusColors, items = [], type }) {
  const [collapsed, setCollapsed] = useState(false);
  const sc = statusColors[status] || statusColors.needs_work;
  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: sc.color }} />
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sc.color}20`, color: sc.color }}>{status?.replace(/_/g, ' ').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black" style={{ color: sc.color }}>{score}/100</span>
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-600 hover:text-gray-300">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item, i) => <CheckItem key={i} item={item} type={type} />)}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  ready:      { color: "#2ed573" },
  healthy:    { color: "#2ed573" },
  needs_work: { color: "#ffa502" },
  not_ready:  { color: "#ff4757" },
  critical:   { color: "#ff4757" },
};

export default function DevOpsDashboard() {
  const [user, setUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState("full");
  const [lastScanned, setLastScanned] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
    // Load last result from localStorage
    const cached = localStorage.getItem('devops_scan_result');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setScanResult(parsed.result);
        setLastScanned(parsed.ts);
      } catch (_) {}
    }
  }, []);

  const isEds360 = user?.email?.endsWith('@eds-360.com');
  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || isEds360;

  if (user && !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-gray-400 text-sm">This page is only available to platform developers and EDS-360 team members.</p>
      </div>
    );
  }

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('runDevOpsScan', { scan_type: scanType });
      const result = res.data?.scan_result;
      if (result) {
        setScanResult(result);
        setLastScanned(new Date().toISOString());
        localStorage.setItem('devops_scan_result', JSON.stringify({ result, ts: new Date().toISOString() }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const SCAN_TYPES = [
    { value: "full", label: "Full Scan", icon: Shield },
    { value: "appstore", label: "App Store", icon: Smartphone },
    { value: "cicd", label: "CI/CD", icon: GitBranch },
    { value: "vulnerabilities", label: "Vulnerabilities", icon: Bug },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-[#00d4ff]" />
            <h1 className="text-2xl font-black text-white">DevOps & App Readiness</h1>
          </div>
          <p className="text-xs text-gray-500">CI/CD health, vulnerability scanning & App Store submission checks</p>
        </div>
        {lastScanned && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <Clock className="w-3 h-3" />
            Last scanned: {new Date(lastScanned).toLocaleString()}
          </div>
        )}
      </div>

      {/* Scan Controls */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {SCAN_TYPES.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                onClick={() => setScanType(s.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  scanType === s.value
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={runScan}
            disabled={loading}
            className="bg-[#00d4ff] text-black hover:bg-[#0099cc] font-bold"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Scanning...</>
            ) : (
              <><Rocket className="w-4 h-4 mr-2" />Run {SCAN_TYPES.find(s => s.value === scanType)?.label}</>
            )}
          </Button>
          {loading && <span className="text-xs text-gray-500 animate-pulse">AI analysis in progress — admins will be emailed results...</span>}
        </div>
        <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1">
          <Bell className="w-3 h-3" /> Results will be automatically emailed to all admins and EDS-360 team members.
        </p>
      </div>

      {/* Results */}
      {scanResult && (
        <>
          {/* Score Overview */}
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-6">
                <ScoreRing score={scanResult.overall_score || 0} label="Overall" size={90} />
                {scanResult.appstore?.score != null && <ScoreRing score={scanResult.appstore.score} label="App Store" />}
                {scanResult.cicd?.score != null && <ScoreRing score={scanResult.cicd.score} label="CI/CD" />}
                {scanResult.vulnerabilities?.score != null && <ScoreRing score={scanResult.vulnerabilities.score} label="Security" />}
              </div>
              <div className="flex-1 min-w-[200px]">
                {scanResult.summary && (
                  <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-[#00d4ff]/40 pl-4">{scanResult.summary}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  {[
                    { label: "Critical", count: scanResult.vulnerabilities?.critical_count, color: "#ff4757" },
                    { label: "High", count: scanResult.vulnerabilities?.high_count, color: "#ffa502" },
                    { label: "Medium", count: scanResult.vulnerabilities?.medium_count, color: "#ffd700" },
                    { label: "Low", count: scanResult.vulnerabilities?.low_count, color: "#2ed573" },
                  ].filter(v => v.count != null).map(v => (
                    <div key={v.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: `${v.color}15`, border: `1px solid ${v.color}30` }}>
                      <div className="text-lg font-black" style={{ color: v.color }}>{v.count}</div>
                      <div className="text-[9px] text-gray-500">{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Immediate Recommendations */}
          {scanResult.recommendations?.filter(r => r.priority === 'immediate').length > 0 && (
            <div className="bg-[#ff4757]/5 border border-[#ff4757]/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-[#ff4757] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Immediate Actions Required
              </h3>
              <div className="space-y-2">
                {scanResult.recommendations.filter(r => r.priority === 'immediate').map((r, i) => (
                  <div key={i} className="bg-white/[0.03] rounded-lg p-3">
                    <p className="text-xs font-semibold text-white">{r.title}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Sections */}
          <div className="space-y-4">
            {scanResult.appstore?.items?.length > 0 && (
              <SectionCard
                icon={Smartphone}
                title="App Store Readiness"
                score={scanResult.appstore.score}
                status={scanResult.appstore.status}
                statusColors={STATUS_COLORS}
                items={scanResult.appstore.items}
                type="appstore"
              />
            )}
            {scanResult.cicd?.items?.length > 0 && (
              <SectionCard
                icon={GitBranch}
                title="CI/CD Pipeline Health"
                score={scanResult.cicd.score}
                status={scanResult.cicd.status}
                statusColors={STATUS_COLORS}
                items={scanResult.cicd.items}
                type="cicd"
              />
            )}
            {scanResult.vulnerabilities?.items?.length > 0 && (
              <SectionCard
                icon={Bug}
                title="Vulnerability Scan"
                score={scanResult.vulnerabilities.score}
                status={scanResult.vulnerabilities.critical_count > 0 ? 'critical' : scanResult.vulnerabilities.high_count > 0 ? 'needs_work' : 'healthy'}
                statusColors={STATUS_COLORS}
                items={scanResult.vulnerabilities.items}
                type="vuln"
              />
            )}
          </div>

          {/* Short/Long term recommendations */}
          {scanResult.recommendations?.filter(r => r.priority !== 'immediate').length > 0 && (
            <div className="bg-[#0d1220] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00d4ff]" /> Improvement Roadmap
              </h3>
              <div className="space-y-3">
                {['short_term', 'long_term'].map(priority => {
                  const items = scanResult.recommendations.filter(r => r.priority === priority);
                  if (!items.length) return null;
                  return (
                    <div key={priority}>
                      <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">{priority.replace('_', ' ')}</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {items.map((r, i) => (
                          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-200">{r.title}</p>
                            <p className="text-[11px] text-gray-500 mt-1">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}