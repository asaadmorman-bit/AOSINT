import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe2, Plus, Search, Filter, RefreshCw, Loader2,
  FileText, Zap, Shield, Pin
} from "lucide-react";
import { meetsMinTier, TIER_META } from "@/components/shared/tierCapabilities";
import BriefCard from "@/components/briefing/BriefCard";
import BriefViewer from "@/components/briefing/BriefViewer";
import GenerateBriefDialog from "@/components/briefing/GenerateBriefDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const USER_TIER = "pro"; // In production, pull from auth context

export default function BriefingEngine() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [generating, setGenerating] = useState(false);

  const queryClient = useQueryClient();
  const canAccess = meetsMinTier(USER_TIER, "community");

  const { data: briefs = [], isLoading } = useQuery({
    queryKey: ["intel_briefs"],
    queryFn: () => base44.entities.IntelBrief.list("-generated_at", 50),
    refetchInterval: 8000, // Poll for generating briefs
  });

  const handleGenerate = async (briefType) => {
    setGenerating(true);
    await base44.functions.invoke("generateBrief", { brief_type: briefType });
    queryClient.invalidateQueries({ queryKey: ["intel_briefs"] });
    setGenerating(false);
  };

  const filtered = briefs.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || b.brief_type === filterType;
    return matchSearch && matchType;
  });

  const pinned = filtered.filter(b => b.is_pinned);
  const unpinned = filtered.filter(b => !b.is_pinned);

  const stats = {
    total: briefs.length,
    ready: briefs.filter(b => b.status === "ready").length,
    generating: briefs.filter(b => b.status === "generating").length,
    pinned: briefs.filter(b => b.is_pinned).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5 text-[#00d4ff]" />
            </div>
            <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Executive Briefing Engine</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${TIER_META[USER_TIER]?.color}20`, color: TIER_META[USER_TIER]?.color }}>
              {TIER_META[USER_TIER]?.badge || USER_TIER.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-400">AI-generated strategic intelligence briefs aligned with the 2026 State of Security report</p>
        </div>
        <Button onClick={() => setShowGenerate(true)} disabled={generating}
          className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 font-semibold shrink-0">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Plus className="w-4 h-4" /> New Brief</>}
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Briefs", value: stats.total, color: "#00d4ff" },
          { label: "Ready",        value: stats.ready,      color: "#2ed573" },
          { label: "Generating",   value: stats.generating, color: "#ffa502" },
          { label: "Pinned",       value: stats.pinned,     color: "#a855f7" },
        ].map(s => (
          <div key={s.label} className="bg-[#111827] border border-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className="text-xl font-black font-mono" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs..."
            className="pl-9 bg-white/5 border-white/10 text-white h-9 text-sm" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9 text-sm w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="weekly_strategic">Weekly Strategic</SelectItem>
            <SelectItem value="daily_operational">Daily Operational</SelectItem>
            <SelectItem value="executive_protection">Executive Protection</SelectItem>
            <SelectItem value="law_enforcement">Law Enforcement</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["intel_briefs"] })}
          className="h-9 w-9 p-0 text-gray-500 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Briefs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
            <p className="text-xs text-gray-500">Loading intelligence briefs...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-dashed border-white/10 rounded-2xl p-14 text-center">
          <Globe2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-300 font-semibold mb-1">No briefs generated yet</p>
          <p className="text-gray-500 text-sm mb-5">Generate your first intelligence brief aligned with the 2026 State of Security report</p>
          <Button onClick={() => setShowGenerate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Generate First Brief
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pinned.map(b => <BriefCard key={b.id} brief={b} onOpen={setSelectedBrief} />)}
              </div>
            </div>
          )}
          <div>
            {pinned.length > 0 && (
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">All Briefs</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unpinned.map(b => <BriefCard key={b.id} brief={b} onOpen={setSelectedBrief} />)}
            </div>
          </div>
        </div>
      )}

      {/* Enterprise upgrade nudge */}
      {USER_TIER === "pro" && (
        <div className="bg-gradient-to-r from-[#a855f7]/5 to-[#00d4ff]/5 border border-[#a855f7]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Unlock Daily & EP Briefs</p>
            <p className="text-xs text-gray-400 mt-0.5">Daily Operational, Executive Protection, and Custom briefs require Enterprise tier</p>
          </div>
          <Link to={createPageUrl("Pricing")} className="shrink-0">
            <Button size="sm" className="bg-[#a855f7] text-white hover:bg-[#9333ea] gap-2 font-semibold">
              <Zap className="w-3.5 h-3.5" /> Upgrade to Enterprise
            </Button>
          </Link>
        </div>
      )}

      {/* Modals */}
      <GenerateBriefDialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        userTier={USER_TIER}
        onGenerate={handleGenerate}
      />

      {selectedBrief && (
        <BriefViewer
          brief={selectedBrief}
          onClose={() => setSelectedBrief(null)}
          onUpdate={(updated) => setSelectedBrief(updated)}
        />
      )}
    </div>
  );
}