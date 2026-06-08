import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, MessageSquare, Mail, Headphones, Crown, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";

import { createPageUrl } from "@/utils";

const TIER_SUPPORT = {
  community: { label: "Community Support", icon: Mail, color: "#00d4ff", sla: "support@eds-360.com", canTicket: false },
  pro: { label: "Email Support", icon: Mail, color: "#00d4ff", sla: "support@eds-360.com", canTicket: true },
  enterprise: { label: "Priority Support", icon: Headphones, color: "#a855f7", sla: "support@eds-360.com", canTicket: true },
  gov: { label: "Dedicated Analyst", icon: Crown, color: "#f59e0b", sla: "support@eds-360.com", canTicket: true },
};

const STATUS_STYLES = {
  open: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  in_progress: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  waiting: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  resolved: "text-green-400 bg-green-500/10 border-green-500/20",
  closed: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

export default function Support() {
  const [showNew, setShowNew] = useState(false);
  const [userTier, setUserTier] = useState("pro"); // would come from auth in production
  const [form, setForm] = useState({ subject: "", description: "", category: "technical", priority: "medium" });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.SupportTicket.filter({ requester_email: user?.email || "" }, "-created_date"),
    enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({
      ...data,
      requester_email: user?.email || "unknown",
      requester_name: user?.full_name || "User",
      tier: userTier,
      sla_hours: userTier === "enterprise" || userTier === "gov" ? 24 : 72,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tickets"] }); setShowNew(false); setForm({ subject: "", description: "", category: "technical", priority: "medium" }); },
  });

  const tierSupport = TIER_SUPPORT[userTier] || TIER_SUPPORT.community;
  const SupportIcon = tierSupport.icon;

  return (
    <div className="space-y-6">
      {/* Tier Support Banner */}
      <div className="rounded-xl border p-5 flex items-center gap-4" style={{ borderColor: `${tierSupport.color}30`, background: `${tierSupport.color}08` }}>
        <div className="p-3 rounded-xl" style={{ background: `${tierSupport.color}15` }}>
          <SupportIcon className="w-6 h-6" style={{ color: tierSupport.color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{tierSupport.label}</p>
          <p className="text-xs text-gray-400">SLA: {tierSupport.sla}</p>
        </div>
        {userTier === "community" && (
          <a href={createPageUrl("Forum")}>
            <Button size="sm" className="bg-[#6b7280] text-white gap-1.5 text-xs">
              <MessageSquare className="w-3 h-3" /> Visit Forum
            </Button>
          </a>
        )}
        {tierSupport.canTicket && (
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5 text-black text-xs font-bold" style={{ background: tierSupport.color }}>
            <Plus className="w-3 h-3" /> New Ticket
          </Button>
        )}
      </div>

      {/* Community-only users */}
      {userTier === "community" && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Get Help with Issues & Feedback</h3>
            <p className="text-sm text-gray-400 mb-6">
             As a community beta member, you can report issues and send feedback directly to our support team. We value your input as we build ASOSINT together.
           </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <a href={createPageUrl("Forum")}>
                <Button className="w-full bg-[#6b7280] text-white gap-2"><MessageSquare className="w-4 h-4" /> Community Forum</Button>
              </a>
              <a href="mailto:support@eds-360.com?subject=ASOSINT%20Issue%20or%20Feedback">
                <Button className="w-full bg-[#00d4ff] text-black gap-2 font-semibold"><Mail className="w-4 h-4" /> Email Support</Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tickets for paid tiers */}
      {tierSupport.canTicket && (
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">My Tickets</h2>
          {tickets.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
              <CheckCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No open tickets. Everything running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-[#111827] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">{ticket.subject}</h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                        <span>{ticket.category}</span>
                        <span>{new Date(ticket.created_date).toLocaleDateString()}</span>
                        {ticket.sla_hours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ticket.sla_hours}hr SLA</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[9px] ${
                        ticket.priority === "critical" ? "text-red-400 border-red-500/20" :
                        ticket.priority === "high" ? "text-orange-400 border-orange-500/20" :
                        "text-gray-400 border-gray-500/20"
                      }`}>{ticket.priority}</Badge>
                      <Badge variant="outline" className={`text-[9px] ${STATUS_STYLES[ticket.status]}`}>{ticket.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  {ticket.resolution && (
                    <div className="mt-3 p-3 bg-[#2ed573]/5 border border-[#2ed573]/15 rounded-lg">
                      <p className="text-xs text-[#2ed573] font-semibold mb-1">Resolution</p>
                      <p className="text-xs text-gray-300">{ticket.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Common Questions</h2>
        <div className="space-y-3">
          {[
            { q: "How do I configure OSINT feeds?", a: "Navigate to Threat Feeds and click '+ Add Feed'. Enter the feed URL and select the feed type. Pro+ users can access full feed libraries." },
            { q: "What is the difference between Community and Pro tiers?", a: "Pro unlocks full OSINT feeds, 250 assets, daily scoring, API access, and email support. Community is limited to 25 assets and weekly reports." },
            { q: "How does AI risk scoring work?", a: "SOINT's AI analyzes your asset inventory, active threat indicators, and feed data to produce risk scores across cyber, physical, influence, and supply chain domains." },
            { q: "Can I export assessment reports?", a: "Yes. All assessments can be exported as JSON. Enterprise+ users get PDF executive briefings." },
          ].map((faq, i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-4">
              <p className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#00d4ff]" />{faq.q}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed ml-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Submit Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400 text-xs">Subject</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Brief description of issue" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["billing", "technical", "feature_request", "security", "general"].map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={4} placeholder="Describe your issue in detail..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNew(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={() => createTicketMutation.mutate(form)} disabled={!form.subject || !form.description || createTicketMutation.isPending}
              className="gap-2 text-black font-bold" style={{ background: tierSupport.color }}>
              {createTicketMutation.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}