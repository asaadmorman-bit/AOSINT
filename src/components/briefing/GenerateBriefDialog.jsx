import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Globe2, Zap, Shield, FileText, Lock } from "lucide-react";
import { meetsMinTier } from "@/components/shared/tierCapabilities";

const BRIEF_TYPES = [
  { key: "weekly_strategic",     label: "Weekly Strategic",     desc: "Global threat landscape, fragmentation, convergence, ransomware, recommendations", icon: Globe2,    minTier: "community", color: "#00d4ff" },
  { key: "daily_operational",    label: "Daily Operational",    desc: "New incidents, emerging threats, asset exposure, tactical warning indicators",      icon: Zap,       minTier: "enterprise", color: "#2ed573" },
  { key: "executive_protection", label: "Executive Protection", desc: "Regional instability, physical threat indicators, travel risk summaries",            icon: Shield,    minTier: "enterprise", color: "#a855f7" },
  { key: "law_enforcement",      label: "Law Enforcement",      desc: "Crimeware trends, influence-crime convergence, public safety indicators",            icon: Shield,    minTier: "gov",        color: "#f59e0b" },
  { key: "custom",               label: "Custom Brief",         desc: "Comprehensive multi-domain brief with full analyst workspace integration",           icon: FileText,  minTier: "enterprise", color: "#6b7280" },
];

export default function GenerateBriefDialog({ open, onClose, userTier, onGenerate }) {
  const [selected, setSelected] = useState("weekly_strategic");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await onGenerate(selected);
    setGenerating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Globe2 className="w-4 h-4 text-[#00d4ff]" />
            Generate Intelligence Brief
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-1">
          {BRIEF_TYPES.map(t => {
            const locked = !meetsMinTier(userTier, t.minTier);
            const isSelected = selected === t.key && !locked;
            return (
              <div key={t.key}
                onClick={() => !locked && setSelected(t.key)}
                className={`p-3 rounded-xl border transition-all ${
                  locked ? "opacity-40 cursor-not-allowed border-white/5" :
                  isSelected ? "border-[#00d4ff]/40 bg-[#00d4ff]/5 cursor-pointer" :
                  "border-white/5 hover:border-white/15 cursor-pointer"
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${t.color}15`, border: `1px solid ${t.color}20` }}>
                    {locked ? <Lock className="w-3.5 h-3.5 text-gray-500" /> :
                      <t.icon className="w-3.5 h-3.5" style={{ color: t.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{t.label}</p>
                      {locked && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">
                          {t.minTier.toUpperCase()}+
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{t.desc}</p>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#00d4ff] shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancel</Button>
          <Button onClick={handleGenerate} disabled={generating}
            className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] font-semibold gap-2">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Globe2 className="w-4 h-4" /> Generate Brief</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}