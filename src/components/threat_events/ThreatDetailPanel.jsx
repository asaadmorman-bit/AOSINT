import React from "react";
import { X, AlertTriangle, Shield, Globe, Wifi, Activity, Camera, MapPin, Clock, Tag, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";

const SEVERITY_CONFIG = {
  critical:      { color: "#ff4757", bg: "rgba(255,71,87,0.08)",  border: "rgba(255,71,87,0.2)"  },
  high:          { color: "#ffa502", bg: "rgba(255,165,2,0.08)",  border: "rgba(255,165,2,0.2)"  },
  medium:        { color: "#00d4ff", bg: "rgba(0,212,255,0.06)",  border: "rgba(0,212,255,0.18)" },
  low:           { color: "#2ed573", bg: "rgba(46,213,115,0.06)", border: "rgba(46,213,115,0.18)"},
  informational: { color: "#6b7280", bg: "rgba(107,114,128,0.06)",border: "rgba(107,114,128,0.15)"},
};

const SOURCE_ICONS = {
  shodan: Wifi, virustotal: Shield, alienvault: Globe,
  osint: Globe, siem: Activity, physical_sensor: AlertTriangle,
  ip_camera: Camera, access_control: Shield, edr: Shield,
};

function Row({ icon: Icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-white/5 last:border-0">
      <Icon className="w-3.5 h-3.5 text-gray-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] text-gray-600 uppercase tracking-widest">{label}</p>
        <p className={`text-xs text-gray-200 mt-0.5 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ThreatDetailPanel({ feature, onClose }) {
  if (!feature) return null;

  const isEP = feature.layer_type === "ep_asset";
  const cfg = isEP
    ? { color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)" }
    : (SEVERITY_CONFIG[feature.severity] ?? SEVERITY_CONFIG.informational);

  const Icon = SOURCE_ICONS[feature.source_tool] ?? Activity;
  const ts = feature.timestamp
    ? `${format(new Date(feature.timestamp), "MMM d, yyyy HH:mm")} (${formatDistanceToNow(new Date(feature.timestamp), { addSuffix: true })})`
    : null;

  const geo = [feature.city, feature.country].filter(Boolean).join(", ");

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "#0d1220", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/5 shrink-0" style={{ background: cfg.bg }}>
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg shrink-0" style={{ background: `${cfg.color}20` }}>
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isEP ? (
                <Badge className="text-[9px] border-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>EP ASSET</Badge>
              ) : (
                <Badge className="text-[9px] border-0" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {(feature.severity || "").toUpperCase()}
                </Badge>
              )}
              {feature.domain && (
                <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">{feature.domain}</Badge>
              )}
              {feature.status && (
                <Badge variant="outline" className="text-[9px] border-white/10 text-gray-500">{feature.status}</Badge>
              )}
            </div>
            <h2 className="text-sm font-bold text-white leading-tight">{feature.title}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Score bar */}
      {!isEP && (
        <div className="px-4 py-3 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Threat Score</span>
            <span className="text-sm font-black" style={{ color: cfg.color }}>{feature.threat_score}/100</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${feature.threat_score || 0}%`, background: cfg.color }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {feature.description && (
          <p className="text-xs text-gray-400 leading-relaxed py-3 border-b border-white/5">{feature.description}</p>
        )}
        <Row icon={Clock}    label="Timestamp"   value={ts} />
        <Row icon={Activity} label="Source"       value={feature.source_tool?.replace(/_/g, " ").toUpperCase()} />
        <Row icon={MapPin}   label="Location"     value={geo || null} />
        <Row icon={Globe}    label="IP Address"   value={feature.ip_address} mono />
        <Row icon={Hash}     label="Event ID"     value={feature.id} mono />
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-white/5 shrink-0 flex gap-2">
        <button className="flex-1 text-xs font-semibold py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          Acknowledge
        </button>
        <button
          className="flex-1 text-xs font-semibold py-2 rounded-lg transition-colors"
          style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          Escalate
        </button>
      </div>
    </div>
  );
}