import React from "react";
import { CheckCircle2, XCircle, Loader2, Lock } from "lucide-react";

const ADDONS = [
  // Modules
  { id: "researcher_mode", name: "Researcher Mode", category: "module", icon: "🔬", price: 49, min_tier: "pro", description: "Full TTP explorer, convergence analysis, and analyst workspace." },
  { id: "scenario_engine", name: "Scenario Engine", category: "module", icon: "🎯", price: 79, min_tier: "pro", description: "High-level defensive scenario forecasting and early-warning analytics." },
  { id: "red_blue_cell", name: "Red/Blue Cell Module", category: "module", icon: "⚔️", price: 99, min_tier: "pro", description: "Tabletop exercise planning, gap assessment, and after-action reporting." },
  { id: "compliance_engine", name: "Compliance Engine", category: "module", icon: "📋", price: 79, min_tier: "pro", description: "Control mapping, compliance evidence management, and readiness scoring." },
  { id: "training_portal", name: "Training Portal", category: "module", icon: "🎓", price: 49, min_tier: "pro", description: "Scenario-based analyst training with competency tracking." },
  // Agents
  { id: "narrative_intel_agent", name: "Narrative Intel Agent", category: "agent", icon: "📢", price: 39, min_tier: "pro", description: "Track narrative velocity, cross-platform spread, and influence patterns." },
  { id: "ransomware_ecosystem_agent", name: "Ransomware Ecosystem Agent", category: "agent", icon: "🔒", price: 39, min_tier: "pro", description: "Monitor RaaS operators, affiliate behavior, and sector targeting." },
  { id: "regional_fragmentation_agent", name: "Regional Fragmentation Agent", category: "agent", icon: "🌍", price: 39, min_tier: "pro", description: "Legal divergence, geopolitical tension indicators, and regional instability." },
  { id: "sovereign_deploy_agent", name: "Sovereign Deployment Agent", category: "agent", icon: "🏛️", price: 199, min_tier: "enterprise", description: "Data sovereignty controls, air-gap config, and national retention policies." },
  { id: "advanced_audit_agent", name: "Advanced Audit & Compliance Agent", category: "agent", icon: "🔍", price: 149, min_tier: "enterprise", description: "Extended audit retention, classified-level compliance, regulatory reporting." },
  // Capacity
  { id: "extra_seats_10", name: "10 Extra Seats", category: "capacity", icon: "👥", price: 90, min_tier: "pro", description: "Add 10 operator/analyst seats to your current tier." },
  { id: "extra_ingestion_50gb", name: "50GB Extra Ingestion", category: "capacity", icon: "📡", price: 29, min_tier: "pro", description: "Additional 50GB/month feed ingestion capacity." },
  { id: "extended_retention_1yr", name: "1-Year Extended Retention", category: "capacity", icon: "🗃️", price: 99, min_tier: "enterprise", description: "Extend audit and data retention to 1 year (default 90 days)." },
];

const CATEGORY_META = {
  module: { label: "Modules", color: "#00d4ff" },
  agent: { label: "Agents", color: "#a855f7" },
  capacity: { label: "Capacity", color: "#ffa502" },
};

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

export default function AddonCatalog({ activeAddons = [], userTier, onActivate, onDeactivate, loading }) {
  const tierIdx = TIER_ORDER.indexOf(userTier);
  const categories = ["module", "agent", "capacity"];

  return (
    <div className="space-y-6">
      {categories.map(cat => {
        const items = ADDONS.filter(a => a.category === cat);
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: meta.color }}>{meta.label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map(addon => {
                const active = activeAddons.some(a => a.addon_id === addon.id && a.status === "active");
                const canAccess = tierIdx >= TIER_ORDER.indexOf(addon.min_tier);
                return (
                  <div key={addon.id}
                    className={`bg-[#0d1117] border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                      active ? "border-[#2ed573]/20" : canAccess ? "border-white/5 hover:border-white/10" : "border-white/3 opacity-50"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{addon.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{addon.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block"
                            style={{ background: `${meta.color}10`, color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-white">${addon.price}<span className="text-[9px] text-gray-600">/mo</span></p>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed flex-1">{addon.description}</p>

                    <div className="pt-1 border-t border-white/5">
                      {!canAccess ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                          <Lock className="w-3 h-3" /> Requires {addon.min_tier}+
                        </div>
                      ) : (
                        <button
                          disabled={loading === addon.id}
                          onClick={() => active ? onDeactivate(addon) : onActivate(addon)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors ${
                            active
                              ? "bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20 hover:bg-[#ff4757]/20"
                              : "bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 hover:bg-[#2ed573]/20"
                          }`}>
                          {loading === addon.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : active ? <><XCircle className="w-3 h-3" /> Deactivate</> : <><CheckCircle2 className="w-3 h-3" /> Activate — ${addon.price}/mo</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}