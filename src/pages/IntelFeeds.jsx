import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Hash, Lock, Loader2, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { Button } from "@/components/ui/button";
import ChannelList from "@/components/feeds/ChannelList";
import MessageFeed from "@/components/feeds/MessageFeed";
import MessageComposer from "@/components/feeds/MessageComposer";
import TierGate from "@/components/feeds/TierGate";
import FeedScheduleSettings from "@/components/feeds/FeedScheduleSettings";

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

const TIER_META = {
  community: { color: "#6b7280", label: "Community" },
  pro: { color: "#00d4ff", label: "Pro" },
  enterprise: { color: "#a855f7", label: "Enterprise" },
  gov: { color: "#f59e0b", label: "Gov / CI" },
};

export default function IntelFeeds() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState("community");
  const [activeChannel, setActiveChannel] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [discordServerId, setDiscordServerId] = useState("");
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Resolve tier from subscription / trial
      const res = await base44.functions.invoke("checkSubscription", {});
      setUserTier(res?.data?.tier || "community");
    }).catch(() => {});
  }, []);

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ["feed-channels"],
    queryFn: () => base44.entities.FeedChannel.filter({ is_active: true }),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["feed-messages", activeChannel?.id],
    queryFn: () => activeChannel
      ? base44.entities.FeedMessage.filter({ channel_id: activeChannel.id }, "created_date", 100)
      : Promise.resolve([]),
    enabled: !!activeChannel,
    refetchInterval: 5000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!activeChannel) return;
    const unsub = base44.entities.FeedMessage.subscribe((event) => {
      if (event.data?.channel_id === activeChannel.id) {
        queryClient.invalidateQueries({ queryKey: ["feed-messages", activeChannel.id] });
      }
    });
    return unsub;
  }, [activeChannel?.id]);

  // Set default channel on load
  useEffect(() => {
    if (channels.length && !activeChannel) {
      const first = channels.find(c => c.min_tier === "community") || channels[0];
      setActiveChannel(first);
    }
  }, [channels]);

  const handleIngestData = async () => {
    setIngesting(true);
    setIngestResult(null);
    const res = await base44.functions.invoke("ingestEntityDataToFeeds", {});
    setIngestResult(res?.data || { error: "Unknown error" });
    queryClient.invalidateQueries({ queryKey: ["feed-messages"] });
    setIngesting(false);
  };

  const handleSyncToDiscord = async () => {
    if (!discordServerId.trim()) return;
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke("syncIntelFeedsToDiscord", { discord_server_id: discordServerId.trim() });
    setSyncResult(res?.data || { error: "Unknown error" });
    setSyncing(false);
  };

  const handleQuickSyncThreatIntel = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke("syncThreatIntelToDiscord", { channel_name: "intel-feed" });
    setSyncResult(res?.data || { error: "Unknown error" });
    setSyncing(false);
  };

  const handleQuickSyncOSINT = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke("syncOSINTFeedToDiscord", { channel_name: "osint-feed" });
    setSyncResult(res?.data || { error: "Unknown error" });
    setSyncing(false);
  };

  const hasAccess = true; // beta: all feeds unlocked
  const tierMeta = TIER_META[userTier] || TIER_META.community;

  if (loadingChannels) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
    {/* Admin: Sync to Discord panel */}
    {user?.role === "admin" && (
      <div className="bg-[#0d1220] border border-white/5 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-400">🔗 Sync Intel Feed Channels → Discord Server</span>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs h-7" onClick={handleIngestData} disabled={ingesting}>
              {ingesting ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : "⚡"}
              {ingesting ? "Ingesting..." : "Pull Entity Data → Feeds"}
            </Button>
            {ingestResult && (
              <span className={`text-[10px] ${ingestResult.error ? "text-red-400" : "text-green-400"}`}>
                {ingestResult.error ? `Error: ${ingestResult.error}` : `✓ ${ingestResult.ingested} messages ingested`}
              </span>
            )}
            <Button size="sm" className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-7" onClick={handleQuickSyncThreatIntel} disabled={syncing}>
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : "📤"}
              {syncing ? "Syncing..." : "#intel-feed"}
            </Button>
            <Button size="sm" className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-7" onClick={handleQuickSyncOSINT} disabled={syncing}>
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : "🕵️"}
              {syncing ? "Syncing..." : "#osint-feed"}
            </Button>
            <button onClick={() => setShowSyncPanel(!showSyncPanel)} className="text-[10px] text-[#00d4ff] hover:underline">
              {showSyncPanel ? "Hide Discord" : "Discord Sync"}
            </button>
          </div>
        </div>
        {showSyncPanel && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[11px] text-gray-500">Enter your Discord Server ID to auto-create matching channels and push all future messages to them.</p>
            <div className="flex gap-2">
              <input
                value={discordServerId}
                onChange={e => setDiscordServerId(e.target.value)}
                placeholder="Discord Server ID (e.g. 1234567890)"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00d4ff]"
              />
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#0099cc] text-xs" onClick={handleSyncToDiscord} disabled={syncing || !discordServerId.trim()}>
                {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Sync Now"}
              </Button>
            </div>
            {syncResult && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${syncResult.error ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {syncResult.error ? <AlertCircle className="w-3 h-3 shrink-0" /> : <CheckCircle2 className="w-3 h-3 shrink-0" />}
                {syncResult.message || syncResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    )}
    <div className="flex flex-1 bg-[#0a0e1a] rounded-xl overflow-hidden border border-white/5" style={{ minHeight: 0 }}>
      {/* Sidebar — hidden on mobile when a channel is open */}
      <ChannelList
        channels={channels}
        activeChannelId={activeChannel?.id}
        userTier={userTier}
        onSelect={setActiveChannel}
        mobileHidden={!!activeChannel}
      />

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="flex flex-col border-b border-white/5 bg-[#0d1220] shrink-0">
              <div className="flex items-center gap-2 px-4 py-3">
                {/* Mobile back button */}
                <button
                  className="sm:hidden p-1 rounded-lg hover:bg-white/10 text-gray-400 mr-1"
                  onClick={() => setActiveChannel(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Hash className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="font-bold text-sm text-white truncate">{activeChannel.name}</span>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20">
                    BETA · OPEN
                  </span>
                  {activeChannel.is_readonly && (
                    <span className="text-[9px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full hidden sm:inline">READ ONLY</span>
                  )}
                  {user?.role === "admin" && (
                    <FeedScheduleSettings
                      channel={activeChannel}
                      onUpdated={() => queryClient.invalidateQueries({ queryKey: ["feed-channels"] })}
                    />
                  )}
                </div>
              </div>
              {activeChannel.description && (
                <div className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">
                  {activeChannel.description}
                </div>
              )}
            </div>

            {/* Content */}
            <PullToRefresh onRefresh={() => queryClient.invalidateQueries({ queryKey: ["feed-messages", activeChannel?.id] })}>
              <div className="flex flex-col flex-1">
                <MessageFeed messages={messages} currentUserEmail={user?.email} />
                {!activeChannel.is_readonly && user ? (
                  <MessageComposer
                    channel={activeChannel}
                    user={user}
                    onSent={() => queryClient.invalidateQueries({ queryKey: ["feed-messages", activeChannel.id] })}
                  />
                ) : (
                  <div className="border-t border-white/5 px-5 py-3 bg-[#0d1220] text-xs text-gray-600 flex items-center gap-2">
                    <Lock className="w-3 h-3" /> This channel is read-only.
                  </div>
                )}
              </div>
            </PullToRefresh>
          </>
        ) : (
          <div className="flex-1 hidden sm:flex items-center justify-center text-gray-600 text-sm">
            Select a channel to start
          </div>
        )}
      </div>
    </div>
    </div>
  );
}