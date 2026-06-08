import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { CATEGORY_META } from "@/pages/QuestionLab";

export default function CreateQuestionDialog({ open, onClose, userTier, onCreated }) {
  const [form, setForm] = useState({
    question: "", category: "custom", priority: "medium",
    related_regions: "", related_sectors: "", related_actors: "", tags: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnalyticQuestion.create({
      question: data.question,
      category: data.category,
      priority: data.priority,
      related_regions: data.related_regions ? data.related_regions.split(",").map(s => s.trim()).filter(Boolean) : [],
      related_sectors: data.related_sectors ? data.related_sectors.split(",").map(s => s.trim()).filter(Boolean) : [],
      related_actors: data.related_actors ? data.related_actors.split(",").map(s => s.trim()).filter(Boolean) : [],
      tags: data.tags ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "unanswered",
      source: "analyst_input",
      min_tier: "pro",
    }),
    onSuccess: () => {
      onCreated();
      setForm({ question: "", category: "custom", priority: "medium", related_regions: "", related_sectors: "", related_actors: "", tags: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#00d4ff]" />
            New Analytic Question
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Intelligence Question</Label>
            <Textarea
              value={form.question}
              onChange={e => setForm({ ...form, question: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1"
              rows={3}
              placeholder="What do you need to know? Be specific and analytically rigorous..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, m]) => (
                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Related Regions <span className="normal-case text-gray-600">(comma-separated)</span></Label>
            <Input value={form.related_regions} onChange={e => setForm({ ...form, related_regions: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="Eastern Europe, Southeast Asia" />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Related Sectors <span className="normal-case text-gray-600">(comma-separated)</span></Label>
            <Input value={form.related_sectors} onChange={e => setForm({ ...form, related_sectors: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="healthcare, energy, defense" />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Related Actors <span className="normal-case text-gray-600">(comma-separated)</span></Label>
            <Input value={form.related_actors} onChange={e => setForm({ ...form, related_actors: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="APT41, Lazarus Group..." />
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Tags <span className="normal-case text-gray-600">(comma-separated)</span></Label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="ransomware, china, critical-infrastructure" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.question || createMutation.isPending}
            className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] font-semibold"
          >
            {createMutation.isPending ? "Creating..." : "Create Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}