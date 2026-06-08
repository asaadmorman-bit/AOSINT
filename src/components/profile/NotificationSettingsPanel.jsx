import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, CheckCircle2, Mail, MessageSquare, LayoutDashboard, Smartphone } from "lucide-react";

const THREAT_TYPES = [
  { value: "credential_leak", label: "Credential Leaks" },
  { value: "domain_compromise", label: "Domain Compromise" },
  { value: "malware", label: "Malware" },
  { value: "ransomware", label: "Ransomware" },
  { value: "vulnerability", label: "Vulnerabilities" },
  { value: "threat_actor", label: "Threat Actors" },
  { value: "dark_web", label: "Dark Web Mentions" },
  { value: "phishing", label: "Phishing" },
  { value: "data_breach", label: "Data Breaches" },
  { value: "supply_chain", label: "Supply Chain" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "#3b82f6" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#ef4444" },
  { value: "critical", label: "Critical", color: "#7c3aed" },
];

const DATA_SOURCES = [
  { value: "osint_feeds", label: "OSINT Feeds" },
  { value: "lea_intelligence", label: "LEA Intelligence" },
  { value: "vulnerability_scans", label: "Vulnerability Scans" },
  { value: "dark_web_monitoring", label: "Dark Web Monitoring" },
  { value: "threat_actors", label: "Threat Actors" },
  { value: "campaigns", label: "Campaigns" },
];

const CHANNELS = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS / Text", icon: Smartphone },
  { value: "discord", label: "Discord", icon: MessageSquare },
];

export default function NotificationSettingsPanel({ user }) {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(null);
  const queryClient = useQueryClient();

  const { data: notificationSettings, isLoading } = useQuery({
    queryKey: ["notification_settings", user?.email],
    queryFn: () =>
      base44.entities.NotificationSettings.filter(
        { user_email: user?.email },
        "-created_date",
        1
      ).then(results => results?.[0] || null),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (notificationSettings) {
      setSettings(notificationSettings);
    } else if (user?.email && !isLoading) {
      setSettings({
        user_email: user.email,
        threat_types: [],
        severity_levels: ["high", "critical"],
        data_sources: [],
        notification_channels: ["dashboard"],
        batch_notifications: false,
        batch_interval_minutes: 60,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "08:00",
        is_enabled: true,
      });
    }
  }, [notificationSettings, user?.email, isLoading]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (settings?.id) {
        return base44.entities.NotificationSettings.update(settings.id, data);
      } else {
        return base44.entities.NotificationSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification_settings", user?.email],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const toggleArrayItem = (key, value) => {
    setSettings({
      ...settings,
      [key]: settings[key].includes(value)
        ? settings[key].filter(item => item !== value)
        : [...settings[key], value],
    });
  };

  if (isLoading) {
    return (
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4">
      {/* Notifications Toggle */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#00d4ff]" /> Notification Settings
          </h2>
          <button
            onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              settings.is_enabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}
          >
            {settings.is_enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Notification Channels</h3>
        <p className="text-xs text-gray-400 mb-3">Where should we send your alerts?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            const isSelected = settings.notification_channels.includes(channel.value);
            return (
              <button
                key={channel.value}
                onClick={() => toggleArrayItem("notification_channels", channel.value)}
                className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{channel.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact Details for Email/SMS */}
      {(settings.notification_channels.includes('email') || settings.notification_channels.includes('sms')) && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Delivery Contact Details</h3>
          {settings.notification_channels.includes('email') && (
            <div>
              <Label className="text-xs text-gray-400">Email Address for Alerts</Label>
              <Input
                type="email"
                placeholder={user?.email || "your@email.com"}
                value={settings.email_address || ""}
                onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
              <p className="text-[11px] text-gray-600 mt-1">Leave blank to use your account email</p>
            </div>
          )}
          {settings.notification_channels.includes('sms') && (
            <div>
              <Label className="text-xs text-gray-400">Phone Number for SMS Alerts</Label>
              <Input
                type="tel"
                placeholder="+12025551234"
                value={settings.phone_number || ""}
                onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
              <p className="text-[11px] text-gray-600 mt-1">Include country code (e.g. +1 for US)</p>
            </div>
          )}
        </div>
      )}

      {/* Threat Types */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Threat Types to Monitor</h3>
        <p className="text-xs text-gray-400 mb-3">
          Select the types of threats you want to be alerted about.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THREAT_TYPES.map(threat => (
            <label
              key={threat.value}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                settings.threat_types.includes(threat.value)
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={settings.threat_types.includes(threat.value)}
                onChange={() => toggleArrayItem("threat_types", threat.value)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">{threat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Severity Levels */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Severity Levels</h3>
        <p className="text-xs text-gray-400 mb-3">Which severity levels should trigger alerts?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SEVERITY_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => toggleArrayItem("severity_levels", level.value)}
              className={`p-3 rounded-lg border transition-all text-center ${
                settings.severity_levels.includes(level.value)
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 opacity-50"
              }`}
              style={{
                borderColor: settings.severity_levels.includes(level.value)
                  ? level.color
                  : undefined,
              }}
            >
              <div
                className="text-xs font-bold mb-1"
                style={{
                  color: settings.severity_levels.includes(level.value)
                    ? level.color
                    : "#9ca3af",
                }}
              >
                {level.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Data Sources</h3>
        <p className="text-xs text-gray-400 mb-3">Which data sources should feed your alerts?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DATA_SOURCES.map(source => (
            <label
              key={source.value}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                settings.data_sources.includes(source.value)
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="checkbox"
                checked={settings.data_sources.includes(source.value)}
                onChange={() => toggleArrayItem("data_sources", source.value)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">{source.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Batch Settings */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Batch Notifications</h3>
          <button
            onClick={() => setSettings({ ...settings, batch_notifications: !settings.batch_notifications })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              settings.batch_notifications
                ? "bg-blue-500/20 text-blue-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {settings.batch_notifications ? "On" : "Off"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Group alerts together instead of sending them individually
        </p>
        {settings.batch_notifications && (
          <div>
            <Label className="text-xs text-gray-400">Batch Interval (minutes)</Label>
            <Input
              type="number"
              min="5"
              max="1440"
              value={settings.batch_interval_minutes}
              onChange={(e) => setSettings({ ...settings, batch_interval_minutes: parseInt(e.target.value) })}
              className="mt-1 bg-white/5 border-white/10 text-white"
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending || saved}
        className={saved ? "w-full bg-green-600 hover:bg-green-600" : "w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]"}
      >
        {saveMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4 mr-2" />
        ) : null}
        {saveMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Notification Settings"}
      </Button>
    </div>
  );
}