import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Filter, Globe, Shield, Megaphone, MapPin, Link2 } from "lucide-react";
import { format } from "date-fns";

const DOMAIN_META = {
  cyber:         { color: "#00d4ff", icon: Shield,   label: "Cyber" },
  physical:      { color: "#ffa502", icon: MapPin,   label: "Physical" },
  influence:     { color: "#a855f7", icon: Megaphone, label: "Influence" },
  geopolitical:  { color: "#f59e0b", icon: Globe,    label: "Geopolitical" },
  hybrid:        { color: "#ff6b35", icon: Link2,    label: "Hybrid" },
};
const SEVERITY_COLORS = { critical: "#ff4757", high: "#ffa502", medium: "#00d4ff", low: "#6b7280", informational: "#374151" };

export default function ThreatTimeline({ events, userTier }) {
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", event_type: "cyber_incident", domain: "cyber", severity: "medium", occurred_at: "", region: "", description: "" });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimelineEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeline_events"] });
      setShowCreate(false);
    },
  });

  const filtered = events.filter(e => {
    const matchDomain = filterDomain === "all" || e.domain === filterDomain;
    const matchSeverity = filterSeverity === "all" || e.severity === filterSeverity;
    return matchDomain && matchSeverity;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.occurred_at || b.created_date) - new Date(a.occurred_at || a.created_date));

  // Group by month
  const grouped = sorted.reduce((acc, event) => {
    const date = event.occurred_at || event.created_date;
    const key = date ? format(new Date(date), "MMMM yyyy") : "Unknown Date";
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-40">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {Object.entries(DOMAIN_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {Object.keys(SEVERITY_COLORS).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm"
          className="bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20 hover:bg-[#ff6b35]/20 gap-1.5 h-9">
          <Plus className="w-3.5 h-3.5" /> Add Event
        </Button>
      </div>

      {/* Domain legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(DOMAIN_META).map(([key, meta]) => {
          const count = events.filter(e => e.domain === key).length;
          return (
            <button key={key} onClick={() => setFilterDomain(filterDomain === key ? "all" : key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all ${
                filterDomain === key ? "opacity-100" : "opacity-50 hover:opacity-75"
              }`}
              style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
              <meta.icon className="w-2.5 h-2.5" />{meta.label} ({count})
            </button>
          );
        })}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-10 text-center">
          <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No timeline events yet</p>
          <p className="text-gray-600 text-xs mt-1">Add cross-domain events to build the threat timeline</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">{month}</p>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] text-gray-600">{monthEvents.length} events</span>
              </div>

              <div className="relative pl-5 space-y-2">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/5" />
                {monthEvents.map(event => {
                  const domainMeta = DOMAIN_META[event.domain] || DOMAIN_META.cyber;
                  const sevColor = SEVERITY_COLORS[event.severity] || "#6b7280";
                  const DomainIcon = domainMeta.icon;

                  return (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-5 top-3.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: domainMeta.color, boxShadow: `0 0 6px ${domainMeta.color}60` }} />
                      <div className="bg-black/20 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${domainMeta.color}15` }}>
                            <DomainIcon className="w-3.5 h-3.5" style={{ color: domainMeta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${domainMeta.color}20`, color: domainMeta.color }}>
                                {domainMeta.label}
                              </span>
                              <span className="text-[9px] font-semibold" style={{ color: sevColor }}>
                                {event.severity?.toUpperCase()}
                              </span>
                              {event.region && (
                                <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                  <MapPin className="w-2 h-2" />{event.region}
                                </span>
                              )}
                              {event.convergence_indicator && (
                                <span className="text-[9px] text-[#ff6b35] bg-[#ff6b35]/10 px-1.5 py-0.5 rounded font-bold">CONVERGENCE</span>
                              )}
                              {event.fragmentation_indicator && (
                                <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/10 px-1.5 py-0.5 rounded font-bold">FRAGMENTATION</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-white">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{event.description}</p>
                            )}
                            {event.occurred_at && (
                              <p className="text-[9px] text-gray-600 mt-1.5 font-mono">
                                {format(new Date(event.occurred_at), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#ff6b35]" />Add Timeline Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-gray-500">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">Domain</Label>
                <Select value={form.domain} onValueChange={v => setForm({ ...form, domain: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOMAIN_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">Event Type</Label>
                <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cyber_incident">Cyber Incident</SelectItem>
                    <SelectItem value="physical_event">Physical Event</SelectItem>
                    <SelectItem value="influence_campaign">Influence Campaign</SelectItem>
                    <SelectItem value="geopolitical">Geopolitical</SelectItem>
                    <SelectItem value="ransomware">Ransomware</SelectItem>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="sector_disruption">Sector Disruption</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Region</Label>
                <Input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1 text-xs" placeholder="Eastern Europe..." />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Date/Time</Label>
              <Input type="datetime-local" value={form.occurred_at}
                onChange={e => setForm({ ...form, occurred_at: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending}
              className="bg-[#ff6b35] text-white hover:bg-[#e85e2a]">
              {createMutation.isPending ? "Adding..." : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}