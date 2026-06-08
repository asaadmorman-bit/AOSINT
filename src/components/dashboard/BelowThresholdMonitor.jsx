import React from "react";
import { Badge } from "@/components/ui/badge";
import { EyeOff, TrendingUp, Waves } from "lucide-react";

const CATEGORIES = [
  { label: "Economic Coercion", value: 73, color: "#ffa502", icon: TrendingUp },
  { label: "Influence Operations", value: 81, color: "#a855f7", icon: Waves },
  { label: "Data Harvesting (GoLaxy)", value: 89, color: "#ff4757", icon: EyeOff },
  { label: "Proxy Activity", value: 54, color: "#ff6b35", icon: Waves },
  { label: "Strategic Deception", value: 66, color: "#ffa502", icon: EyeOff },
  { label: "Supply Chain Seeding", value: 61, color: "#00d4ff", icon: TrendingUp },
];

export default function BelowThresholdMonitor() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Gray Zone / Below-Threshold Activity</p>
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        return (
          <div key={cat.label} className="flex items-center gap-3">
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
            <span className="text-xs text-gray-400 w-40 shrink-0">{cat.label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${cat.value}%`, background: cat.color, boxShadow: `0 0 6px ${cat.color}60` }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: cat.color }}>{cat.value}</span>
          </div>
        );
      })}
    </div>
  );
}