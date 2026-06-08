import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ThumbsUp, ThumbsDown, AlertCircle, MessageCircle } from "lucide-react";

export default function AgentFeedbackCollector({ agentId, taskId }) {
  const [feedbackType, setFeedbackType] = useState("positive");
  const [accuracyRating, setAccuracyRating] = useState(75);
  const [effectivenessRating, setEffectivenessRating] = useState(75);
  const [responseTime, setResponseTime] = useState(75);
  const [detectionAccuracy, setDetectionAccuracy] = useState(75);
  const [falsePositives, setFalsePositives] = useState(0);
  const [falseNegatives, setFalseNegatives] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [trainingValue, setTrainingValue] = useState(true);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: () =>
      base44.entities.AgentTrainingFeedback.create({
        agent_id: agentId,
        task_id: taskId,
        feedback_type: feedbackType,
        accuracy_rating: accuracyRating,
        effectiveness_rating: effectivenessRating,
        speed_rating: responseTime,
        decision_quality: (accuracyRating + effectivenessRating) / 2,
        feedback_text: feedbackText,
        threat_detection_accuracy: detectionAccuracy,
        false_positive_count: falsePositives,
        false_negative_count: falseNegatives,
        response_effectiveness: (effectivenessRating + detectionAccuracy) / 2,
        operator_id: "operator@example.com",
        timestamp: new Date().toISOString(),
        training_value: trainingValue,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentFeedback"] });
      // Reset form
      setFeedbackType("positive");
      setAccuracyRating(75);
      setEffectivenessRating(75);
      setResponseTime(75);
      setDetectionAccuracy(75);
      setFalsePositives(0);
      setFalseNegatives(0);
      setFeedbackText("");
      setTrainingValue(true);
    },
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-cyan-400" />
        Agent Performance Feedback
      </h3>

      {/* Feedback Type */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Feedback Type</label>
        <div className="flex gap-2">
          {["positive", "negative", "partial", "correction"].map((type) => (
            <button
              key={type}
              onClick={() => setFeedbackType(type)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                feedbackType === type
                  ? "bg-cyan-600 text-white"
                  : "bg-black/30 text-gray-400 hover:bg-black/40"
              }`}
            >
              {type === "positive" && <ThumbsUp className="w-3 h-3 inline mr-1" />}
              {type === "negative" && <ThumbsDown className="w-3 h-3 inline mr-1" />}
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Ratings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Accuracy: {accuracyRating}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={accuracyRating}
            onChange={(e) => setAccuracyRating(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Effectiveness: {effectivenessRating}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={effectivenessRating}
            onChange={(e) => setEffectivenessRating(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Response Speed: {responseTime}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={responseTime}
            onChange={(e) => setResponseTime(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">
            Detection Accuracy: {detectionAccuracy}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={detectionAccuracy}
            onChange={(e) => setDetectionAccuracy(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* False Positives/Negatives */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-2">False Positives</label>
          <input
            type="number"
            value={falsePositives}
            onChange={(e) => setFalsePositives(Number(e.target.value))}
            min="0"
            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">False Negatives</label>
          <input
            type="number"
            value={falseNegatives}
            onChange={(e) => setFalseNegatives(Number(e.target.value))}
            min="0"
            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
          />
        </div>
      </div>

      {/* Feedback Text */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Detailed Feedback</label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Describe agent performance, areas for improvement, and lessons learned..."
          rows="4"
          className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
        />
      </div>

      {/* Training Value */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={trainingValue}
          onChange={(e) => setTrainingValue(e.target.checked)}
          className="rounded"
        />
        <span className="text-xs text-gray-400">Include in training dataset</span>
      </label>

      {/* Submit Button */}
      <Button
        onClick={() => submitMutation.mutate()}
        disabled={submitMutation.isPending || !feedbackText.trim()}
        className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
      </Button>

      {submitMutation.isSuccess && (
        <div className="p-2 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs">
          ✓ Feedback submitted successfully
        </div>
      )}
    </div>
  );
}