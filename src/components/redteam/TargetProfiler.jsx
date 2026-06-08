import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp, AlertTriangle, Heart } from "lucide-react";

export default function TargetProfiler() {
  const [showForm, setShowForm] = useState(false);
  const [profileData, setProfileData] = useState({
    target_name: "",
    target_type: "individual",
    organization: "",
    role: "",
    email: "",
    phone: "",
    social_media_profiles: [],
    interests_hobbies: [],
    trust_relationships: [],
  });
  const [newSocialProfile, setNewSocialProfile] = useState("");

  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["targetProfiles"],
    queryFn: () => base44.entities.TargetProfile.list(),
  });

  const createProfileMutation = useMutation({
    mutationFn: () =>
      base44.entities.TargetProfile.create({
        ...profileData,
        susceptibility_score: calculateSusceptibility(profileData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targetProfiles"] });
      setProfileData({
        target_name: "",
        target_type: "individual",
        organization: "",
        role: "",
        email: "",
        phone: "",
        social_media_profiles: [],
        interests_hobbies: [],
        trust_relationships: [],
      });
      setShowForm(false);
    },
  });

  const calculateSusceptibility = (data) => {
    let score = 50;
    if (data.role?.toLowerCase().includes("executive")) score += 15;
    if (data.social_media_profiles?.length > 0) score += 10;
    if (data.interests_hobbies?.length > 3) score += 10;
    if (data.trust_relationships?.length > 0) score += 15;
    return Math.min(100, score);
  };

  const addSocialProfile = () => {
    if (newSocialProfile.trim()) {
      setProfileData({
        ...profileData,
        social_media_profiles: [...profileData.social_media_profiles, newSocialProfile.trim()],
      });
      setNewSocialProfile("");
    }
  };

  const vulnerabilityFactors = {
    "Social Media Presence": profileData.social_media_profiles?.length || 0,
    "Multiple Interests": profileData.interests_hobbies?.length || 0,
    "Trust Network": profileData.trust_relationships?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Target Profiler
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Target Name</label>
              <input
                type="text"
                value={profileData.target_name}
                onChange={(e) => setProfileData({ ...profileData, target_name: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Type</label>
              <select
                value={profileData.target_type}
                onChange={(e) => setProfileData({ ...profileData, target_type: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              >
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
                <option value="role">Role</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Organization</label>
              <input
                type="text"
                value={profileData.organization}
                onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Role/Title</label>
              <input
                type="text"
                value={profileData.role}
                onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Social Media Profiles</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSocialProfile}
                onChange={(e) => setNewSocialProfile(e.target.value)}
                placeholder="LinkedIn profile URL, Twitter handle, etc."
                className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
              />
              <Button onClick={addSocialProfile} size="sm" className="bg-purple-600">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {profileData.social_media_profiles.map((profile, idx) => (
                <Badge
                  key={idx}
                  className="bg-purple-900/30 text-purple-300 border-purple-500/20 cursor-pointer"
                  onClick={() =>
                    setProfileData({
                      ...profileData,
                      social_media_profiles: profileData.social_media_profiles.filter((_, i) => i !== idx),
                    })
                  }
                >
                  {profile.split('/').pop()} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createProfileMutation.mutate()}
              disabled={createProfileMutation.isPending || !profileData.target_name}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Profile
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Profiles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{profile.target_name}</p>
                <p className="text-xs text-gray-400">{profile.role}</p>
              </div>
              <Badge className="bg-orange-900/30 text-orange-300 border-orange-500/20">
                {profile.susceptibility_score || 0}%
              </Badge>
            </div>

            <div className="space-y-2 text-xs mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-gray-400">{profile.organization}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-gray-500" />
                  <span className="text-gray-400 truncate">{profile.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs mb-3">
              {profile.social_media_profiles?.length > 0 && (
                <p className="text-gray-400">
                  <Heart className="w-2 h-2 inline mr-1" />
                  {profile.social_media_profiles.length} social profiles
                </p>
              )}
              {profile.trust_relationships?.length > 0 && (
                <p className="text-gray-400">
                  <TrendingUp className="w-2 h-2 inline mr-1" />
                  {profile.trust_relationships.length} trust relationships
                </p>
              )}
            </div>

            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" variant="outline">
              View Full Profile
            </Button>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          No target profiles created yet. Create one to begin profiling.
        </div>
      )}
    </div>
  );
}