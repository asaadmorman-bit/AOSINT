import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2 } from "lucide-react";

export default function DatasetCurator({ agentId, datasets }) {
  const [showCreate, setShowCreate] = useState(false);
  const [datasetData, setDatasetData] = useState({
    dataset_name: "",
    agent_id: agentId,
    dataset_type: "threat_detection",
    focus_area: "",
    status: "draft",
  });

  const queryClient = useQueryClient();

  const createDatasetMutation = useMutation({
    mutationFn: () => base44.entities.TrainingDataset.create(datasetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingDatasets"] });
      setDatasetData({
        dataset_name: "",
        agent_id: agentId,
        dataset_type: "threat_detection",
        focus_area: "",
        status: "draft",
      });
      setShowCreate(false);
    },
  });

  const addFeedbackToDatasetMutation = useMutation({
    mutationFn: ({ datasetId, feedbackIds }) =>
      base44.entities.TrainingDataset.update(datasetId, {
        source_feedback_ids: feedbackIds,
        status: "curated",
        quality_score: calculateQualityScore(feedbackIds),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingDatasets"] });
    },
  });

  const calculateQualityScore = (feedbackIds) => {
    return Math.min(100, 60 + feedbackIds.length * 5);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Training Datasets</h3>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Dataset
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs text-gray-400 mb-2">Type</label>
              <select
                value={datasetData.dataset_type}
                onChange={(e) => setDatasetData({ ...datasetData, dataset_type: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              >
                <option value="threat_detection">Threat Detection</option>
                <option value="incident_response">Incident Response</option>
                <option value="threat_hunting">Threat Hunting</option>
                <option value="analysis">Analysis</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Focus Area</label>
            <input
              type="text"
              value={datasetData.focus_area}
              onChange={(e) => setDatasetData({ ...datasetData, focus_area: e.target.value })}
              placeholder="e.g., ransomware detection, lateral movement"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createDatasetMutation.mutate()}
              disabled={createDatasetMutation.isPending || !datasetData.dataset_name}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-semibold">{dataset.dataset_name}</p>
                <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/20 mt-1 text-[8px]">
                  {dataset.dataset_type}
                </Badge>
              </div>
              {dataset.status === 'completed' && (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
            </div>

            <div className="space-y-1 text-xs mb-3">
              <p className="text-gray-400">Focus: {dataset.focus_area}</p>
              <p className="text-gray-400">Data Points: {dataset.data_points || 0}</p>
              {dataset.quality_score && (
                <p className="text-gray-400">Quality Score: {dataset.quality_score}%</p>
              )}
              {dataset.actual_improvement && (
                <p className="text-green-400">
                  ↑ Improvement: {dataset.actual_improvement}%
                </p>
              )}
            </div>

            <Badge className={`text-[8px] ${
              dataset.status === 'completed'
                ? 'bg-green-900/30 text-green-300 border-green-500/20'
                : dataset.status === 'in_training'
                ? 'bg-blue-900/30 text-blue-300 border-blue-500/20'
                : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'
            }`}>
              {dataset.status}
            </Badge>
          </div>
        ))}
      </div>

      {datasets.length === 0 && !showCreate && (
        <div className="text-center text-gray-500 py-8">
          No training datasets yet. Create one to start curating feedback.
        </div>
      )}
    </div>
  );
}