import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, BarChart3, Package, DollarSign, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeveloperDashboard() {
  const [showNewApp, setShowNewApp] = useState(false);
  const [formData, setFormData] = useState({
    app_id: "",
    name: "",
    description: "",
    category: "integration_connector",
  });

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: developer } = useQuery({
    queryKey: ["developer_profile", user?.email],
    queryFn: () => user ? base44.entities.Developer.filter({ user_email: user.email }).then(r => r?.[0]) : null,
    enabled: !!user,
  });

  const { data: apps } = useQuery({
    queryKey: ["my_apps", developer?.id],
    queryFn: () => developer ? base44.entities.App.filter({ developer_id: developer.id }) : [],
    enabled: !!developer,
  });

  const { data: transactions } = useQuery({
    queryKey: ["my_transactions", developer?.id],
    queryFn: () => developer ? base44.entities.MarketplaceTransaction.filter({ developer_id: developer.id }) : [],
    enabled: !!developer,
  });

  const submitAppMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("submitMarketplaceApp", formData);
      return response.data;
    },
    onSuccess: () => {
      setShowNewApp(false);
      setFormData({ app_id: "", name: "", description: "", category: "integration_connector" });
    },
  });

  if (!developer) {
    return (
      <div className="min-h-screen bg-[#060a0f] text-white p-8 flex items-center justify-center">
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 max-w-md">
          <AlertCircle className="w-8 h-8 text-yellow-400 mb-3" />
          <h2 className="text-xl font-bold mb-2">Developer Account Required</h2>
          <p className="text-gray-400 mb-4">You need an active developer account to publish apps.</p>
          <Button className="w-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
            Request Developer Access
          </Button>
        </div>
      </div>
    );
  }

  const publishedApps = apps?.filter(a => a.status === "published") || [];
  const pendingApps = apps?.filter(a => ["submitted", "under_review"].includes(a.status)) || [];
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount_usd || 0), 0) || 0;
  const totalInstalls = publishedApps.reduce((sum, a) => sum + (a.install_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Developer Dashboard</h1>
              <p className="text-gray-400 mt-2">Hello, {developer.display_name}</p>
            </div>
            <Button
              onClick={() => setShowNewApp(true)}
              className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New App
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Total Installs</span>
                <Package className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <p className="text-2xl font-bold">{totalInstalls}</p>
            </div>
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Total Revenue</span>
                <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Published Apps</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{publishedApps.length}</p>
            </div>
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">Under Review</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{pendingApps.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Published Apps */}
        {publishedApps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Published Apps</h2>
            <div className="space-y-3">
              {publishedApps.map(app => (
                <div key={app.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{app.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">v{app.version} • {app.install_count || 0} installs</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Monthly Revenue</p>
                      <p className="text-xl font-bold">${(app.price_usd * (app.install_count || 0)).toLocaleString()}</p>
                    </div>
                    <Button variant="outline" className="text-xs">Manage</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Apps */}
        {pendingApps.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">Under Review</h2>
            <div className="space-y-3">
              {pendingApps.map(app => (
                <div key={app.id} className="bg-[#0d1117] border border-yellow-500/20 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-bold">{app.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{app.status}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="text-xs">View Details</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Apps */}
        {!publishedApps.length && !pendingApps.length && (
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">No apps yet</h3>
            <p className="text-gray-400 mb-6">Create your first app to start building the future of intelligence.</p>
            <Button
              onClick={() => setShowNewApp(true)}
              className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
            >
              Create App
            </Button>
          </div>
        )}
      </div>

      {/* New App Modal */}
      {showNewApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">Submit New App</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">App ID (slug)</label>
                <input
                  type="text"
                  value={formData.app_id}
                  onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                  placeholder="my-awesome-app"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">App Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome App"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does your app do?"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white mt-1 h-20 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white mt-1"
                >
                  <option value="integration_connector">Integration / Connector</option>
                  <option value="analytics_extension">Analytics Extension</option>
                  <option value="agent_plugin">Agent Plugin</option>
                  <option value="dashboard_visualization">Dashboard / Visualization</option>
                  <option value="scenario_template">Scenario Template</option>
                  <option value="playbook">Playbook</option>
                  <option value="compliance_pack">Compliance Pack</option>
                  <option value="training_module">Training Module</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowNewApp(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => submitAppMutation.mutate()}
                disabled={!formData.app_id || !formData.name || submitAppMutation.isPending}
                className="flex-1 bg-[#00d4ff]/10 text-[#00d4ff]"
              >
                {submitAppMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}