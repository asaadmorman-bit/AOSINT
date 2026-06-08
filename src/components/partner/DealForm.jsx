import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function DealForm({ partner, onClose }) {
  const [form, setForm] = useState({
    opportunity_name: "",
    customer_name: "",
    customer_industry: "",
    customer_size: "mid-market",
    deal_type: "new_customer",
    tier_required: "pro",
    estimated_arr_usd: 0,
    expected_close_date: "",
  });

  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke("registerDeal", {
        partner_id: partner.id,
        ...form,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", partner.id] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.opportunity_name || !form.customer_name) {
      alert("Please fill required fields");
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6 space-y-4 mb-6">
      <h3 className="font-bold">Register New Deal</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Opportunity Name *</label>
            <Input
              placeholder="Project Zenith"
              value={form.opportunity_name}
              onChange={e => setForm({ ...form, opportunity_name: e.target.value })}
              className="bg-black/30 border-white/10 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Customer Name *</label>
            <Input
              placeholder="Acme Corp"
              value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })}
              className="bg-black/30 border-white/10 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Industry</label>
            <Input
              placeholder="Finance"
              value={form.customer_industry}
              onChange={e => setForm({ ...form, customer_industry: e.target.value })}
              className="bg-black/30 border-white/10 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Customer Size</label>
            <select
              value={form.customer_size}
              onChange={e => setForm({ ...form, customer_size: e.target.value })}
              className="w-full h-9 rounded-lg bg-black/30 border border-white/10 px-3 text-sm text-gray-300"
            >
              {["enterprise", "mid-market", "smb", "government"].map(s => (
                <option key={s} value={s} className="bg-[#0d1117]">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Tier Required</label>
            <select
              value={form.tier_required}
              onChange={e => setForm({ ...form, tier_required: e.target.value })}
              className="w-full h-9 rounded-lg bg-black/30 border border-white/10 px-3 text-sm text-gray-300"
            >
              {["community", "pro", "enterprise", "gov"].map(t => (
                <option key={t} value={t} className="bg-[#0d1117]">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Estimated ARR (USD)</label>
            <Input
              type="number"
              placeholder="0"
              value={form.estimated_arr_usd}
              onChange={e => setForm({ ...form, estimated_arr_usd: parseInt(e.target.value) || 0 })}
              className="bg-black/30 border-white/10 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Expected Close Date</label>
          <Input
            type="date"
            value={form.expected_close_date}
            onChange={e => setForm({ ...form, expected_close_date: e.target.value })}
            className="bg-black/30 border-white/10 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="outline" className="border-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="bg-[#00d4ff] text-black font-bold gap-2"
          >
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {registerMutation.isPending ? "Registering..." : "Register Deal"}
          </Button>
        </div>
      </form>
    </div>
  );
}