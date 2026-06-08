import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trash2, Settings, CheckCircle2, AlertCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyApps() {
  const queryClient = useQueryClient();
  const [selectedInstall, setSelectedInstall] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenants } = useQuery({
    queryKey: ["my_tenants"],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const { data: installations } = useQuery({
    queryKey: ["my_installations", user?.email],
    queryFn: () => base44.entities.AppInstallation.filter({ tenant_id: { $in: tenants?.map(t => t.id) || [] } }),
    enabled: !!tenants && tenants.length > 0,
  });

  const { data: appDetails } = useQuery({
    queryKey: ["installation_app_details", installations],
    queryFn: async () => {
      if (!installations) return [];
      const apps = await Promise.all(
        installations.map(inst => 
          base44.asServiceRole.entities.App.filter({ app_id: inst.app_id }).then(r => r?.[0])
        )
      );
      return apps;
    },
    enabled: !!installations,
  });

  const uninstallMutation = useMutation({
    mutationFn: async (installId) => {
      return await base44.entities.AppInstallation.update(installId, {
        status: 'uninstalled',
        uninstall_requested_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_installations"] });
      setSelectedInstall(null);
    },
  });

  const activeInstallations = installations?.filter(i => i.status === 'active') || [];

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">My Apps</h1>
          <p className="text-gray-400 mt-2">Manage your installed marketplace apps</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeInstallations.length === 0 ? (
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-bold mb-2">No apps installed</h3>
            <p className="text-gray-400">Browse the marketplace to find and install apps for your tenant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInstallations.map((install, idx) => {
              const app = appDetails?.[idx];
              return (
                <div key={install.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{app?.name || install.app_id}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Installed on {new Date(install.installation_date).toLocaleDateString()}
                      </p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          {install.health_status === 'healthy' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : install.health_status === 'degraded' ? (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs text-gray-400 capitalize">{install.health_status}</span>
                        </div>

                        {install.current_usage && (
                          <>
                            <span className="text-xs text-gray-500">
                              API Calls: {install.current_usage.api_calls_this_month?.toLocaleString() || 0}
                            </span>
                            <span className="text-xs text-gray-500">
                              Data: {install.current_usage.data_ingested_gb?.toFixed(2) || 0}GB
                            </span>
                          </>
                        )}
                      </div>

                      {install.last_error && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                          {install.last_error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedInstall(install.id)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => uninstallMutation.mutate(install.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}