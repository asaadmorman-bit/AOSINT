import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import DealForm from "@/components/partner/DealForm";

export default function DealManagement({ partner }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: deals } = useQuery({
    queryKey: ["deals", partner.id],
    queryFn: () => base44.entities.Deal.filter({ partner_id: partner.id }),
  });

  const canRegisterDeals = ["silver", "gold", "elite", "gov"].includes(partner.tier);

  if (!canRegisterDeals) {
    return (
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Deal Registration Not Available</h3>
        <p className="text-gray-400 mb-6">Upgrade to Silver tier or higher to access deal registration</p>
        <Button className="bg-[#00d4ff] text-black font-bold">Upgrade Tier</Button>
      </div>
    );
  }

  const stats = {
    total: deals?.length || 0,
    qualified: deals?.filter(d => d.status === "qualified").length || 0,
    inProgress: deals?.filter(d => d.status === "in_progress").length || 0,
    approved: deals?.filter(d => d.status === "approved").length || 0,
    closedWon: deals?.filter(d => d.status === "closed_won").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { label: "Total Deals", value: stats.total },
          { label: "Qualified", value: stats.qualified },
          { label: "In Progress", value: stats.inProgress },
          { label: "Approved", value: stats.approved },
          { label: "Closed Won", value: stats.closedWon },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d1117] border border-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Register Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Deal Pipeline</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#00d4ff] text-black font-bold gap-2">
          <Plus className="w-4 h-4" /> Register Deal
        </Button>
      </div>

      {/* Form */}
      {showForm && <DealForm partner={partner} onClose={() => setShowForm(false)} />}

      {/* Deal List */}
      <div className="space-y-3">
        {!deals || deals.length === 0 ? (
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
            <p className="text-gray-400">No deals registered yet. Register your first deal to get started.</p>
          </div>
        ) : (
          deals.map(deal => (
            <div key={deal.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold">{deal.opportunity_name}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      deal.status === "closed_won" ? "bg-green-500/10 text-green-400" :
                      deal.status === "approved" ? "bg-blue-500/10 text-blue-400" :
                      deal.status === "in_progress" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {deal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{deal.customer_name} • {deal.customer_size}</p>
                  <div className="text-sm text-gray-500">
                    <span>${(deal.estimated_arr_usd || 0).toLocaleString()} ARR</span>
                    <span className="mx-2">•</span>
                    <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Tier Required</div>
                  <div className="text-lg font-bold">{deal.tier_required}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}