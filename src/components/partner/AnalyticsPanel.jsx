import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";

export default function AnalyticsPanel({ partner }) {
  const { data: analytics } = useQuery({
    queryKey: ["partner_analytics", partner.id],
    queryFn: () => base44.functions.invoke("getPartnerAnalytics", {
      partner_id: partner.id
    }).then(r => r.data),
  });

  if (!analytics) return <div>Loading...</div>;

  const metrics = [
    {
      label: "Pipeline Value",
      value: `$${(analytics.deals.pipeline_value_usd || 0).toLocaleString()}`,
      subtext: `${analytics.deals.in_pipeline} deals`,
      icon: Target,
      color: "#00d4ff",
    },
    {
      label: "Closed-Won Revenue",
      value: `$${(analytics.deals.closed_won_revenue_usd || 0).toLocaleString()}`,
      subtext: `${analytics.deals.closed_won} wins`,
      icon: TrendingUp,
      color: "#2ed573",
    },
    {
      label: "Total Commissions (Paid)",
      value: `$${(analytics.commissions.total_paid_usd || 0).toLocaleString()}`,
      subtext: `YTD: $${(analytics.commissions.ytd_total || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "#f59e0b",
    },
    {
      label: "Accrued Commissions",
      value: `$${(analytics.commissions.accrued_usd || 0).toLocaleString()}`,
      subtext: "Next month",
      icon: BarChart3,
      color: "#a855f7",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase">{m.label}</span>
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-bold mb-1">{m.value}</div>
            <div className="text-xs text-gray-500">{m.subtext}</div>
          </div>
        ))}
      </div>

      {/* Deal Breakdown */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Deal Status Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: "Total Deals", value: analytics.deals.total },
            { label: "In Pipeline", value: analytics.deals.in_pipeline, color: "#f59e0b" },
            { label: "Closed Won", value: analytics.deals.closed_won, color: "#2ed573" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(item.value / analytics.deals.total) * 100}%`,
                    backgroundColor: item.color || "#00d4ff",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Team Certifications</h3>
        <div className="space-y-2">
          {Object.entries(analytics.certifications || {}).map(([cert, stats]) => (
            <div key={cert} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
              <span className="text-sm capitalize">{cert.replace(/_/g, " ")}</span>
              <span className="text-sm font-bold">
                {stats.passed} / {stats.total} certified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">YTD Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Revenue</span>
              <span className="font-bold">${(partner.ytd_revenue_usd || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Commissions Earned</span>
              <span className="font-bold" style={{ color: "#2ed573" }}>
                ${(partner.ytd_commissions_usd || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Tenant Portfolio</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Tenants</span>
              <span className="font-bold text-2xl">{analytics.tenants.active_count}</span>
            </div>
            <div className="text-xs text-gray-500">
              {partner.partner_type === "msp" && (
                <p>Downstream customers: {partner.msp_downstream_customers || 0}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}