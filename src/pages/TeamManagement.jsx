import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Edit2, Shield, Loader2 } from "lucide-react";

export default function TeamManagement() {
  const [user, setUser] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamType, setNewTeamType] = useState("security");
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("user");
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: members = [] } = useQuery({
    queryKey: ['teamMembers', selectedTeamId],
    queryFn: () => selectedTeamId ? base44.entities.TeamMember.filter({ team_id: selectedTeamId }) : Promise.resolve([]),
    enabled: !!selectedTeamId
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setNewTeamName("");
      setNewTeamType("security");
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setNewMemberEmail("");
      setNewMemberRole("user");
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (memberId) => base44.entities.TeamMember.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, role }) => base44.entities.TeamMember.update(memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    }
  });

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    createTeamMutation.mutate({
      name: newTeamName,
      type: newTeamType,
      owner_email: user?.email
    });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !selectedTeamId) return;
    addMemberMutation.mutate({
      team_id: selectedTeamId,
      user_email: newMemberEmail,
      role: newMemberRole
    });
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const roleColors = {
    admin: "bg-red-100 text-red-800",
    moderator: "bg-yellow-100 text-yellow-800",
    user: "bg-blue-100 text-blue-800"
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Team Collaboration</h1>
        </div>
        <p className="text-gray-600">Create and manage security teams with role-based access control</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Create Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5" />
              Create Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <Input
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={createTeamMutation.isPending}
              />
              <Select value={newTeamType} onValueChange={setNewTeamType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Security Team</SelectItem>
                  <SelectItem value="threat_intel">Threat Intel</SelectItem>
                  <SelectItem value="incident_response">Incident Response</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={createTeamMutation.isPending} className="w-full">
                {createTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Teams ({teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No teams created yet</p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedTeamId === team.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.type}</p>
                      </div>
                      <Badge>{team.member_count} members</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {selectedTeam.name} - Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddMember} className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={addMemberMutation.isPending}
                className="flex-1"
              />
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Add
              </Button>
            </form>

            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No members yet</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                    <div className="flex-1">
                      <p className="font-medium">{member.user_email}</p>
                      <p className="text-sm text-gray-600">{member.user_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(role) => updateMemberMutation.mutate({ memberId: member.id, role })}
                        disabled={updateMemberMutation.isPending}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMemberMutation.mutate(member.id)}
                        disabled={deleteMemberMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}