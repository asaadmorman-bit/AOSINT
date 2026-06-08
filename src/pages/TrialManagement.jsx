import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp, Users } from "lucide-react";
import AdminGuard from "@/components/auth/AdminGuard.jsx";
import TrialListTable from "@/components/trials/TrialListTable";
import TrialDetailsPanel from "@/components/trials/TrialDetailsPanel";
import { Card } from "@/components/ui/card";

function TrialManagementContent() {
  const [selectedTrialId, setSelectedTrialId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch trial signups
  const { data: trials = [], isLoading, refetch } = useQuery({
    queryKey: ["trialSignups"],
    queryFn: async () => {
      const result = await base44.entities.TrialSignup.list("-created_at", 100);
      return result;
    },
  });

  // Filter trials based on status
  const filteredTrials = filterStatus === "all" 
    ? trials 
    : trials.filter(t => t.status === filterStatus);

  // Calculate stats
  const stats = {
    total: trials.length,
    pending: trials.filter(t => t.status === "pending").length,
    active: trials.filter(t => t.status === "approved").length,
    converted: trials.filter(t => t.status === "converted").length,
    expired: trials.filter(t => {
      if (!t.trial_expires) return false;
      return new Date(t.trial_expires) < new Date();
    }).length,
  };

  const selectedTrial = trials.find(t => t.id === selectedTrialId);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-6">
        <h1 className="text-2xl font-bold mb-2">Trial Signup Management</h1>
        <p className="text-sm text-gray-400">Manage trial accounts, verify documents, and track user activity</p>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Total Trials</span>
            <Users className="w-4 h-4 text-[#00d4ff]" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Pending</span>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </Card>
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Active</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
        </Card>
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Converted</span>
            <TrendingUp className="w-4 h-4 text-[#2ed573]" />
          </div>
          <p className="text-2xl font-bold">{stats.converted}</p>
        </Card>
        <Card className="bg-[#0d1220] border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Expired</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold">{stats.expired}</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="border border-white/5 rounded-lg bg-[#0d1220] p-6">
            {/* Filter */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Filter:</span>
              {["all", "pending", "approved", "rejected", "converted"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filterStatus === status
                      ? "bg-[#00d4ff] text-black"
                      : "bg-white/5 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading trials...</div>
            ) : filteredTrials.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No trials found</div>
            ) : (
              <TrialListTable 
                trials={filteredTrials} 
                selectedTrialId={selectedTrialId}
                onSelectTrial={setSelectedTrialId}
              />
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-1">
          {selectedTrial ? (
            <TrialDetailsPanel 
              trial={selectedTrial}
              onRefresh={refetch}
              onClose={() => setSelectedTrialId(null)}
            />
          ) : (
            <div className="border border-white/5 rounded-lg bg-[#0d1220] p-6 text-center text-gray-400">
              <p>Select a trial to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrialManagement() {
  return <AdminGuard><TrialManagementContent /></AdminGuard>;
}