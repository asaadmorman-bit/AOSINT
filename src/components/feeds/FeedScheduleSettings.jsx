import React, { useState } from "react";
import { Settings, Zap, Clock, Timer, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const SPEED_OPTIONS = [
  { value: "realtime", label: "Realtime", desc: "Every 5 min", color: "#ff4757" },
  { value: "fast", label: "Fast", desc: "Every 15 min", color: "#ff6b35" },
  { value: "normal", label: "Normal", desc: "Every hour", color: "#00d4ff" },
  { value: "slow", label: "Slow", desc: "Every 4 hours", color: "#6b7280" },
];

const SEVERITY_OPTS = [
  { value: "info", color: "#6b7280" },
  { value: "low", color: "#2ed573" },
  { value: "medium", color: "#ffa502" },
  { value: "high", color: "#ff6b35" },
  { value: "critical", color: "#ff4757" },
];

export default function FeedScheduleSettings({ channel, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    auto_push_enabled: channel.auto_push_enabled || false,
    push_speed: channel.push_speed || "normal",
    push_duration_hours: channel.push_duration_hours ?? 24,
    push_severity_filter: channel.push_severity_filter || [],
  });

  const toggleSeverity = (val) => {
    setSettings(s => ({
      ...s,
      push_severity_filter: s.push_severity_filter.includes(val)
        ? s.push_severity_filter.filter(x => x !== val)
        : [...s.push_severity_filter, val],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.FeedChannel.update(channel.id, settings);
    setSaving(false);
    setOpen(false);
    onUpdated?.();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-[#00d4ff] transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
        title="Feed Schedule Settings"
      >
        <Settings className="w-3 h-3" />
        <span>{settings.auto_push_enabled ? `Auto: ${settings.push_speed}` : "Schedule"}</span>
        {settings.auto_push_enabled && <span className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 bg-[#0d1220] border border-white/10 rounded-xl shadow-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Discord Push Schedule</span>
            <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
          </div>

          {/* Enable toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-gray-400 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Auto-push to Discord</span>
            <div
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${settings.auto_push_enabled ? "bg-[#00d4ff]" : "bg-white/10"}`}
              onClick={() => setSettings(s => ({ ...s, auto_push_enabled: !s.auto_push_enabled }))}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.auto_push_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </label>

          {settings.auto_push_enabled && (
            <>
              {/* Speed */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Push Speed</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SPEED_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSettings(s => ({ ...s, push_speed: opt.value }))}
                      className={`text-left px-2 py-1.5 rounded-lg border text-[10px] transition-all ${settings.push_speed === opt.value ? "border-current" : "border-white/10 text-gray-500 hover:border-white/20"}`}
                      style={settings.push_speed === opt.value ? { color: opt.color, borderColor: opt.color, background: `${opt.color}10` } : {}}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><Timer className="w-3 h-3" /> Duration (hours, 0 = indefinite)</p>
                <input
                  type="number"
                  min={0}
                  max={720}
                  value={settings.push_duration_hours}
                  onChange={e => setSettings(s => ({ ...s, push_duration_hours: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00d4ff]"
                />
              </div>

              {/* Severity filter */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1"><Filter className="w-3 h-3" /> Severity Filter (empty = all)</p>
                <div className="flex gap-1.5 flex-wrap">
                  {SEVERITY_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleSeverity(opt.value)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all"
                      style={settings.push_severity_filter.includes(opt.value)
                        ? { color: opt.color, borderColor: opt.color, background: `${opt.color}15` }
                        : { color: "#6b7280", borderColor: "rgba(255,255,255,0.1)" }
                      }
                    >
                      {opt.value.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button size="sm" className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc] text-xs" onClick={handleSave} disabled={saving}>
            <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </div>
  );
}