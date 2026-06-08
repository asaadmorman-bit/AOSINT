import React from "react";
import { Globe2, Bell, Skull, Radar, Shield, Database, Layers, Sword, BadgeCheck, Landmark, Zap, Lock, Hash } from "lucide-react";

const ICON_MAP = {
  Globe2, Bell, Skull, Radar, Shield, Database, Layers, Sword, BadgeCheck, Landmark, Zap, Hash,
};

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];
const TIER_COLORS = {
  community: "#6b7280",
  pro: "#00d4ff",
  enterprise: "#a855f7",
  gov: "#f59e0b",
};

export default function ChannelList({ channels, activeChannelId, userTier, onSelect, mobileHidden }) {
  const userIdx = TIER_ORDER.length; // beta: all unlocked

  const groups = [
    { label: "Community", tiers: ["community"] },
    { label: "Pro", tiers: ["pro"] },
    { label: "Enterprise", tiers: ["enterprise"] },
    { label: "Gov / CI", tiers: ["gov"] },
  ];

  return (
    <div className={`${mobileHidden ? "hidden sm:flex" : "flex"} w-60 shrink-0 bg-[#0d1220] border-r border-white/5 flex-col h-full overflow-y-auto`}>
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Intelligence Feeds</p>
      </div>
      {groups.map(group => {
        const groupChannels = channels.filter(c => group.tiers.includes(c.min_tier));
        if (!groupChannels.length) return null;
        const tierColor = TIER_COLORS[group.tiers[0]];
        return (
          <div key={group.label} className="mt-2">
            <p className="text-[9px] font-bold uppercase tracking-widest px-4 mb-1" style={{ color: tierColor }}>
              {group.label}
            </p>
            {groupChannels.map(ch => {
              const Icon = ICON_MAP[ch.icon] || Hash;
              const locked = false; // beta: all feeds unlocked
              const isActive = ch.id === activeChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelect(ch)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all ${
                    isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: locked ? "#4b5563" : (isActive ? tierColor : undefined) }} />
                  <span className={`truncate text-xs ${locked ? "text-gray-600" : ""}`}>
                    # {ch.name}
                  </span>
                  {locked && <Lock className="w-3 h-3 ml-auto shrink-0 text-gray-600" />}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}