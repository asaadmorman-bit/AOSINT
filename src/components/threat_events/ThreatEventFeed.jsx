import React from "react";
import { AlertTriangle, Shield, Wifi, Camera, Globe, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG = {
  critical: { color: "#ff4757", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.25)", pulse: true },
  high:     { color: "#ffa502", bg: "rgba(255,165,2,0.1)",  border: "rgba(255,165,2,0.25)",  pulse: false },
  medium:   { color: "#00d4ff", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.2)",   pulse: false },
  low:      { color: "#2ed573", bg: "rgba(46,213,115,0.08)", border: "rgba(46,213,115,0.2)", pulse: false },
  informational: { color: "#6b7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.15)", pulse: false },
};

const SOURCE_ICONS = {
  shodan: Wifi,
  virustotal: Shield,
  alienvault: Globe,
  osint: Globe,
  siem: Activity,
  physical_sensor: AlertTriangle,
  ip_camera: Camera,
  access_control: Shield,
  edr: Shield,
  netflow: Wifi,
  custom_webhook: Activity,
  manual: Activity,
};

export default function ThreatEventFeed({ events = [], maxItems = 50 }) {
  const visible = events.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-600">
        <Activity className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">No threat events detected</p>
        <p className="text-xs mt-1 opacity-60">Awaiting telemetry ingestion...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
      {visible.map((event) => {
        const cfg = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.informational;
        const Icon = SOURCE_ICONS[event.source_tool] ?? Activity;
        const ts = event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : "unknown";

        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg border transition-all hover:brightness-110"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            {/* Score pill */}
            <div className="flex flex-col items-center shrink-0 w-10">
              <span className="text-lg font-black leading-none" style={{ color: cfg.color }}>{event.threat_score}</span>
              <span className="text-[8px] text-gray-600 uppercase tracking-widest">/100</span>
              {cfg.pulse && <span className="mt-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />}
            </div>

            {/* Icon */}
            <div className="p-1.5 rounded-md shrink-0" style={{ background: `${cfg.color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                <Badge className="text-[9px] px-1.5 py-0 border-0 shrink-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {event.severity?.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-white/10 text-gray-500 shrink-0">
                  {event.domain}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{event.description || "No description"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-gray-600">{event.source_tool?.replace('_', ' ').toUpperCase()}</span>
                {event.location_data?.country && (
                  <span className="text-[10px] text-gray-600">📍 {event.location_data.city ? `${event.location_data.city}, ` : ''}{event.location_data.country}</span>
                )}
                <span className="text-[10px] text-gray-700 ml-auto">{ts}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}