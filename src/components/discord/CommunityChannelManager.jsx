import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Hash, Lock, Globe, Plus, Trash2, ExternalLink, UserPlus,
  Users, Loader2, CheckCircle2, AlertCircle, Tag, RefreshCw
} from "lucide-react";

const PREFERENCE_OPTIONS = [
  "Threat Actors", "Vulnerabilities", "OSINT", "Dark Web", "Malware",
  "Ransomware", "Geopolitical", "Critical Infrastructure", "Phishing",
  "Supply Chain", "AI/ML Threats", "Compliance", "Nation State", "Indicators",
];

const CATEGORY_OPTIONS = [
  { value: "intelligence", label: "Intelligence" },
  { value: "threats", label: "Threats" },
  { value: "alerts", label: "Alerts" },
  { value: "community", label: "Community" },
  { value: "gov", label: "Gov / CI" },
  { value: "enterprise", label: "Enterprise" },
];

export default function CommunityChannelManager() {
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [inviteState, setInviteState] = useState({});

  const [form, setForm] = useState({
    discord_server_id: "",
    channel_name: "",
    topic: "",
    category: "community",
    is_private: false,
    preferences: [],
    allowed_user_ids: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoadingServers(true);
    const [svrs, chs] = await Promise.all([
      base44.entities.DiscordThreatServer.list("-created_date", 50),
      base44.entities.DiscordThreatChannel.filter({ channel_type: "community" }, "-created_date", 100),
    ]);
    setServers(svrs);
    setChannels(chs);
    setLoadingServers(false);
    if (svrs.length > 0 && !form.discord_server_id) {
      setForm(f => ({ ...f, discord_server_id: svrs[0].discord_server_id }));
    }
  }

  function togglePref(pref) {
    setForm(f => ({
      ...f,
      preferences: f.preferences.includes(pref)
        ? f.preferences.filter(p => p !== pref)
        : [...f.preferences, pref],
    }));
  }

  async function handleCreate() {
    if (!form.channel_name || !form.discord_server_id) return;
    setCreating(true);
    setResult(null);

    const allowedIds = form.allowed_user_ids
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const selectedServer = servers.find(s => s.discord_server_id === form.discord_server_id);

    const res = await base44.functions.invoke("manageCommunityChannel", {
      action: "create",
      discord_server_id: form.discord_server_id,
      server_record_id: selectedServer?.id,
      channel_name: form.channel_name,
      topic: form.topic,
      category: form.category,
      is_private: form.is_private,
      preferences: form.preferences,
      allowed_user_ids: allowedIds,
    });

    setResult(res.data);
    setCreating(false);

    if (res.data?.success) {
      setForm(f => ({ ...f, channel_name: "", topic: "", preferences: [], allowed_user_ids: "" }));
      setShowForm(false);
      loadData();
    }
  }

  async function handleDelete(ch) {
    await base44.functions.invoke("manageCommunityChannel", {
      action: "delete",
      discord_channel_id: ch.discord_channel_id,
    });
    loadData();
  }

  async function handleInvite(ch, e) {
    e.preventDefault();
    const userId = inviteState[ch.id]?.userId?.trim();
    if (!userId) return;
    setInviteState(s => ({ ...s, [ch.id]: { ...s[ch.id], loading: true, done: false } }));

    const res = await base44.functions.invoke("manageCommunityChannel", {
      action: "invite_user",
      discord_server_id: ch.discord_server_id,
      discord_user_id: userId,
      private_role_id: inviteState[ch.id]?.roleId,
    });

    setInviteState(s => ({
      ...s,
      [ch.id]: { userId: "", roleId: s[ch.id]?.roleId, loading: false, done: res.data?.success },
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00d4ff]" /> Community Channels
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Create private or open Discord channels tailored to users' intelligence preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={loadData} className="text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowForm(v => !v)}
            className="bg-[#00d4ff] hover:bg-[#0099cc] text-black text-sm font-semibold gap-2"
          >
            <Plus className="w-4 h-4" /> New Channel
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-[#111827] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm">Create Community Channel</h3>

          {/* Server picker */}
          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Discord Server</Label>
            {loadingServers ? (
              <div className="text-gray-500 text-sm">Loading servers…</div>
            ) : servers.length === 0 ? (
              <div className="text-yellow-400 text-sm">No servers connected. Add one in the Servers tab first.</div>
            ) : (
              <select
                value={form.discord_server_id}
                onChange={e => setForm(f => ({ ...f, discord_server_id: e.target.value }))}
                className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                {servers.map(s => (
                  <option key={s.id} value={s.discord_server_id}>
                    {s.name} ({s.discord_server_id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Channel name + topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">Channel Name *</Label>
              <Input
                placeholder="e.g. ransomware-watchlist"
                value={form.channel_name}
                onChange={e => setForm(f => ({ ...f, channel_name: e.target.value }))}
                className="bg-[#1a2235] border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">Category</Label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#1a2235] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-gray-400 text-xs">Channel Topic / Description</Label>
            <Input
              placeholder="e.g. Track ransomware campaigns targeting healthcare orgs"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="bg-[#1a2235] border-white/10 text-white placeholder:text-gray-600"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> Intel Focus / Preferences</Label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePref(p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.preferences.includes(p)
                      ? "bg-[#00d4ff]/20 border-[#00d4ff]/50 text-[#00d4ff]"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Private toggle */}
          <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
            <Switch
              checked={form.is_private}
              onCheckedChange={v => setForm(f => ({ ...f, is_private: v }))}
              id="is-private"
            />
            <Label htmlFor="is-private" className="text-white text-sm cursor-pointer">
              {form.is_private ? (
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-yellow-400" /> Private — invite-only access</span>
              ) : (
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#00d4ff]" /> Open — all server members can view</span>
              )}
            </Label>
          </div>

          {/* Allowed user IDs (private only) */}
          {form.is_private && (
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Initial Discord User IDs to invite (comma separated)
              </Label>
              <Input
                placeholder="e.g. 123456789012345678, 987654321098765432"
                value={form.allowed_user_ids}
                onChange={e => setForm(f => ({ ...f, allowed_user_ids: e.target.value }))}
                className="bg-[#1a2235] border-white/10 text-white placeholder:text-gray-600 font-mono text-sm"
              />
              <p className="text-gray-600 text-xs">Find Discord User IDs via Developer Mode → right-click user → Copy User ID</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${result.success ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              {result.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <div>
                {result.success
                  ? <>Channel <strong>#{result.channel_name}</strong> created! {result.is_private && `Role assigned to ${result.assigned_users?.length || 0} users. `}
                    <a href={result.discord_url} target="_blank" rel="noopener noreferrer" className="underline ml-1">Open in Discord ↗</a></>
                  : result.error}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => { setShowForm(false); setResult(null); }} className="text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.channel_name || !form.discord_server_id}
              className="bg-[#00d4ff] hover:bg-[#0099cc] text-black font-semibold gap-2"
            >
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Channel</>}
            </Button>
          </div>
        </div>
      )}

      {/* Existing community channels */}
      {loadingServers ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading channels…
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No community channels yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map(ch => (
            <ChannelCard
              key={ch.id}
              ch={ch}
              inviteState={inviteState}
              setInviteState={setInviteState}
              onInvite={handleInvite}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelCard({ ch, inviteState, setInviteState, onInvite, onDelete }) {
  const [showInvite, setShowInvite] = useState(false);
  const inv = inviteState[ch.id] || {};

  return (
    <div className="bg-[#111827] border border-white/8 rounded-xl p-4 space-y-3 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="w-4 h-4 text-[#00d4ff] shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{ch.channel_name || ch.threat_name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {ch.discord_channel_id && (
            <a
              href={`https://discord.com/channels/${ch.discord_server_id}/${ch.discord_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#00d4ff] transition-colors"
              title="Open in Discord"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onDelete(ch)}
            className="text-gray-600 hover:text-red-400 transition-colors ml-1"
            title="Delete channel"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 text-[10px]">
          community
        </Badge>
        <Badge className="bg-white/5 text-gray-400 border-white/10 text-[10px]">
          {ch.discord_server_id?.slice(-6) || "—"}
        </Badge>
        {ch.discord_channel_id && (
          <span className="text-gray-600 text-[10px] font-mono">#{ch.discord_channel_id.slice(-6)}</span>
        )}
      </div>

      {/* Invite user (only useful if they know the private role ID) */}
      {ch.discord_channel_id && (
        <div>
          <button
            onClick={() => setShowInvite(v => !v)}
            className="text-xs text-[#00d4ff] hover:underline flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> {showInvite ? "Hide" : "Invite User"}
          </button>
          {showInvite && (
            <form onSubmit={e => onInvite(ch, e)} className="mt-2 space-y-1.5">
              <Input
                placeholder="Discord Role ID"
                value={inv.roleId || ""}
                onChange={e => setInviteState(s => ({ ...s, [ch.id]: { ...s[ch.id], roleId: e.target.value } }))}
                className="bg-[#1a2235] border-white/10 text-white placeholder:text-gray-600 text-xs font-mono h-8"
              />
              <Input
                placeholder="Discord User ID to invite"
                value={inv.userId || ""}
                onChange={e => setInviteState(s => ({ ...s, [ch.id]: { ...s[ch.id], userId: e.target.value } }))}
                className="bg-[#1a2235] border-white/10 text-white placeholder:text-gray-600 text-xs font-mono h-8"
              />
              <Button type="submit" size="sm" disabled={inv.loading} className="w-full bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 text-[#00d4ff] text-xs h-7">
                {inv.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : inv.done ? <><CheckCircle2 className="w-3 h-3" /> Invited!</> : "Assign Access"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}