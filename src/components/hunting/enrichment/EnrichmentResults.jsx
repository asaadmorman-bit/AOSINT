import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, Target, CheckCircle2, ChevronDown,
  ChevronRight, Link2, Zap, TrendingUp, Database, Eye
} from "lucide-react";

const SEV = {
  critical: "bg-red-900/30 text-red-300 border-red-500/20",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/20",
  immediate: "bg-red-900/30 text-red-300 border-red-500/20",
  unknown: "bg-slate-700/30 text-gray-400 border-slate-600/20",
};

function Section({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition">
        <span className="text-sm font-semibold text-white flex items-center gap-2">{icon}{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-700/40 pt-3">{children}</div>}
    </div>
  );
}

function StatPill({ label, value, color }) {
  const colors = { red: "text-red-400", orange: "text-orange-400", purple: "text-purple-400", yellow: "text-yellow-400", cyan: "text-cyan-400" };
  return (
    <div className="bg-slate-800/50 rounded p-2 text-center">
      <p className={`text-2xl font-black ${colors[color]}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

export default function EnrichmentResults({ result }) {
  const { attack_vector_prediction: avp, batch_summary, results, playbooks_updated, mode } = result;
  const isBatch = mode === 'batch';

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[9px]">
            {isBatch ? `BATCH — ${result.ioc_count} IOCs` : 'SINGLE IOC'}
          </Badge>
          {avp?.urgency && (
            <Badge className={`text-[9px] ${SEV[avp.urgency] || SEV.unknown}`}>
              {avp.urgency} urgency
            </Badge>
          )}
          {playbooks_updated?.length > 0 && (
            <Badge className="bg-green-900/30 text-green-300 border-green-500/20 text-[9px]">
              {playbooks_updated.length} playbooks updated
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          <StatPill label="IOCs" value={result.ioc_count} color="cyan" />
          <StatPill label="TTPs" value={batch_summary?.total_ttps || 0} color="purple" />
          <StatPill label="Actors" value={batch_summary?.total_actors || 0} color="orange" />
          <StatPill label="Malware" value={batch_summary?.total_malware || 0} color="red" />
          <StatPill label="Playbooks" value={playbooks_updated?.length || 0} color="yellow" />
        </div>
      </div>

      {/* Attack Vector Prediction — hero section */}
      {avp && (
        <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-5">
          <h3 className="text-base font-bold text-red-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> AI Attack Vector Prediction
          </h3>
          {avp.overall_threat_narrative && (
            <p className="text-sm text-gray-200 mb-4 leading-relaxed">{avp.overall_threat_narrative}</p>
          )}

          {/* Kill chain */}
          {avp.kill_chain_sequence?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kill Chain Progression</p>
              <div className="flex flex-wrap gap-2">
                {avp.kill_chain_sequence.map((phase, i) => (
                  <div key={i} className={`rounded-lg p-2 border text-xs flex-1 min-w-32 ${
                    phase.status === 'observed' ? 'bg-red-900/30 border-red-500/30' : 'bg-slate-800/50 border-slate-700/30 opacity-70'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${phase.status === 'observed' ? 'bg-red-400' : 'bg-slate-500'}`} />
                      <span className="font-bold text-white text-[10px]">{phase.phase}</span>
                      <Badge className={`text-[8px] ml-auto ${phase.status === 'observed' ? 'bg-red-900/30 text-red-300 border-red-500/20' : 'bg-slate-700/30 text-gray-400 border-slate-600/20'}`}>
                        {phase.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-400">{phase.description}</p>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {phase.techniques?.slice(0, 3).map((t, j) => (
                        <span key={j} className="text-[8px] bg-slate-900/50 text-gray-400 rounded px-1">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {avp.predicted_next_techniques?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Predicted Next Techniques</p>
                {avp.predicted_next_techniques.map((t, i) => (
                  <p key={i} className="text-xs text-gray-300 mb-1">▸ {t}</p>
                ))}
              </div>
            )}
            {avp.target_assets_at_risk?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Assets at Risk</p>
                {avp.target_assets_at_risk.map((a, i) => (
                  <p key={i} className="text-xs text-gray-300 mb-1">▸ {a}</p>
                ))}
              </div>
            )}
          </div>

          {avp.predicted_timeline && (
            <p className="text-xs text-gray-400 mt-3">
              <span className="font-bold text-yellow-400">Timeline:</span> {avp.predicted_timeline}
              {avp.confidence && <span className="ml-3 text-gray-500">Confidence: {avp.confidence}</span>}
            </p>
          )}
        </div>
      )}

      {/* Detection Queries */}
      {avp?.detection_queries?.length > 0 && (
        <Section title={`Detection Queries (${avp.detection_queries.length})`} icon={<Eye className="w-4 h-4 text-cyan-400" />}>
          <div className="space-y-3">
            {avp.detection_queries.map((q, i) => (
              <div key={i} className="bg-slate-800/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/20 text-[8px]">{q.platform}</Badge>
                  <p className="text-xs text-gray-400">{q.description}</p>
                </div>
                <pre className="text-xs text-cyan-300 font-mono bg-slate-900/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">{q.query}</pre>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Defensive Actions */}
      {avp?.defensive_actions?.length > 0 && (
        <Section title="Recommended Defensive Actions" icon={<Shield className="w-4 h-4 text-green-400" />} defaultOpen={false}>
          <div className="space-y-1">
            {avp.defensive_actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">{a}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Confirmation Indicators */}
      {avp?.confirmation_indicators?.length > 0 && (
        <Section title="Confirmation Indicators to Watch" icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />} defaultOpen={false}>
          {avp.confirmation_indicators.map((c, i) => (
            <p key={i} className="text-xs text-gray-300 mb-1">▸ {c}</p>
          ))}
        </Section>
      )}

      {/* Per-IOC results (batch) */}
      {results?.length > 0 && (
        <Section title={`Per-IOC Enrichment Details (${results.length})`} icon={<Database className="w-4 h-4 text-purple-400" />} defaultOpen={!isBatch}>
          <div className="space-y-3">
            {results.map((r, i) => (
              <IOCResultRow key={i} result={r} />
            ))}
          </div>
        </Section>
      )}

      {/* Correlated TTPs across batch */}
      {batch_summary?.all_ttps?.length > 0 && (
        <Section title={`Correlated TTPs Across All IOCs (${batch_summary.all_ttps.length})`} icon={<Target className="w-4 h-4 text-purple-400" />} defaultOpen={false}>
          <div className="flex flex-wrap gap-1">
            {batch_summary.all_ttps.map((ttp, i) => (
              <Badge key={i} className="bg-purple-900/30 text-purple-300 border-purple-500/20 text-[8px]">{ttp}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Updated playbooks */}
      {playbooks_updated?.length > 0 && (
        <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Playbooks Auto-Updated with Enriched Context
          </h4>
          {playbooks_updated.map((pb, i) => (
            <p key={i} className="text-xs text-gray-300">▸ <span className="text-green-300">{pb.name}</span> — trigger_conditions, input_schema, and attack predictions updated</p>
          ))}
        </div>
      )}
    </div>
  );
}

function IOCResultRow({ result }) {
  const [open, setOpen] = useState(false);
  const e = result.enrichment;
  const SEV_C = { critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-blue-400" };

  return (
    <div className="bg-slate-800/40 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-800/60 transition">
        <Badge className="bg-slate-700/30 text-gray-400 border-slate-600/20 text-[8px] shrink-0">{result.ioc_type}</Badge>
        <span className="text-xs text-gray-200 font-mono truncate flex-1">{result.ioc}</span>
        <span className={`text-xs font-bold shrink-0 ${SEV_C[e?.severity] || 'text-gray-400'}`}>{e?.severity}</span>
        <span className="text-[10px] text-gray-500 shrink-0">{e?.confidence_score}%</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-slate-700/30 pt-2 space-y-2">
          {e?.summary && <p className="text-xs text-gray-300">{e.summary}</p>}
          <div className="flex flex-wrap gap-1">
            {e?.malware_families?.map((m, i) => <Badge key={i} className="bg-red-900/20 text-red-300 border-red-500/20 text-[8px]">{m}</Badge>)}
            {e?.threat_actors?.map((a, i) => <Badge key={i} className="bg-orange-900/20 text-orange-300 border-orange-500/20 text-[8px]">{a}</Badge>)}
            {e?.mitre_ttps?.slice(0, 5).map((t, i) => <Badge key={i} className="bg-purple-900/20 text-purple-300 border-purple-500/20 text-[8px]">{t}</Badge>)}
            {e?.cves?.map((c, i) => <Badge key={i} className="bg-yellow-900/20 text-yellow-300 border-yellow-500/20 text-[8px]">{c}</Badge>)}
          </div>
          {e?.hunting_steps?.slice(0, 3).map((s, i) => (
            <p key={i} className="text-[10px] text-gray-400">▸ {s}</p>
          ))}
        </div>
      )}
    </div>
  );
}