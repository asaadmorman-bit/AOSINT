import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Save, Plus, Trash2 } from "lucide-react";

const ROLES = ["admin", "analyst", "manager", "viewer"];
const DATA_TYPES = ["osint_alert", "threat_indicator", "threat_actor", "vulnerability", "lea_intelligence"];
const SEVERITIES = ["critical", "high", "medium", "low", "informational"];
const NOTIFICATION_CHANNELS = ["discord", "email", "dashboard"];

export default function AlertThresholdManager() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    role: "analyst",
    data_type: "osint_alert",
    severity_threshold: "medium",
    notification_enabled: true,
    notification_channels: ["dashboard"],
    auto_create_channels: false,
    filter_by_sector: [],
    filter_by_region: [],
    batch_notifications: false,
    batch_interval_minutes: 60,
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["alertThresholdConfigs"],
    queryFn: () => base44.entities.AlertThresholdConfiguration.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AlertThresholdConfiguration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertThresholdConfigs"] });
      setFormData({
        role: "analyst",
        data_type: "osint_alert",
        severity_threshold: "medium",
        notification_enabled: true,
        notification_channels: ["dashboard"],
        auto_create_channels: false,
        filter_by_sector: [],
        filter_by_region: [],
        batch_notifications: false,
        batch_interval_minutes: 60,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AlertThresholdConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertThresholdConfigs"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AlertThresholdConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertThresholdConfigs"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (config) => {
    setFormData(config);
    setEditingId(config.id);
  };

  const toggleChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      notification_channels: prev.notification_channels.includes(channel)
        ? prev.notification_channels.filter(c => c !== channel)
        : [...prev.notification_channels, channel]
    }));
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 animate-pulse">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Configuration" : "Create Alert Configuration"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data Type</label>
                <select
                  value={formData.data_type}
                  onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Severity Threshold</label>
                <select
                  value={formData.severity_threshold}
                  onChange={(e) => setFormData({ ...formData, severity_threshold: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Batch Interval (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.batch_interval_minutes}
                  onChange={(e) => setFormData({ ...formData, batch_interval_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Notification Channels */}
            <div>
              <label className="block text-sm font-medium mb-2">Notification Channels</label>
              <div className="flex gap-4">
                {NOTIFICATION_CHANNELS.map(channel => (
                  <label key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.notification_channels.includes(channel)}
                      onChange={() => toggleChannel(channel)}
                      className="rounded"
                    />
                    <span className="text-sm">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notification_enabled}
                  onChange={(e) => setFormData({ ...formData, notification_enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Notifications Enabled</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_create_channels}
                  onChange={(e) => setFormData({ ...formData, auto_create_channels: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Auto-Create Discord Channels</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.batch_notifications}
                  onChange={(e) => setFormData({ ...formData, batch_notifications: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Batch Notifications</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Save className="w-4 h-4" />
                {editingId ? "Update" : "Create"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      role: "analyst",
                      data_type: "osint_alert",
                      severity_threshold: "medium",
                      notification_enabled: true,
                      notification_channels: ["dashboard"],
                      auto_create_channels: false,
                      filter_by_sector: [],
                      filter_by_region: [],
                      batch_notifications: false,
                      batch_interval_minutes: 60,
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Role</th>
                  <th className="text-left py-2 px-3 font-medium">Data Type</th>
                  <th className="text-left py-2 px-3 font-medium">Threshold</th>
                  <th className="text-left py-2 px-3 font-medium">Channels</th>
                  <th className="text-left py-2 px-3 font-medium">Batch</th>
                  <th className="text-left py-2 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 px-3 text-center text-gray-500">
                      No configurations created yet
                    </td>
                  </tr>
                ) : (
                  configs.map(config => (
                    <tr key={config.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{config.role}</td>
                      <td className="py-2 px-3">{config.data_type}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          config.severity_threshold === 'critical' ? 'bg-red-100 text-red-800' :
                          config.severity_threshold === 'high' ? 'bg-orange-100 text-orange-800' :
                          config.severity_threshold === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {config.severity_threshold}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {config.notification_channels?.map(ch => (
                            <span key={ch} className="px-2 py-1 rounded text-xs bg-gray-200">{ch}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {config.batch_notifications ? '✓' : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(config.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}