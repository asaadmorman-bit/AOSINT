import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function FeedbackForm({ agentId }) {
  const [feedbackData, setFeedbackData] = useState({
    agent_id: agentId,
    feedback_type: "positive",
    feedback_category: "accuracy",
    rating: 3,
    description: "",
    task_id: "",
    is_corrective: false,
    correction_details: "{}",
  });
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["agentTasks", agentId],
    queryFn: () => base44.entities.AgentTask.filter({ agent_id: agentId }, "-end_time", 10),
    enabled: !!agentId,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.AgentFeedback.create({
        ...feedbackData,
        operator_id: me?.email,
        timestamp: new Date().toISOString(),
        impact_score: calculateImpactScore(feedbackData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentFeedback"] });
      queryClient.invalidateQueries({ queryKey: ["agentMetrics"] });
      setSubmitted(true);
      setTimeout(() => {
        setFeedbackData({
          agent_id: agentId,
          feedback_type: "positive",
          feedback_category: "accuracy",
          rating: 3,
          description: "",
          task_id: "",
          is_corrective: false,
          correction_details: "{}",
        });
        setSubmitted(false);
      }, 2000);
    },
  });

  const calculateImpactScore = (data) => {
    let score = 50;
    if (data.feedback_type === "corrective") score += 30;
    if (data.feedback_type === "negative") score += 20;
    if (data.rating && data.rating < 3) score += 15;
    return Math.min(100, score);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Provide Agent Feedback</h3>

      {submitted && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/20 rounded text-green-400 text-sm">
          ✓ Feedback submitted successfully
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Feedback Type</label>
          <select
            value={feedbackData.feedback_type}
            onChange={(e) => setFeedbackData({ ...feedbackData, feedback_type: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="corrective">Corrective</option>
            <option value="suggestion">Suggestion</option>
            <option value="false_positive">False Positive</option>
            <option value="false_negative">False Negative</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Category</label>
          <select
            value={feedbackData.feedback_category}
            onChange={(e) => setFeedbackData({ ...feedbackData, feedback_category: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="accuracy">Accuracy</option>
            <option value="speed">Speed</option>
            <option value="relevance">Relevance</option>
            <option value="actionability">Actionability</option>
            <option value="decision_logic">Decision Logic</option>
            <option value="escalation_timing">Escalation Timing</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Related Task (optional)</label>
          <select
            value={feedbackData.task_id}
            onChange={(e) => setFeedbackData({ ...feedbackData, task_id: e.target.value })}
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">Select a task...</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.task_name} - {task.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Rating (1-5)</label>
          <select
            value={feedbackData.rating}
            onChange={(e) => setFeedbackData({ ...feedbackData, rating: Number(e.target.value) })}
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value="1">1 - Poor</option>
            <option value="2">2 - Below Average</option>
            <option value="3">3 - Average</option>
            <option value="4">4 - Good</option>
            <option value="5">5 - Excellent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Feedback Description</label>
        <textarea
          value={feedbackData.description}
          onChange={(e) => setFeedbackData({ ...feedbackData, description: e.target.value })}
          placeholder="Provide detailed feedback on agent performance..."
          rows="4"
          className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
        />
      </div>

      <label className="flex items-center gap-2 my-4 cursor-pointer">
        <input
          type="checkbox"
          checked={feedbackData.is_corrective}
          onChange={(e) => setFeedbackData({ ...feedbackData, is_corrective: e.target.checked })}
          className="rounded"
        />
        <span className="text-xs text-gray-400">This is a corrective action with specific details</span>
      </label>

      {feedbackData.is_corrective && (
        <div className="mb-4 p-3 bg-orange-900/10 border border-orange-500/20 rounded">
          <label className="block text-xs text-gray-400 mb-2">Correction Details (JSON)</label>
          <textarea
            value={feedbackData.correction_details}
            onChange={(e) => setFeedbackData({ ...feedbackData, correction_details: e.target.value })}
            placeholder='{"wrong": "...", "should_be": "...", "reason": "..."}'
            rows="3"
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-xs font-mono"
          />
        </div>
      )}

      <Button
        onClick={() => submitFeedbackMutation.mutate()}
        disabled={submitFeedbackMutation.isPending || !feedbackData.description}
        className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}