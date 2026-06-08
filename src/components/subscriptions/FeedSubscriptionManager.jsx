import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Loader2, Mail, Shield, Zap, Rss, Save, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { value: "high", label: "High", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { value: "low", label: "Low", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
];

const ALERT_TYPE_OPTIONS = [
  { value: "vulnerability", label: "Vulnerabilities", icon: Shield },
  { value: "threat_actor", label: "Threat Actors", icon: AlertCircle },
  { value: "osint_alert", label: "OSINT Alerts", icon: Rss },
  { value: "vendor_advisory", label: "Vendor Advisories", icon: Bell },
  { value: "threat_indicator", label: "Threat Indicators", icon: Zap },
];

const FREQUENCY_OPTIONS = [
  { value: "realtime", label: "Real-time", desc: "Instant alert on every new event" },
  { value: "daily_digest", label: "Daily Digest", desc: "One summary email per day" },
  { value: "weekly_digest", label: "Weekly Digest", desc: "One summary email per week" },
];

export default function FeedSubscriptionManager() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: feeds = [] } = useQuery({
    queryKey: ["threatFeeds"],
    queryFn: () => base44.entities.ThreatFeed.filter({ status: "active" }, "name", 50),
  });

  const { data: existingSub, isLoading } = useQuery({
    queryKey: ["myFeedSub", user?.email],
    queryFn: () => base44.entities.FeedAlertSubscription.filter({ user_email: user.email }, "-created_date", 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const [form, setForm] = useState({
    notification_email: "",
    alert_severities: ["critical"],
    alert_types: ["vulnerability"],
    frequency: "realtime",
    email_enabled: true,
    subscribed_feed_ids: [],
    subscribed_feed_names: [],
  });

  useEffect(() => {
    if (existingSub) {
      setForm({
        notification_email: existingSub.notification_email || user?.email || "",
        alert_severities: existingSub.alert_severities || ["critical"],
        alert_types: existingSub.alert_types || ["vulnerability"],
        frequency: existingSub.frequency || "realtime",
        email_enabled: existingSub.email_enabled !== false,
        subscribed_feed_ids: existingSub.subscribed_feed_ids || [],
        subscribed_feed_names: existingSub.subscribed_feed_names || [],
      });
    } else if (user?.email) {
      setForm(f => ({ ...f, notification_email: user.email }));
    }
  }, [existingSub, user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSub) {
        return base44.entities.FeedAlertSubscription.update(existingSub.id, data);
      } else {
        return base44.entities.FeedAlertSubscription.create({
          ...data,
          user_email: user.email,
          user_name: user.full_name || "",
          is_active: true,
          alert_count: 0,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFeedSub"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggleSeverity = (val) => {
    setForm(f => ({
      ...f,
      alert_severities: f.alert_severities.includes(val)
        ? f.alert_severities.filter(s => s !== val)
        : [...f.alert_severities, val]
    }));
  };

  const toggleAlertType = (val) => {
    setForm(f => ({
      ...f,
      alert_types: f.alert_types.includes(val)
        ? f.alert_types.filter(s => s !== val)
        : [...f.alert_types, val]
    }));
  };

  const toggleFeed = (feed) => {
    setForm(f => {
      const isSelected = f.subscribed_feed_ids.includes(feed.id);
      return {
        ...f,
        subscribed_feed_ids: isSelected
          ? f.subscribed_feed_ids.filter(id => id !== feed.id)
          : [...f.subscribed_feed_ids, feed.id],
        subscribed_feed_names: isSelected
          ? f.subscribed_feed_names.filter(n => n !== feed.name)
          : [...f.subscribed_feed_names, feed.name],
      };
    });
  };

  const handleSave = () => saveMutation.mutate(form);

  if (!user) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <Bell className="w-8 h-8 text-[#00d4ff] mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Sign in to configure your alert subscriptions</p>
        <Button className="mt-3 bg-[#00d4ff] text-black text-sm" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-lg font-bold text-white">Alert Subscriptions</h2>
          {existingSub?.is_active && (
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">Active</Badge>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || !form.notification_email}
          className="bg-[#00d4ff] text-black text-sm font-bold gap-1.5"
        >
          {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved!" : "Save Preferences"}
        </Button>
      </div>

      {/* Email */}
      <Card className="bg-[#0d1220] border-white/5 p-4">
        <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Alert Email Address
        </label>
        <input
          type="email"
          value={form.notification_email}
          onChange={e => setForm(f => ({ ...f, notification_email: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
          placeholder="your@email.com"
        />
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="email_enabled"
            checked={form.email_enabled}
            onChange={e => setForm(f => ({ ...f, email_enabled: e.target.checked }))}
            className="w-4 h-4 accent-[#00d4ff]"
          />
          <label htmlFor="email_enabled" className="text-sm text-gray-300 cursor-pointer">Email notifications enabled</label>
        </div>
      </Card>

      {/* Severity */}
      <Card className="bg-[#0d1220] border-white/5 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Alert on Severity</p>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => toggleSeverity(s.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                form.alert_severities.includes(s.value)
                  ? s.color + " ring-1 ring-current"
                  : "bg-white/5 text-gray-500 border-white/10 hover:border-white/20"
              }`}
            >
              {form.alert_severities.includes(s.value) && <Check className="inline w-3 h-3 mr-1" />}
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Alert Types */}
      <Card className="bg-[#0d1220] border-white/5 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Alert Types</p>
        <div className="grid grid-cols-2 gap-2">
          {ALERT_TYPE_OPTIONS.map(t => {
            const Icon = t.icon;
            const active = form.alert_types.includes(t.value);
            return (
              <button
                key={t.value}
                onClick={() => toggleAlertType(t.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                    : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {active && <Check className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Frequency */}
      <Card className="bg-[#0d1220] border-white/5 p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Frequency</p>
        <div className="space-y-2">
          {FREQUENCY_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setForm(prev => ({ ...prev, frequency: f.value }))}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                form.frequency === f.value
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                form.frequency === f.value ? "border-[#00d4ff] bg-[#00d4ff]" : "border-gray-600"
              }`}>
                {form.frequency === f.value && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${form.frequency === f.value ? "text-[#00d4ff]" : "text-gray-300"}`}>{f.label}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Feed Selection */}
      {feeds.length > 0 && (
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Subscribe to Feeds</p>
          <p className="text-[11px] text-gray-500 mb-3">Leave all unchecked to receive alerts from all active feeds</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {feeds.map(feed => (
              <label key={feed.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.subscribed_feed_ids.includes(feed.id)}
                  onChange={() => toggleFeed(feed)}
                  className="w-4 h-4 accent-[#00d4ff]"
                />
                <span className="text-sm text-gray-300">{feed.name}</span>
                <span className="text-[10px] text-gray-500 ml-auto">{feed.feed_type}</span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {existingSub && (
        <div className="text-[11px] text-gray-600 text-center">
          {existingSub.alert_count > 0 && `${existingSub.alert_count} alert(s) sent · `}
          Last alerted: {existingSub.last_alerted_at ? new Date(existingSub.last_alerted_at).toLocaleDateString() : "Never"}
        </div>
      )}
    </div>
  );
}