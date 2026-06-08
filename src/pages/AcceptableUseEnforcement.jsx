import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Loader2, Plus, ChevronRight } from "lucide-react";

const ESCALATION_LEVELS = {
  1: { label: "Warning", color: "bg-yellow-100 text-yellow-800", description: "First written warning" },
  2: { label: "Suspension", color: "bg-orange-100 text-orange-800", description: "Temporary account suspension (7 days)" },
  3: { label: "Investigation", color: "bg-red-100 text-red-800", description: "Formal investigation initiated" },
  4: { label: "Account Lock", color: "bg-red-200 text-red-900", description: "Account suspended pending review" },
  5: { label: "Termination", color: "bg-red-800 text-white", description: "Account terminated" }
};

export default function AcceptableUseEnforcement() {
  const [user, setUser] = useState(null);
  const [showNewViolation, setShowNewViolation] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [formData, setFormData] = useState({
    user_email: "",
    violation_type: "policy_violation",
    description: "",
    severity: "medium"
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: () => base44.entities.PolicyViolation.list()
  });

  const createViolationMutation = useMutation({
    mutationFn: (data) => base44.entities.PolicyViolation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setFormData({ user_email: "", violation_type: "policy_violation", description: "", severity: "medium" });
      setShowNewViolation(false);
    }
  });

  const escalateMutation = useMutation({
    mutationFn: ({ violationId, newLevel, action }) => 
      base44.entities.PolicyViolation.update(violationId, {
        escalation_level: newLevel,
        status: newLevel === 5 ? 'closed' : 'escalated',
        actions_taken: [
          ...(selectedViolation?.actions_taken || []),
          {
            level: newLevel,
            action: action,
            timestamp: new Date().toISOString(),
            executed_by: user?.email
          }
        ]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setSelectedViolation(null);
    }
  });

  const handleCreateViolation = async (e) => {
    e.preventDefault();
    createViolationMutation.mutate({
      ...formData,
      assigned_to: user?.email,
      actions_taken: [
        {
          level: 1,
          action: "Violation reported",
          timestamp: new Date().toISOString(),
          executed_by: user?.email
        }
      ]
    });
  };

  const handleEscalate = (newLevel) => {
    const actions = {
      1: "Formal warning issued. User notified of policy violation.",
      2: "Account suspended for 7 days. Security review initiated.",
      3: "Formal investigation opened. Evidence collected.",
      4: "Account locked pending administrative review.",
      5: "Account terminated. Records archived for compliance."
    };

    escalateMutation.mutate({
      violationId: selectedViolation.id,
      newLevel: newLevel,
      action: actions[newLevel]
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          <h1 className="text-3xl font-bold">Acceptable Use Enforcement</h1>
        </div>
        <p className="text-gray-600">Monitor and enforce acceptable use policy violations with escalation procedures</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5].map(level => (
          <Card key={level} className="border-l-4" style={{ borderLeftColor: level === 5 ? '#991b1b' : level === 4 ? '#dc2626' : level === 3 ? '#ea580c' : '#eab308' }}>
            <CardContent className="pt-6">
              <div className="text-xs font-bold text-gray-500 mb-1">LEVEL {level}</div>
              <div className="font-semibold text-sm mb-2">{ESCALATION_LEVELS[level].label}</div>
              <div className="text-xs text-gray-600">{ESCALATION_LEVELS[level].description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={() => setShowNewViolation(!showNewViolation)} className="bg-red-600 hover:bg-red-700">
        <Plus className="w-4 h-4 mr-2" /> Report Violation
      </Button>

      {showNewViolation && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Report New Violation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateViolation} className="space-y-4">
              <Input
                placeholder="User email"
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                required
              />
              <Select value={formData.violation_type} onValueChange={(value) => setFormData({...formData, violation_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="data_exfiltration">Data Exfiltration</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="resource_abuse">Resource Abuse</SelectItem>
                  <SelectItem value="security_incident">Security Incident</SelectItem>
                  <SelectItem value="compliance_breach">Compliance Breach</SelectItem>
                  <SelectItem value="inappropriate_activity">Inappropriate Activity</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Detailed description of the violation"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createViolationMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {createViolationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Report
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewViolation(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <h2 className="font-semibold mb-4">Violations ({violations.length})</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : violations.length === 0 ? (
            <p className="text-gray-500">No violations recorded</p>
          ) : (
            <div className="space-y-2">
              {violations.map(violation => (
                <button
                  key={violation.id}
                  onClick={() => setSelectedViolation(violation)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedViolation?.id === violation.id
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{violation.user_email}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                  <Badge className={ESCALATION_LEVELS[violation.escalation_level]?.color}>
                    Level {violation.escalation_level}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedViolation && (
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {selectedViolation.user_email}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Violation Type</p>
                  <p className="font-medium capitalize">{selectedViolation.violation_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm">{selectedViolation.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Severity</p>
                    <Badge className={selectedViolation.severity === 'critical' ? 'bg-red-100 text-red-800' : selectedViolation.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}>
                      {selectedViolation.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Incident Count</p>
                    <p className="font-medium">{selectedViolation.incident_count}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Escalation Actions</h3>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(level => (
                      <Button
                        key={level}
                        onClick={() => handleEscalate(level)}
                        disabled={selectedViolation.escalation_level >= level || escalateMutation.isPending}
                        variant={selectedViolation.escalation_level >= level ? "outline" : "default"}
                        className="w-full justify-start"
                      >
                        <span className="text-xs font-bold mr-2">L{level}</span>
                        {ESCALATION_LEVELS[level].label}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedViolation.actions_taken && selectedViolation.actions_taken.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Action History</h3>
                    <div className="space-y-2">
                      {selectedViolation.actions_taken.map((action, idx) => (
                        <div key={idx} className="text-xs p-2 rounded bg-gray-50 border">
                          <p className="font-medium">Level {action.level}: {action.action}</p>
                          <p className="text-gray-600">{new Date(action.timestamp).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}