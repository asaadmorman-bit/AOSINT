import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import FeedbackForm from "@/components/training/FeedbackForm";
import ActionCorrectionUI from "@/components/training/ActionCorrectionUI";
import DatasetCurator from "@/components/training/DatasetCurator";
import PerformanceAnalytics from "@/components/training/PerformanceAnalytics";

export default function AgentTrainingDashboard({ agentId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: agent } = useQuery({
    queryKey: ["agentProfile", agentId],
    queryFn: () => base44.entities.AgentProfile.list({ id: agentId }).then(r => r[0]),
    enabled: !!agentId,
  });

  const { data: metrics = {} } = useQuery({
    queryKey: ["agentMetrics", agentId],
    queryFn: () => 
      base44.entities.AgentPerformanceMetrics.filter({ agent_id: agentId }, "-end_date", 1)
        .then(r => r[0] || {}),
    enabled: !!agentId,
  });

  const { data: recentFeedback = [] } = useQuery({
    queryKey: ["agentFeedback", agentId],
    queryFn: () => base44.entities.AgentFeedback.filter({ agent_id: agentId }, "-timestamp", 5),
    enabled: !!agentId,
  });

  const { data: recentCorrections = [] } = useQuery({
    queryKey: ["actionCorrections", agentId],
    queryFn: () => base44.entities.ActionCorrection.filter({ agent_id: agentId }, "-timestamp", 5),
    enabled: !!agentId,
  });

  const { data: trainingDatasets = [] } = useQuery({
    queryKey: ["trainingDatasets", agentId],
    queryFn: () => base44.entities.TrainingDataset.filter({ agent_id: agentId }),
    enabled: !!agentId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          Agent Training Module
        </h1>
        <div className="text-sm text-gray-400">
          Training Agent: <span className="text-white font-semibold">{agent?.agent_name}</span>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${metrics.success_rate || 0}%`}
          trend={metrics.improvement_trend}
          trendValue={`${metrics.trend_percentage || 0}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Accuracy"
          value={`${metrics.accuracy || 0}%`}
          trend={metrics.improvement_trend}
          trendValue={`${metrics.trend_percentage || 0}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="False Positive Rate"
          value={`${metrics.false_positive_rate || 0}%`}
          trend={metrics.improvement_trend === 'declining' ? 'improving' : metrics.improvement_trend}
          trendValue={`${metrics.trend_percentage || 0}%`}
          icon={<AlertCircle className="w-5 h-5" />}
          color="orange"
        />
        <MetricCard
          title="Feedback Items"
          value={recentFeedback.length}
          subtext={`${recentCorrections.length} corrections`}
          icon={<BookOpen className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-1">
          {["overview", "feedback", "corrections", "datasets", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            <RecentFeedbackPanel feedback={recentFeedback} />
            <RecentCorrectionsPanel corrections={recentCorrections} />
          </div>
        )}

        {activeTab === "feedback" && <FeedbackForm agentId={agentId} />}

        {activeTab === "corrections" && (
          <ActionCorrectionUI agentId={agentId} onTaskSelect={setSelectedTask} selectedTask={selectedTask} />
        )}

        {activeTab === "datasets" && (
          <DatasetCurator agentId={agentId} datasets={trainingDatasets} />
        )}

        {activeTab === "analytics" && (
          <PerformanceAnalytics agentId={agentId} metrics={metrics} />
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, trendValue, subtext, icon, color }) {
  const colorClasses = {
    green: "bg-green-900/20 border-green-500/20 text-green-400",
    blue: "bg-blue-900/20 border-blue-500/20 text-blue-400",
    orange: "bg-orange-900/20 border-orange-500/20 text-orange-400",
    purple: "bg-purple-900/20 border-purple-500/20 text-purple-400",
  }[color];

  return (
    <div className={`${colorClasses} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase font-semibold">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {trend && (
        <p className={`text-xs ${trend === 'improving' ? 'text-green-400' : trend === 'declining' ? 'text-red-400' : 'text-gray-400'}`}>
          {trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'} {trendValue} {trend}
        </p>
      )}
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}

function RecentFeedbackPanel({ feedback }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Recent Feedback</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {feedback.length === 0 ? (
          <p className="text-xs text-gray-500">No feedback yet</p>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="bg-black/30 border border-white/5 rounded p-2">
              <div className="flex items-start justify-between mb-1">
                <Badge className={`text-[8px] ${
                  item.feedback_type === 'positive'
                    ? 'bg-green-900/30 text-green-300 border-green-500/20'
                    : item.feedback_type === 'negative'
                    ? 'bg-red-900/30 text-red-300 border-red-500/20'
                    : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'
                }`}>
                  {item.feedback_type}
                </Badge>
                {item.rating && <span className="text-xs text-gray-400">{item.rating}/5</span>}
              </div>
              <p className="text-xs text-gray-400">{item.feedback_category}</p>
              <p className="text-xs text-gray-300 mt-1">{item.description?.substring(0, 80)}...</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentCorrectionsPanel({ corrections }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Recent Corrections</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {corrections.length === 0 ? (
          <p className="text-xs text-gray-500">No corrections yet</p>
        ) : (
          corrections.map((item) => (
            <div key={item.id} className="bg-black/30 border border-white/5 rounded p-2">
              <div className="flex items-start justify-between mb-1">
                <Badge className={`text-[8px] ${
                  item.severity === 'critical'
                    ? 'bg-red-900/30 text-red-300 border-red-500/20'
                    : item.severity === 'high'
                    ? 'bg-orange-900/30 text-orange-300 border-orange-500/20'
                    : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'
                }`}>
                  {item.correction_type}
                </Badge>
              </div>
              <p className="text-xs text-gray-400">{item.root_cause?.substring(0, 60)}...</p>
              <p className="text-xs text-blue-400 mt-1">✓ {item.corrected_action?.substring(0, 50)}...</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}