import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Zap, Target, Brain } from "lucide-react";

export default function CampaignBuilder() {
  const [campaignData, setCampaignData] = useState({
    campaign_name: "",
    campaign_type: "phishing",
    objective: "",
    target_profile_id: "",
    personalization_level: "role_based",
    engagement_strategy: "curiosity_driven",
    delivery_method: "email",
    learning_enabled: true,
    status: "draft",
  });
  const [selectedTargetProfile, setSelectedTargetProfile] = useState(null);

  const queryClient = useQueryClient();

  const { data: targetProfiles = [] } = useQuery({
    queryKey: ["targetProfiles"],
    queryFn: () => base44.entities.TargetProfile.list(),
  });

  const { data: behaviorPatterns = [] } = useQuery({
    queryKey: ["behaviorPatterns", campaignData.target_profile_id],
    queryFn: () =>
      campaignData.target_profile_id
        ? base44.entities.BehaviorPattern.filter({
            target_profile_id: campaignData.target_profile_id,
          })
        : Promise.resolve([]),
    enabled: !!campaignData.target_profile_id,
  });

  const createCampaignMutation = useMutation({
    mutationFn: () => base44.entities.SocialEngineeringCampaign.create(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setCampaignData({
        campaign_name: "",
        campaign_type: "phishing",
        objective: "",
        target_profile_id: "",
        personalization_level: "role_based",
        engagement_strategy: "curiosity_driven",
        delivery_method: "email",
        learning_enabled: true,
        status: "draft",
      });
    },
  });

  const handleSelectTarget = (profile) => {
    setSelectedTargetProfile(profile);
    setCampaignData({ ...campaignData, target_profile_id: profile.id });
  };

  const strategyDescriptions = {
    direct: "Direct request or instruction",
    relationship_building: "Build trust before request",
    authority_based: "Leverage authority or position",
    curiosity_driven: "Exploit natural curiosity",
    urgency_based: "Create sense of urgency",
    fear_based: "Appeal to fears or concerns",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Zap className="w-6 h-6 text-cyan-400" />
        Campaign Builder
      </h2>

      {/* Campaign Basics */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white">Campaign Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Campaign Name</label>
            <input
              type="text"
              value={campaignData.campaign_name}
              onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Campaign Type</label>
            <select
              value={campaignData.campaign_type}
              onChange={(e) => setCampaignData({ ...campaignData, campaign_type: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              <option value="phishing">Phishing</option>
              <option value="pretexting">Pretexting</option>
              <option value="baiting">Baiting</option>
              <option value="vishing">Vishing</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Objective</label>
          <textarea
            value={campaignData.objective}
            onChange={(e) => setCampaignData({ ...campaignData, objective: e.target.value })}
            placeholder="What is the mission objective?"
            rows="3"
            className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Target Selection */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Select Target Profile
        </h3>

        {selectedTargetProfile ? (
          <div className="bg-black/30 border border-cyan-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{selectedTargetProfile.target_name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedTargetProfile.role} at {selectedTargetProfile.organization}
                </p>
                <div className="flex gap-1 mt-2">
                  <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/20 text-[8px]">
                    Susceptibility: {selectedTargetProfile.susceptibility_score}%
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedTargetProfile(null);
                  setCampaignData({ ...campaignData, target_profile_id: "" });
                }}
                variant="outline"
                size="sm"
              >
                Change
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {targetProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleSelectTarget(profile)}
                className="bg-black/30 border border-white/10 hover:border-cyan-500/30 rounded p-2 cursor-pointer transition"
              >
                <p className="text-white font-semibold text-sm">{profile.target_name}</p>
                <p className="text-xs text-gray-400">{profile.role}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Vulnerability: {profile.susceptibility_score || 0}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Behavioral Insights */}
      {behaviorPatterns.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            Identified Behavior Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {behaviorPatterns.map((pattern) => (
              <div key={pattern.id} className="bg-black/30 border border-blue-500/20 rounded p-2">
                <p className="text-white font-semibold text-sm">{pattern.pattern_name}</p>
                <p className="text-xs text-gray-400 mt-1">{pattern.description}</p>
                <p className="text-xs text-blue-400 mt-1">
                  Timing: {pattern.timing}
                </p>
                <p className="text-xs text-gray-500">
                  Confidence: {pattern.confidence_score}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Selection */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white">Engagement Strategy</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Strategy</label>
            <select
              value={campaignData.engagement_strategy}
              onChange={(e) => setCampaignData({ ...campaignData, engagement_strategy: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              {Object.entries(strategyDescriptions).map(([key, desc]) => (
                <option key={key} value={key}>
                  {key.replace(/_/g, ' ').toUpperCase()} - {desc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Personalization</label>
            <select
              value={campaignData.personalization_level}
              onChange={(e) => setCampaignData({ ...campaignData, personalization_level: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              <option value="generic">Generic</option>
              <option value="role_based">Role-Based</option>
              <option value="highly_personalized">Highly Personalized</option>
              <option value="adaptive">Adaptive Learning</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-2">
            {strategyDescriptions[campaignData.engagement_strategy]}
          </p>
        </div>
      </div>

      {/* Delivery & Options */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white">Delivery & Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Delivery Method</label>
            <select
              value={campaignData.delivery_method}
              onChange={(e) => setCampaignData({ ...campaignData, delivery_method: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="phone">Phone</option>
              <option value="social_media">Social Media</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={campaignData.learning_enabled}
                onChange={(e) => setCampaignData({ ...campaignData, learning_enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-400">Enable Adaptive Learning</span>
            </label>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => createCampaignMutation.mutate()}
          disabled={
            createCampaignMutation.isPending ||
            !campaignData.campaign_name ||
            !campaignData.target_profile_id ||
            !campaignData.objective
          }
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
        </Button>
      </div>
    </div>
  );
}