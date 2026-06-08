import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Users, Award, DollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PartnerDashboard({ partner }) {
  const { data: analytics } = useQuery({
    queryKey: ["partner_analytics", partner.id],
    queryFn: () => base44.functions.invoke("getPartnerAnalytics", {
      partner_id: partner.id
    }).then(r => r.data),
  });

  if (!analytics) return <div>Loading analytics...</div>;

  const stats = [
    { label: "Pipeline Value", value: `$${(analytics.deals.pipeline_value_usd || 0).toLocaleString()}`, icon: Target, color: "#00d4ff" },
    { label: "Closed Won", value: `${analytics.deals.closed_won}`, icon: TrendingUp, color: "#2ed573" },
    { label: "Active Tenants", value: `${analytics.tenants.active_count}`, icon: Users, color: "#a855f7" },
    { label: "Total Commissions", value: `$${(analytics.commissions.total_paid_usd || 0).toLocaleString()}`, icon: DollarSign, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0d1117] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase">{stat.label}</span>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-left h-10">
              Register New Deal
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-left h-10">
              View Training Paths
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-left h-10">
              Download Co-marketing Assets
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-left h-10">
              Contact Support
            </Button>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Your Tier Benefits</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>✓ Deal registration & pipeline visibility</p>
            <p>✓ Co-selling workflows with SOINT</p>
            <p>✓ Partner analytics & commission tracking</p>
            <p>✓ Premium training & certifications</p>
            <p>✓ Dedicated partner support</p>
          </div>
          <Button className="w-full mt-4 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20">
            Upgrade Tier
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activity (30 Days)</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(analytics.recent_activity_30d || {}).map(([activity, count]) => (
            <div key={activity} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-gray-400 capitalize">{activity.replace(/_/g, " ")}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}