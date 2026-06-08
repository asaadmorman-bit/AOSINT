import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Download, BarChart3, Check } from "lucide-react";

export default function DatasetCurator() {
  const [showCreate, setShowCreate] = useState(false);
  const [datasetData, setDatasetData] = useState({
    dataset_name: "",
    description: "",
    agent_types: [],
    dataset_type: "threat_detection",
    source: "feedback_curation",
    training_data: "[]",
  });

  const queryClient = useQueryClient();

  const { data: datasets = [] } = useQuery({
    queryKey: ["trainingDatasets"],
    queryFn: () => base44.entities.AgentTrainingDataset.list(),
  });

  const { data: feedbackData = [] } = useQuery({
    queryKey: ["trainingFeedback"],
    queryFn: () => base44.entities.AgentTrainingFeedback.filter({ training_value: true }),
  });

  const createDatasetMutation = useMutation({
    mutationFn: () => {
      const trainingArray = JSON.parse(datasetData.training_data || "[]");
      return base44.entities.AgentTrainingDataset.create({
        ...datasetData,
        curator_id: "curator@example.com",
        record_count: trainingArray.length,
        positive_examples: trainingArray.filter(t => t.label === "positive").length,
        negative_examples: trainingArray.filter(t => t.label === "negative").length,
        quality_score: calculateQualityScore(trainingArray),
        created_date: new Date().toISOString(),
        status: "curated",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingDatasets"] });
      setDatasetData({
        dataset_name: "",
        description: "",
        agent_types: [],
        dataset_type: "threat_detection",
        source: "feedback_curation",
        training_data: "[]",
      });
      setShowCreate(false);
    },
  });

  const calculateQualityScore = (data) => {
    if (data.length === 0) return 0;
    const balance = Math.min(
      data.filter(d => d.label === "positive").length,
      data.filter(d => d.label === "negative").length
    ) / (data.length / 2);
    const completeness = data.filter(d => d.features && d.label).length / data.length;
    return Math.round((balance * 0.5 + completeness * 0.5) * 100);
  };

  const generateFromFeedback = () => {
    const trainingData = feedbackData.map(feedback => ({
      features: {
        accuracy: feedback.accuracy_rating,
        effectiveness: feedback.effectiveness_rating,
        detection_accuracy: feedback.threat_detection_accuracy,
        false_positives: feedback.false_positive_count,
        false_negatives: feedback.false_negative_count,
      },
      label: feedback.feedback_type === "positive" ? "positive" : "negative",
      feedback_id: feedback.id,
    }));

    setDatasetData({
      ...datasetData,
      training_data: JSON.stringify(trainingData),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          Training Dataset Curator
        </h3>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Dataset
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Dataset Name</label>
              <input
                type="text"
                value={datasetData.dataset_name}
                onChange={(e) => setDatasetData({ ...datasetData, dataset_name: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Dataset Type</label>
              <select
                value={datasetData.dataset_type}
                onChange={(e) => setDatasetData({ ...datasetData, dataset_type: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              >
                <option value="threat_detection">Threat Detection</option>
                <option value="incident_response">Incident Response</option>
                <option value="behavior_analysis">Behavior Analysis</option>
                <option value="decision_making">Decision Making</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Description</label>
            <textarea
              value={datasetData.description}
              onChange={(e) => setDatasetData({ ...datasetData, description: e.target.value })}
              rows="2"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          {feedbackData.length > 0 && (
            <div className="p-3 bg-cyan-900/20 border border-cyan-500/20 rounded">
              <p className="text-xs text-cyan-300 mb-2">
                {feedbackData.length} training samples available from feedback
              </p>
              <Button
                onClick={generateFromFeedback}
                size="sm"
                variant="outline"
              >
                <Check className="w-3 h-3 mr-1" />
                Generate from Feedback
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => createDatasetMutation.mutate()}
              disabled={
                createDatasetMutation.isPending ||
                !datasetData.dataset_name ||
                datasetData.training_data === "[]"
              }
              className="bg-green-600 hover:bg-green-700"
            >
              Create Dataset
            </Button>
            <Button onClick={() => setShowCreate(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Datasets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{dataset.dataset_name}</p>
                <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/20 mt-1 text-[8px]">
                  {dataset.dataset_type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <Badge className={`${
                dataset.quality_score > 80
                  ? "bg-green-900/30 text-green-300 border-green-500/20"
                  : "bg-yellow-900/30 text-yellow-300 border-yellow-500/20"
              }`}>
                {dataset.quality_score}%
              </Badge>
            </div>

            <p className="text-xs text-gray-400 mb-3">{dataset.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="bg-black/30 p-2 rounded">
                <p className="text-gray-400">Samples</p>
                <p className="text-cyan-400 font-bold">{dataset.record_count}</p>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <p className="text-gray-400">Positive</p>
                <p className="text-green-400 font-bold">{dataset.positive_examples}</p>
              </div>
              <div className="bg-black/30 p-2 rounded">
                <p className="text-gray-400">Negative</p>
                <p className="text-red-400 font-bold">{dataset.negative_examples}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700" variant="outline">
                <BarChart3 className="w-3 h-3 mr-1" />
                Use for Training
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {datasets.length === 0 && !showCreate && (
        <p className="text-center text-gray-500 py-8">No datasets created yet.</p>
      )}
    </div>
  );
}