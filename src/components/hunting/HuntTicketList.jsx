import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Crosshair, Search, AlertTriangle, Brain, Zap, Shield, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const HUNT_TYPE_META = {
  anomalous_pattern: { label: "Anomaly", color: "#ffa502", icon: Zap },
  ttp_precursor: { label: "TTP Precursor", color: "#a855f7", icon: Brain },
  missed_ioc: { label: "Missed IOC", color: "#00d4ff", icon: Search },
  behavioral_drift: { label: "Behavioral Drift", color: "#ff6b35", icon: AlertTriangle },
  lateral_movement: { label: "Lateral Movement", color: "#ff4757", icon: Crosshair },
  data_staging: { label: "Data Staging", color: "#ffd700", icon: Shield },
  c2_beacon: { label: "C2 Beacon", color: "#ff4757", icon: AlertTriangle },
};

const SEVERITY_COLORS = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#00d4ff",
  low: "#6b7280",
};

export default function HuntTicketList({ tickets, isLoading, selectedTicket, onSelect }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchSeverity = severityFilter === "all" || t.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="pl-8 bg-white/5 border-white/10 text-white text-xs h-8"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-7 flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-7 flex-1">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket count */}
      <p className="text-[10px] text-gray-600">{filtered.length} tickets</p>

      {/* List */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
            <Crosshair className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-xs">No tickets yet — run a hunt scan to surface threats</p>
          </div>
        ) : filtered.map(ticket => {
          const meta = HUNT_TYPE_META[ticket.hunt_type] || { label: ticket.hunt_type, color: "#6b7280", icon: Crosshair };
          const Icon = meta.icon;
          const isSelected = selectedTicket?.id === ticket.id;
          const sevColor = SEVERITY_COLORS[ticket.severity] || "#6b7280";

          return (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                isSelected ? "border-white/20" : "border-white/5 bg-[#111827] hover:border-white/10"
              }`}
              style={isSelected ? { borderColor: `${meta.color}40`, background: `${meta.color}06` } : {}}
            >
              {/* Top row */}
              <div className="flex items-start gap-2 mb-2">
                <div className="p-1.5 rounded-md shrink-0 mt-0.5" style={{ background: `${meta.color}15` }}>
                  <Icon className="w-3 h-3" style={{ color: meta.color }} />
                </div>
                <p className="text-xs font-medium text-white leading-snug flex-1">{ticket.title}</p>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${sevColor}15`, color: sevColor }}
                >
                  {ticket.severity?.toUpperCase()}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">
                  {meta.label}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ml-auto ${
                  ticket.status === "open" ? "bg-[#ffa502]/10 text-[#ffa502]" :
                  ticket.status === "investigating" ? "bg-[#00d4ff]/10 text-[#00d4ff]" :
                  ticket.status === "confirmed" ? "bg-[#ff4757]/10 text-[#ff4757]" :
                  ticket.status === "resolved" ? "bg-[#2ed573]/10 text-[#2ed573]" :
                  "bg-white/5 text-gray-500"
                }`}>
                  {ticket.status}
                </span>
              </div>
              {/* Confidence & time */}
              <div className="flex items-center gap-2 mt-2">
                {ticket.confidence && (
                  <div className="flex items-center gap-1 flex-1">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${ticket.confidence}%`, background: meta.color }} />
                    </div>
                    <span className="text-[9px] text-gray-500">{ticket.confidence}%</span>
                  </div>
                )}
                {ticket.created_date && (
                  <span className="text-[9px] text-gray-600 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(ticket.created_date), { addSuffix: true })}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}