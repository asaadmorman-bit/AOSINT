import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
  Facebook, Instagram, RefreshCw, Settings
} from "lucide-react";

export default function SocialMediaFeedManager({ feedChannelId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    platform: "facebook",
    account_id: "",
    account_name: "",
    hashtags: "",
    keywords: ""
  });

  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['socialMediaFeedConfigs', feedChannelId],
    queryFn: () => base44.entities.SocialMediaFeedConfig.filter({ feed_channel_id: feedChannelId }),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialMediaFeedConfig.create({
      ...data,
      feed_channel_id: feedChannelId,
      hashtags: data.hashtags ? data.hashtags.split(',').map(h => h.trim()) : [],
      keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaFeedConfigs'] });
      setForm({ platform: "facebook", account_id: "", account_name: "", hashtags: "", keywords: "" });
      setIsAdding(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialMediaFeedConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaFeedConfigs'] });
    }
  });

  const syncMutation = useMutation({
    mutationFn: () => base44.functions.invoke('syncSocialMediaFeedsToChannels'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaFeedConfigs'] });
    }
  });

  const PlatformIcon = form.platform === "instagram" ? Instagram : Facebook;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Facebook className="w-4 h-4" /> Social Media News Bulletins
        </h3>
        <Button
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Feed
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">Platform</Label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">Account ID</Label>
              <Input
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                placeholder="e.g., 123456789"
                className="text-xs h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-400">Account Name</Label>
            <Input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="e.g., Official Company Page"
              className="text-xs h-8"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400">Hashtags (comma-separated)</Label>
            <Input
              value={form.hashtags}
              onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
              placeholder="#cybersecurity, #threatintel"
              className="text-xs h-8"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400">Keywords (comma-separated)</Label>
            <Input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="breach, vulnerability, attack"
              className="text-xs h-8"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createMutation.mutate(form)}
              disabled={!form.account_id || !form.account_name || createMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-xs"
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Save Config
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading configs...</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-xs">No social media feeds configured yet</div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                {config.platform === "instagram" ? (
                  <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                ) : (
                  <Facebook className="w-4 h-4 text-blue-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{config.account_name}</p>
                  <p className="text-[11px] text-gray-500">
                    ID: {config.account_id} • Last sync: {config.last_sync ? new Date(config.last_sync).toLocaleString() : "Never"}
                  </p>
                  {(config.hashtags?.length > 0 || config.keywords?.length > 0) && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {config.hashtags?.map((h) => (
                        <Badge key={h} variant="secondary" className="text-[10px] py-0 px-1.5">#{h}</Badge>
                      ))}
                      {config.keywords?.map((k) => (
                        <Badge key={k} variant="outline" className="text-[10px] py-0 px-1.5">{k}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="h-7 w-7 p-0"
                  title="Sync now"
                >
                  <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(config.id)}
                  disabled={deleteMutation.isPending}
                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3 text-[12px] text-yellow-300 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">API Token Required</p>
          <p className="text-yellow-200/80">Set <code className="bg-black/20 px-1 rounded">META_GRAPH_API_TOKEN</code> in environment variables to enable syncing.</p>
        </div>
      </div>
    </div>
  );
}