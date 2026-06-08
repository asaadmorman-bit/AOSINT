import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Save, Loader2, Upload } from "lucide-react";

export default function BrandingSettings({ tenantId }) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["tenant_config", tenantId],
    queryFn: () => base44.entities.TenantConfiguration.filter({ tenant_id: tenantId }).then(r => r[0]),
  });

  const [branding, setBranding] = useState(config?.branding || {
    logo_url: "",
    primary_color: "#00d4ff",
    secondary_color: "#a855f7",
    app_name: "",
    support_email: ""
  });

  const [domain, setDomain] = useState(config?.custom_domain || "");

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (config?.id) {
        return base44.entities.TenantConfiguration.update(config.id, {
          branding,
          custom_domain: domain
        });
      }
    },
    onSuccess: () => {
      setSaving(false);
      queryClient.invalidateQueries({ queryKey: ["tenant_config", tenantId] });
    },
    onError: () => setSaving(false),
  });

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate();
  };

  if (!config) return <div className="text-gray-600">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Logo & Colors */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> Branding
        </p>

        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Logo URL</label>
            <Input value={branding.logo_url || ""} onChange={e => setBranding({ ...branding, logo_url: e.target.value })}
              placeholder="https://cdn.example.com/logo.png"
              className="h-8 bg-black/30 border-white/10 text-sm" />
            {branding.logo_url && (
              <img src={branding.logo_url} alt="Logo preview" className="mt-2 h-10 max-w-32" />
            )}
          </div>

          {/* App Name */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">App Name</label>
            <Input value={branding.app_name || ""} onChange={e => setBranding({ ...branding, app_name: e.target.value })}
              placeholder="My Organization SOINT"
              className="h-8 bg-black/30 border-white/10 text-sm" />
          </div>

          {/* Support Email */}
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Support Email</label>
            <Input value={branding.support_email || ""} onChange={e => setBranding({ ...branding, support_email: e.target.value })}
              type="email"
              placeholder="support@organization.com"
              className="h-8 bg-black/30 border-white/10 text-sm" />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={branding.primary_color || "#00d4ff"}
                  onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer" />
                <span className="text-xs text-gray-600 font-mono min-w-0 truncate">{branding.primary_color}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={branding.secondary_color || "#a855f7"}
                  onChange={e => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="w-full h-8 rounded-lg cursor-pointer" />
                <span className="text-xs text-gray-600 font-mono min-w-0 truncate">{branding.secondary_color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domain */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Custom Domain</p>
        <Input value={domain} onChange={e => setDomain(e.target.value)}
          placeholder="soint.yourcompany.com"
          className="h-8 bg-black/30 border-white/10 text-sm mb-2" />
        <p className="text-[9px] text-gray-600">Enter your custom domain (DNS CNAME required)</p>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}
          className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1 px-4 py-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}