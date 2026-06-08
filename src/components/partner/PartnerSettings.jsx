import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2 } from "lucide-react";

export default function PartnerSettings({ partner }) {
  const [form, setForm] = useState({
    primary_contact_name: partner.primary_contact_name || "",
    primary_contact_email: partner.primary_contact_email || "",
    website: partner.website || "",
    slack_webhook: partner.slack_webhook || "",
  });

  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Partner Profile */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Partner Profile</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Company Name</label>
            <Input
              disabled
              value={partner.company_name}
              className="bg-black/30 border-white/10 text-sm opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Primary Contact Name</label>
              <Input
                value={form.primary_contact_name}
                onChange={e => setForm({ ...form, primary_contact_name: e.target.value })}
                className="bg-black/30 border-white/10 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Email Address</label>
              <Input
                type="email"
                value={form.primary_contact_email}
                onChange={e => setForm({ ...form, primary_contact_email: e.target.value })}
                className="bg-black/30 border-white/10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Website</label>
            <Input
              value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })}
              className="bg-black/30 border-white/10 text-sm"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button className="bg-[#00d4ff] text-black font-bold gap-2">
              <Save className="w-4 h-4" /> Save Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Integrations</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Slack Webhook (Optional)</label>
            <Input
              placeholder="https://hooks.slack.com/..."
              value={form.slack_webhook}
              onChange={e => setForm({ ...form, slack_webhook: e.target.value })}
              className="bg-black/30 border-white/10 text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">Get notified when deals are approved or tenants are provisioned</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button className="bg-[#00d4ff] text-black font-bold gap-2">
              <Save className="w-4 h-4" /> Save Integrations
            </Button>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Compliance & Certifications</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-gray-400">SOC 2 Type II</span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">✓ Verified</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-gray-400">ISO 27001</span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-400">Not provided</span>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4">Contact partnerships@soint.io to update certifications</p>
      </div>

      {/* Support */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Need Help?</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>📧 Email: partnerships@soint.io</p>
          <p>💬 Slack: #partner-support</p>
          <p>📞 Phone: +1 (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
}