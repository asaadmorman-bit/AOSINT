import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown, Plus, Pin, Lock, Search, Tag } from "lucide-react";
import StatusDot from "@/components/shared/StatusDot";

const CATEGORIES = [
  { key: "osint", label: "OSINT", color: "#00d4ff" },
  { key: "threat_intel", label: "Threat Intel", color: "#ff4757" },
  { key: "threat_intel_submission", label: "Threat Data", color: "#ff6b6b" },
  { key: "tools", label: "Tools", color: "#2ed573" },
  { key: "help", label: "Help", color: "#ffa502" },
  { key: "announcements", label: "Announcements", color: "#a855f7" },
];

const catMeta = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

export default function Forum() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showPost, setShowPost] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", category: "help", tags: "", threat_type: "", threat_severity: "medium", source_url: "" });
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["forum_posts"],
    queryFn: () => base44.entities.ForumPost.filter({ status: "published" }, "-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.ForumPost.create({
        ...data,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        author_name: user?.full_name || "Anonymous",
        author_email: user?.email || "",
        author_tier: user?.role || "community",
        status: "published",
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["forum_posts"] }); setShowCreate(false); setForm({ title: "", body: "", category: "help", tags: "", threat_type: "", threat_severity: "medium", source_url: "" }); },
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, type, current }) => base44.entities.ForumPost.update(id, {
      [type === "up" ? "upvotes" : "downvotes"]: (current || 0) + 1
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum_posts"] }),
  });

  const filtered = posts.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.body?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const pinned = filtered.filter(p => p.is_pinned);
  const regular = filtered.filter(p => !p.is_pinned);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">Community-powered intelligence forum</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9 bg-white/5 border-white/10 text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === "all" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === c.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
              style={activeCategory === c.key ? { background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}30` } : {}}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading posts...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...pinned, ...regular].map(post => {
            const cat = catMeta[post.category] || catMeta.help;
            return (
              <div key={post.id}
                className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all cursor-pointer group"
                onClick={() => setShowPost(post)}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <button onClick={e => { e.stopPropagation(); voteMutation.mutate({ id: post.id, type: "up", current: post.upvotes }); }}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-[#2ed573] transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-gray-400">{(post.upvotes || 0) - (post.downvotes || 0)}</span>
                    <button onClick={e => { e.stopPropagation(); voteMutation.mutate({ id: post.id, type: "down", current: post.downvotes }); }}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {post.is_pinned && <Pin className="w-3 h-3 text-[#ffa502]" />}
                      {post.is_locked && <Lock className="w-3 h-3 text-gray-500" />}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${cat.color}20`, color: cat.color }}>{cat.label}</span>
                      {post.tags?.map(t => (
                        <span key={t} className="text-[10px] text-gray-500 flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{t}</span>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#00d4ff] transition-colors line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-600">
                      <span>{post.author_name || "Anonymous"}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" />{post.reply_count || 0} replies</span>
                      <span>{post.created_date ? new Date(post.created_date).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Detail Dialog */}
      {showPost && (
        <Dialog open={!!showPost} onOpenChange={() => setShowPost(null)}>
          <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${catMeta[showPost.category]?.color}20`, color: catMeta[showPost.category]?.color }}>{catMeta[showPost.category]?.label}</span>
              </div>
              <DialogTitle className="text-left text-base">{showPost.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{showPost.body}</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 border-t border-white/5 pt-4">
              <span>By {showPost.author_name || "Anonymous"}</span>
              <span>{showPost.created_date ? new Date(showPost.created_date).toLocaleString() : ""}</span>
              <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{showPost.upvotes || 0}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Your post title" />
            </div>
            <div>
              <Label className="text-gray-400">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Body</Label>
              <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1 min-h-[120px]" placeholder="Share your knowledge or question..." />
            </div>
            <div>
              <Label className="text-gray-400">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. osint, apt, ransomware" />
            </div>
            {form.category === "threat_intel_submission" && (
              <>
                <div>
                  <Label className="text-gray-400">Threat Type</Label>
                  <Select value={form.threat_type} onValueChange={v => setForm({ ...form, threat_type: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["malware", "phishing", "ransomware", "apt", "vulnerability", "credential_leak", "domain", "ip_address", "hash", "url", "other"].map(t => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400">Severity</Label>
                  <Select value={form.threat_severity} onValueChange={v => setForm({ ...form, threat_severity: v })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-400">Source URL (optional)</Label>
                  <Input value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="https://..." />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.body || createMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {createMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}