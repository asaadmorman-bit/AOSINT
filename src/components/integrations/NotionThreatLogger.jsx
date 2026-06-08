import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Send, CheckCircle2, AlertCircle, Loader2, Database, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SEV_COLORS = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function NotionThreatLogger({ findings = [], onComplete }) {
  const [databaseId, setDatabaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  const handleLog = async () => {
    if (!databaseId.trim()) { setError("Please enter your Notion Database ID."); return; }
    if (findings.length === 0) { setError("No findings to log."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('logThreatToNotion', {
        databaseId: databaseId.trim().replace(/-/g, ''),
        findings,
      });
      setResults(res.data);
      if (onComplete) onComplete(res.data);
    } catch (err) {
      setError(err.message || "Failed to log to Notion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0d1220] border border-white/8 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">Log to Notion</span>
          <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px]">Connected</Badge>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-gray-600 hover:text-gray-300">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Findings preview */}
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs text-gray-400">{findings.length} finding{findings.length !== 1 ? 's' : ''} ready to log</span>
        {findings.length > 0 && (
          <button onClick={() => setExpanded(e => !e)} className="text-[10px] text-gray-600 hover:text-gray-400 underline">
            {expanded ? "hide" : "preview"}
          </button>
        )}
      </div>

      {expanded && findings.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {findings.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-white/3 rounded text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${SEV_COLORS[f.severity] || SEV_COLORS.medium}`}>
                {f.severity?.toUpperCase()}
              </span>
              <span className="text-gray-300 truncate">{f.title}</span>
              <span className="text-gray-600 shrink-0 text-[9px] uppercase">{f.domain}</span>
            </div>
          ))}
        </div>
      )}

      {/* Database ID input */}
      <div className="space-y-1">
        <label className="text-[11px] text-gray-500 font-mono uppercase tracking-widest">
          Notion Database ID
        </label>
        <Input
          placeholder="e.g. 1234abcd5678efgh90ij..."
          value={databaseId}
          onChange={e => setDatabaseId(e.target.value)}
          className="bg-white/5 border-white/10 text-gray-200 text-xs font-mono placeholder-gray-700 h-8"
        />
        <p className="text-[10px] text-gray-700">
          Open your Notion database → copy the ID from the URL:{" "}
          <span className="font-mono text-gray-600">notion.so/.../<u>DATABASE_ID</u>?v=...</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/5 border border-red-500/15 rounded p-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Success results */}
      {results && (
        <div className="bg-green-500/5 border border-green-500/15 rounded p-3 space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {results.logged}/{results.total} findings logged to Notion
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {results.results?.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                {r.success
                  ? <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                  : <AlertCircle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                }
                <span className={r.success ? "text-gray-400" : "text-red-400"}>{r.title}</span>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 ml-auto shrink-0">
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleLog}
        disabled={loading || findings.length === 0}
        className="w-full bg-white text-black hover:bg-gray-200 text-xs h-8 font-bold"
      >
        {loading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Logging to Notion...</>
          : <><Send className="w-3.5 h-3.5 mr-2" />Log {findings.length} Finding{findings.length !== 1 ? 's' : ''} to Notion</>
        }
      </Button>
    </div>
  );
}