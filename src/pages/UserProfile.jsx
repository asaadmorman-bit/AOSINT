import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, Mail, Shield, Save, LogOut, Key, Bell, Loader2, CheckCircle2, Trash2, AlertTriangle, Share2 } from "lucide-react";
import SocialSharePanel from "@/components/social/SocialSharePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { createPageUrl } from "@/utils";
import FeedSubscriptionManager from "@/components/profile/FeedSubscriptionManager";
import NotificationSettingsPanel from "@/components/profile/NotificationSettingsPanel";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ full_name: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({ full_name: u?.full_name || "" });
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: form.full_name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Avatar + basic info */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff] text-2xl font-black shrink-0">
          {(user?.full_name || user?.email || "?")[0].toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{user?.full_name || "—"}</div>
          <div className="text-sm text-gray-400">{user?.email}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Shield className="w-3 h-3 text-[#00d4ff]" />
            <span className="text-[11px] text-[#00d4ff] font-semibold uppercase tracking-widest">{user?.role || "user"}</span>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <User className="w-4 h-4 text-[#00d4ff]" /> Profile Information
        </h2>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Display Name</Label>
          <Input
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="Your full name"
            className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-[#00d4ff] focus:ring-[#00d4ff]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Email Address</Label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-gray-400">
            <Mail className="w-4 h-4 shrink-0" />
            {user?.email}
          </div>
          <p className="text-[11px] text-gray-600">Email cannot be changed.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || saved}
          className={saved ? "bg-green-600 hover:bg-green-600 text-white" : "bg-[#00d4ff] text-black hover:bg-[#0099cc]"}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Account details */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <Key className="w-4 h-4 text-[#00d4ff]" /> Account Details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-1">Account Role</div>
            <div className="text-white capitalize">{user?.role || "user"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Member Since</div>
            <div className="text-white">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : "—"}</div>
          </div>
        </div>
      </div>

      {/* Social Sharing */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#00d4ff]" /> Share to Socials
        </h2>
        <p className="text-xs text-gray-500">Post verified threat intel to your social channels. Every post is attributed to ASOSINT by Emerging Defense Solutions.</p>
        <SocialSharePanel />
      </div>

      {/* Feed Subscriptions */}
      <FeedSubscriptionManager user={user} />

      {/* Notification Settings */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00d4ff]" /> Notification Preferences
        </h2>
        <NotificationSettingsPanel user={user} />
      </div>

      {/* Sign Out */}
      <div className="bg-[#0d1220] border border-red-500/10 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <LogOut className="w-4 h-4 text-red-400" /> Sign Out
        </h2>
        <p className="text-sm text-gray-500">You'll be redirected to the homepage after signing out.</p>
        <Button
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          onClick={() => base44.auth.logout(createPageUrl("Homepage"))}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#0d1220] border border-red-600/30 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone — Delete My Account
        </h2>
        <p className="text-sm text-gray-500">
          Permanently delete your account and all associated data including profiles, investigations, alerts, and settings. This action <span className="text-red-400 font-semibold">cannot be undone</span> and all data will be purged within 30 days.
        </p>
        <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-600/40 text-red-500 hover:bg-red-600/10 hover:border-red-600/60"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0d1220] border border-red-600/30 text-white max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Permanently Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                This will <strong className="text-red-400">permanently purge</strong> your account and all associated data — investigations, alerts, profiles, and settings. You will be immediately signed out. <strong className="text-red-400">This cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
                onClick={async (e) => {
                  e.preventDefault();
                  setDeleting(true);
                  try {
                    await base44.functions.invoke('deleteUserAccount', { confirmEmail: user.email });
                  } catch (_) {}
                  base44.auth.logout(createPageUrl("Homepage"));
                }}
              >
                {deleting
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                  : <><Trash2 className="w-4 h-4 mr-2" />Yes, Delete Everything</>
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}