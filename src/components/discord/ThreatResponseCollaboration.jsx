import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";

const STATUS_OPTIONS = [
  { id: "open", label: "Open", icon: AlertCircle, color: "#ff6b6b" },
  { id: "investigating", label: "Investigating", icon: Clock, color: "#ffa502" },
  { id: "responded", label: "Responded", icon: CheckCircle, color: "#2ed573" },
];

export default function ThreatResponseCollaboration() {
  const [showNew, setShowNew] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({
    server_id: "",
    threat_id: "",
    threat_title: "",
    status: "open",
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: collaborationThreads = [] } = useQuery({
    queryKey: ["threat_collab_threads"],
    queryFn: () => base44.entities.DiscordThreatCollaborationThread?.list?.() || [],
  });

  const { data: threadMessages = [] } = useQuery({
    queryKey: ["thread_messages", selectedThread?.id],
    queryFn: () =>
      selectedThread
        ? base44.entities.ThreatResponseMessage?.filter?.({ thread_id: selectedThread.id }, "-created_date") || []
        : [],
    enabled: !!selectedThread,
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["discord_servers"],
    queryFn: () => base44.entities.DiscordThreatServer.list(),
  });

  const createThreadMutation = useMutation({
    mutationFn: (data) => base44.entities.DiscordThreatCollaborationThread.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat_collab_threads"] });
      setShowNew(false);
      setForm({ server_id: "", threat_id: "", threat_title: "", status: "open" });
    },
  });

  const postMessageMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.ThreatResponseMessage.create({
        ...data,
        author_email: user?.email,
        author_name: user?.full_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread_messages", selectedThread?.id] });
      setNewMessage("");
    },
  });

  const updateThreadStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.DiscordThreatCollaborationThread.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat_collab_threads"] });
      if (selectedThread) {
        setSelectedThread((prev) => ({ ...prev, status }));
      }
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Threat Response Collaboration</h2>
          <p className="text-sm text-gray-400 mt-1">Real-time threat response coordination within Discord</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2 bg-[#00d4ff] text-black">
          <Plus className="w-4 h-4" /> New Thread
        </Button>
      </div>

      {/* Threads List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">Active Threads</h3>
          {collaborationThreads.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-lg p-4 text-center">
              <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No active threads</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborationThreads.map((thread) => {
                const statusConfig = STATUS_OPTIONS.find((s) => s.id === thread.status);
                const StatusIcon = statusConfig?.icon || AlertCircle;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedThread?.id === thread.id
                        ? "bg-[#00d4ff]/10 border-[#00d4ff] shadow-[inset_0_0_0_1px_rgba(0,212,255,0.15)]"
                        : "bg-[#111827] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <p className="text-sm font-medium text-white truncate">{thread.threat_title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusIcon className="w-3 h-3" style={{ color: statusConfig?.color }} />
                      <span className="text-[11px] text-gray-500">{thread.status}</span>
                    </div>
                    {thread.participant_count && (
                      <p className="text-[10px] text-gray-600 mt-1">{thread.participant_count} participants</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread Details */}
        {selectedThread ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedThread.threat_title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedThread.threat_id}</p>
                </div>
                <Select value={selectedThread.status} onValueChange={(v) => updateThreadStatusMutation.mutate({ id: selectedThread.id, status: v })}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <div className="bg-black/20 rounded-lg p-4 mb-4 h-64 overflow-y-auto space-y-3">
                {threadMessages.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-8">No messages yet</p>
                ) : (
                  threadMessages.map((msg) => (
                    <div key={msg.id} className="border-l-2 border-[#00d4ff]/30 pl-3">
                      <p className="text-xs text-gray-400">{msg.author_name}</p>
                      <p className="text-sm text-gray-200 mt-1">{msg.message}</p>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {new Date(msg.created_date).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Add your response..."
                  className="bg-white/5 border-white/10 text-white text-sm resize-none h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      postMessageMutation.mutate({ thread_id: selectedThread.id, message: newMessage });
                    }
                  }}
                />
                <Button
                  onClick={() => postMessageMutation.mutate({ thread_id: selectedThread.id, message: newMessage })}
                  disabled={!newMessage || postMessageMutation.isPending}
                  size="sm"
                  className="gap-2 bg-[#00d4ff] text-black"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-xl p-8 flex items-center justify-center min-h-96">
            <p className="text-gray-600 text-sm">Select a thread to start collaborating</p>
          </div>
        )}
      </div>

      {/* New Thread Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[#111827] border border-white/10">
          <DialogHeader>
            <DialogTitle>Create Collaboration Thread</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs">Server</Label>
              <Select value={form.server_id} onValueChange={(v) => setForm({ ...form, server_id: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 text-xs">Threat Title</Label>
              <Input
                value={form.threat_title}
                onChange={(e) => setForm({ ...form, threat_title: e.target.value })}
                placeholder="e.g., Critical Ransomware Detected"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-xs">Threat ID (Optional)</Label>
              <Input
                value={form.threat_id}
                onChange={(e) => setForm({ ...form, threat_id: e.target.value })}
                placeholder="Reference ID"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              onClick={() => createThreadMutation.mutate(form)}
              disabled={!form.server_id || !form.threat_title || createThreadMutation.isPending}
              className="bg-[#00d4ff] text-black"
            >
              {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}