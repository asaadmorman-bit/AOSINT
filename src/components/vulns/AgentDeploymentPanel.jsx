import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cpu, Smartphone, Server, Monitor, Terminal, Copy, CheckCircle2,
  Loader2, Plus, Wifi, WifiOff, Clock, Trash2, ChevronDown, ChevronUp,
  Apple, Container
} from "lucide-react";

const PLATFORM_META = {
  linux:      { icon: Terminal,   label: "Linux",      color: "text-orange-400",  bg: "bg-orange-900/10 border-orange-500/20" },
  windows:    { icon: Monitor,    label: "Windows",    color: "text-blue-400",    bg: "bg-blue-900/10 border-blue-500/20" },
  macos:      { icon: Apple,      label: "macOS",      color: "text-gray-300",    bg: "bg-gray-800/20 border-gray-600/20" },
  android:    { icon: Smartphone, label: "Android",    color: "text-green-400",   bg: "bg-green-900/10 border-green-500/20" },
  ios:        { icon: Smartphone, label: "iOS",        color: "text-cyan-400",    bg: "bg-cyan-900/10 border-cyan-500/20" },
  docker:     { icon: Container,  label: "Docker",     color: "text-sky-400",     bg: "bg-sky-900/10 border-sky-500/20" },
  kubernetes: { icon: Cpu,        label: "Kubernetes", color: "text-purple-400",  bg: "bg-purple-900/10 border-purple-500/20" },
};

const STATUS_META = {
  pending:  { color: "text-yellow-400 bg-yellow-900/20 border-yellow-500/30", label: "Pending" },
  active:   { color: "text-green-400 bg-green-900/20 border-green-500/30",   label: "Active" },
  inactive: { color: "text-gray-400 bg-gray-800/20 border-gray-600/30",      label: "Inactive" },
  error:    { color: "text-red-400 bg-red-900/20 border-red-500/30",         label: "Error" },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function AgentCard({ agent, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORM_META[agent.target_type] || PLATFORM_META.linux;
  const statusMeta = STATUS_META[agent.status] || STATUS_META.pending;
  const Icon = meta.icon;

  const lastSeen = agent.last_check_in
    ? `${Math.round((Date.now() - new Date(agent.last_check_in)) / 60000)}m ago`
    : "Never";

  return (
    <div className={`border rounded-xl overflow-hidden ${meta.bg}`}>
      <div className="flex items-center gap-3 p-3">
        <Icon className={`w-5 h-5 shrink-0 ${meta.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{agent.agent_name}</span>
            <Badge className={`text-[8px] border shrink-0 ${statusMeta.color}`}>{statusMeta.label}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-gray-500">{meta.label}</span>
            {agent.hostname && <span className="text-[10px] text-gray-600">{agent.hostname}</span>}
            {agent.ip_address && <span className="text-[10px] text-gray-600">{agent.ip_address}</span>}
            <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {lastSeen}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {agent.findings_count > 0 && (
            <span className="text-[10px] font-bold text-orange-400">{agent.findings_count} findings</span>
          )}
          <button onClick={() => setExpanded(o => !o)} className="text-gray-500 hover:text-gray-300 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(agent.id)} className="text-gray-600 hover:text-red-400 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/5 p-3 space-y-2 bg-slate-950/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-mono">Token:</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400">{agent.agent_token?.slice(0, 16)}…</span>
              <CopyButton text={agent.agent_token} />
            </div>
          </div>
          {agent.os_version && <div className="text-[10px] text-gray-500">OS: <span className="text-gray-300">{agent.os_version}</span></div>}
          {agent.asset_name && <div className="text-[10px] text-gray-500">Asset: <span className="text-gray-300">{agent.asset_name}</span></div>}
          <div className="text-[10px] text-gray-500">Scan interval: <span className="text-gray-300">{agent.scan_interval_minutes}m</span></div>
          <div className="text-[10px] text-gray-500">Deployed by: <span className="text-gray-300">{agent.deployed_by}</span></div>
        </div>
      )}
    </div>
  );
}

export default function AgentDeploymentPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ agent_name: "", target_type: "linux", scan_interval_minutes: 60, auto_scan: true });
  const [generatedScript, setGeneratedScript] = useState(null);
  const [scriptExpanded, setScriptExpanded] = useState(false);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["deployed-agents"],
    queryFn: () => base44.entities.DeployedAgent.list("-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("", 100),
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("generateAgentInstallScript", form);
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedScript(data);
      queryClient.invalidateQueries({ queryKey: ["deployed-agents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DeployedAgent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deployed-agents"] }),
  });

  const activeCount = agents.filter(a => a.status === "active").length;
  const pendingCount = agents.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-white">{agents.length}</p>
          <p className="text-[10px] text-gray-500">Total Agents</p>
        </div>
        <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-green-400">{activeCount}</p>
          <p className="text-[10px] text-gray-500">Active</p>
        </div>
        <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-yellow-400">{pendingCount}</p>
          <p className="text-[10px] text-gray-500">Awaiting Check-in</p>
        </div>
      </div>

      {/* Deploy new agent */}
      <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowForm(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white flex-1 text-left">Deploy New Agent</span>
          {showForm ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {showForm && (
          <div className="border-t border-white/5 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Agent Name</label>
                <input
                  type="text"
                  value={form.agent_name}
                  onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
                  placeholder="e.g. prod-web-server-01"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Target Platform</label>
                <select
                  value={form.target_type}
                  onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
                >
                  {Object.entries(PLATFORM_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Link to Asset (optional)</label>
                <select
                  value={form.asset_id || ""}
                  onChange={e => {
                    const asset = assets.find(a => a.id === e.target.value);
                    setForm(f => ({ ...f, asset_id: e.target.value, asset_name: asset?.name || "" }));
                  }}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">— None —</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Scan Interval (minutes)</label>
                <input
                  type="number"
                  min={5}
                  value={form.scan_interval_minutes}
                  onChange={e => setForm(f => ({ ...f, scan_interval_minutes: parseInt(e.target.value) || 60 }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <Button
              onClick={() => deployMutation.mutate()}
              disabled={deployMutation.isPending || !form.agent_name}
              className="w-full bg-cyan-700 hover:bg-cyan-600 flex items-center justify-center gap-2"
            >
              {deployMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating agent…</>
                : <><Cpu className="w-4 h-4" /> Generate Install Script</>}
            </Button>

            {/* Generated script output */}
            {generatedScript && (
              <div className="bg-slate-950 border border-cyan-500/20 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">Agent Ready</span>
                    <span className="text-[10px] text-gray-500 font-mono">{generatedScript.agent_id?.slice(0, 12)}…</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CopyButton text={generatedScript.install_script} />
                    <button onClick={() => setScriptExpanded(o => !o)} className="text-gray-500 hover:text-gray-300 text-xs">
                      {scriptExpanded ? "Hide script" : "Show script"}
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-400 mb-2">{generatedScript.instructions}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Token:</span>
                    <span className="font-mono text-cyan-400">{generatedScript.agent_token?.slice(0, 20)}…</span>
                    <CopyButton text={generatedScript.agent_token} />
                  </div>
                </div>
                {scriptExpanded && (
                  <pre className="px-4 py-3 text-[10px] text-green-300 font-mono overflow-x-auto max-h-72 bg-black/40 border-t border-white/5 whitespace-pre-wrap">
                    {generatedScript.install_script}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agent list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <Cpu className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No agents deployed yet</p>
          <p className="text-gray-600 text-sm mt-1">Generate an install script above to deploy your first agent.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest px-1">{agents.length} Deployed Agents</p>
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}