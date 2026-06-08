import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const THREAT_TYPES = [
  { id: "credential_leak", label: "Credential Leaks" },
  { id: "domain_compromise", label: "Domain Compromise" },
  { id: "malware", label: "Malware" },
  { id: "ransomware", label: "Ransomware" },
  { id: "vulnerability", label: "Vulnerabilities" },
  { id: "threat_actor", label: "Threat Actor Activity" },
  { id: "dark_web", label: "Dark Web Mentions" },
];

const SEVERITY_LEVELS = ["critical", "high", "medium", "low"];

export default function ThreatAlertConfigurator() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    server_id: "",
    channel_id: "",
    threat_types: [],
    severity_filter: [],
    mention_roles: [],
    auto_create_thread: false,
    thread_archive_hours: 24,
  });
  const queryClient = useQueryClient();

  const { data: configs = [] } = useQuery({
    queryKey: ["discord_threat_alerts"],
    queryFn: () => base44.entities.DiscordThreatAlertConfig?.list?.() || [],
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["discord_servers"],
    queryFn: () => base44.entities.DiscordThreatServer.list(),
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscordThreatAlertConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discord_threat_alerts"] });
      setShowNew(false);
      setForm({
        server_id: "",
        channel_id: "",
        threat_types: [],
        severity_filter: [],
        mention_roles: [],
        auto_create_thread: false,
        thread_archive_hours: 24,
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id) => base44.entities.DiscordThreatAlertConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discord_threat_alerts"] }),
  });

  const handleThreatTypeToggle = (threatType) => {
    setForm({
      ...form,
      threat_types: form.threat_types.includes(threatType)
        ? form.threat_types.filter(t => t !== threatType)
        : [...form.threat_types, threatType],
    });
  };

  const handleSeverityToggle = (severity) => {
    setForm({
      ...form,
      severity_filter: form.severity_filter.includes(severity)
        ? form.severity_filter.filter(s => s !== severity)
        : [...form.severity_filter, severity],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Threat Alert Rules</h2>
          <p className="text-sm text-gray-400 mt-1">Configure automated alerts for specific threats in Discord channels</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2 bg-[#00d4ff] text-black">
          <Plus className="w-4 h-4" /> New Alert Rule
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No alert rules configured yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div key={config.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {servers.find(s => s.id === config.server_id)?.name || "Unknown Server"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    #{config.channel_id || "general"} • {config.threat_types.length} threat types
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteConfigMutation.mutate(config.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {config.threat_types.map((type) => (
                    <Badge key={type} variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/20">
                      {THREAT_TYPES.find(t => t.id === type)?.label || type}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {config.severity_filter.map((severity) => {
                    const colors = {
                      critical: "bg-red-500/10 text-red-300 border-red-500/20",
                      high: "bg-orange-500/10 text-orange-300 border-orange-500/20",
                      medium: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
                      low: "bg-green-500/10 text-green-300 border-green-500/20",
                    };
                    return (
                      <Badge key={severity} variant="outline" className={`text-[10px] ${colors[severity] || ""}`}>
                        {severity}
                      </Badge>
                    );
                  })}
                </div>

                {config.auto_create_thread && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-400" /> Auto-creates threads (archives in {config.thread_archive_hours}h)
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Alert Rule Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[#111827] border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Threat Alert Rule</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Server & Channel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 text-xs">Server</Label>
                <Select value={form.server_id} onValueChange={(v) => setForm({ ...form, server_id: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-400 text-xs">Channel ID</Label>
                <Input
                  value={form.channel_id}
                  onChange={(e) => setForm({ ...form, channel_id: e.target.value })}
                  placeholder="e.g., 1234567890"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            {/* Threat Types */}
            <div>
              <Label className="text-gray-400 text-xs mb-3 block">Threat Types to Monitor</Label>
              <div className="grid grid-cols-2 gap-2">
                {THREAT_TYPES.map((type) => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.threat_types.includes(type.id)}
                      onCheckedChange={() => handleThreatTypeToggle(type.id)}
                      className="border-white/20"
                    />
                    <label className="text-sm text-gray-300 cursor-pointer">{type.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <Label className="text-gray-400 text-xs mb-3 block">Severity Levels</Label>
              <div className="flex gap-2 flex-wrap">
                {SEVERITY_LEVELS.map((severity) => (
                  <Button
                    key={severity}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSeverityToggle(severity)}
                    className={`text-xs capitalize ${
                      form.severity_filter.includes(severity)
                        ? "bg-[#00d4ff]/20 border-[#00d4ff] text-[#00d4ff]"
                        : "border-white/10 text-gray-400"
                    }`}
                  >
                    {severity}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-thread */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Checkbox
                checked={form.auto_create_thread}
                onCheckedChange={(v) => setForm({ ...form, auto_create_thread: v })}
                className="border-white/20"
              />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Auto-create Discussion Threads</p>
                <p className="text-xs text-gray-400">Start a thread for each alert to organize team response</p>
              </div>
            </div>

            {form.auto_create_thread && (
              <div>
                <Label className="text-gray-400 text-xs">Thread Archive Time (hours)</Label>
                <Input
                  type="number"
                  value={form.thread_archive_hours}
                  onChange={(e) => setForm({ ...form, thread_archive_hours: parseInt(e.target.value) })}
                  min="1"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              onClick={() => createConfigMutation.mutate(form)}
              disabled={!form.server_id || !form.channel_id || form.threat_types.length === 0 || createConfigMutation.isPending}
              className="bg-[#00d4ff] text-black"
            >
              {createConfigMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}