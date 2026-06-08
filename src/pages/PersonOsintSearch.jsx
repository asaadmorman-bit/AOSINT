import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User, Mail, Phone, AtSign, Building2, MapPin, FileText,
  Search, Loader2, AlertTriangle, Shield, TrendingUp,
  ChevronDown, ChevronRight, Eye, Zap, Target, Lock,
  Clock, CheckCircle2, Globe2
} from "lucide-react";
import DarkWebMonitor from "@/components/osint/DarkWebMonitor";
import RiskTrajectoryAnalysis from "@/components/osint/RiskTrajectoryAnalysis";
import ActionableReportGenerator from "@/components/osint/ActionableReportGenerator";
import CivilRightsGate from "@/components/osint/CivilRightsGate";

const SEVERITY_STYLES = {
  critical: "bg-red-900/30 text-red-300 border-red-500/30",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/30",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/30",
  unknown: "bg-gray-900/30 text-gray-400 border-gray-600/30",
};

const TRAJECTORY_ICON = {
  increasing: { icon: TrendingUp, color: "text-red-400" },
  stable: { icon: Shield, color: "text-yellow-400" },
  decreasing: { icon: CheckCircle2, color: "text-green-400" },
};

function RiskMeter({ score, label }) {
  const color = score >= 75 ? "#ff4757" : score >= 50 ? "#ffa502" : score >= 25 ? "#f1c40f" : "#2ed573";
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-[10px] text-gray-400 uppercase">/100</span>
        </div>
      </div>
      <Badge className={`${SEVERITY_STYLES[label?.toLowerCase()] || SEVERITY_STYLES.unknown} text-xs font-bold uppercase`}>
        {label || "unknown"} risk
      </Badge>
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition"
      >
        <span className="flex items-center gap-2 font-semibold text-white text-sm">
          {icon}
          {title}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-700/40 pt-4">{children}</div>}
    </div>
  );
}

function RiskCard({ category, severity, description, confidence }) {
  return (
    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-white">{category}</span>
        <div className="flex items-center gap-1">
          <Badge className={`text-[8px] ${SEVERITY_STYLES[severity?.toLowerCase()] || SEVERITY_STYLES.unknown}`}>
            {severity}
          </Badge>
          {confidence && (
            <span className="text-[9px] text-gray-500">{confidence} confidence</span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

export default function PersonOsintSearch() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", username: "",
    organization: "", location: "", additional_notes: "",
  });
  const [report, setReport] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [civilRightsVerified, setCivilRightsVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("personOsintSearch", form);
      return res.data;
    },
    onSuccess: (data) => setReport(data),
    onError: (err) => {
      console.error("PersonOsintSearch error:", err);
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const r = report?.report;

  const trajectoryMeta = TRAJECTORY_ICON[r?.risk_forecast?.trajectory] || TRAJECTORY_ICON.stable;
  const TrajectoryIcon = trajectoryMeta.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <User className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Person OSINT & Security Impact Analysis</h1>
          <p className="text-xs text-gray-500">
            {civilRightsVerified 
              ? "Deep analysis authorized under verified legal authority"
              : "Basic search only — legal verification required for deep analysis"}
          </p>
        </div>
        <Badge className="ml-auto bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">AI + OSINT</Badge>
      </div>

      {/* Civil Rights Gate */}
      <CivilRightsGate 
        onVerified={(method) => {
          setCivilRightsVerified(true);
          setVerificationMethod(method);
        }}
        onDeny={() => {
          setCivilRightsVerified(false);
          setVerificationMethod(null);
          setReport(null);
        }}
      />

      {/* Input Form */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          Subject Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field icon={<User className="w-3.5 h-3.5" />} label="Full Name" placeholder="John Smith" value={form.full_name} onChange={v => set("full_name", v)} />
          <Field icon={<Mail className="w-3.5 h-3.5" />} label="Email Address" placeholder="john.smith@example.com" value={form.email} onChange={v => set("email", v)} />
          <Field icon={<Phone className="w-3.5 h-3.5" />} label="Phone Number" placeholder="+1 (555) 000-0000" value={form.phone} onChange={v => set("phone", v)} />
          <Field icon={<AtSign className="w-3.5 h-3.5" />} label="Username / Handle" placeholder="@johnsmith or GitHub handle" value={form.username} onChange={v => set("username", v)} />
          <Field icon={<Building2 className="w-3.5 h-3.5" />} label="Organization" placeholder="Acme Corp" value={form.organization} onChange={v => set("organization", v)} />
          <Field icon={<MapPin className="w-3.5 h-3.5" />} label="Location" placeholder="Washington, DC" value={form.location} onChange={v => set("location", v)} />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1 font-semibold flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Additional Context
          </label>
          <textarea
            rows={2}
            value={form.additional_notes}
            onChange={e => set("additional_notes", e.target.value)}
            placeholder="Role, known associations, reason for analysis, specific concerns…"
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => searchMutation.mutate()}
              disabled={(!form.full_name && !form.email && !form.username) || searchMutation.isPending}
              className={`flex items-center gap-2 ${civilRightsVerified ? "bg-cyan-600 hover:bg-cyan-700" : "bg-slate-600 hover:bg-slate-700"}`}
            >
              {searchMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                : <><Search className="w-4 h-4" /> {civilRightsVerified ? "Run Full Analysis" : "Run Basic Search"}</>}
            </Button>
            {searchMutation.isPending && (
              <p className="text-xs text-gray-500 animate-pulse">
                {civilRightsVerified ? "Deep analysis enabled…" : "Basic search mode (limited results)…"}
              </p>
            )}
          </div>
          {searchMutation.isError && (
            <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">
                {searchMutation.error?.message?.includes("integration") || searchMutation.error?.message?.includes("limit")
                  ? "Monthly integration credits limit reached. Please upgrade your plan at base44.com to continue using AI-powered searches."
                  : searchMutation.error?.message || "Search failed. Please try again."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report */}
      {report && r && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <RiskMeter score={r.subject?.risk_score || 0} label={r.subject?.risk_label} />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">{r.subject?.name || form.full_name}</h2>
                {r.subject?.email && <p className="text-xs text-gray-500 mb-2">{r.subject.email}</p>}
                <p className="text-sm text-gray-300 leading-relaxed">{r.subject?.summary}</p>
                <div className="flex items-center gap-2 mt-3">
                  <TrajectoryIcon className={`w-4 h-4 ${trajectoryMeta.color}`} />
                  <span className="text-xs text-gray-400">
                    Risk trajectory: <span className={`font-bold ${trajectoryMeta.color}`}>{r.risk_forecast?.trajectory}</span>
                    {r.risk_forecast?.trajectory_reason && ` — ${r.risk_forecast.trajectory_reason}`}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 mt-2">
                  Analysis by {report.queried_by} · {new Date(report.queried_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Analyst Notes */}
          {r.analyst_notes && (
            <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-300 font-semibold mb-1 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Analyst Notes</p>
              <p className="text-sm text-gray-300">{r.analyst_notes}</p>
            </div>
          )}

          {/* Deep Analysis Sections (Only if Verified) */}
          {civilRightsVerified ? (
            <>
              {/* Dark Web Monitoring */}
              <DarkWebMonitor personName={r.subject?.name || form.full_name} darkWebFindings={r.dark_web_findings} />

              {/* Risk Trajectory Analysis */}
              <RiskTrajectoryAnalysis trajectoryData={r.risk_forecast} />
            </>
          ) : (
            <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-300 font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Deep Analysis Restricted
              </p>
              <p className="text-sm text-gray-300">
                Verify legal authority above to unlock dark web monitoring, risk trajectory analysis, and advanced threat assessment.
              </p>
            </div>
          )}

          {/* Digital Footprint */}
          {r.digital_footprint && (
            <Section title="Digital Footprint & Exposure" icon={<Globe2 className="w-4 h-4 text-cyan-400" />}>
              {r.digital_footprint.social_media_presence?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Social Media Presence</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {r.digital_footprint.social_media_presence.map((sm, i) => (
                      <div key={i} className="bg-slate-800/40 rounded-lg p-2 flex items-start gap-2">
                        <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/20 text-[8px] shrink-0">{sm.platform}</Badge>
                        <div>
                          <p className="text-[10px] text-cyan-400 font-semibold">{sm.likelihood}</p>
                          <p className="text-xs text-gray-400">{sm.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.digital_footprint.breach_exposure && (
                <div className="mb-4 bg-red-900/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-300 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Breach / Credential Exposure
                    <Badge className={`ml-2 text-[8px] ${SEVERITY_STYLES[r.digital_footprint.breach_exposure.risk_level?.toLowerCase()] || SEVERITY_STYLES.unknown}`}>
                      {r.digital_footprint.breach_exposure.risk_level}
                    </Badge>
                  </p>
                  <p className="text-xs text-gray-300 mb-1">{r.digital_footprint.breach_exposure.details}</p>
                  {r.digital_footprint.breach_exposure.known_breaches?.map((b, i) => (
                    <span key={i} className="inline-block text-[9px] bg-red-900/20 text-red-300 rounded px-1.5 py-0.5 mr-1 mb-1">{b}</span>
                  ))}
                </div>
              )}
              {r.digital_footprint.public_records_exposure && (
                <p className="text-xs text-gray-400 mb-2"><span className="text-gray-300 font-semibold">Public Records:</span> {r.digital_footprint.public_records_exposure}</p>
              )}
              {r.digital_footprint.dark_web_indicators && (
                <p className="text-xs text-gray-400"><span className="text-gray-300 font-semibold">Dark Web:</span> {r.digital_footprint.dark_web_indicators}</p>
              )}
            </Section>
          )}

          {/* Professional Profile */}
          {r.professional_profile && (
            <Section title="Professional Profile" icon={<Building2 className="w-4 h-4 text-purple-400" />} defaultOpen={false}>
              <p className="text-sm text-gray-300 mb-3">{r.professional_profile.inferred_background}</p>
              {r.professional_profile.known_affiliations?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {r.professional_profile.known_affiliations.map((a, i) => (
                    <Badge key={i} className="bg-purple-900/20 text-purple-300 border-purple-500/20 text-[8px]">{a}</Badge>
                  ))}
                </div>
              )}
              {r.professional_profile.public_contributions?.map((c, i) => (
                <p key={i} className="text-xs text-gray-400">▸ {c}</p>
              ))}
            </Section>
          )}

          {/* Security Risks */}
          {r.security_risks?.length > 0 && (
            <Section title={`Security Risk Assessment (${r.security_risks.length} risks)`} icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}>
              <div className="space-y-2">
                {r.security_risks.map((risk, i) => (
                  <RiskCard key={i} category={risk.category || risk.risk_category} severity={risk.severity} description={risk.description} confidence={risk.confidence} />
                ))}
              </div>
            </Section>
          )}

          {/* Threat Actor Interest */}
          {r.threat_actor_interest && (
            <Section title="Threat Actor Targeting Likelihood" icon={<Target className="w-4 h-4 text-red-400" />} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: "Nation-State", val: r.threat_actor_interest.nation_state },
                  { label: "Organized Crime", val: r.threat_actor_interest.organized_crime },
                  { label: "Hacktivism", val: r.threat_actor_interest.hacktivism },
                  { label: "Corporate Espionage", val: r.threat_actor_interest.corporate_espionage },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/40 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
                    <p className="text-sm text-gray-200">{item.val}</p>
                  </div>
                ))}
              </div>
              {r.threat_actor_interest.overall_target_attractiveness && (
                <p className="text-xs text-gray-300 bg-slate-800/30 rounded p-2">
                  <span className="text-gray-400 font-semibold">Overall attractiveness:</span> {r.threat_actor_interest.overall_target_attractiveness}
                </p>
              )}
            </Section>
          )}

          {/* Risk Forecast */}
          {r.risk_forecast && (
            <Section title="6-12 Month Risk Forecast" icon={<TrendingUp className="w-4 h-4 text-yellow-400" />}>
              {r.risk_forecast.top_scenarios?.map((s, i) => (
                <div key={i} className="mb-3 bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{s.scenario}</p>
                    <div className="flex gap-1 shrink-0">
                      <Badge className="text-[8px] bg-orange-900/20 text-orange-300 border-orange-500/20">{s.probability}</Badge>
                      <Badge className={`text-[8px] ${SEVERITY_STYLES[s.impact?.toLowerCase()] || SEVERITY_STYLES.unknown}`}>{s.impact} impact</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{s.timeframe}</p>
                </div>
              ))}
              {r.risk_forecast.early_warning_indicators?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Early Warning Indicators</p>
                  {r.risk_forecast.early_warning_indicators.map((w, i) => (
                    <p key={i} className="text-xs text-gray-300 mb-1">▸ {w}</p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Recommended Actions */}
          {r.recommended_actions && (
            <Section title="Protective Action Plan" icon={<Lock className="w-4 h-4 text-green-400" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Immediate (≤1 week)", key: "immediate", color: "red" },
                  { label: "Short-Term (1-3 months)", key: "short_term", color: "yellow" },
                  { label: "Long-Term", key: "long_term", color: "green" },
                ].map(({ label, key, color }) => (
                  <div key={key}>
                    <p className={`text-xs font-bold mb-2 ${color === "red" ? "text-red-400" : color === "yellow" ? "text-yellow-400" : "text-green-400"}`}>{label}</p>
                    <div className="space-y-1">
                      {r.recommended_actions[key]?.map((action, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className={`w-3 h-3 mt-0.5 shrink-0 ${color === "red" ? "text-red-500" : color === "yellow" ? "text-yellow-500" : "text-green-500"}`} />
                          <p className="text-xs text-gray-300">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Actionable Report Generator (Only if Verified) */}
          {civilRightsVerified && (
            <ActionableReportGenerator report={r} personName={r.subject?.name || form.full_name} />
          )}

          {/* Disclaimer */}
          <div className="bg-slate-900/30 border border-slate-700/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-600 text-center">
              This report is generated for legitimate security analysis purposes only. All findings are based on publicly available information and AI inference.
              Confidence levels are estimates. Always corroborate findings before taking action.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1 font-semibold flex items-center gap-1 text-gray-500">
        {icon} {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 placeholder:text-gray-600"
      />
    </div>
  );
}