import React, { useState, useEffect } from "react";
import { Plus, Trash2, Bell, Shield, Tag, Search, Filter, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["domain", "ip", "actor", "hash", "campaign", "custom"];

const CATEGORY_STYLES = {
  domain:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ip:       "bg-purple-500/20 text-purple-300 border-purple-500/30",
  actor:    "bg-red-500/20 text-red-300 border-red-500/30",
  hash:     "bg-gray-500/20 text-gray-300 border-gray-500/30",
  campaign: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  custom:   "bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30",
};

export default function WatchlistConfig() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("custom");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setLoading(true);
    const data = await base44.entities.WatchlistKeyword.list("-created_date");
    setKeywords(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newKeyword.trim()) return;
    setSaving(true);
    const created = await base44.entities.WatchlistKeyword.create({
      keyword: newKeyword.trim(),
      category: newCategory,
      description: newDescription.trim() || undefined,
      is_active: true,
      created_by: user?.email,
    });
    setKeywords(prev => [created, ...prev]);
    setNewKeyword("");
    setNewDescription("");
    setNewCategory("custom");
    setSaving(false);
  };

  const handleToggle = async (kw) => {
    const updated = await base44.entities.WatchlistKeyword.update(kw.id, { is_active: !kw.is_active });
    setKeywords(prev => prev.map(k => k.id === kw.id ? updated : k));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this keyword from the watchlist?")) return;
    await base44.entities.WatchlistKeyword.delete(id);
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const filtered = keywords.filter(kw => {
    const matchText = !filterText || kw.keyword.toLowerCase().includes(filterText.toLowerCase()) || (kw.description || "").toLowerCase().includes(filterText.toLowerCase());
    const matchCat = filterCategory === "all" || kw.category === filterCategory;
    return matchText && matchCat;
  });

  const activeCount = keywords.filter(k => k.is_active).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1220] to-[#111827] border border-white/5 rounded-2xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-6 h-6 text-[#ffa502]" />
              <h1 className="text-3xl font-black text-white">Watchlist Keywords</h1>
            </div>
            <p className="text-gray-400 text-sm">
              Define keywords (domains, actor names, IPs, hashes) to automatically match against new investigations and API scans.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-[#ffa502]">{activeCount}</p>
            <p className="text-xs text-gray-500">Active keywords</p>
          </div>
        </div>
      </div>

      {/* Add new keyword */}
      <div className="bg-[#111827] border border-[#ffa502]/20 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#ffa502]" />
          Add Keyword
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !saving && handleAdd()}
            placeholder="e.g. evil-domain.com, Lazarus Group, 8.8.8.8"
            className="sm:col-span-2 bg-white/5 border-white/10"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-[#111827]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <Input
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          placeholder="Optional: why are you watching this? (e.g. known C2 domain for APT29)"
          className="bg-white/5 border-white/10 text-sm"
        />
        <Button
          onClick={handleAdd}
          disabled={saving || !newKeyword.trim()}
          className="bg-[#ffa502] text-black hover:bg-[#ffa502]/90 font-semibold gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add to Watchlist
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Search keywords…"
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          <option value="all" className="bg-[#111827]">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c} className="bg-[#111827]">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Keyword list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading keywords…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-[#111827] border border-white/5 rounded-xl">
          <Bell className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {keywords.length === 0 ? "No keywords yet. Add one above to start monitoring." : "No keywords match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(kw => (
            <div key={kw.id} className={`bg-[#111827] border rounded-xl p-4 flex items-center gap-4 transition-colors ${kw.is_active ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
              <button onClick={() => handleToggle(kw)} className="shrink-0 text-gray-500 hover:text-[#ffa502] transition-colors" title={kw.is_active ? "Disable" : "Enable"}>
                {kw.is_active
                  ? <ToggleRight className="w-6 h-6 text-[#ffa502]" />
                  : <ToggleLeft className="w-6 h-6" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-white">{kw.keyword}</span>
                  <Badge className={`text-[10px] border ${CATEGORY_STYLES[kw.category] || CATEGORY_STYLES.custom}`}>
                    {kw.category}
                  </Badge>
                  {!kw.is_active && <Badge className="text-[10px] bg-gray-500/20 text-gray-400 border-0">disabled</Badge>}
                </div>
                {kw.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{kw.description}</p>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(kw.id)} className="h-8 w-8 text-gray-500 hover:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}