import React, { useState, useEffect } from "react";
import { Search, Trash2, Copy, BarChart3, Plus, Calendar, Filter, ArrowLeft, CheckSquare, Square, Tag, ChevronRight, FileText, X, TrendingUp, Grid, Columns, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NewScanForm from "@/components/investigations/NewScanForm";
import WatchlistMatchAlert from "@/components/investigations/WatchlistMatchAlert";
import { checkAgainstWatchlist, buildInvestigationText } from "@/components/investigations/WatchlistMatcher";

// Keyword-based local tag suggestions (fast, no API needed)
const TAG_RULES = [
  { tags: ["phishing"], keywords: ["phish", "spear", "credential", "email", "lure", "bec", "spoof"] },
  { tags: ["malware"], keywords: ["malware", "trojan", "rat", "backdoor", "payload", "loader", "dropper", "implant"] },
  { tags: ["ransomware"], keywords: ["ransomware", "ransom", "encrypt", "lockbit", "blackcat", "conti", "ryuk"] },
  { tags: ["infrastructure"], keywords: ["ip", "domain", "server", "c2", "c&c", "hosting", "vps", "cdn", "proxy", "tunnel"] },
  { tags: ["threat-actor"], keywords: ["apt", "actor", "group", "nation-state", "lazarus", "cozy bear", "fancy bear", "ta"] },
  { tags: ["vulnerability"], keywords: ["cve", "vuln", "exploit", "zero-day", "0day", "patch", "rce", "lpe", "sqli", "xss"] },
  { tags: ["osint"], keywords: ["osint", "open source", "linkedin", "twitter", "social media", "whois", "shodan", "censys"] },
  { tags: ["dark-web"], keywords: ["dark web", "darkweb", "tor", "onion", "market", "forum", "leak"] },
  { tags: ["credential-leak"], keywords: ["credential", "password", "breach", "dump", "combo", "stealer", "infostealer"] },
  { tags: ["geopolitical"], keywords: ["geopolit", "nation", "state", "government", "military", "espionage", "cyber warfare"] },
  { tags: ["network"], keywords: ["network", "port scan", "nmap", "lateral move", "pivot", "firewall", "router"] },
  { tags: ["ioc"], keywords: ["ioc", "indicator", "hash", "md5", "sha1", "sha256", "url", "ip address", "mutex"] },
];

function suggestTagsLocally(query, results) {
  const text = [
    query,
    ...(results || []).map(r => `${r.title || ""} ${r.description || ""} ${r.name || ""}`)
  ].join(" ").toLowerCase();

  const suggested = new Set();
  TAG_RULES.forEach(({ tags, keywords }) => {
    if (keywords.some(kw => text.includes(kw))) {
      tags.forEach(t => suggested.add(t));
    }
  });
  return Array.from(suggested);
}

const STORAGE_KEY = "asosint_investigations";

// Investigation List Component
const InvestigationList = ({ investigations, selectedForCompare, onSelect, onToggleCompare, onDelete, onBulkDelete }) => {
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const [selectedForBatch, setSelectedForBatch] = React.useState([]);
  const allSelected = investigations.length > 0 && selectedForBatch.length === investigations.length;
  const someSelected = selectedForBatch.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedForBatch(allSelected ? [] : investigations.map(inv => inv.id));
  };

  const toggleSelectItem = (id) => {
    setSelectedForBatch(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedForBatch.length} investigation${selectedForBatch.length !== 1 ? 's' : ''}?`)) {
      selectedForBatch.forEach(id => onDelete(id));
      setSelectedForBatch([]);
    }
  };

  return (
    <div className="space-y-3">
      {selectedForBatch.length > 0 && (
        <div className="bg-[#1f2937] border border-[#00d4ff]/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-white"><span className="font-semibold">{selectedForBatch.length}</span> selected</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedForBatch([])} className="text-gray-400 hover:text-white">
              Clear
            </Button>
            <Button size="sm" onClick={handleBulkDelete} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] border border-white/5">
        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-[#00d4ff] transition-colors shrink-0">
          {allSelected ? (
            <CheckSquare className="w-5 h-5 text-[#00d4ff]" />
          ) : someSelected ? (
            <div className="w-5 h-5 border-2 border-[#00d4ff] rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-[#00d4ff] rounded-sm" />
            </div>
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
        <p className="text-xs text-gray-400 flex-1">
          {investigations.length} investigation{investigations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {investigations.map(inv => {
        const isSelected = selectedForCompare.includes(inv.id);
        const isBatchSelected = selectedForBatch.includes(inv.id);
        const resultCount = inv.results?.length || 0;

        return (
          <div key={inv.id} className={`bg-[#111827] border transition-colors rounded-xl p-4 hover:border-white/10 group ${isBatchSelected ? 'border-[#00d4ff]/50 bg-[#1f2937]' : 'border-white/5'}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleSelectItem(inv.id)} className="mt-1 text-gray-500 hover:text-[#00d4ff] transition-colors shrink-0">
                {isBatchSelected ? <CheckSquare className="w-5 h-5 text-[#00d4ff]" /> : <Square className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0">
                <button onClick={() => onSelect(inv.id)} className="text-left w-full hover:opacity-80 transition-opacity">
                  <p className="font-semibold text-white truncate">{inv.query}</p>
                </button>

                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {formatDate(inv.createdAt)}
                  </div>
                  <Badge className="bg-white/5 text-gray-300 text-[10px] border-0">
                    {resultCount} result{resultCount !== 1 ? "s" : ""}
                  </Badge>
                  {inv.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-400">{inv.tags.join(", ")}</span>
                    </div>
                  )}
                </div>

                {inv.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{inv.notes}</p>}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="icon" variant="ghost" onClick={() => onSelect(inv.id)} className="h-8 w-8 text-gray-400 hover:text-white" title="View details">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(inv.id)} className="h-8 w-8 text-gray-400 hover:text-red-400" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Investigation Detail Component
const InvestigationDetail = ({ investigation, onBack, onUpdate, onDelete }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(investigation.notes || "");
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(investigation.tags || []);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestTags = async () => {
    setIsSuggesting(true);
    setSuggestedTags([]);

    // First, run fast local keyword matching
    const local = suggestTagsLocally(investigation.query, investigation.results);

    // Then enhance with AI via LLM
    const resultSummary = (investigation.results || [])
      .slice(0, 10)
      .map(r => r.title || r.name || r.description || "")
      .filter(Boolean)
      .join(", ");

    const prompt = `You are an OSINT/cybersecurity analyst. Given the following investigation query and result titles, suggest 3-8 short, relevant classification tags (lowercase, hyphen-separated if multi-word). Focus on threat categories, techniques, targets, or domains.

Query: "${investigation.query}"
Result titles: ${resultSummary || "none"}

Return only a JSON array of tag strings. Example: ["phishing","threat-actor","credential-leak"]`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: { tags: { type: "array", items: { type: "string" } } }
      }
    });

    const aiTags = response?.tags || [];
    const combined = Array.from(new Set([...local, ...aiTags])).filter(t => !tags.includes(t));
    setSuggestedTags(combined);
    setIsSuggesting(false);
  };

  const handleAcceptSuggestion = (tag) => {
    if (!tags.includes(tag)) {
      const updated = [...tags, tag];
      setTags(updated);
      onUpdate({ tags: updated });
    }
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleDismissSuggestion = (tag) => {
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updated = [...tags, newTag.trim()];
      setTags(updated);
      onUpdate({ tags: updated });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    const updated = tags.filter(t => t !== tag);
    setTags(updated);
    onUpdate({ tags: updated });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 text-gray-400 hover:text-white -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-black text-white mb-2">{investigation.query}</h1>
          <p className="text-gray-400 text-sm">
            Created {new Date(investigation.createdAt).toLocaleDateString()} at {new Date(investigation.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Results ({investigation.results?.length || 0})</h2>
            {investigation.results && investigation.results.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {investigation.results.map((result, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <h3 className="font-semibold text-white text-sm mb-2">{result.title || result.name || `Result ${idx + 1}`}</h3>
                    {result.description && <p className="text-xs text-gray-400 mb-2">{result.description}</p>}
                    {result.severity && (
                      <Badge className={`text-[10px] border-0 ${
                        result.severity === "critical" ? "bg-red-500/20 text-red-300" :
                        result.severity === "high" ? "bg-orange-500/20 text-orange-300" :
                        result.severity === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                        "bg-blue-500/20 text-blue-300"
                      }`}>
                        {result.severity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No results stored</p>
            )}
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h2>
              {!isEditingNotes && (
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(true)} className="text-gray-400 hover:text-white">
                  Edit
                </Button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add investigation notes..." className="bg-white/5 border-white/10 text-sm min-h-[120px]" />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => {
                    setNotes(investigation.notes || "");
                    setIsEditingNotes(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    onUpdate({ notes });
                    setIsEditingNotes(false);
                  }} className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                    Save Notes
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm whitespace-pre-wrap">{notes || "No notes yet"}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSuggestTags}
                disabled={isSuggesting}
                className="text-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 text-xs gap-1 h-7 px-2"
                title="AI-suggest tags based on query and results"
              >
                {isSuggesting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {isSuggesting ? "Analyzing..." : "Suggest"}
              </Button>
            </div>

            {suggestedTags.length > 0 && (
              <div className="mb-3 p-3 bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-lg">
                <p className="text-[10px] text-[#00d4ff] mb-2 font-semibold uppercase tracking-wider">AI Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-md px-2 py-1">
                      <span className="text-[11px] text-[#00d4ff]">{tag}</span>
                      <button onClick={() => handleAcceptSuggestion(tag)} className="text-[#00d4ff] hover:text-white transition-colors ml-1" title="Add tag">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDismissSuggestion(tag)} className="text-[#00d4ff]/50 hover:text-red-400 transition-colors" title="Dismiss">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-3">
              {tags.map(tag => (
                <div key={tag} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-300">{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleAddTag()} placeholder="Add tag..." className="text-xs bg-white/5 border-white/10" />
              <Button size="sm" onClick={handleAddTag} className="bg-white/10 text-gray-300 hover:bg-white/20 shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Details</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-gray-500">Query</p>
                <p className="text-gray-300 break-all">{investigation.query}</p>
              </div>
              <div>
                <p className="text-gray-500">Results</p>
                <p className="text-gray-300">{investigation.results?.length || 0} items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison View Component
const ComparisonView = ({ investigations, onBack }) => {
  const [viewMode, setViewMode] = useState("grid");

  const getCommonFindings = () => {
    if (investigations.length < 2) return [];
    const resultSets = investigations.map(inv => new Set((inv.results || []).map(r => JSON.stringify(r))));
    return Array.from(resultSets[0]).filter(item => resultSets.slice(1).every(set => set.has(item))).map(item => JSON.parse(item));
  };

  const getUniqueFindings = () => {
    const all = {};
    investigations.forEach((inv, idx) => {
      (inv.results || []).forEach(result => {
        const key = JSON.stringify(result);
        if (!all[key]) all[key] = [];
        all[key].push(idx);
      });
    });
    return Object.entries(all).filter(([_, indices]) => indices.length === 1);
  };

  const commonFindings = getCommonFindings();
  const uniqueFindings = getUniqueFindings();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 text-gray-400 hover:text-white -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-black text-white mb-2">Compare Investigations</h1>
          <p className="text-gray-400 text-sm">{investigations.length} investigation{investigations.length !== 1 ? "s" : ""} selected</p>
        </div>

        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-[#00d4ff] text-black" : "text-gray-400"}>
            <Grid className="w-4 h-4 mr-1" />
            Grid
          </Button>
          <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className={viewMode === "table" ? "bg-[#00d4ff] text-black" : "text-gray-400"}>
            <Columns className="w-4 h-4 mr-1" />
            Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Investigations</p>
          <p className="text-2xl font-black text-white">{investigations.length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Common Findings</p>
          <p className="text-2xl font-black text-[#00d4ff]">{commonFindings.length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Unique Findings</p>
          <p className="text-2xl font-black text-gray-300">{uniqueFindings.length}</p>
        </div>
      </div>

      {viewMode === "grid" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {investigations.map((inv, idx) => (
              <div key={inv.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
                <Badge className="bg-white/5 text-gray-300 text-[10px] border-0 mb-2">Investigation {idx + 1}</Badge>
                <h3 className="font-semibold text-white text-sm truncate mb-2">{inv.query}</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>{inv.results?.length || 0} results</p>
                  <p>{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>

          {commonFindings.length > 0 && (
            <div className="bg-[#111827] border border-[#2ed573]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#2ed573]" />
                <h2 className="text-lg font-semibold text-white">Common Findings ({commonFindings.length})</h2>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {commonFindings.map((finding, idx) => (
                  <div key={idx} className="bg-white/5 border border-[#2ed573]/20 rounded-lg p-3 hover:border-[#2ed573]/40 transition-colors">
                    <h3 className="font-semibold text-white text-sm mb-1">{finding.title || finding.name || `Finding ${idx + 1}`}</h3>
                    {finding.description && <p className="text-xs text-gray-400">{finding.description}</p>}
                    <p className="text-xs text-[#2ed573] mt-1">✓ Found in all investigations</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Main Component
export default function Investigations() {
  const [view, setView] = useState("list");
  const [investigations, setInvestigations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showScanForm, setShowScanForm] = useState(false);
  const [watchlistMatches, setWatchlistMatches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInvestigations(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investigations));
  }, [investigations]);

  const addInvestigationWithCheck = async (inv) => {
    setInvestigations(prev => [inv, ...prev]);
    const text = buildInvestigationText(inv);
    const matches = await checkAgainstWatchlist(text);
    if (matches.length > 0) setWatchlistMatches(matches);
  };

  const deleteInvestigation = (id) => {
    setInvestigations(investigations.filter(inv => inv.id !== id));
    if (selectedId === id) setSelectedId(null);
    setSelectedForCompare(selectedForCompare.filter(sid => sid !== id));
  };

  const updateInvestigation = (id, updates) => {
    setInvestigations(investigations.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const getFiltered = () => {
    let filtered = investigations;
    if (searchFilter) {
      filtered = filtered.filter(inv =>
        inv.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
        inv.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    }
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.query.localeCompare(b.query));
    }
    return filtered;
  };

  const selected = investigations.find(inv => inv.id === selectedId);
  const filtered = getFiltered();

  if (view === "detail" && selected) {
    return <InvestigationDetail investigation={selected} onBack={() => setView("list")} onUpdate={(updates) => updateInvestigation(selectedId, updates)} onDelete={() => { deleteInvestigation(selectedId); setView("list"); }} />;
  }

  if (view === "compare") {
    const toCompare = investigations.filter(inv => selectedForCompare.includes(inv.id));
    return <ComparisonView investigations={toCompare} onBack={() => { setView("list"); setSelectedForCompare([]); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0d1220] to-[#111827] border border-white/5 rounded-2xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Investigations</h1>
            <p className="text-gray-400 text-sm">Save and compare your OSINT searches to track findings over time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-black text-[#00d4ff]">{investigations.length}</p>
              <p className="text-xs text-gray-500">Total searches</p>
            </div>
            <Button onClick={() => setShowScanForm(v => !v)} className="bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/20 gap-2">
              <Search className="w-4 h-4" />
              New Scan
            </Button>
            <Link to={createPageUrl("InvestigationDashboard")}>
              <Button className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {watchlistMatches.length > 0 && (
        <WatchlistMatchAlert matches={watchlistMatches} onDismiss={() => setWatchlistMatches([])} />
      )}

      {showScanForm && (
        <NewScanForm
          onSave={async (inv) => {
            await addInvestigationWithCheck(inv);
            setShowScanForm(false);
          }}
          onCancel={() => setShowScanForm(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input placeholder="Filter by query or tags..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

          {selectedForCompare.length >= 2 && (
            <Button onClick={() => setView("compare")} className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-2">
              <BarChart3 className="w-4 h-4" />
              Compare {selectedForCompare.length}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Saved Searches</p>
          <p className="text-2xl font-black text-white">{investigations.length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Selected for Compare</p>
          <p className="text-2xl font-black text-[#00d4ff]">{selectedForCompare.length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Filtered Results</p>
          <p className="text-2xl font-black text-gray-300">{filtered.length}</p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <InvestigationList investigations={filtered} selectedForCompare={selectedForCompare} onSelect={(id) => { setSelectedId(id); setView("detail"); }} onToggleCompare={(id) => { setSelectedForCompare(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]); }} onDelete={deleteInvestigation} onBulkDelete={(ids) => { ids.forEach(id => deleteInvestigation(id)); }} />
      ) : (
        <div className="text-center py-12 bg-[#111827] border border-white/5 rounded-xl">
          <p className="text-gray-400 text-sm">
            {searchFilter ? "No investigations match your filter" : "No investigations yet. Start a search to save it here."}
          </p>
        </div>
      )}
    </div>
  );
}