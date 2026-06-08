import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Save, Loader2 } from "lucide-react";

export default function SecuritySettings({ tenantId }) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["tenant_config", tenantId],
    queryFn: () => base44.entities.TenantConfiguration.filter({ tenant_id: tenantId }).then(r => r[0]),
  });

  const [idp, setIdp] = useState(config?.identity_provider || {
    type: "saml",
    sso_enabled: false,
    mfa_required: false,
    saml_metadata_url: ""
  });

  const [security, setSecurity] = useState(config?.security_policies || {
    password_min_length: 12,
    password_require_special: true,
    session_timeout_minutes: 60,
    ip_allowlist: [],
    ip_blocklist: []
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (config?.id) {
        return base44.entities.TenantConfiguration.update(config.id, {
          identity_provider: idp,
          security_policies: security
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
      {/* Identity & SSO */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Identity Provider
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">SSO Type</label>
            <select value={idp.type || "saml"}
              onChange={e => setIdp({ ...idp, type: e.target.value })}
              className="w-full h-8 px-2 rounded-lg bg-black/30 border border-white/10 text-xs text-gray-300">
              {["saml", "oidc", "okta", "azure_ad"].map(t => (
                <option key={t} value={t} className="bg-[#0d1117]">{t.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5">
            <span className="text-xs text-gray-400">Enable SSO</span>
            <button onClick={() => setIdp({ ...idp, sso_enabled: !idp.sso_enabled })}
              className={`w-9 h-5 rounded-full transition-colors ${idp.sso_enabled ? "bg-[#00d4ff]" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${idp.sso_enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5">
            <span className="text-xs text-gray-400">Require MFA</span>
            <button onClick={() => setIdp({ ...idp, mfa_required: !idp.mfa_required })}
              className={`w-9 h-5 rounded-full transition-colors ${idp.mfa_required ? "bg-[#00d4ff]" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${idp.mfa_required ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {idp.type === "saml" && (
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">SAML Metadata URL</label>
              <Input value={idp.saml_metadata_url || ""} onChange={e => setIdp({ ...idp, saml_metadata_url: e.target.value })}
                placeholder="https://idp.example.com/metadata.xml"
                className="h-8 bg-black/30 border-white/10 text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Password Policy</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Minimum Length</label>
            <Input type="number" min="8" max="32" value={security.password_min_length || 12}
              onChange={e => setSecurity({ ...security, password_min_length: parseInt(e.target.value) })}
              className="h-8 bg-black/30 border-white/10 text-sm" />
          </div>

          <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5">
            <span className="text-xs text-gray-400">Require Special Characters</span>
            <button onClick={() => setSecurity({ ...security, password_require_special: !security.password_require_special })}
              className={`w-9 h-5 rounded-full transition-colors ${security.password_require_special ? "bg-[#00d4ff]" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${security.password_require_special ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Session Timeout (minutes)</label>
            <Input type="number" min="5" max="480" value={security.session_timeout_minutes || 60}
              onChange={e => setSecurity({ ...security, session_timeout_minutes: parseInt(e.target.value) })}
              className="h-8 bg-black/30 border-white/10 text-sm" />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}
          className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 gap-1 px-4 py-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
}