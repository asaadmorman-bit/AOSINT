import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import UpgradePrompt from "@/components/shared/UpgradePrompt";

export default function ApiKeys() {
  const [showNew, setShowNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [userTier] = useState("pro"); // from auth in prod
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["my_api_keys"],
    queryFn: () => base44.entities.ApiKey.filter({ owner_email: user?.email || "" }, "-created_date"),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (name) => {
      const raw = "sk_soint_" + Math.random().toString(36).substring(2, 30);
      setGeneratedKey(raw);
      return base44.entities.ApiKey.create({
        name,
        key_preview: raw.substring(0, 16) + "...",
        key_hash: btoa(raw),
        owner_email: user?.email || "unknown",
        tier: userTier,
        status: "active",
        rate_limit: userTier === "pro" ? 1000 : userTier === "enterprise" ? 10000 : 999999,
        scopes: userTier === "pro" ? ["read"] : ["read", "write", "admin"],
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my_api_keys"] }); setNewKeyName(""); },
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => base44.entities.ApiKey.update(id, { status: "revoked" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my_api_keys"] }),
  });

  const copyKey = () => {
    if (generatedKey) { navigator.clipboard.writeText(generatedKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (userTier === "community") {
    return (
      <div className="space-y-5">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center">
          <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-2">API Access</h3>
          <p className="text-sm text-gray-400 mb-4">API keys are available on Pro plan and above.</p>
        </div>
        <UpgradePrompt minTier="pro" feature="REST API access with rate limits and scoped keys" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Manage API keys for programmatic access to SOINT</p>
        <Button onClick={() => setShowNew(true)} className="bg-[#00d4ff] text-black hover:bg-[#00bfe6] gap-2">
          <Plus className="w-4 h-4" /> Generate Key
        </Button>
      </div>

      {/* Docs hint */}
      <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-xl p-4 text-xs text-gray-400">
        <p className="text-[#00d4ff] font-bold mb-1">API Quick Start</p>
        <code className="text-gray-300 bg-black/20 px-2 py-1 rounded block mt-1">
          curl -H "Authorization: Bearer sk_soint_..." https://api.soint.io/v1/indicators
        </code>
        <p className="mt-2 text-gray-500">Rate limit: <span className="text-gray-300">{userTier === "pro" ? "1,000" : "10,000"} req/hr</span> · Scopes: <span className="text-gray-300">{userTier === "pro" ? "read" : "read, write, admin"}</span></p>
      </div>

      {apiKeys.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-10 text-center">
          <Key className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No API keys yet. Generate your first key to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map(key => (
            <div key={key.id} className="bg-[#111827] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10">
              <div className="p-2 rounded-lg bg-[#00d4ff]/10">
                <Key className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{key.name}</p>
                <code className="text-xs text-gray-500 font-mono">{key.key_preview}</code>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                  <span>Created {new Date(key.created_date).toLocaleDateString()}</span>
                  {key.last_used && <span>Last used {new Date(key.last_used).toLocaleDateString()}</span>}
                  <span>{key.request_count || 0} requests</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={`text-[9px] ${key.status === "active" ? "text-green-400 border-green-500/20" : "text-gray-500 border-gray-700"}`}>{key.status}</Badge>
                {key.status === "active" && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300"
                    onClick={() => revokeMutation.mutate(key.id)}>Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={showNew} onOpenChange={v => { if (!v) setGeneratedKey(null); setShowNew(v); }}>
        <DialogContent className="bg-[#111827] border border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Generate API Key</DialogTitle></DialogHeader>
          {!generatedKey ? (
            <>
              <div>
                <Label className="text-gray-400 text-xs">Key Name</Label>
                <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Production SIEM Integration" />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNew(false)} className="text-gray-400">Cancel</Button>
                <Button onClick={() => createMutation.mutate(newKeyName)} disabled={!newKeyName || createMutation.isPending}
                  className="bg-[#00d4ff] text-black hover:bg-[#00bfe6]">
                  {createMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">Copy this key now. It will not be shown again.</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3 flex items-center gap-2">
                <code className="text-xs text-[#2ed573] flex-1 break-all font-mono">{generatedKey}</code>
                <Button size="sm" variant="ghost" onClick={copyKey} className="shrink-0 text-gray-400 hover:text-white">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowNew(false); setGeneratedKey(null); }} className="bg-[#00d4ff] text-black w-full">Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}