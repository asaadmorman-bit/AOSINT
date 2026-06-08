import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Loader2, Plus, FileText, Trash2, Save } from "lucide-react";

export default function DashboardBuilder() {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: "",
    description: "",
    dashboard_type: "custom",
    watch_list_ids: [],
    widgets: []
  });
  const [generatingReport, setGeneratingReport] = useState(null);

  const { data: dashboards, isLoading: dashLoading } = useQuery({
    queryKey: ['custom_dashboards'],
    queryFn: () => base44.entities.CustomDashboard.list('-last_modified', 50),
    initialData: [],
  });

  const { data: watchLists } = useQuery({
    queryKey: ['watch_lists'],
    queryFn: () => base44.entities.WatchList.list('-last_updated', 100),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomDashboard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_dashboards'] });
      setShowNewForm(false);
      setNewDashboard({
        name: "",
        description: "",
        dashboard_type: "custom",
        watch_list_ids: [],
        widgets: []
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomDashboard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_dashboards'] });
    }
  });

  const handleGenerateReport = async (dashboardId) => {
    setGeneratingReport(dashboardId);
    try {
      const { data: report } = await base44.functions.invoke('generateDashboardReport', {
        dashboardId
      });

      // Create downloadable report
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2)));
      element.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleCreateDashboard = () => {
    if (!newDashboard.name || newDashboard.watch_list_ids.length === 0) {
      alert("Dashboard name and at least one watch list are required");
      return;
    }

    createMutation.mutate({
      ...newDashboard,
      created_date: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      widgets: [
        { widget_id: '1', widget_type: 'threat_summary', position: 0 },
        { widget_id: '2', widget_type: 'watch_list_view', position: 1 },
        { widget_id: '3', widget_type: 'alert_feed', position: 2 },
        { widget_id: '4', widget_type: 'statistics', position: 3 }
      ]
    });
  };

  const dashboardTypeColors = {
    threat_monitoring: 'bg-red-100 text-red-800',
    organization_tracking: 'bg-blue-100 text-blue-800',
    entity_analysis: 'bg-purple-100 text-purple-800',
    campaign_overview: 'bg-orange-100 text-orange-800',
    regional_analysis: 'bg-green-100 text-green-800',
    custom: 'bg-gray-100 text-gray-800'
  };

  if (dashLoading) return <p className="text-gray-500">Loading dashboards...</p>;

  return (
    <div className="space-y-6">
      {/* Existing Dashboards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Custom Dashboards</CardTitle>
            <Button onClick={() => setShowNewForm(!showNewForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboards.length === 0 && !showNewForm && (
            <Alert>No dashboards created yet. Create one to visualize watch lists.</Alert>
          )}

          {dashboards.map(dash => (
            <div key={dash.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{dash.name}</p>
                    <Badge className={dashboardTypeColors[dash.dashboard_type]}>
                      {dash.dashboard_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{dash.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {dash.watch_list_ids?.length || 0} watch lists • {dash.widgets?.length || 0} widgets
                  </p>
                </div>
                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReport(dash.id)}
                    disabled={generatingReport === dash.id}
                  >
                    {generatingReport === dash.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-1" /> Report
                      </>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(dash.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* New Dashboard Form */}
      {showNewForm && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Dashboard Name"
              value={newDashboard.name}
              onChange={(e) => setNewDashboard(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Description"
              value={newDashboard.description}
              onChange={(e) => setNewDashboard(prev => ({ ...prev, description: e.target.value }))}
            />

            <div>
              <label className="text-sm font-semibold block mb-2">Dashboard Type</label>
              <select
                value={newDashboard.dashboard_type}
                onChange={(e) => setNewDashboard(prev => ({ ...prev, dashboard_type: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="custom">Custom</option>
                <option value="threat_monitoring">Threat Monitoring</option>
                <option value="organization_tracking">Organization Tracking</option>
                <option value="entity_analysis">Entity Analysis</option>
                <option value="campaign_overview">Campaign Overview</option>
                <option value="regional_analysis">Regional Analysis</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Select Watch Lists</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-white">
                {watchLists.map(wl => (
                  <label key={wl.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDashboard.watch_list_ids?.includes(wl.id) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewDashboard(prev => ({
                            ...prev,
                            watch_list_ids: [...(prev.watch_list_ids || []), wl.id]
                          }));
                        } else {
                          setNewDashboard(prev => ({
                            ...prev,
                            watch_list_ids: (prev.watch_list_ids || []).filter(id => id !== wl.id)
                          }));
                        }
                      }}
                    />
                    <span className="text-sm">{wl.name}</span>
                    <Badge className="text-xs">{wl.watch_list_type}</Badge>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateDashboard} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Create Dashboard
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}