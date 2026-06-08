import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Loader2, Users, Shield, Eye, Briefcase
} from "lucide-react";

export default function CollaboratorPanel({ investigationId, user }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");
  const queryClient = useQueryClient();

  const { data: collaborators, isLoading } = useQuery({
    queryKey: ['investigationCollaborators', investigationId],
    queryFn: () => base44.entities.InvestigationCollaborator.filter(
      { investigation_id: investigationId },
      '-joined_at',
      50
    ),
    initialData: []
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => base44.entities.InvestigationCollaborator.create({
      investigation_id: investigationId,
      user_email: data.email,
      user_name: data.email.split("@")[0],
      role: data.role
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationCollaborators'] });
      setInviteEmail("");
      setInviteRole("analyst");
    }
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestigationCollaborator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationCollaborators'] });
    }
  });

  const roleIcons = {
    owner: Shield,
    lead: Briefcase,
    analyst: Users,
    viewer: Eye
  };

  const roleDescriptions = {
    owner: "Can edit all, manage collaborators",
    lead: "Can manage tasks, add collaborators",
    analyst: "Can comment, add findings",
    viewer: "Read-only access"
  };

  const isOwner = collaborators.find(c => c.user_email === user.email)?.role === "owner";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white text-sm">Team ({collaborators.length})</h3>
      </div>

      {isOwner && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
              className="text-xs h-8 bg-white/5 border-white/10"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="text-xs h-8 bg-white/5 border border-white/10 rounded-md text-white px-2"
            >
              <option value="analyst">Analyst</option>
              <option value="lead">Lead</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button
            onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-xs h-8"
          >
            {inviteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
            Add Collaborator
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading team...</div>
      ) : (
        <div className="space-y-2">
          {collaborators.map(collab => {
            const RoleIcon = roleIcons[collab.role];
            return (
              <div key={collab.id} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0">
                    {collab.user_name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{collab.user_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RoleIcon className="w-2.5 h-2.5 text-gray-500" />
                      <span className="text-[10px] text-gray-500 capitalize">{collab.role}</span>
                    </div>
                  </div>
                </div>
                {isOwner && collab.user_email !== user.email && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeMutation.mutate(collab.id)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 shrink-0"
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[10px] text-gray-500 space-y-1 p-2 bg-white/5 rounded-lg border border-white/10">
        <p className="font-semibold text-gray-400 mb-1">Roles:</p>
        {Object.entries(roleDescriptions).map(([role, desc]) => (
          <p key={role} className="capitalize"><strong>{role}:</strong> {desc}</p>
        ))}
      </div>
    </div>
  );
}