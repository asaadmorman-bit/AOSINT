import React, { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const SEVERITY_COLORS = {
  critical: "#ff1744",
  high:     "#ff6d00",
  medium:   "#ffd600",
  low:      "#00b0ff",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1220] border border-white/10 rounded p-2.5 text-xs font-mono shadow-xl">
      <div className="text-gray-400 mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400 capitalize">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function EventTimeline({ events }) {
  // Build daily bucketed data for last 14 days
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: format(d, "MMM d"), ts: d, critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    });

    events.forEach(ev => {
      const ts = new Date(ev.timestamp || ev.created_date || ev.triggered_at);
      if (isNaN(ts)) return;
      const dayIdx = days.findIndex(d => {
        const next = new Date(d.ts);
        next.setDate(next.getDate() + 1);
        return ts >= d.ts && ts < next;
      });
      if (dayIdx !== -1) {
        const sev = ev.severity || "low";
        if (days[dayIdx][sev] !== undefined) days[dayIdx][sev]++;
        days[dayIdx].total++;
      }
    });
    return days;
  }, [events]);

  // Domain breakdown bar data
  const domainData = useMemo(() => {
    const counts = {};
    events.forEach(ev => {
      const d = ev.domain || ev.threat_category || "unknown";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [events]);

  const DOMAIN_COLORS = ["#00e5ff","#ff1744","#d500f9","#ff9100","#00e676","#ffab40","#f50057","#546e7a"];

  return (
    <div className="space-y-6">
      {/* Area chart — events over time */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-mono">
          Events by Severity — Last 14 Days
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={v} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={v} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <RechartTooltip content={<CustomTooltip />} />
            {Object.entries(SEVERITY_COLORS).map(([k, v]) => (
              <Area key={k} type="monotone" dataKey={k} stroke={v} strokeWidth={1.5}
                fill={`url(#grad-${k})`} stackId="1" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart — by domain */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-mono">
          Events by Domain / Category
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={domainData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <RechartTooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {domainData.map((_, i) => (
                <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}