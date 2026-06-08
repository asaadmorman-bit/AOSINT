import React, { useState } from "react";
// Assets.js - full import
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Monitor, Building, Wifi, Server, Trash2, RefreshCw, TrendingUp, Radar } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";
import AssetDiscoveryModule from "@/components/assets/AssetDiscoveryModule";

const ASSET_TYPES = ["server", "endpoint", "network_device", "cloud_service", "application", "database", "iot_device", "physical_facility", "personnel", "vehicle", "communication_system"];
const DOMAINS = ["digital", "physical", "hybrid"];
const CRITICALITY = ["critical", "high", "medium", "low"];

const domainColors = {
  digital: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  physical: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  hybrid: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const criticalityColors = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const domainIcons = { digital: Monitor, physical: Building, hybrid: Wifi };

export default function Assets() {
  const [showDialog, setShowDialog] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [filterDomain, setFilterDomain] = useState("all");
  const [sortBy, setSortBy] = useState("risk_score"); // risk_score | created_date | criticality
  const [rescoring, setRescoring] = useState(false);
  const [form, setForm] = useState({
    name: "", asset_type: "server", domain: "digital", criticality: "medium",
    owner: "", location: "", ip_address: "", os_platform: "", notes: ""
  });

  const queryClient = useQueryClient();

  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ["assets"],
    queryFn: () => base44.entities.Asset.list("-risk_score", 300),
  });

  const handleRescore = async () => {
    setRescoring(true);
    try {
      await base44.functions.invoke("calculateAssetRiskScore", {});
      await refetch();
    } finally {
      setRescoring(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["assets"] }); setShowDialog(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });

  const critOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const filtered = (filterDomain === "all" ? assets : assets.filter(a => a.domain === filterDomain))
    .slice()
    .sort((a, b) => {
      if (sortBy === "risk_score") return (b.risk_score ?? 0) - (a.risk_score ?? 0);
      if (sortBy === "criticality") return (critOrder[a.criticality] ?? 2) - (critOrder[b.criticality] ?? 2);
      return 0; // created_date already sorted from API
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Inventory of physical and digital assets to assess</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRescore}
            disabled={rescoring}
            className="border-white/10 text-gray-300 hover:text-white gap-2 text-xs"
          >
            {rescoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            {rescoring ? "Rescoring..." : "Recalculate Risk"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDiscovery(v => !v)}
            className="border-[#00d4ff]/30 text-[#00d4ff] hover:bg-[#00d4ff]/10 gap-2 text-xs"
          >
            <Radar className="w-3.5 h-3.5" /> {showDiscovery ? "Hide" : "Auto-Discover"}
          </Button>
          <Button onClick={() => setShowDialog(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Asset Discovery Module */}
      {showDiscovery && (
        <div className="border border-[#00d4ff]/15 rounded-xl p-1">
          <AssetDiscoveryModule />
        </div>
      )}

      {/* Domain Tabs + Sort */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {["all", ...DOMAINS].map(d => (
            <button key={d} onClick={() => setFilterDomain(d)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterDomain === d ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20" : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}>
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span>Sort:</span>
          {[["risk_score","Risk Score"],["criticality","Criticality"],["created_date","Date Added"]].map(([val, label]) => (
            <button key={val} onClick={() => setSortBy(val)}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                sortBy === val ? "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20" : "text-gray-500 border-white/5 hover:text-gray-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <Server className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No assets registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(asset => {
            const DomainIcon = domainIcons[asset.domain] || Monitor;
            return (
              <div key={asset.id} className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <DomainIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{asset.asset_type?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${criticalityColors[asset.criticality]}`}>
                    {asset.criticality}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className={`text-[10px] ${domainColors[asset.domain]}`}>{asset.domain}</Badge>
                  <StatusDot status={asset.compliance_status} />
                  {asset.risk_score != null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      asset.risk_score >= 75 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      asset.risk_score >= 50 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      asset.risk_score >= 25 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}>
                      Risk {asset.risk_score}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  {asset.owner && <div>Owner: <span className="text-gray-300">{asset.owner}</span></div>}
                  {asset.location && <div>Location: <span className="text-gray-300">{asset.location}</span></div>}
                  {asset.ip_address && <div>IP: <span className="text-gray-300 font-mono">{asset.ip_address}</span></div>}
                  {asset.risk_score != null && <div>Vulns: <span className="text-gray-300">{asset.vulnerabilities_count ?? 0} open</span></div>}
                </div>

                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(asset.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label className="text-gray-400">Asset Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Type</Label>
                <Select value={form.asset_type} onValueChange={v => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Domain</Label>
                <Select value={form.domain} onValueChange={v => setForm({ ...form, domain: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Criticality</Label>
                <Select value={form.criticality} onValueChange={v => setForm({ ...form, criticality: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CRITICALITY.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Owner</Label>
                <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">IP Address</Label>
                <Input value={form.ip_address} onChange={e => setForm({ ...form, ip_address: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-400">Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}