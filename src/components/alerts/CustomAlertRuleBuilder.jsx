import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Plus, X, AlertCircle } from "lucide-react";

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"];
const CHANNEL_OPTIONS = ["dashboard", "email", "discord"];

export default function CustomAlertRuleBuilder() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    keywords: [],
    ip_ranges: [],
    domain_patterns: [],
    threat_actor_groups: [],
    severity_filter: ["high", "critical"],
    notification_channels: ["dashboard"],
    is_enabled: true,
  });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState("");
  const [activeSection, setActiveSection] = useState("keywords");
  const queryClient = useQueryClient();

  const { data: savedRules = [] } = useQuery({
    queryKey: ["custom_alert_rules"],
    queryFn: () => base44.entities.CustomAlertRule.list(),
  });

  const createMutation = useMutation({
    mutationFn: (ruleData) => base44.entities.CustomAlertRule.create(ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_alert_rules"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomAlertRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_alert_rules"] });
    },
  });

  const generateAIRule = async () => {
    if (!aiPrompt.trim()) return;
    
    setAiLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a security alert rule expert. Based on this user request, generate a JSON alert rule configuration:\n\n"${aiPrompt}"\n\nReturn ONLY valid JSON (no markdown) with these fields:\n{\n  "name": "descriptive name",\n  "description": "what this rule detects",\n  "keywords": ["array of relevant keywords"],\n  "ip_ranges": ["CIDR ranges if applicable"],\n  "domain_patterns": ["regex patterns if applicable"],\n  "threat_actor_groups": ["threat actor names if applicable"],\n  "severity_filter": ["low", "medium", "high", "critical"],\n  "notification_channels": ["dashboard", "email", "discord"]\n}`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            ip_ranges: { type: "array", items: { type: "string" } },
            domain_patterns: { type: "array", items: { type: "string" } },
            threat_actor_groups: { type: "array", items: { type: "string" } },
            severity_filter: { type: "array", items: { type: "string" } },
            notification_channels: { type: "array", items: { type: "string" } },
          },
        },
      });

      const aiData = response.data || response;
      setForm({
        ...form,
        ...aiData,
        is_enabled: true,
      });
      setAiPrompt("");
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const addItem = (section) => {
    if (!currentInput.trim()) return;
    setForm({
      ...form,
      [section]: [...form[section], currentInput],
    });
    setCurrentInput("");
  };

  const removeItem = (section, index) => {
    setForm({
      ...form,
      [section]: form[section].filter((_, i) => i !== index),
    });
  };

  const handleSaveRule = () => {
    if (!form.name.trim()) {
      alert("Rule name is required");
      return;
    }
    createMutation.mutate(form);
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      keywords: [],
      ip_ranges: [],
      domain_patterns: [],
      threat_actor_groups: [],
      severity_filter: ["high", "critical"],
      notification_channels: ["dashboard"],
      is_enabled: true,
    });
  };

  const renderSection = (title, key, placeholder) => (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-gray-300">{title}</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 text-white placeholder-gray-600"
          onKeyPress={(e) => e.key === "Enter" && addItem(key)}
        />
        <Button
          size="sm"
          onClick={() => addItem(key)}
          className="bg-[#00d4ff] text-black hover:bg-[#0099cc] shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {form[key].map((item, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {item}
            <button
              onClick={() => removeItem(key, idx)}
              className="ml-1 text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Assistant */}
      <div className="bg-[#0d1220] border border-[#00d4ff]/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="w-5 h-5 text-[#00d4ff]" />
          <h3 className="text-sm font-semibold text-white">AI Rule Assistant</h3>
        </div>
        <p className="text-xs text-gray-400">
          Describe what you want to monitor, and AI will generate a rule configuration.
        </p>
        <Textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="e.g., 'Alert when APT28 is mentioned alongside IP ranges in the 192.168.0.0/16 subnet' or 'Monitor for credential leak keywords and suspicious domains'"
          className="bg-white/5 border-white/10 text-white placeholder-gray-600 min-h-20"
        />
        <Button
          onClick={generateAIRule}
          disabled={aiLoading || !aiPrompt.trim()}
          className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating Rule...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Rule with AI
            </>
          )}
        </Button>
      </div>

      {/* Rule Builder */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Rule Details</h3>
        
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-300">Rule Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., APT28 Activity Monitor"
            className="bg-white/5 border-white/10 text-white placeholder-gray-600"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-300">Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What does this rule detect?"
            className="bg-white/5 border-white/10 text-white placeholder-gray-600"
          />
        </div>

        {/* Tabs for different sections */}
        <div className="flex gap-2 border-b border-white/10">
          {["keywords", "ip_ranges", "domain_patterns", "threat_actor_groups"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeSection === section
                  ? "border-[#00d4ff] text-[#00d4ff]"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              {section.replace(/_/g, " ").toUpperCase()}
            </button>
          ))}
        </div>

        {activeSection === "keywords" &&
          renderSection("Keywords", "keywords", "e.g., credential leak, malware hash")}
        {activeSection === "ip_ranges" &&
          renderSection("IP Ranges (CIDR)", "ip_ranges", "e.g., 192.168.0.0/16")}
        {activeSection === "domain_patterns" &&
          renderSection("Domain Patterns (Regex)", "domain_patterns", "e.g., .*malicious\\.com$")}
        {activeSection === "threat_actor_groups" &&
          renderSection("Threat Actor Groups", "threat_actor_groups", "e.g., APT28, Lazarus")}

        {/* Severity Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-300">Severity Levels</Label>
          <div className="flex gap-2 flex-wrap">
            {SEVERITY_OPTIONS.map((level) => (
              <button
                key={level}
                onClick={() => {
                  const newFilter = form.severity_filter.includes(level)
                    ? form.severity_filter.filter((s) => s !== level)
                    : [...form.severity_filter, level];
                  setForm({ ...form, severity_filter: newFilter });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  form.severity_filter.includes(level)
                    ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff]"
                    : "bg-white/5 border border-white/10 text-gray-400"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Channels */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-300">Notification Channels</Label>
          <div className="flex gap-2 flex-wrap">
            {CHANNEL_OPTIONS.map((channel) => (
              <button
                key={channel}
                onClick={() => {
                  const newChannels = form.notification_channels.includes(channel)
                    ? form.notification_channels.filter((c) => c !== channel)
                    : [...form.notification_channels, channel];
                  setForm({ ...form, notification_channels: newChannels });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  form.notification_channels.includes(channel)
                    ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff]"
                    : "bg-white/5 border border-white/10 text-gray-400"
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSaveRule}
            disabled={createMutation.isPending}
            className="flex-1 bg-[#00d4ff] text-black hover:bg-[#0099cc]"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Rule"
            )}
          </Button>
          <Button
            onClick={resetForm}
            variant="outline"
            className="border-white/10 text-gray-400 hover:bg-white/5"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Saved Rules */}
      {savedRules.length > 0 && (
        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Your Alert Rules</h3>
          <div className="space-y-3">
            {savedRules.map((rule) => (
              <div key={rule.id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{rule.name}</h4>
                    {rule.description && (
                      <p className="text-xs text-gray-400 mt-1">{rule.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => deleteMutation.mutate(rule.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {rule.keywords.length > 0 && <div>Keywords: {rule.keywords.join(", ")}</div>}
                  {rule.ip_ranges.length > 0 && <div>IPs: {rule.ip_ranges.join(", ")}</div>}
                  {rule.domain_patterns.length > 0 && <div>Domains: {rule.domain_patterns.join(", ")}</div>}
                  {rule.threat_actor_groups.length > 0 && (
                    <div>Actors: {rule.threat_actor_groups.join(", ")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}