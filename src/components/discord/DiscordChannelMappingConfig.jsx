import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Hash, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle,
  MessageSquare, Zap, Settings
} from "lucide-react";

const DATA_TYPES = [
  { value: "alerts", label: "OSINT Alerts", icon: "🚨", desc: "Threat alerts, breaches, suspicious activity" },
  { value: "indicators", label: "Threat Indicators (IOCs)", icon: "📊", desc: "IPs, domains, hashes, URLs" },
  { value: "threat_actors", label: "Threat Actors", icon: "👁️", desc: "APT groups, criminal actors, nation-state actors" },
];

const CATEGORIES = [
  { value: "general", label: "General", emoji: "🌐", desc: "Catch-all for unclassified items" },
  { value: "enterprise", label: "Enterprise", emoji: "🏢", desc: "Corporate & business sector threats" },
  { value: "government", label: "Government", emoji: "🏛️", desc: "Gov / nation-state / geopolitical intel" },
  { value: "public_information", label: "Public Info", emoji: "📢", desc: "Open-source, community, public OSINT" },
  { value: "critical_infrastructure", label: "Critical Infra", emoji: "⚡", desc: "Energy, utilities, ICS/SCADA" },
  { value: "financial", label: "Financial", emoji: "💰", desc: "Banking, fraud, ransomware, crypto" },
  { value: "healthcare", label: "Healthcare", emoji: "🏥", desc: "Medical, pharma, hospital sector" },
  { value: "law_enforcement", label: "Law Enforcement", emoji: "🔒", desc: "LEA, INTERPOL, CISA feeds" },
];

const DEFAULT_CHANNEL_NAMES = {
  alerts: "threat-alerts",
  indicators: "ioc-indicators",
  threat_actors: "threat-actors",
};

const CATEGORY_CHANNEL_SUFFIX = {
  general: "",
  enterprise: "-enterprise",
  government: "-gov",
  public_information: "-public",
  critical_infrastructure: "-infra",
  financial: "-financial",
  healthcare: "-healthcare",
  law_enforcement: "-lea",
};

export default function DiscordChannelMappingConfig({ server }) {
  const [mappings, setMappings] = useState([]);
  const [liveChannels, setLiveChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const msg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadMappings = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("manageDiscordChannelConfig", {
      action: "list",
      server_id: server.id,
    });
    setMappings(res.data?.mappings || []);
    setLoading(false);
  };

  const syncChannels = async () => {
    setSyncing(true);
    const res = await base44.functions.invoke("manageDiscordChannelConfig", {
      action: "sync_channels",
      discord_server_id: server.discord_server_id,
    });
    setLiveChannels(res.data?.channels || []);
    setSyncing(false);
  };

  useEffect(() => {
    loadMappings();
    syncChannels();
  }, [server.id]);

  const getMappingsForType = (dataType) =>
    mappings.filter(m => m.data_type === dataType);

  const saveMapping = async (dataType, category, config) => {
    const key = `${dataType}__${category}`;
    setSaving(key);
    const res = await base44.functions.invoke("manageDiscordChannelConfig", {
      action: "save",
      mapping: {
        server_id: server.id,
        discord_server_id: server.discord_server_id,
        data_type: dataType,
        category: category,
        channel_name: config.channel_name,
        channel_id: config.channel_id || null,
        auto_create: config.auto_create !== false,
        enable_threading: !!config.enable_threading,
        severity_filter: config.severity_filter || [],
        tag_filter: config.tag_filter || [],
        is_active: true,
      },
    });
    setSaving(null);
    if (res.data?.success) {
      msg(`✅ [${category}] ${dataType} mapping saved${res.data.channel_created ? " — channel created in Discord" : ""}`);
      await loadMappings();
      await syncChannels();
    } else {
      msg(`❌ ${res.data?.error || "Save failed"}`, "error");
    }
  };

  const deleteMapping = async (mappingId, label) => {
    setDeleting(mappingId);
    await base44.functions.invoke("manageDiscordChannelConfig", {
      action: "delete",
      mapping_id: mappingId,
    });
    setDeleting(null);
    msg(`Mapping for ${label} removed`);
    await loadMappings();
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading channel mappings…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-white">Channel Mappings</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure which Discord channel receives each data type.
            Enable auto-create to have channels created automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={syncChannels} disabled={syncing} className="gap-1 border-white/20 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10">
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Channels"}
        </Button>
      </div>

      {message && (
        <Alert className={message.type === "error" ? "border-red-500/30 bg-red-500/10" : "border-[#2ed573]/30 bg-[#2ed573]/10"}>
          <AlertDescription className={`text-sm ${message.type === "error" ? "text-red-400" : "text-[#2ed573]"}`}>{message.text}</AlertDescription>
        </Alert>
      )}

      {liveChannels.length > 0 && (
        <div className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg p-2 flex flex-wrap gap-1 items-center">
          <Hash className="w-3 h-3 mr-1 text-[#00d4ff]" />
          <span className="font-medium mr-1 text-gray-300">Live channels:</span>
          {liveChannels.slice(0, 15).map(ch => (
            <Badge key={ch.id} variant="outline" className="text-[10px] py-0 border-white/20 text-gray-300">{ch.name}</Badge>
          ))}
          {liveChannels.length > 15 && <span className="text-gray-500">+{liveChannels.length - 15} more</span>}
        </div>
      )}

      <div className="space-y-5">
        {DATA_TYPES.map(dt => (
          <div key={dt.value} className="space-y-2">
            <p className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <span>{dt.icon}</span> {dt.label}
              <span className="font-normal text-gray-500">— one channel per category</span>
            </p>
            <div className="space-y-2 pl-1">
              {CATEGORIES.map(cat => {
                const existingMappings = getMappingsForType(dt.value);
                const mapping = existingMappings.find(m => (m.category || 'general') === cat.value);
                const key = `${dt.value}__${cat.value}`;
                return (
                  <MappingRow
                    key={key}
                    dataType={dt}
                    category={cat}
                    mapping={mapping}
                    liveChannels={liveChannels}
                    saving={saving === key}
                    deleting={deleting}
                    onSave={(config) => saveMapping(dt.value, cat.value, config)}
                    onDelete={(id) => deleteMapping(id, `${cat.label} ${dt.label}`)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MappingRow({ dataType, category, mapping, liveChannels, saving, deleting, onSave, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const defaultName = `${DEFAULT_CHANNEL_NAMES[dataType.value] || dataType.value}${CATEGORY_CHANNEL_SUFFIX[category.value] || ''}`;

  const [config, setConfig] = useState({
    channel_name: mapping?.channel_name || defaultName,
    channel_id: mapping?.channel_id || "",
    auto_create: mapping?.auto_create !== false,
    enable_threading: mapping?.enable_threading || false,
    severity_filter: mapping?.severity_filter || [],
    tag_filter: mapping?.tag_filter || [],
  });

  useEffect(() => {
    setConfig({
      channel_name: mapping?.channel_name || defaultName,
      channel_id: mapping?.channel_id || "",
      auto_create: mapping?.auto_create !== false,
      enable_threading: mapping?.enable_threading || false,
      severity_filter: mapping?.severity_filter || [],
      tag_filter: mapping?.tag_filter || [],
    });
  }, [mapping]);

  const toggleSeverity = (sev) => {
    setConfig(prev => ({
      ...prev,
      severity_filter: prev.severity_filter.includes(sev)
        ? prev.severity_filter.filter(s => s !== sev)
        : [...prev.severity_filter, sev],
    }));
  };

  const severityColors = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-blue-100 text-blue-800 border-blue-200",
    informational: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className={`rounded-xl border transition-all ${mapping ? "border-[#2ed573]/20 bg-[#2ed573]/5" : "border-white/10 border-dashed bg-white/[0.02]"}`}>
      <div className="py-2.5 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{category.emoji}</span>
            <div>
              <p className="font-semibold text-xs text-gray-200">{category.label}</p>
              <p className="text-[10px] text-gray-500">{category.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {mapping ? (
              <Badge className="bg-[#2ed573]/15 text-[#2ed573] border-[#2ed573]/30 text-[10px] gap-1 py-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                #{mapping.channel_name}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-gray-500 border-white/15 py-0">Not set</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="pt-0 pb-3 px-3 space-y-3 border-t border-white/10">
          {/* Channel Name */}
          <div className="space-y-1 pt-3">
            <label className="text-[11px] font-semibold text-gray-400">Channel Name</label>
            <div className="flex gap-1">
              <div className="flex items-center bg-white/10 px-2 rounded-l border border-r-0 border-white/10 text-gray-400">
                <Hash className="w-3 h-3" />
              </div>
              <Input
                value={config.channel_name}
                onChange={e => setConfig({ ...config, channel_name: e.target.value.toLowerCase().replace(/\s+/g, '-'), channel_id: "" })}
                placeholder={defaultName}
                className="rounded-l-none text-xs h-7 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
              />
            </div>
            {liveChannels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] text-gray-500">Quick pick:</span>
                {liveChannels.slice(0, 10).map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setConfig({ ...config, channel_name: ch.name, channel_id: ch.id })}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      config.channel_id === ch.id
                        ? "bg-[#00d4ff]/20 border-[#00d4ff]/40 text-[#00d4ff]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                    }`}
                  >
                    #{ch.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <div className="flex items-center justify-between flex-1">
              <p className="text-[11px] font-semibold text-gray-400">Auto-create</p>
              <Switch checked={config.auto_create} onCheckedChange={v => setConfig({ ...config, auto_create: v })} />
            </div>
            <div className="flex items-center justify-between flex-1">
              <p className="text-[11px] font-semibold text-gray-400">Threading</p>
              <Switch checked={config.enable_threading} onCheckedChange={v => setConfig({ ...config, enable_threading: v })} />
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 mb-1">Severity <span className="font-normal text-gray-600">(empty = all)</span></p>
            <div className="flex flex-wrap gap-1">
              {["critical", "high", "medium", "low", "informational"].map(sev => (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`px-2 py-0.5 rounded text-[10px] border font-medium transition-all ${
                    config.severity_filter.includes(sev)
                      ? severityColors[sev]
                      : "bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSave(config)} disabled={saving || !config.channel_name} className="flex-1 h-7 text-xs gap-1 bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {saving ? "Saving…" : "Save"}
            </Button>
            {mapping && (
              <Button size="sm" variant="destructive" onClick={() => onDelete(mapping.id)} disabled={deleting === mapping.id} className="h-7 text-xs w-8 p-0">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}