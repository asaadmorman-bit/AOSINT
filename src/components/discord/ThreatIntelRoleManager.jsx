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
import { Plus, Trash2, Users } from "lucide-react";

const THREAT_CATEGORIES = [
  { id: "critical_threat", label: "Critical Threats" },
  { id: "active_campaign", label: "Active Campaigns" },
  { id: "zero_day", label: "Zero Days" },
  { id: "breach", label: "Data Breaches" },
  { id: "malware", label: "Malware Alerts" },
];

export default function ThreatIntelRoleManager() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    server_id: "",
    role_id: "",
    role_name: "",
    threat_categories: [],
    severity_threshold: "high",
  });
  const queryClient = useQueryClient();

  const { data: roleMappings = [] } = useQuery({
    queryKey: ["discord_threat_roles"],
    queryFn: () => base44.entities.DiscordThreatRoleMapping?.list?.() || [],
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["discord_servers"],
    queryFn: () => base44.entities.DiscordThreatServer.list(),
  });

  const createMappingMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscordThreatRoleMapping.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discord_threat_roles"] });
      setShowNew(false);
      setForm({
        server_id: "",
        role_id: "",
        role_name: "",
        threat_categories: [],
        severity_threshold: "high",
      });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (id) => base44.entities.DiscordThreatRoleMapping.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discord_threat_roles"] }),
  });

  const handleCategoryToggle = (category) => {
    setForm({
      ...form,
      threat_categories: form.threat_categories.includes(category)
        ? form.threat_categories.filter(c => c !== category)
        : [...form.threat_categories, category],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Role-Based Threat Intelligence</h2>
          <p className="text-sm text-gray-400 mt-1">Automatically assign Discord roles based on threat intel access</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2 bg-[#00d4ff] text-black">
          <Plus className="w-4 h-4" /> New Role Mapping
        </Button>
      </div>

      {roleMappings.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No role mappings configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roleMappings.map((mapping) => (
            <div key={mapping.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00d4ff]" />
                    {mapping.role_name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {servers.find(s => s.id === mapping.server_id)?.name} • Threshold: {mapping.severity_threshold}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMappingMutation.mutate(mapping.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {mapping.threat_categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/20"
                  >
                    {THREAT_CATEGORIES.find(c => c.id === cat)?.label || cat}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Role Mapping Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[#111827] border border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Role Mapping</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Server */}
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

            {/* Role Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 text-xs">Role ID</Label>
                <Input
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  placeholder="e.g., 1234567890"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-400 text-xs">Role Name (Display)</Label>
                <Input
                  value={form.role_name}
                  onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                  placeholder="e.g., Threat Analysts"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            {/* Threat Categories */}
            <div>
              <Label className="text-gray-400 text-xs mb-3 block">Grant Access to Threat Types</Label>
              <div className="space-y-2">
                {THREAT_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.threat_categories.includes(cat.id)}
                      onCheckedChange={() => handleCategoryToggle(cat.id)}
                      className="border-white/20"
                    />
                    <label className="text-sm text-gray-300 cursor-pointer">{cat.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Threshold */}
            <div>
              <Label className="text-gray-400 text-xs">Minimum Severity to Assign Role</Label>
              <Select value={form.severity_threshold} onValueChange={(v) => setForm({ ...form, severity_threshold: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="high">High & Critical</SelectItem>
                  <SelectItem value="medium">Medium & Above</SelectItem>
                  <SelectItem value="all">All Severities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              onClick={() => createMappingMutation.mutate(form)}
              disabled={!form.server_id || !form.role_id || form.threat_categories.length === 0 || createMappingMutation.isPending}
              className="bg-[#00d4ff] text-black"
            >
              {createMappingMutation.isPending ? "Creating..." : "Create Mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}