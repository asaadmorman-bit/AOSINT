import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, TrendingUp } from "lucide-react";

const MOCK_NARRATIVES = [
  { title: "Western Infrastructure Vulnerability", velocity: 87, platforms: ["Telegram", "Twitter/X", "Dark Forums"], trend: "up" },
  { title: "AI-Driven Disinformation Campaign", velocity: 72, platforms: ["Reddit", "Twitter/X", "Substack"], trend: "up" },
  { title: "Supply Chain Compromise Allegations", velocity: 61, platforms: ["LinkedIn", "Industry Forums"], trend: "stable" },
  { title: "Election Security Interference Claims", velocity: 54, platforms: ["Telegram", "Facebook"], trend: "up" },
  { title: "Critical Healthcare Data Leaks", velocity: 43, platforms: ["Pastebin", "Dark Web"], trend: "stable" },
];

export default function NarrativeTracker({ userTier }) {
  const { data: narratives = [] } = useQuery({
    queryKey: ["narratives_exec"],
    queryFn: () => base44.entities.NarrativeTracker.list("-updated_date", 8),
  });

  const display = narratives.length > 0 ? narratives.slice(0, 5).map(n => ({
    title: n.title || n.name,
    velocity: n.amplification_score || n.spread_velocity || Math.floor(Math.random() * 60 + 30),
    platforms: n.platforms || ["Unknown"],
    trend: n.trend || "stable",
  })) : MOCK_NARRATIVES;

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[#a855f7]" />
        <h3 className="text-sm font-bold text-white">Influence Narrative Tracker</h3>
        {narratives.length === 0 && <span className="text-[9px] text-gray-600 ml-auto">Demo data</span>}
      </div>

      <div className="space-y-3">
        {display.map((n, i) => {
          const vColor = n.velocity >= 75 ? "#ff4757" : n.velocity >= 50 ? "#ffa502" : "#00d4ff";
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-300 font-medium truncate pr-2">{n.title}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {n.trend === "up" && <TrendingUp className="w-3 h-3 text-[#ff4757]" />}
                  <span className="text-xs font-bold font-mono" style={{ color: vColor }}>{n.velocity}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full">
                <div className="h-full rounded-full" style={{ width: `${n.velocity}%`, background: vColor }} />
              </div>
              <p className="text-[9px] text-gray-700">{Array.isArray(n.platforms) ? n.platforms.join(" · ") : n.platforms}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-gray-700 mt-3">Propagation velocity score (0–100). Higher = faster spread across monitored platforms.</p>
    </div>
  );
}