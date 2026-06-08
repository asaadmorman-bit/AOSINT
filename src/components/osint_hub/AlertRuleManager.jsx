import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Edit2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TRIGGER_TYPES = [
  { value: "keyword", label: "Keyword Match" },
  { value: "severity", label: "Severity Level" },
  { value: "entity_type", label: "Entity Type" },
  { value: "intelligence_type", label: "Intelligence Type" },
  { value: "threat_actor", label: "Threat Actor" },
  { value: "combined", label: "Combined Filters" },
];

const SEVERITY_LEVELS = ["low", "medium", "high", "critical"];
const INTELLIGENCE_TYPES = ["osint", "sigint", "humint", "geoint", "techint"];
const ENTITY_TYPES = ["domain", "ip", "email", "username", "hash", "organization", "url", "phone"];
const PLATFORMS = ["tor_forum", "paste_site", "dark_web_market", "leak_site", "telegram", "i2p", "public_breach_db"];

export default function AlertRuleManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [currentUser, setCurrentUser] = useState("");

  const [form, setForm] = useState({
    rule_name: "",
    description: "",
    trigger_type: "keyword",
    keywords: "",
    negative_keywords: "",
    logic_operator: "OR",
    min_severity: "medium",
    entity_types: [],
    intelligence_types: [],
    threat_actors: "",
    source_platforms: [],
    suppression_period_hours: 0,
    notification_channels: ["in_app"],
    webhook_url: "",
    notified_users: "",
  });

  // Fetch current user
  React.useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user?.email || ""));
  }, []);

  const { data: rules = [] } = useQuery({
    queryKey: ["alertRules"],
    queryFn: () => base44.entities.AlertRule.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AlertRule.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertRules"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AlertRule.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertRules"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertRule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alertRules"] }),
  });

  const resetForm = () => {
    setForm({
      rule_name: "",
      description: "",
      trigger_type: "keyword",
      keywords: "",
      negative_keywords: "",
      logic_operator: "OR",
      min_severity: "medium",
      entity_types: [],
      intelligence_types: [],
      threat_actors: "",
      source_platforms: [],
      suppression_period_hours: 0,
      notification_channels: ["in_app"],
      webhook_url: "",
      notified_users: "",
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const data = {
      rule_name: form.rule_name,
      description: form.description,
      trigger_type: form.trigger_type,
      keywords: form.keywords ? form.keywords.split(",").map(k => k.trim()).filter(Boolean) : [],
      negative_keywords: form.negative_keywords ? form.negative_keywords.split(",").map(k => k.trim()).filter(Boolean) : [],
      logic_operator: form.logic_operator,
      min_severity: form.min_severity,
      entity_types: form.entity_types,
      intelligence_types: form.intelligence_types,
      threat_actors: form.threat_actors ? form.threat_actors.split(",").map(t => t.trim()).filter(Boolean) : [],
      source_platforms: form.source_platforms,
      suppression_period_hours: parseInt(form.suppression_period_hours) || 0,
      notification_channels: form.notification_channels,
      webhook_url: form.webhook_url,
      notified_users: form.notified_users ? form.notified_users.split(",").map(u => u.trim()).filter(Boolean) : [currentUser],
      is_enabled: true,
      created_by: currentUser,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      rule_name: rule.rule_name,
      description: rule.description || "",
      trigger_type: rule.trigger_type,
      keywords: rule.keywords?.join(", ") || "",
      negative_keywords: rule.negative_keywords?.join(", ") || "",
      logic_operator: rule.logic_operator || "OR",
      min_severity: rule.min_severity || "medium",
      entity_types: rule.entity_types || [],
      intelligence_types: rule.intelligence_types || [],
      threat_actors: rule.threat_actors?.join(", ") || "",
      source_platforms: rule.source_platforms || [],
      suppression_period_hours: rule.suppression_period_hours || 0,
      notification_channels: rule.notification_channels || ["in_app"],
      webhook_url: rule.webhook_url || "",
      notified_users: rule.notified_users?.join(", ") || currentUser,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-lg font-bold text-white">Alert Rules</h2>
          <span className="text-xs bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-1 rounded-lg">{rules.length} rules</span>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#0d1220] border-[#00d4ff]/20 p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Rule Name</label>
              <input
                type="text"
                value={form.rule_name}
                onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                placeholder="e.g., Monitor for leaked credentials"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff] resize-none"
                placeholder="What does this rule detect?"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Trigger Type</label>
                <MobileSelect
                  value={form.trigger_type}
                  onValueChange={(v) => setForm({ ...form, trigger_type: v })}
                  placeholder="Trigger Type"
                  options={TRIGGER_TYPES.map(t => ({ value: t.value, label: t.label }))}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Min Severity</label>
                <MobileSelect
                  value={form.min_severity}
                  onValueChange={(v) => setForm({ ...form, min_severity: v })}
                  placeholder="Min Severity"
                  options={SEVERITY_LEVELS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Logic Operator</label>
                <MobileSelect
                  value={form.logic_operator}
                  onValueChange={(v) => setForm({ ...form, logic_operator: v })}
                  placeholder="Logic Operator"
                  options={[
                    { value: "OR", label: "OR (any match)" },
                    { value: "AND", label: "AND (all match)" },
                  ]}
                />
                <p className="text-[11px] text-gray-500 mt-1">Combine multiple conditions</p>
              </div>
            </div>

            {(form.trigger_type === "keyword" || form.trigger_type === "combined") && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                    placeholder="e.g., password, credential, breach"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Negative Keywords (exclude)</label>
                  <input
                    type="text"
                    value={form.negative_keywords}
                    onChange={(e) => setForm({ ...form, negative_keywords: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                    placeholder="e.g., test, false, irrelevant"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Alerts matching negative keywords will be excluded</p>
                </div>
              </>
            )}

            {(form.trigger_type === "entity_type" || form.trigger_type === "combined") && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Entity Types</label>
                <div className="flex flex-wrap gap-2">
                  {ENTITY_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({
                        ...form,
                        entity_types: form.entity_types.includes(type)
                          ? form.entity_types.filter(t => t !== type)
                          : [...form.entity_types, type]
                      })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        form.entity_types.includes(type)
                          ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                          : "bg-white/5 text-gray-400 border border-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(form.trigger_type === "intelligence_type" || form.trigger_type === "combined") && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Intelligence Types</label>
                <div className="flex flex-wrap gap-2">
                  {INTELLIGENCE_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({
                        ...form,
                        intelligence_types: form.intelligence_types.includes(type)
                          ? form.intelligence_types.filter(t => t !== type)
                          : [...form.intelligence_types, type]
                      })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors uppercase ${
                        form.intelligence_types.includes(type)
                          ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                          : "bg-white/5 text-gray-400 border border-white/10"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Dark Web Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform}
                    onClick={() => setForm({
                      ...form,
                      source_platforms: form.source_platforms.includes(platform)
                        ? form.source_platforms.filter(p => p !== platform)
                        : [...form.source_platforms, platform]
                    })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      form.source_platforms.includes(platform)
                        ? "bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {platform.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Notification Channels</label>
              <div className="flex gap-3">
                {["in_app", "email", "webhook"].map(channel => (
                  <label key={channel} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notification_channels.includes(channel)}
                      onChange={(e) => setForm({
                        ...form,
                        notification_channels: e.target.checked
                          ? [...form.notification_channels, channel]
                          : form.notification_channels.filter(c => c !== channel)
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-400 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.notification_channels.includes("webhook") && (
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Webhook URL</label>
                <input
                  type="url"
                  value={form.webhook_url}
                  onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                  placeholder="https://your-endpoint.com/alert"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Suppression Period (hours)</label>
              <input
                type="number"
                value={form.suppression_period_hours}
                onChange={(e) => setForm({ ...form, suppression_period_hours: e.target.value })}
                min="0"
                max="720"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                placeholder="0 (no suppression)"
              />
              <p className="text-[10px] text-gray-500 mt-1">Suppress duplicate alerts for same entity within this period (0 = disabled)</p>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Notify Users (comma-separated emails)</label>
              <input
                type="text"
                value={form.notified_users}
                onChange={(e) => setForm({ ...form, notified_users: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                placeholder={currentUser}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
            <Button variant="ghost" onClick={resetForm} className="text-gray-400 text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.rule_name || createMutation.isPending || updateMutation.isPending}
              className="bg-[#00d4ff] text-black font-bold text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Rule"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center text-sm text-gray-400">
            No alert rules configured yet. Create one to start monitoring dark web feeds.
          </div>
        ) : (
          rules.map(rule => (
            <Card key={rule.id} className="bg-[#0d1220] border-white/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{rule.rule_name}</h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded ${rule.is_enabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {rule.is_enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {rule.description && <p className="text-xs text-gray-400 mt-1">{rule.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded capitalize">{rule.trigger_type}</span>
                    {rule.logic_operator === 'AND' && <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded">AND logic</span>}
                    {rule.negative_keywords?.length > 0 && <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-1 rounded">{rule.negative_keywords.length} exclusions</span>}
                    {rule.suppression_period_hours > 0 && <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded">{rule.suppression_period_hours}h suppress</span>}
                    {rule.keywords?.length > 0 && <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded">{rule.keywords.length} keywords</span>}
                    {rule.trigger_count > 0 && <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded">{rule.trigger_count} triggers</span>}
                    <span className="text-[9px] text-gray-500 ml-auto">{rule.notified_users?.length || 1} user(s)</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rule)}
                    className="h-8 w-8 text-gray-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(rule.id)}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}