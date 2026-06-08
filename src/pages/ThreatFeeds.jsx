import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Rss, Filter, X, CheckSquare, Square, ShieldCheck, BookOpen, Loader2 } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";
import FeedAISummary from "@/components/feeds/FeedAISummary";
import ScapStigPanel from "@/components/feeds/ScapStigPanel";
import FeedLibrary from "@/components/feeds/FeedLibrary";

const FEED_TYPES = ["cyber", "crime", "influence", "geopolitical", "supply_chain", "insider_threat", "scap_stig", "mobile_security", "vulnerability", "compliance", "ics_ot"];
const INTERVALS = ["5min", "15min", "1hr", "6hr", "12hr", "24hr"];
const CONFIDENCE_LEVELS = ["high", "medium", "low"];

const DATE_RANGES = [
  { label: "All time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

function isWithinRange(dateStr, range) {
  if (range === "all" || !dateStr) return true;
  const date = new Date(dateStr);
  const now = new Date();
  const ms = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 }[range];
  return now - date <= ms;
}

export default function ThreatFeeds() {
  const [pageTab, setPageTab] = useState("myfeeds"); // "myfeeds" | "library"
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState("manual");
  const [ingestingFeed, setIngestingFeed] = useState(null);
  const [form, setForm] = useState({ name: "", feed_type: "cyber", source_url: "", refresh_interval: "1hr", confidence_level: "medium", description: "", status: "active" });
  const queryClient = useQueryClient();

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Selection
  const [selected, setSelected] = useState(new Set());

  const { data: feeds = [], isLoading } = useQuery({
    queryKey: ["feeds"],
    queryFn: () => base44.entities.ThreatFeed.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ThreatFeed.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["feeds"] }); setShowDialog(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ThreatFeed.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feeds"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ThreatFeed.update(id, { status: status === "active" ? "inactive" : "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feeds"] }),
  });

  const resetForm = () => setForm({ name: "", feed_type: "cyber", source_url: "", refresh_interval: "1hr", confidence_level: "medium", description: "", status: "active" });

  const filteredFeeds = useMemo(() => {
    return feeds.filter(f => {
      if (filterType !== "all" && f.feed_type !== filterType) return false;
      if (filterConfidence !== "all" && f.confidence_level !== filterConfidence) return false;
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (!isWithinRange(f.created_date, filterDate)) return false;
      if (search && !f.name?.toLowerCase().includes(search.toLowerCase()) && !f.description?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [feeds, filterType, filterConfidence, filterStatus, filterDate, search]);

  const activeFilters = [filterType !== "all", filterConfidence !== "all", filterStatus !== "all", filterDate !== "all", search !== ""].filter(Boolean).length;

  const clearFilters = () => { setFilterType("all"); setFilterConfidence("all"); setFilterDate("all"); setFilterStatus("all"); setSearch(""); };

  // Bulk selection helpers
  const allFilteredIds = filteredFeeds.map(f => f.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); allFilteredIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelected(prev => new Set([...prev, ...allFilteredIds]));
    }
  };

  const bulkDelete = async () => {
    await Promise.all([...selected].map(id => base44.entities.ThreatFeed.delete(id)));
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
  };

  const bulkActivate = async () => {
    await Promise.all([...selected].map(id => base44.entities.ThreatFeed.update(id, { status: "active" })));
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
  };

  const bulkPause = async () => {
    await Promise.all([...selected].map(id => base44.entities.ThreatFeed.update(id, { status: "inactive" })));
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
  };

  const confidenceColor = { high: "text-[#2ed573]", medium: "text-yellow-400", low: "text-red-400" };

  const runIngestion = async (feedId, feedName) => {
    setIngestingFeed(feedId);
    try {
      await base44.functions.invoke('ingestFeedIOCs', { feed_id: feedId });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    } finally {
      setIngestingFeed(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button onClick={() => setPageTab("myfeeds")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${pageTab === "myfeeds" ? "bg-[#00d4ff] text-black" : "text-gray-400 hover:text-white"}`}>
            <Rss className="w-3.5 h-3.5" /> My Feeds
          </button>
          <button onClick={() => setPageTab("library")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${pageTab === "library" ? "bg-[#00d4ff] text-black" : "text-gray-400 hover:text-white"}`}>
            <BookOpen className="w-3.5 h-3.5" /> Feed Library
          </button>
        </div>
        {pageTab === "myfeeds" && (
          <Button onClick={() => setShowDialog(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
            <Plus className="w-4 h-4" /> Add Feed
          </Button>
        )}
      </div>

      {/* Feed Library Tab */}
      {pageTab === "library" && (
        <FeedLibrary existingFeeds={feeds} onSubscribe={() => queryClient.invalidateQueries({ queryKey: ["feeds"] })} />
      )}

      {pageTab === "myfeeds" && (
      <div className="space-y-5">

      {/* Filters */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <Input
            placeholder="Search feeds..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 text-white h-8 text-xs w-44"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs w-40">
              <SelectValue placeholder="Feed Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {FEED_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterConfidence} onValueChange={setFilterConfidence}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs w-40">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              {CONFIDENCE_LEVELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs w-36">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-400 hover:text-white gap-1 px-2">
              <X className="w-3 h-3" /> Clear {activeFilters > 1 ? `(${activeFilters})` : ""}
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredFeeds.length} of {feeds.length} feeds</span>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-xl px-4 py-2.5">
          <span className="text-sm text-[#00d4ff] font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="ghost" onClick={bulkActivate} className="h-7 text-xs text-[#2ed573] hover:text-[#2ed573] hover:bg-[#2ed573]/10 gap-1">
              <RefreshCw className="w-3 h-3" /> Activate All
            </Button>
            <Button size="sm" variant="ghost" onClick={bulkPause} className="h-7 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-1">
              <RefreshCw className="w-3 h-3" /> Pause All
            </Button>
            <Button size="sm" variant="ghost" onClick={bulkDelete} className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 gap-1">
              <Trash2 className="w-3 h-3" /> Delete All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="h-7 text-xs text-gray-400 hover:text-white">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Select All row */}
      {filteredFeeds.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            {allSelected ? <CheckSquare className="w-4 h-4 text-[#00d4ff]" /> : <Square className="w-4 h-4" />}
            Select all {filteredFeeds.length} feeds
          </button>
        </div>
      )}

      {/* Feed Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredFeeds.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <Rss className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{feeds.length === 0 ? "No threat feeds configured" : "No feeds match your filters"}</p>
          <p className="text-gray-600 text-xs mt-1">{feeds.length === 0 ? "Add feeds to start collecting threat intelligence" : "Try adjusting your filters"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFeeds.map(feed => (
            <div
              key={feed.id}
              className={`bg-[#111827] border rounded-xl p-5 hover:border-white/10 transition-all group relative ${selected.has(feed.id) ? "border-[#00d4ff]/40 bg-[#00d4ff]/5" : "border-white/5"}`}
            >
              {/* Checkbox */}
              <div className="absolute top-3 left-3">
                <Checkbox
                  checked={selected.has(feed.id)}
                  onCheckedChange={() => toggleSelect(feed.id)}
                  className="border-white/20 data-[state=checked]:bg-[#00d4ff] data-[state=checked]:border-[#00d4ff]"
                />
              </div>
              <div className="pl-7">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feed.name}</h3>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{feed.feed_type?.replace(/_/g, " ")}</span>
                  </div>
                  <StatusDot status={feed.status} />
                </div>
                {feed.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{feed.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
                  <span>Refresh: {feed.refresh_interval}</span>
                  <span className={confidenceColor[feed.confidence_level] || "text-gray-400"}>
                    Conf: {feed.confidence_level}
                  </span>
                  {feed.created_date && (
                    <span>{new Date(feed.created_date).toLocaleDateString()}</span>
                  )}
                </div>
                {feed.source_url && <p className="text-xs text-gray-600 font-mono truncate mb-4">{feed.source_url}</p>}
                <FeedAISummary feed={feed} />
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-3 flex-wrap">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-[#00d4ff] hover:text-[#00bfe6]"
                    onClick={() => runIngestion(feed.id, feed.name)}
                    disabled={ingestingFeed === feed.id}>
                    {ingestingFeed === feed.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Ingest IOCs
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400 hover:text-white"
                    onClick={() => toggleMutation.mutate({ id: feed.id, status: feed.status })}>
                    {feed.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300"
                    onClick={() => deleteMutation.mutate(feed.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>)}

      {/* Add Feed Dialog — always rendered so state persists */}
      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) setDialogTab("manual"); }}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Threat Feed</DialogTitle>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-2">
            <button onClick={() => setDialogTab("manual")}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all ${dialogTab === "manual" ? "bg-[#00d4ff] text-black font-semibold" : "text-gray-400 hover:text-white"}`}>
              Manual Feed
            </button>
            <button onClick={() => setDialogTab("scap")}
              className={`flex-1 text-xs py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${dialogTab === "scap" ? "bg-[#00d4ff] text-black font-semibold" : "text-gray-400 hover:text-white"}`}>
              <ShieldCheck className="w-3 h-3" /> SCAP / STIG
            </button>
          </div>

          {dialogTab === "manual" ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Feed Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. AlienVault OTX" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Feed Type</Label>
                  <Select value={form.feed_type} onValueChange={v => setForm({ ...form, feed_type: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FEED_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400">Refresh Interval</Label>
                  <Select value={form.refresh_interval} onValueChange={v => setForm({ ...form, refresh_interval: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERVALS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Source URL</Label>
                <Input value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="https://..." />
              </div>
              <div>
                <Label className="text-gray-400">Confidence Level</Label>
                <Select value={form.confidence_level} onValueChange={v => setForm({ ...form, confidence_level: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowDialog(false)} className="text-gray-400">Cancel</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
                  Add Feed
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <ScapStigPanel onAddFeed={(feedData) => {
              createMutation.mutate(feedData);
              setShowDialog(false);
              setDialogTab("manual");
            }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}