import React from "react";
import { Layers, ArrowRight } from "lucide-react";

const DOMAIN_COLORS = { cyber: "#00d4ff", physical: "#ffa502", influence: "#a855f7", hybrid: "#ff4757", geopolitical: "#f59e0b" };

export default function CrossDomainCorrelation({ events, userTier }) {
  const crossDomain = events.filter(e => e.is_cross_domain);

  // Build correlation clusters
  const clusters = {};
  crossDomain.forEach(e => {
    const key = e.domain;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(e);
  });

  if (crossDomain.length === 0) return (
    <div className="text-center py-16">
      <Layers className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">No cross-domain correlations detected</p>
      <p className="text-gray-600 text-xs mt-1">Events spanning multiple domains will appear here</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(clusters).map(([domain, items]) => (
          <div key={domain} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{ background: `${DOMAIN_COLORS[domain]}10`, border: `1px solid ${DOMAIN_COLORS[domain]}20`, color: DOMAIN_COLORS[domain] }}>
            {domain} <span className="font-bold font-mono">{items.length}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {crossDomain.map((event, i) => {
          const color = DOMAIN_COLORS[event.domain] || "#6b7280";
          return (
            <div key={event.id || i}
              className="p-3 bg-[#0d1117] border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: `${color}15`, color }}>{event.domain}</span>
                <ArrowRight className="w-3 h-3 text-gray-700" />
                <span className="text-[9px] text-[#a855f7]">CROSS-DOMAIN LINK</span>
              </div>
              <p className="text-xs font-medium text-white">{event.title}</p>
              {event.correlation_ids?.length > 0 && (
                <p className="text-[9px] text-gray-600">{event.correlation_ids.length} linked event(s)</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}