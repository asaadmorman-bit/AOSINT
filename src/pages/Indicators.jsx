import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, Trash2, ChevronRight } from "lucide-react";
import SeverityBadge from "@/components/shared/SeverityBadge";
import StatusDot from "@/components/shared/StatusDot";
import AMANIPanel from "@/components/agents/AMANIPanel";

const INDICATOR_TYPES = ["ip_address", "domain", "hash", "email", "url", "cve", "ttps", "actor", "campaign", "physical_location", "person_of_interest"];
const CATEGORIES = ["cyber", "crime", "influence", "geopolitical", "supply_chain", "insider_threat"];
const SEVERITIES = ["critical", "high", "medium", "low", "informational"];

export default function Indicators() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    title: "", indicator_type: "ip_address", value: "", threat_category: "cyber",
    severity: "medium", confidence: 50, tags: [], notes: "", status: "active"
  });

  const queryClient = useQueryClient();

  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ["indicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThreatIndicator.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["indicators"] }); setShowDialog(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ThreatIndicator.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["indicators"] }),
  });

  const filtered = indicators.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.value?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "all" || i.severity === filterSeverity;
    const matchType = filterType === "all" || i.indicator_type === filterType;
    return matchSearch && matchSeverity && matchType;
  });

  return (
    <div className="space-y-6">
      {/* AMANI Panel for selected indicator */}
      {selectedIndicator && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Indicator</p>
              <p className="text-sm font-semibold text-white">{selectedIndicator.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400">{selectedIndicator.indicator_type?.replace(/_/g, " ")}</span>
                <span className="text-gray-600">·</span>
                <span className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]">{selectedIndicator.value}</span>
              </div>
            </div>
            <button onClick={() => setSelectedIndicator(null)} className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors">
              Clear
            </button>
          </div>
          <AMANIPanel context={selectedIndicator} contextType="indicator" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-400">Track and manage threat indicators across all domains</p>
        <Button onClick={() => setShowDialog(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Add Indicator
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search indicators..." className="pl-9 bg-white/5 border-white/10 text-white" />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
            <Filter className="w-3 h-3 mr-2 text-gray-500" /><SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <Filter className="w-3 h-3 mr-2 text-gray-500" /><SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {INDICATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-500 text-xs">Title</TableHead>
                <TableHead className="text-gray-500 text-xs">Type</TableHead>
                <TableHead className="text-gray-500 text-xs">Value</TableHead>
                <TableHead className="text-gray-500 text-xs">Category</TableHead>
                <TableHead className="text-gray-500 text-xs">Severity</TableHead>
                <TableHead className="text-gray-500 text-xs">Status</TableHead>
                <TableHead className="text-gray-500 text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    {isLoading ? "Loading..." : "No indicators found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(ind => (
                <TableRow
                  key={ind.id}
                  className={`border-white/5 hover:bg-white/[0.02] cursor-pointer ${selectedIndicator?.id === ind.id ? "bg-[#00d4ff]/5" : ""}`}
                  onClick={() => setSelectedIndicator(selectedIndicator?.id === ind.id ? null : ind)}
                >
                  <TableCell className="text-sm text-gray-200 font-medium">
                    <div className="flex items-center gap-1.5">
                      {selectedIndicator?.id === ind.id && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shrink-0" />}
                      {ind.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{ind.indicator_type?.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-xs text-gray-400 font-mono max-w-[200px] truncate">{ind.value}</TableCell>
                  <TableCell className="text-xs text-gray-400 capitalize">{ind.threat_category?.replace(/_/g, " ")}</TableCell>
                  <TableCell><SeverityBadge severity={ind.severity} /></TableCell>
                  <TableCell><StatusDot status={ind.status} /></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-400"
                      onClick={() => deleteMutation.mutate(ind.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Threat Indicator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label className="text-gray-400">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Type</Label>
                <Select value={form.indicator_type} onValueChange={v => setForm({ ...form, indicator_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{INDICATOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Category</Label>
                <Select value={form.threat_category} onValueChange={v => setForm({ ...form, threat_category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Value</Label>
              <Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. 192.168.1.1 or CVE-2026-xxxx" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Confidence (0-100)</Label>
                <Input type="number" min={0} max={100} value={form.confidence} onChange={e => setForm({ ...form, confidence: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.value} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              Add Indicator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}