import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const data = await base44.entities.NotificationSettings.filter({
          user_email: currentUser.email,
        });

        if (data.length) {
          setSettings(data[0]);
        } else {
          setSettings({
            user_email: currentUser.email,
            failed_login_enabled: true,
            failed_login_email: true,
            failed_login_threshold: 5,
            radius_failure_enabled: true,
            radius_failure_email: true,
            mfa_failure_enabled: true,
            mfa_failure_email: true,
            vulnerability_enabled: true,
            vulnerability_email: true,
            vulnerability_min_severity: 'high',
            osint_enabled: true,
            osint_email: true,
            campaign_enabled: true,
            campaign_email: true,
            sentinel_enabled: true,
            sentinel_email: true,
            notification_digest: 'immediate',
            quiet_hours_enabled: false,
          });
        }
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.NotificationSettings.update(settings.id, settings);
      } else {
        await base44.entities.NotificationSettings.create({
          ...settings,
          updated_at: new Date().toISOString(),
        });
      }
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin" />;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-[#00d4ff]" />
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
      </div>

      {/* Failed Login Attempts */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Failed Login Attempts</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.failed_login_enabled}
              onChange={(e) =>
                setSettings({ ...settings, failed_login_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.failed_login_email}
              onChange={(e) =>
                setSettings({ ...settings, failed_login_email: e.target.checked })
              }
              disabled={!settings.failed_login_enabled}
            />
            Send email
          </label>
          <div>
            <label className="text-xs text-gray-400">Threshold (failed attempts):</label>
            <input
              type="number"
              value={settings.failed_login_threshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  failed_login_threshold: parseInt(e.target.value),
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      {/* RADIUS Failures */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">RADIUS Server Failures</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.radius_failure_enabled}
              onChange={(e) =>
                setSettings({ ...settings, radius_failure_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.radius_failure_email}
              onChange={(e) =>
                setSettings({ ...settings, radius_failure_email: e.target.checked })
              }
              disabled={!settings.radius_failure_enabled}
            />
            Send email
          </label>
        </div>
      </div>

      {/* MFA Failures */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">MFA Failures & Suspicious Activity</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.mfa_failure_enabled}
              onChange={(e) =>
                setSettings({ ...settings, mfa_failure_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.mfa_failure_email}
              onChange={(e) =>
                setSettings({ ...settings, mfa_failure_email: e.target.checked })
              }
              disabled={!settings.mfa_failure_enabled}
            />
            Send email
          </label>
        </div>
      </div>

      {/* Vulnerabilities */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Vulnerability Alerts</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.vulnerability_enabled}
              onChange={(e) =>
                setSettings({ ...settings, vulnerability_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.vulnerability_email}
              onChange={(e) =>
                setSettings({ ...settings, vulnerability_email: e.target.checked })
              }
              disabled={!settings.vulnerability_enabled}
            />
            Send email
          </label>
          <div>
            <label className="text-xs text-gray-400">Minimum severity:</label>
            <select
              value={settings.vulnerability_min_severity}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  vulnerability_min_severity: e.target.value,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm mt-1"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* OSINT Findings */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">OSINT Findings</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.osint_enabled}
              onChange={(e) =>
                setSettings({ ...settings, osint_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.osint_email}
              onChange={(e) =>
                setSettings({ ...settings, osint_email: e.target.checked })
              }
              disabled={!settings.osint_enabled}
            />
            Send email
          </label>
        </div>
      </div>

      {/* Campaign Events */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Campaign Events</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.campaign_enabled}
              onChange={(e) =>
                setSettings({ ...settings, campaign_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.campaign_email}
              onChange={(e) =>
                setSettings({ ...settings, campaign_email: e.target.checked })
              }
              disabled={!settings.campaign_enabled}
            />
            Send email
          </label>
        </div>
      </div>

      {/* Sentinel Updates */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Izulu Sentinel Updates</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.sentinel_enabled}
              onChange={(e) =>
                setSettings({ ...settings, sentinel_enabled: e.target.checked })
              }
            />
            Enable notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.sentinel_email}
              onChange={(e) =>
                setSettings({ ...settings, sentinel_email: e.target.checked })
              }
              disabled={!settings.sentinel_enabled}
            />
            Send email
          </label>
        </div>
      </div>

      {/* Digest Options */}
      <div className="border border-white/10 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-3">Notification Delivery</h4>
        <div className="space-y-2">
          <label className="text-xs text-gray-400">How to receive notifications:</label>
          <select
            value={settings.notification_digest}
            onChange={(e) =>
              setSettings({ ...settings, notification_digest: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
          >
            <option value="immediate">Immediate</option>
            <option value="hourly">Hourly Digest</option>
            <option value="daily">Daily Digest</option>
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}