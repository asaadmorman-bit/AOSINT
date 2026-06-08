import React from "react";
import { Bell, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WatchlistMatchAlert({ matches, onDismiss }) {
  if (!matches?.length) return null;

  return (
    <div className="bg-[#ffa502]/10 border border-[#ffa502]/30 rounded-xl p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-[#ffa502] shrink-0 mt-0.5 animate-pulse" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#ffa502] mb-1">
          Watchlist Match — {matches.length} keyword{matches.length !== 1 ? "s" : ""} triggered
        </p>
        <div className="flex flex-wrap gap-1.5">
          {matches.map(kw => (
            <Badge key={kw.id} className="bg-[#ffa502]/20 text-[#ffa502] border border-[#ffa502]/30 text-xs">
              {kw.keyword}
              {kw.category && kw.category !== "custom" && (
                <span className="ml-1 opacity-60">({kw.category})</span>
              )}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Link to={createPageUrl("WatchlistConfig")}>
            <Button size="sm" variant="ghost" className="text-[#ffa502] hover:text-[#ffa502] hover:bg-[#ffa502]/10 h-7 px-2 text-xs gap-1">
              <Eye className="w-3 h-3" />
              Manage Watchlist
            </Button>
          </Link>
        </div>
      </div>
      <button onClick={onDismiss} className="text-[#ffa502]/50 hover:text-[#ffa502] transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}