import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Mail, Users, CreditCard, Filter } from "lucide-react";

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [form, setForm] = useState({ email: "", full_name: "", role: "user" });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["all_accounts"],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === "admin",
  });

  const { data: trialsignups = [] } = useQuery({
    queryKey: ["trial_signups"],
    queryFn: () => base44.entities.TrialSignup.list("-created_date"),
    enabled: user?.role === "admin",
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => base44.users.inviteUser(data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_accounts"] });
      setShowNewAccount(false);
      setForm({ email: "", full_name: "", role: "user" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ email, role }) => base44.auth.updateMe({ role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all_accounts"] }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (email) => base44.entities.User.delete(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all_accounts"] }),
  });

  // Only allow admins — after all hooks
  if (user && user.role !== "admin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 font-semibold">Admin access required</p>
      </div>
    );
  }

  const filteredAccounts = accounts.filter((acc) => {
    const matchesEmail = acc.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesRole = roleFilter === "all" || acc.role === roleFilter;
    return matchesEmail && matchesRole;
  });

  const filteredSignups = trialsignups.filter((signup) =>
    signup.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Management</h1>
        <p className="text-gray-400">Manage user accounts, invitations, and trial signups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#111827] border border-white/5">
          <TabsTrigger value="accounts" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Users className="w-4 h-4" /> Active Accounts ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="signups" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Mail className="w-4 h-4" /> Trial Signups ({trialsignups.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white flex-1"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowNewAccount(true)} className="gap-2 bg-[#00d4ff] text-black">
              <Plus className="w-4 h-4" /> Invite User
            </Button>
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No accounts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((acc) => (
                <div key={acc.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{acc.full_name || "No Name"}</h3>
                      <p className="text-sm text-gray-500">{acc.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20">
                          {acc.role}
                        </Badge>
                        {acc.created_date && (
                          <Badge variant="outline" className="text-gray-500 border-gray-500/20 text-xs">
                            Joined {new Date(acc.created_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccountMutation.mutate(acc.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trial Signups */}
        <TabsContent value="signups" className="space-y-4">
          <Input
            placeholder="Search signups..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />

          {filteredSignups.length === 0 ? (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-8 text-center">
              <Mail className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No trial signups found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSignups.map((signup) => (
                <div key={signup.id} className="bg-[#111827] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{signup.full_name || "No Name"}</h3>
                      <p className="text-sm text-gray-500">{signup.email}</p>
                      <p className="text-xs text-gray-600 mt-1">{signup.company || "No company"}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${
                          signup.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          signup.status === "pending" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}>
                          {signup.status}
                        </Badge>
                        {signup.created_date && (
                          <Badge variant="outline" className="text-gray-500 border-gray-500/20 text-xs">
                            {new Date(signup.created_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
        <DialogContent className="bg-[#111827] border border-white/10">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                type="email"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs">Full Name (Optional)</label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewAccount(false)}>Cancel</Button>
            <Button
              onClick={() => inviteUserMutation.mutate(form)}
              disabled={!form.email || inviteUserMutation.isPending}
              className="bg-[#00d4ff] text-black"
            >
              {inviteUserMutation.isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}