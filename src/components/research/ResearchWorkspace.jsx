import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, StickyNote, Lightbulb, HelpCircle, CheckCircle2, AlertTriangle, Clock, Users, Lock, Zap } from "lucide-react";
import { meetsMinTier, TIER_META } from "@/components/shared/tierCapabilities";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const NOTE_TYPE_META = {
  observation:  { color: "#00d4ff",  icon: StickyNote,     label: "Observation" },
  hypothesis:   { color: "#a855f7",  icon: Lightbulb,      label: "Hypothesis" },
  finding:      { color: "#2ed573",  icon: CheckCircle2,   label: "Finding" },
  question:     { color: "#ffa502",  icon: HelpCircle,     label: "Question" },
  action_item:  { color: "#ff4757",  icon: AlertTriangle,  label: "Action Item" },
};

const REVIEW_STATUS_META = {
  draft:     { color: "#6b7280", label: "Draft" },
  submitted: { color: "#00d4ff", label: "Under Review" },
  approved:  { color: "#2ed573", label: "Approved" },
  rejected:  { color: "#ff4757", label: "Rejected" },
};

export default function ResearchWorkspace({ topics, notes, userTier }) {
  const [activeTab, setActiveTab] = useState("notes");
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", body: "", note_type: "observation", visibility: "team" });
  const [topicForm, setTopicForm] = useState({ title: "", domain: "cyber", category: "ttp_evolution", description: "" });

  const canPeerReview = meetsMinTier(userTier, "enterprise");
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.ResearchNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research_notes"] });
      setShowCreateNote(false);
      setNoteForm({ title: "", body: "", note_type: "observation", visibility: "team" });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data) => base44.entities.ResearchTopic.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research_topics"] });
      setShowCreateTopic(false);
    },
  });

  const submitForReview = (note) => {
    base44.entities.ResearchNote.update(note.id, { peer_review_status: "submitted" });
    queryClient.invalidateQueries({ queryKey: ["research_notes"] });
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-0 border-b border-white/5">
        {[
          { key: "notes", label: `Notes (${notes.length})` },
          { key: "topics", label: `Topics (${topics.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? "text-[#00d4ff] border-[#00d4ff]" : "text-gray-500 border-transparent hover:text-gray-300"
            }`}>
            {tab.label}
          </button>
        ))}
        <div className="ml-auto pb-1 flex gap-2">
          {activeTab === "notes" && (
            <Button onClick={() => setShowCreateNote(true)} size="sm"
              className="h-8 text-xs bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/20 gap-1.5">
              <Plus className="w-3 h-3" /> New Note
            </Button>
          )}
          {activeTab === "topics" && (
            <Button onClick={() => setShowCreateTopic(true)} size="sm"
              className="h-8 text-xs bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1.5">
              <Plus className="w-3 h-3" /> New Topic
            </Button>
          )}
        </div>
      </div>

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-2">
          {notes.length === 0 ? (
            <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-10 text-center">
              <StickyNote className="w-9 h-9 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No research notes yet</p>
              <p className="text-gray-600 text-xs mt-1">Create notes to document observations, hypotheses, and findings</p>
            </div>
          ) : (
            notes.map(note => {
              const meta = NOTE_TYPE_META[note.note_type] || NOTE_TYPE_META.observation;
              const NoteIcon = meta.icon;
              const reviewMeta = REVIEW_STATUS_META[note.peer_review_status] || REVIEW_STATUS_META.draft;

              return (
                <div key={note.id} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                      <NoteIcon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${meta.color}20`, color: meta.color }}>
                          {meta.label}
                        </span>
                        {canPeerReview && note.peer_review_status && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${reviewMeta.color}15`, color: reviewMeta.color }}>
                            {reviewMeta.label}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-600 ml-auto">
                          {note.created_date ? format(new Date(note.created_date), "MMM d") : ""}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{note.title}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{note.body}</p>
                      {canPeerReview && note.peer_review_status === "draft" && (
                        <Button size="sm" variant="ghost"
                          onClick={() => submitForReview(note)}
                          className="mt-2 h-6 text-[10px] gap-1 text-[#a855f7] hover:bg-[#a855f7]/10 px-2">
                          <Users className="w-2.5 h-2.5" /> Submit for Peer Review
                        </Button>
                      )}
                      {note.review_comments && (
                        <div className="mt-2 bg-black/30 rounded-lg p-2">
                          <p className="text-[9px] text-gray-500 mb-0.5">Review feedback:</p>
                          <p className="text-xs text-gray-300">{note.review_comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!canPeerReview && (
            <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#a855f7]" />
                <div>
                  <p className="text-xs font-semibold text-white">Peer Review — Enterprise</p>
                  <p className="text-[10px] text-gray-500">Collaborative review workflows for analyst teams</p>
                </div>
              </div>
              <Link to={createPageUrl("Pricing")}>
                <Button size="sm" className="bg-[#a855f7] text-white hover:bg-[#9333ea] gap-1.5 shrink-0">
                  <Zap className="w-3 h-3" /> Upgrade
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === "topics" && (
        <div className="space-y-2">
          {topics.length === 0 ? (
            <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-10 text-center">
              <BookOpen className="w-9 h-9 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No research topics yet</p>
            </div>
          ) : (
            topics.map(topic => {
              const domainColors = { cyber: "#00d4ff", physical: "#ffa502", influence: "#a855f7", hybrid: "#ff6b35", supply_chain: "#2ed573" };
              const color = domainColors[topic.domain] || "#6b7280";
              return (
                <div key={topic.id} className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                      <BookOpen className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color }}>
                          {topic.domain?.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {topic.category?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] font-semibold ml-auto"
                          style={{ color: topic.priority === "critical" ? "#ff4757" : topic.priority === "high" ? "#ffa502" : "#6b7280" }}>
                          {topic.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{topic.title}</p>
                      {topic.description && <p className="text-xs text-gray-400 mt-1">{topic.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Note Dialog */}
      <Dialog open={showCreateNote} onOpenChange={setShowCreateNote}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><StickyNote className="w-4 h-4 text-[#2ed573]" />New Research Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-gray-500">Title</Label>
              <Input value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">Note Type</Label>
                <Select value={noteForm.note_type} onValueChange={v => setNoteForm({ ...noteForm, note_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTE_TYPE_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Visibility</Label>
                <Select value={noteForm.visibility} onValueChange={v => setNoteForm({ ...noteForm, visibility: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Note Body</Label>
              <Textarea value={noteForm.body} onChange={e => setNoteForm({ ...noteForm, body: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" rows={4} placeholder="Document your observation, finding, or hypothesis..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateNote(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createNoteMutation.mutate(noteForm)} disabled={!noteForm.title || !noteForm.body || createNoteMutation.isPending}
              className="bg-[#2ed573] text-black hover:bg-[#27c065]">
              {createNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Topic Dialog */}
      <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00d4ff]" />New Research Topic</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] text-gray-500">Title</Label>
              <Input value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-gray-500">Domain</Label>
                <Select value={topicForm.domain} onValueChange={v => setTopicForm({ ...topicForm, domain: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cyber">Cyber</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="influence">Influence</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="supply_chain">Supply Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Category</Label>
                <Select value={topicForm.category} onValueChange={v => setTopicForm({ ...topicForm, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ttp_evolution">TTP Evolution</SelectItem>
                    <SelectItem value="convergence">Convergence</SelectItem>
                    <SelectItem value="fragmentation">Fragmentation</SelectItem>
                    <SelectItem value="ransomware">Ransomware</SelectItem>
                    <SelectItem value="influence_ops">Influence Ops</SelectItem>
                    <SelectItem value="vulnerability">Vulnerability</SelectItem>
                    <SelectItem value="sector_threat">Sector Threat</SelectItem>
                    <SelectItem value="actor_behavior">Actor Behavior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500">Description</Label>
              <Textarea value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateTopic(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createTopicMutation.mutate(topicForm)} disabled={!topicForm.title || createTopicMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}