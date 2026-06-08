import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export default function EngagementTrendChart({ engagements, campaigns }) {
  // Aggregate engagements by date
  const engagementsByDate = {};
  engagements.forEach((e) => {
    const date = new Date(e.timestamp).toLocaleDateString();
    if (!engagementsByDate[date]) {
      engagementsByDate[date] = {
        date,
        sent: 0,
        opened: 0,
        clicked: 0,
        submitted: 0,
        success: 0,
      };
    }
    switch (e.engagement_type) {
      case "sent":
        engagementsByDate[date].sent++;
        break;
      case "opened":
        engagementsByDate[date].opened++;
        break;
      case "clicked":
        engagementsByDate[date].clicked++;
        break;
      case "submitted":
        engagementsByDate[date].submitted++;
        break;
    }
    if (e.success) engagementsByDate[date].success++;
  });

  const trendData = Object.values(engagementsByDate).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Engagement type distribution
  const engagementTypes = {};
  engagements.forEach((e) => {
    engagementTypes[e.engagement_type] =
      (engagementTypes[e.engagement_type] || 0) + 1;
  });

  const typeDistribution = Object.entries(engagementTypes).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const COLORS = ["#00d4ff", "#2ed573", "#ffa502", "#ff6b6b", "#a855f7"];

  // Campaign success rates
  const campaignSuccess = campaigns
    .filter((c) => c.status === "completed" || c.status === "active")
    .map((c) => {
      const campaignEngagements = engagements.filter(
        (e) => e.campaign_id === c.id
      );
      const successCount = campaignEngagements.filter((e) => e.success).length;
      const successRate =
        campaignEngagements.length > 0
          ? Math.round((successCount / campaignEngagements.length) * 100)
          : 0;

      return {
        name: c.campaign_name.substring(0, 15),
        successRate,
        engagements: campaignEngagements.length,
        successes: successCount,
      };
    })
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Engagement Trends Over Time */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Engagement Timeline</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(0,212,255,0.3)",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line type="monotone" dataKey="sent" stroke="#00d4ff" />
            <Line type="monotone" dataKey="opened" stroke="#2ed573" />
            <Line type="monotone" dataKey="clicked" stroke="#ffa502" />
            <Line type="monotone" dataKey="submitted" stroke="#ff6b6b" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Engagement Type Distribution */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(0,212,255,0.3)",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Success Rates */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={campaignSuccess}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(0,212,255,0.3)",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="successRate" fill="#2ed573" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel Analysis */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Engagement Funnel</h3>
        <div className="space-y-2">
          {[
            { stage: "Sent", count: engagements.length, color: "bg-blue-500" },
            {
              stage: "Delivered",
              count: engagements.filter((e) => e.engagement_type !== "sent").length,
              color: "bg-cyan-500",
            },
            {
              stage: "Opened",
              count: engagements.filter((e) => e.engagement_type !== "sent" && e.engagement_type !== "delivered").length,
              color: "bg-green-500",
            },
            {
              stage: "Clicked",
              count: engagements.filter((e) => e.engagement_type === "clicked" || e.engagement_type === "submitted").length,
              color: "bg-orange-500",
            },
            {
              stage: "Submitted",
              count: engagements.filter((e) => e.engagement_type === "submitted").length,
              color: "bg-red-500",
            },
          ].map((level) => (
            <div key={level.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-300">{level.stage}</span>
                <span className="text-sm text-gray-400">{level.count}</span>
              </div>
              <div className="bg-slate-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className={`${level.color} h-full transition-all`}
                  style={{ width: `${(level.count / engagements.length) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}