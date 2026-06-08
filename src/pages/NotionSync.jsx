import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Database, RefreshCw, ExternalLink, Info } from "lucide-react";

export default function NotionSync() {
  const [parentPageId, setParentPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    if (!parentPageId.trim()) {
      setError("Please enter a Notion page ID.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await base44.functions.invoke("syncThreatIntelToNotion", {
      parent_page_id: parentPageId.trim(),
    });
    setLoading(false);
    if (res.data?.success) {
      setResult(res.data);
    } else {
      setError(res.data?.error || "Sync failed. Check logs.");
    }
  };

  const getPageIdFromUrl = (val) => {
    // Accept raw IDs or full Notion URLs
    const match = val.match(/([a-f0-9]{32}|[a-f0-9-]{36})/);
    return match ? match[1].replace(/-/g, "") : val;
  };

  const handleInput = (val) => {
    setParentPageId(getPageIdFromUrl(val));
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
          <Database className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Notion Threat Intel Sync</h1>
          <p className="text-xs text-gray-500">Push ASOSINT data into a Notion master database</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#0d1220] border border-white/8 rounded-xl p-4 flex gap-3 text-sm text-gray-400">
        <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>This sync will create (or update) <span className="text-white">3 databases</span> inside the Notion page you specify:</p>
          <ul className="list-disc list-inside text-gray-500 space-y-0.5 text-xs mt-1">
            <li>🔍 Threat Indicators — up to 200 most recent</li>
            <li>🚨 OSINT Alerts — up to 200 most recent</li>
            <li>👤 Threat Actors — up to 200 most recent</li>
          </ul>
          <p className="text-xs mt-2">
            To get your page ID, open any Notion page → copy the URL → paste it below. The ID will be extracted automatically.
            Make sure the ASOSINT integration is <span className="text-white">shared</span> with that page in Notion.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#0d1220] border border-white/8 rounded-xl p-5 space-y-4">
        <label className="block text-sm text-gray-300 font-medium">Target Notion Page URL or ID</label>
        <Input
          placeholder="https://notion.so/My-Intel-Hub-abc123... or abc123..."
          className="bg-[#111827] border-white/10 text-white placeholder-gray-600 text-sm"
          onChange={(e) => handleInput(e.target.value)}
        />
        {parentPageId && (
          <p className="text-xs text-gray-600">Resolved ID: <span className="text-[#00d4ff] font-mono">{parentPageId}</span></p>
        )}
        <Button
          onClick={handleSync}
          disabled={loading || !parentPageId}
          className="w-full bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/20"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> Run Sync Now</>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#0d1220] border border-[#2ed573]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2ed573]" />
            <span className="text-white font-semibold">Sync Complete</span>
            <span className="text-xs text-gray-500 ml-auto">{new Date(result.synced_at).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Indicators", data: result.results.indicators, emoji: "🔍" },
              { label: "Alerts",     data: result.results.alerts,     emoji: "🚨" },
              { label: "Actors",     data: result.results.actors,     emoji: "👤" },
            ].map(({ label, data, emoji }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg">{emoji}</div>
                <div className="text-white font-bold text-lg">{data.created + data.updated}</div>
                <div className="text-xs text-gray-500">{label}</div>
                <div className="flex gap-1 justify-center mt-1">
                  <Badge className="bg-[#2ed573]/10 text-[#2ed573] text-[10px] px-1 py-0">{data.created} new</Badge>
                  <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] text-[10px] px-1 py-0">{data.updated} updated</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Database links */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Notion Databases</p>
            {Object.entries(result.databases).map(([key, id]) => (
              <a
                key={key}
                href={`https://notion.so/${id.replace(/-/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/8 transition-colors text-sm"
              >
                <span className="text-gray-300 capitalize">{key}</span>
                <div className="flex items-center gap-1 text-[#00d4ff] text-xs">
                  <span className="font-mono">{id.slice(0, 8)}…</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>

          {/* Errors */}
          {result.results.errors?.length > 0 && (
            <details className="text-xs text-red-400">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
                {result.results.errors.length} errors during sync
              </summary>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                {result.results.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}