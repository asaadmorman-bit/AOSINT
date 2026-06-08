import React from "react";
import { AlertTriangle, Eye, Database, MapPin, Phone, Share2 } from "lucide-react";

const EXPOSURE_VECTORS = [
  { label: "Location Tracking", risk: "critical", icon: MapPin, desc: "Persistent geo-data harvested via GoLaxy SDK integrations" },
  { label: "Contact Graph", risk: "critical", icon: Share2, desc: "Social network mapping of principals and associates" },
  { label: "Behavioral Profiling", risk: "high", icon: Eye, desc: "App-usage patterns correlated with routine behavior" },
  { label: "Device Fingerprinting", risk: "high", icon: Phone, desc: "Cross-app UID linking for persistent tracking" },
  { label: "Data Brokerage", risk: "high", icon: Database, desc: "Aggregated data sold to PRC-linked intelligence collectors" },
];

const riskColors = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#00d4ff",
};

export default function GoLaxyExposure() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-3.5 h-3.5 text-[#ff4757]" />
        <p className="text-[10px] text-[#ff4757] uppercase tracking-widest font-bold">GoLaxy / PRC Data Correlation Vectors</p>
      </div>
      {EXPOSURE_VECTORS.map(v => {
        const Icon = v.icon;
        const color = riskColors[v.risk] || "#6b7280";
        return (
          <div key={v.label} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
            <div>
              <p className="text-xs font-semibold" style={{ color }}>{v.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{v.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}