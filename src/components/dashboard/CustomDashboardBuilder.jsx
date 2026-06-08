import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sliders, Check } from "lucide-react";

export default function CustomDashboardBuilder() {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [formData, setFormData] = useState({
    dashboard_id: '',
    feed_type: 'all',
    severity_filter: [],
    threat_type_filter: [],
    organization_filter: [],
    geographic_filter: [],
    max_threats_per_day: 100
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data) => base44.entities.DashboardFeedSubscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_subscriptions'] });
      setShowBuilder(false);
      setFormData({
        dashboard_id: '',
        feed_type: 'all',
        severity_filter: [],
        threat_type_filter: [],
        organization_filter: [],
        geographic_filter: [],
        max_threats_per_day: 100
      });
    }
  });

  const handleToggleFilter = (filterType, value) => {
    setFormData(prev => {
      const currentFilter = prev[filterType] || [];
      return {
        ...prev,
        [filterType]: currentFilter.includes(value)
          ? currentFilter.filter(v => v !== value)
          : [...currentFilter, value]
      };
    });
  };

  const handleCreate = () => {
    if (!formData.dashboard_id) {
      alert('Dashboard ID is required');
      return;
    }
    createSubscriptionMutation.mutate({
      ...formData,
      is_enabled: true
    });
  };

  const severityOptions = ['critical', 'high', 'medium', 'low'];
  const threatTypeOptions = [
    { value: 'threat_actor', label: 'Threat Actors' },
    { value: 'malware', label: 'Malware' },
    { value: 'vulnerability', label: 'Vulnerabilities' },
    { value: 'campaign', label: 'Campaigns' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Dashboard Feed Subscriptions
        </h3>
        <Button size="sm" onClick={() => setShowBuilder(!showBuilder)} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Feed
        </Button>
      </div>

      {showBuilder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm">Configure Dashboard Feeds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-2">Dashboard ID *</label>
              <Input
                placeholder="Dashboard ID"
                value={formData.dashboard_id}
                onChange={(e) => setFormData({ ...formData, dashboard_id: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Feed Type</label>
              <select
                value={formData.feed_type}
                onChange={(e) => setFormData({ ...formData, feed_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              >
                <option value="all">All Feeds</option>
                <option value="osint_alerts">OSINT Alerts Only</option>
                <option value="threat_actors">Threat Actors Only</option>
                <option value="lea_intelligence">LEA Intelligence Only</option>
                <option value="vulnerabilities">Vulnerabilities Only</option>
                <option value="campaigns">Campaigns Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Severity Levels (optional)</label>
              <div className="flex flex-wrap gap-2">
                {severityOptions.map(severity => (
                  <button
                    key={severity}
                    onClick={() => handleToggleFilter('severity_filter', severity)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      formData.severity_filter.includes(severity)
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    {formData.severity_filter.includes(severity) && (
                      <Check className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Leave empty for all severities</p>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Threat Types (optional)</label>
              <div className="flex flex-wrap gap-2">
                {threatTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleFilter('threat_type_filter', option.value)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      formData.threat_type_filter.includes(option.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Daily Threat Limit</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={formData.max_threats_per_day}
                  onChange={(e) => setFormData({ ...formData, max_threats_per_day: parseInt(e.target.value) })}
                  className="flex-1 px-3 py-2 border rounded-lg text-xs"
                />
                <span className="text-xs text-gray-600">threats/day</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Prevents dashboard over-ingestion</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={createSubscriptionMutation.isPending}
                className="flex-1"
              >
                {createSubscriptionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Create Subscription
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBuilder(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <p className="text-xs text-gray-600">
          Configure which threats your dashboard receives. All threats are routed through Discord first,
          then filtered to dashboards based on these preferences.
        </p>
      </div>
    </div>
  );
}