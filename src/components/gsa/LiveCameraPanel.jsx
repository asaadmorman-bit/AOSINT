import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Plus, X, MapPin, Eye, Lock, Globe, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Public webcam sources (using Windy Webcams API as example)
const PUBLIC_FEEDS = [
  { id: "nyc-times-sq", name: "Times Square, NYC", lat: 40.758, lng: -73.9855, url: "https://videos3.earthcam.com/fecnetwork/hdtimes10.flv/chunklist_w414825138.m3u8", type: "public", city: "New York" },
  { id: "tokyo-shibuya", name: "Shibuya Crossing, Tokyo", lat: 35.6595, lng: 139.7004, url: "https://www.youtube.com/embed/live_stream?channel=UCWOqYJ-5x5DXno9F-AQvVMA", type: "public", city: "Tokyo" },
  { id: "london-piccadilly", name: "Piccadilly Circus, London", lat: 51.5101, lng: -0.1340, url: "https://www.youtube.com/embed/live_stream?channel=UCQ4EoyO0sg8T-e4RqOEBqjg", type: "public", city: "London" },
  { id: "paris-eiffel", name: "Eiffel Tower, Paris", lat: 48.8584, lng: 2.2945, url: "https://www.youtube.com/embed/live_stream?channel=UCCqBl_VLJaSJAz5M1NfXZLw", type: "public", city: "Paris" },
  { id: "dubai-burj", name: "Burj Khalifa, Dubai", lat: 25.1972, lng: 55.2744, url: "https://www.youtube.com/embed/live_stream?channel=UCq6nPvBqy4DrwFGP1zP4GGg", type: "public", city: "Dubai" },
  { id: "moscow-red-sq", name: "Red Square, Moscow", lat: 55.7539, lng: 37.6208, url: "https://www.youtube.com/embed/live_stream?channel=UCW1QGC-9Jp_iMFGKgYGvN4g", type: "public", city: "Moscow" },
  { id: "hong-kong", name: "Victoria Harbor, Hong Kong", lat: 22.2855, lng: 114.1577, url: "https://www.youtube.com/embed/live_stream?channel=UCJncHq8gHHg5Xz13_aPR9Yw", type: "public", city: "Hong Kong" },
  { id: "sydney-opera", name: "Sydney Opera House", lat: -33.8568, lng: 151.2153, url: "https://www.youtube.com/embed/live_stream?channel=UCTJwUHfBNRQgG5Mz5kM8Lwg", type: "public", city: "Sydney" },
];

export default function LiveCameraPanel({ onCameraSelect, selectedLocation }) {
  const [activeCamera, setActiveCamera] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: "", url: "", lat: "", lng: "", auth_key: "" });
  const queryClient = useQueryClient();

  // Fetch user's private camera feeds from database
  const { data: privateFeeds = [] } = useQuery({
    queryKey: ["privateFeeds"],
    queryFn: async () => {
      const feeds = await base44.entities.CameraFeed?.list() || [];
      return feeds;
    },
  });

  const addFeedMutation = useMutation({
    mutationFn: async (feedData) => {
      return await base44.entities.CameraFeed.create(feedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privateFeeds"] });
      setShowAddForm(false);
      setNewFeed({ name: "", url: "", lat: "", lng: "", auth_key: "" });
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.CameraFeed.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privateFeeds"] });
      if (activeCamera?.type === "private") setActiveCamera(null);
    },
  });

  const allFeeds = [...PUBLIC_FEEDS, ...privateFeeds.map(f => ({ ...f, type: "private" }))];

  const handleCameraClick = (feed) => {
    setActiveCamera(feed);
    if (onCameraSelect) {
      onCameraSelect({ lat: parseFloat(feed.lat), lng: parseFloat(feed.lng), zoom: 15 });
    }
  };

  const handleAddFeed = (e) => {
    e.preventDefault();
    addFeedMutation.mutate({
      name: newFeed.name,
      url: newFeed.url,
      lat: parseFloat(newFeed.lat),
      lng: parseFloat(newFeed.lng),
      auth_key: newFeed.auth_key || null,
      status: "active",
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a] border-l border-white/5">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-xs font-bold tracking-widest text-white">LIVE FEEDS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </Button>
      </div>

      {/* Add Feed Form */}
      {showAddForm && (
        <div className="p-3 border-b border-white/5 bg-white/3">
          <form onSubmit={handleAddFeed} className="space-y-2">
            <Input
              placeholder="Feed Name"
              value={newFeed.name}
              onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
              className="h-7 text-xs bg-black/30 border-white/10"
              required
            />
            <Input
              placeholder="Stream URL (RTSP, HLS, or YouTube embed)"
              value={newFeed.url}
              onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
              className="h-7 text-xs bg-black/30 border-white/10"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={newFeed.lat}
                onChange={(e) => setNewFeed({ ...newFeed, lat: e.target.value })}
                className="h-7 text-xs bg-black/30 border-white/10"
                required
              />
              <Input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={newFeed.lng}
                onChange={(e) => setNewFeed({ ...newFeed, lng: e.target.value })}
                className="h-7 text-xs bg-black/30 border-white/10"
                required
              />
            </div>
            <Input
              placeholder="Auth Key (optional)"
              value={newFeed.auth_key}
              onChange={(e) => setNewFeed({ ...newFeed, auth_key: e.target.value })}
              className="h-7 text-xs bg-black/30 border-white/10"
            />
            <Button type="submit" size="sm" className="w-full h-7 text-xs bg-[#00e5ff] text-black hover:bg-[#00b4cc]">
              Add Camera Feed
            </Button>
          </form>
        </div>
      )}

      {/* Camera Feed List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allFeeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => handleCameraClick(feed)}
            className={`w-full p-2 rounded-md text-left transition-all ${
              activeCamera?.id === feed.id
                ? "bg-[#00e5ff]/15 border border-[#00e5ff]/30"
                : "bg-white/3 hover:bg-white/5 border border-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {feed.type === "private" ? (
                  <Lock className="w-3 h-3 text-yellow-500 shrink-0" />
                ) : (
                  <Globe className="w-3 h-3 text-[#00e5ff] shrink-0" />
                )}
                <span className="text-xs font-medium text-white truncate">{feed.name}</span>
              </div>
              {feed.type === "private" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFeedMutation.mutate(feed.id);
                  }}
                  className="shrink-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <MapPin className="w-2.5 h-2.5" />
              <span>{feed.city || `${feed.lat}°, ${feed.lng}°`}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Video Player */}
      {activeCamera && (
        <div className="border-t border-white/5 bg-black">
          <div className="p-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3 text-[#00e5ff]" />
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">LIVE</span>
            </div>
            <button onClick={() => setActiveCamera(null)} className="text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="aspect-video bg-black relative">
            {activeCamera.url.includes("youtube.com") || activeCamera.url.includes("youtu.be") ? (
              <iframe
                src={activeCamera.url}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={activeCamera.url}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                controls
              />
            )}
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-mono">
              {activeCamera.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}