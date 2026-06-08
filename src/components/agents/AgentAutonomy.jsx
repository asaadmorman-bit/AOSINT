import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AgentAutonomy({ agentProfile, onUpdate }) {
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [decisionRules, setDecisionRules] = useState(
    typeof agentProfile.decision_rules === 'string'
      ? JSON.parse(agentProfile.decision_rules)
      : agentProfile.decision_rules || {}
  );
  const [escalationPolicy, setEscalationPolicy] = useState(
    typeof agentProfile.escalation_policy === 'string'
      ? JSON.parse(agentProfile.escalation_policy)
      : agentProfile.escalation_policy || {}
  );

  const autonomyLevelConfig = {
    supervised: {
      color: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20",
      description: "All actions require operator approval",
      permissions: ["monitoring", "reporting"],
    },
    semi_autonomous: {
      color: "bg-orange-900/30 text-orange-300 border-orange-500/20",
      description: "Can act on low-risk items, escalates others",
      permissions: ["monitoring", "reporting", "analysis", "threat_hunting"],
    },
    fully_autonomous: {
      color: "bg-red-900/30 text-red-300 border-red-500/20",
      description: "Full autonomy within constraints and escalation policies",
      permissions: ["monitoring", "reporting", "analysis", "threat_hunting", "incident_response", "remediation"],
    },
  };

  const config = autonomyLevelConfig[agentProfile.autonomy_level];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-cyan-400" />
        Autonomy Configuration
      </h3>

      {/* Autonomy Level */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Autonomy Level</p>
          <Badge className={`${config.color} text-[10px]`}>
            {agentProfile.autonomy_level.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mb-3">{config.description}</p>

        {/* Allowed Permissions */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Allowed Actions</p>
          <div className="flex flex-wrap gap-1">
            {config.permissions.map((perm) => (
              <Badge
                key={perm}
                className="bg-green-900/30 text-green-300 border-green-500/20 text-[8px]"
              >
                ✓ {perm.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Blocked Actions */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Blocked Actions</p>
          <div className="flex flex-wrap gap-1">
            {["monitoring", "reporting", "analysis", "threat_hunting", "incident_response", "remediation"]
              .filter(a => !config.permissions.includes(a))
              .map((perm) => (
                <Badge
                  key={perm}
                  className="bg-red-900/30 text-red-300 border-red-500/20 text-[8px]"
                >
                  ✗ {perm.replace(/_/g, ' ')}
                </Badge>
              ))}
          </div>
        </div>
      </div>

      {/* Decision Rules */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Decision Rules</p>
          <Button
            onClick={() => setShowRuleEditor(!showRuleEditor)}
            size="sm"
            variant="outline"
          >
            {showRuleEditor ? 'View' : 'Edit'}
          </Button>
        </div>

        {!showRuleEditor ? (
          <div>
            <p className="text-xs text-gray-400 mb-2">Current Rules</p>
            <div className="bg-black/30 rounded p-2 text-xs font-mono text-gray-300 overflow-x-auto max-h-32 overflow-y-auto">
              {JSON.stringify(decisionRules, null, 2) || "No rules configured"}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={JSON.stringify(decisionRules, null, 2)}
              onChange={(e) => {
                try {
                  setDecisionRules(JSON.parse(e.target.value));
                } catch {}
              }}
              rows="6"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono"
            />
            <Button
              onClick={() => {
                onUpdate?.(agentProfile.id, {
                  decision_rules: JSON.stringify(decisionRules),
                });
                setShowRuleEditor(false);
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Save Rules
            </Button>
          </div>
        )}
      </div>

      {/* Escalation Policy */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          Escalation Policy
        </p>

        <div className="space-y-2 text-xs">
          <p className="text-gray-400">Conditions triggering escalation to operator:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>High severity findings ({escalationPolicy.high_severity_threshold || 'critical'} and above)</li>
            <li>Confidence score below {escalationPolicy.confidence_threshold || '70'}%</li>
            <li>Multiple findings in single task ({escalationPolicy.finding_count_threshold || '5'} or more)</li>
            <li>Recommended remediation actions</li>
          </ul>
        </div>
      </div>

      {/* Autonomous Actions Log */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Autonomous Actions Audit
        </p>
        <p className="text-xs text-gray-400">
          All autonomous actions by this agent are logged and auditable. Operators can review and revert actions taken without explicit approval.
        </p>
      </div>
    </div>
  );
}