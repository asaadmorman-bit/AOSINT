import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "applications", label: "Applications", icon: Clock },
  { id: "partners", label: "Active Partners", icon: Users },
  { id: "deals", label: "Deal Pipeline", icon: TrendingUp },
  { id: "commissions", label: "Commissions", icon: Zap },
];

export default function PartnerAdmin() {
  const [tab, setTab] = useState("applications");

  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: () => base44.entities.PartnerApplication.filter({ status: "submitted" }),
  });

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: () => base44.entities.Partner.filter({ status: "active" }),
  });

  const { data: deals } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.Deal.filter({ status: "qualified" }),
  });

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <h1 className="text-2xl font-bold mb-2">Partner Program Administration</h1>
        <p className="text-sm text-gray-500">Manage applications, partners, deals, and commissions</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6 flex items-center gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === "applications" && applications && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px]">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {tab === "applications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pending Applications</h2>
            {!applications || applications.length === 0 ? (
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
                <p className="text-gray-400">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{app.company_name}</h3>
                        <p className="text-sm text-gray-400 mt-1 capitalize">{app.partner_type}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Button className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-sm h-8">
                        Approve
                      </Button>
                      <Button className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm h-8">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "partners" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Active Partners ({partners?.length || 0})</h2>
            {!partners || partners.length === 0 ? (
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
                <p className="text-gray-400">No active partners</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partners.map(p => (
                  <div key={p.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{p.company_name}</h3>
                      <span
                        className="text-xs font-bold uppercase px-2 py-1 rounded-full"
                        style={{
                          background: `${
                            {
                              registered: "#6b7280",
                              silver: "#64748b",
                              gold: "#d97706",
                              elite: "#a855f7",
                              gov: "#f59e0b",
                            }[p.tier]
                          }20`,
                          color: {
                            registered: "#6b7280",
                            silver: "#64748b",
                            gold: "#d97706",
                            elite: "#a855f7",
                            gov: "#f59e0b",
                          }[p.tier],
                        }}
                      >
                        {p.tier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 capitalize mb-3">{p.partner_type}</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Tenants:</span>
                        <span className="font-bold">{p.active_tenant_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">YTD Revenue:</span>
                        <span className="font-bold">${(p.ytd_revenue_usd || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "deals" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Deals Pending Approval ({deals?.length || 0})</h2>
            {!deals || deals.length === 0 ? (
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
                <p className="text-gray-400">No pending deals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold">{deal.opportunity_name}</h3>
                        <p className="text-sm text-gray-500">{deal.customer_name}</p>
                      </div>
                      <span className="text-sm font-bold">${(deal.estimated_arr_usd || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Tier: {deal.tier_required}</p>
                    <div className="flex gap-2">
                      <Button className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-sm h-8">
                        Approve & Provision
                      </Button>
                      <Button className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm h-8">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "commissions" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Commission Management</h2>
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 text-center">
              <p className="text-gray-400">Commission tracking and payment processing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}