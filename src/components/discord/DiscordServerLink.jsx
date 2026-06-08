import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DiscordServerLink() {
  const [copiedId, setCopiedId] = useState(null);

  const { data: servers = [], isLoading, error } = useQuery({
    queryKey: ["discord_threat_servers"],
    queryFn: () => base44.entities.DiscordThreatServer.list("-created_at", 50),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#00d4ff] mr-2" />
        <span className="text-sm text-gray-400">Loading Discord servers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-xs text-red-300">Failed to load Discord servers</span>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-gray-500">
        <p className="text-sm">No Discord servers connected yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {servers.map(server => (
        <div key={server.id} className="flex items-center justify-between p-4 rounded-lg bg-[#111827] border border-white/5 hover:border-[#00d4ff]/20 transition-colors">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{server.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{server.organization_name || "Personal"}</p>
          </div>
          <div className="flex items-center gap-2">
            {server.discord_invite_url && (
              <a
                href={server.discord_invite_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Server
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-[9px] text-gray-500 hover:text-gray-300"
              onClick={() => {
                navigator.clipboard.writeText(server.discord_server_id);
                setCopiedId(server.id);
                setTimeout(() => setCopiedId(null), 2000);
              }}
            >
              {copiedId === server.id ? "Copied!" : "Copy ID"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}