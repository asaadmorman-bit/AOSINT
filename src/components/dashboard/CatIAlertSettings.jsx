import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, AlertTriangle, CheckCircle2, Loader2, Hash } from "lucide-react";

export default function CatIAlertSettings() {
  const [channelId, setChannelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const settings = await base44.entities.NotificationSettings.filter({ user_email: u.email });
      if (settings.length > 0) {
        setExisting(settings[0]);
        setChannelId(settings[0].discord_channel_id || "");
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        user_email: user.email,
        discord_channel_id: channelId,
        notification_channels: ["discord", "dashboard"],
        severity_levels: ["critical", "high"],
        is_enabled: true,
      };
      if (existing) {
        await base44.entities.NotificationSettings.update(existing.id, data);
      } else {
        const created = await base44.entities.NotificationSettings.create(data);
        setExisting(created);
      }
      setTestResult({ type: "success", message: "Settings saved." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("catIFindingsAlert", {
        feed_name: "Test Feed (RHEL 9 STIG)",
        cat1_count: 3,
        compliance_score: 72,
        platform: "Linux",
        stig_version: "V1R3",
        triggered_by: "manual_test"
      });
      if (res.data?.success) {
        setTestResult({ type: "success", message: res.data.discord_ok ? "Test alert sent to Discord!" : "Alert logged to dashboard (no Discord channel set)." });
      } else {
        setTestResult({ type: "error", message: res.data?.error || "Test failed." });
      }
    } catch (e) {
      setTestResult({ type: "error", message: e.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="text-xs text-gray-500 py-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading settings...</div>;

  const isConfigured = !!existing?.discord_channel_id;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {isConfigured
          ? <Bell className="w-4 h-4 text-[#00d4ff]" />
          : <BellOff className="w-4 h-4 text-gray-500" />}
        <h4 className="text-sm font-semibold text-white">CAT I Findings — Discord Alerts</h4>
        <Badge className={isConfigured
          ? "bg-[#2ed573]/10 text-[#2ed573] border-[#2ed573]/20 text-[10px]"
          : "bg-gray-500/10 text-gray-400 border-gray-500/20 text-[10px]"}>
          {isConfigured ? "Active" : "Not Configured"}
        </Badge>
      </div>

      <p className="text-xs text-gray-500">
        When new CAT I findings are detected in any monitored SCAP/STIG feed, an alert is automatically sent to your Discord channel and logged in the dashboard.
      </p>

      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-4 space-y-3">
        <div>
          <Label className="text-gray-400 text-xs flex items-center gap-1.5 mb-1.5">
            <Hash className="w-3 h-3" /> Discord Channel ID
          </Label>
          <Input
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            placeholder="e.g. 1234567890123456789"
            className="bg-white/5 border-white/10 text-white text-xs h-8"
          />
          <p className="text-[10px] text-gray-600 mt-1">Right-click a Discord channel → Copy Channel ID (Developer Mode required)</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] h-8 text-xs flex-1 gap-1">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Save Settings
          </Button>
          <Button onClick={handleTest} disabled={testing} variant="outline" className="border-white/10 text-gray-300 hover:text-white h-8 text-xs gap-1">
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3 text-yellow-400" />}
            Test Alert
          </Button>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
            testResult.type === "success"
              ? "bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20"
              : "bg-red-400/10 text-red-400 border border-red-400/20"
          }`}>
            {testResult.type === "success"
              ? <CheckCircle2 className="w-3 h-3 shrink-0" />
              : <AlertTriangle className="w-3 h-3 shrink-0" />}
            {testResult.message}
          </div>
        )}
      </div>

      <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2.5 text-xs text-yellow-300 flex gap-2">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-yellow-400" />
        <span>Alerts also appear in the <strong>Dashboard → Alerts</strong> section regardless of Discord configuration. Make sure your bot has <code className="bg-white/5 px-1 rounded">Send Messages</code> permission in the target channel.</span>
      </div>
    </div>
  );
}