import React from "react";
import { TIER_META } from "@/components/shared/tierCapabilities";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function UpgradePrompt({ minTier = "pro", feature = "this feature", size = "md" }) {
  const meta = TIER_META[minTier] || TIER_META.pro;
  if (size === "sm") return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity"
      style={{ color: meta.color, borderColor: `${meta.color}30`, background: `${meta.color}10` }}
      onClick={() => window.location.href = createPageUrl("Pricing")}>
      <Lock className="w-2.5 h-2.5" /> {meta.label}+
    </span>
  );
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: `${meta.color}20`, background: `${meta.color}08` }}>
      <Lock className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">{feature}</p>
        <p className="text-[10px] text-gray-500">Available on {meta.label} plan</p>
      </div>
      <a href={createPageUrl("Pricing")}>
        <Button size="sm" className="h-7 text-xs gap-1 text-black shrink-0" style={{ background: meta.color }}>
          <Zap className="w-3 h-3" /> Upgrade
        </Button>
      </a>
    </div>
  );
}