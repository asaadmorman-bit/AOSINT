import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";

export default function FeedSubscriptionManager({ user }) {
  const [saved, setSaved] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const queryClient = useQueryClient();

  const { data: channels = [] } = useQuery({
    queryKey: ["feed_channels"],
    queryFn: () => base44.entities.FeedChannel.filter({ is_active: true }, "-subscriber_count"),
  });

  useEffect(() => {
    if (user?.feed_subscriptions) {
      setSubscriptions(user.feed_subscriptions);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current_user"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const toggleSubscription = (channelId) => {
    if (subscriptions.includes(channelId)) {
      setSubscriptions(subscriptions.filter(id => id !== channelId));
    } else {
      setSubscriptions([...subscriptions, channelId]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ feed_subscriptions: subscriptions });
  };

  const selectedCount = subscriptions.length;
  const totalCount = channels.length;

  return (
    <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#00d4ff]" /> Discord Feed Subscriptions
        </h2>
        <Badge variant="outline" className="text-[11px]">{selectedCount} / {totalCount}</Badge>
      </div>

      <p className="text-xs text-gray-400">
        Choose which threat intel feeds you want to receive. Unsubscribe from channels you don't need to prevent information overload.
      </p>

      {channels.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">No feeds available</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => toggleSubscription(channel.id)}
              className={`p-3 rounded-lg text-left border transition-all ${
                subscriptions.includes(channel.id)
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {channel.icon && <span className="text-lg">{channel.icon}</span>}
                  {channel.name}
                </div>
                <input
                  type="checkbox"
                  checked={subscriptions.includes(channel.id)}
                  onChange={() => {}}
                  className="cursor-pointer"
                />
              </div>
              {channel.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{channel.description}</p>
              )}
              {channel.category && (
                <Badge variant="secondary" className="text-[9px] mt-2">{channel.category}</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending || saved}
        className={saved ? "w-full bg-green-600 hover:bg-green-600 text-white" : "w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]"}
      >
        {updateMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4 mr-2" />
        ) : null}
        {updateMutation.isPending ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}