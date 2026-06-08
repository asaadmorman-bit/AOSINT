import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity } from "lucide-react";

const MODULE_COLORS = {
  threat_feeds: "#00d4ff", knowledge_graph: "#a855f7", scenario_engine: "#ffa502",
  agent_marketplace: "#ff6b35", researcher_mode: "#2ed573", operator_mode: "#00d4ff",
  executive_dashboard: "#a855f7", briefing_engine: "#ffa502", compliance_engine: "#2ed573",
  training_portal: "#ff6b35", fusion_center: "#00d4ff", red_blue_cell: "#ff4757",
  data_lake: "#6b7280", mobile: "#2ed573", api: "#a855f7",
};

const EVENT_LABELS = {
  feed_ingestion: "Feed Ingestion", storage_write: "Storage Write", scenario_run: "Scenario Run",
  agent_compute: "Agent Compute", graph_query: "Graph Query", dashboard_view: "Dashboard View",
  mobile_sync: "Mobile Sync", field_upload: "Field Upload", training_completion: "Training",
  compliance_upload: "Compliance Upload", red_blue_exercise: "Red/Blue Exercise",
  briefing_export: "Briefing Export", api_call: "API Call", seat_added: "Seat Added",
  addon_activated: "Add-on Activated",
};

const TIER_LIMITS = {
  community: { feed_ingestion: 1000, api_call: 500, graph_query: 100 },
  pro: { feed_ingestion: 50000, api_call: 10000, graph_query: 5000 },
  enterprise: { feed_ingestion: Infinity, api_call: Infinity, graph_query: Infinity },
  gov: { feed_ingestion: Infinity, api_call: Infinity, graph_query: Infinity },
};

export default function UsageDashboard({ events = [], tier = "community" }) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.community;

  const byModule = useMemo(() => {
    const map = {};
    events.forEach(e => {
      map[e.module] = (map[e.module] || 0) + (e.quantity || 1);
    });
    return Object.entries(map).map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [events]);

  const byType = useMemo(() => {
    const map = {};
    events.forEach(e => { map[e.event_type] = (map[e.event_type] || 0) + (e.quantity || 1); });
    return map;
  }, [events]);

  const totalCost = events.reduce((s, e) => s + (e.cost_usd || 0), 0);
  const totalEvents = events.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: totalEvents.toLocaleString(), color: "#00d4ff" },
          { label: "Usage Cost", value: `$${totalCost.toFixed(2)}`, color: "#ffa502" },
          { label: "Feed Ingested", value: (byType.feed_ingestion || 0).toLocaleString(), color: "#a855f7" },
          { label: "API Calls", value: (byType.api_call || 0).toLocaleString(), color: "#2ed573" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
            <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Usage limits */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4 space-y-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Usage Limits ({tier})</p>
        {Object.entries(limits).map(([key, limit]) => {
          const used = byType[key] || 0;
          const pct = limit === Infinity ? 0 : Math.min(100, (used / limit * 100));
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">{EVENT_LABELS[key] || key}</span>
                <span className="font-mono text-gray-500">
                  {used.toLocaleString()} / {limit === Infinity ? "∞" : limit.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct > 85 ? "#ff4757" : pct > 60 ? "#ffa502" : "#2ed573"
                  }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* By module chart */}
      {byModule.length > 0 && (
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">
            <Activity className="w-3 h-3 inline mr-1.5" />Usage by Module
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byModule} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="module" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}
                labelStyle={{ color: "#e5e7eb", fontSize: 10 }}
                itemStyle={{ color: "#9ca3af", fontSize: 10 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byModule.map((entry, i) => (
                  <Cell key={i} fill={MODULE_COLORS[entry.module] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}