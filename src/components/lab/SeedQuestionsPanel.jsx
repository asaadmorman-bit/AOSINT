import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, CheckCircle2 } from "lucide-react";

const SEED_QUESTIONS = [
  { question: "Which emerging actors are most likely to bridge state and criminal ecosystems in Eastern Europe?", category: "convergence", priority: "critical", source: "report_2026", related_regions: ["Eastern Europe", "Russia"], related_sectors: ["energy", "finance"], tags: ["convergence", "state-crime"] },
  { question: "Where is warning time decreasing fastest for critical infrastructure sectors?", category: "warning_time", priority: "critical", source: "report_2026", related_sectors: ["energy", "water", "healthcare"], tags: ["warning-time", "critical-infrastructure"] },
  { question: "Which narratives consistently precede ransomware campaigns targeting the healthcare sector?", category: "influence", priority: "high", source: "report_2026", related_sectors: ["healthcare"], tags: ["ransomware", "influence", "healthcare"] },
  { question: "How is GoLaxy/PRC data aggregation enabling targeted exploitation of Western government officials?", category: "cross_domain", priority: "critical", source: "report_2026", related_regions: ["China", "USA", "Europe"], related_sectors: ["government", "defense"], tags: ["golaxy", "prc", "data-harvesting"] },
  { question: "What is the rate of RaaS affiliate overlap between major ransomware families in 2026?", category: "ransomware", priority: "high", source: "report_2026", related_sectors: ["all"], tags: ["raas", "ransomware", "affiliates"] },
  { question: "Which regions are experiencing the highest fragmentation index increase in 2026?", category: "fragmentation", priority: "high", source: "report_2026", related_regions: ["Global"], tags: ["fragmentation", "geopolitics"] },
  { question: "What shared infrastructure patterns indicate state-criminal convergence in Southeast Asia?", category: "convergence", priority: "high", source: "report_2026", related_regions: ["Southeast Asia"], tags: ["convergence", "infrastructure"] },
  { question: "How are influence operations adapting to platform fragmentation post-2025?", category: "influence", priority: "high", source: "report_2026", related_regions: ["Global"], related_sectors: ["media", "government"], tags: ["influence", "social-media", "fragmentation"] },
  { question: "Which sectors show the highest exposure to supply chain compromise in fragmented vendor ecosystems?", category: "cross_domain", priority: "high", source: "report_2026", related_sectors: ["defense", "energy", "technology"], tags: ["supply-chain", "fragmentation"] },
  { question: "How is AI being weaponized in influence operations across fragmented media landscapes?", category: "influence", priority: "critical", source: "report_2026", related_regions: ["Global"], tags: ["ai", "influence", "disinformation"] },
];

export default function SeedQuestionsPanel({ open, onClose, onSeeded }) {
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSeed = async () => {
    setSeeding(true);
    setProgress(0);
    for (let i = 0; i < SEED_QUESTIONS.length; i++) {
      await base44.entities.AnalyticQuestion.create({
        ...SEED_QUESTIONS[i],
        status: "unanswered",
        min_tier: "pro",
      });
      setProgress(i + 1);
    }
    setSeeding(false);
    onSeeded();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#a855f7]" />
            Seed 2026 State of Security Questions
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed">
            This will pre-load <span className="text-white font-semibold">{SEED_QUESTIONS.length} analytic questions</span> derived directly from the 2026 State of Security: How Global Fragmentation is Redefining Conflict white paper.
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {SEED_QUESTIONS.map((q, i) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg transition-all ${
                progress > i ? "bg-[#2ed573]/5 border border-[#2ed573]/10" :
                seeding && progress === i ? "bg-[#00d4ff]/5 border border-[#00d4ff]/20 animate-pulse" :
                "bg-white/3 border border-white/5"
              }`}>
                {progress > i ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573] shrink-0 mt-0.5" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0 mt-0.5 flex items-center justify-center text-[8px] text-gray-600">{i + 1}</span>
                )}
                <p className="text-xs text-gray-300 leading-relaxed">{q.question}</p>
              </div>
            ))}
          </div>
          {seeding && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Seeding questions...</span>
                <span>{progress}/{SEED_QUESTIONS.length}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full">
                <div className="h-full bg-[#00d4ff] rounded-full transition-all duration-300"
                  style={{ width: `${(progress / SEED_QUESTIONS.length) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400" disabled={seeding}>Cancel</Button>
          <Button onClick={handleSeed} disabled={seeding}
            className="bg-[#a855f7] text-white hover:bg-[#9333ea] gap-2 font-semibold">
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
            {seeding ? `Seeding ${progress}/${SEED_QUESTIONS.length}...` : "Seed All Questions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}