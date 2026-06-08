import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertTriangle, Users, ShieldCheck } from "lucide-react";

export default function FeedAISummary({ feed }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generate = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a threat intelligence analyst. Analyze the following threat feed and produce a concise intelligence summary.

Feed Name: ${feed.name}
Feed Type: ${feed.feed_type}
Description: ${feed.description || "No description provided"}
Source URL: ${feed.source_url || "N/A"}
Confidence Level: ${feed.confidence_level}
Status: ${feed.status}

Identify:
1. The main threat (what is the core threat or risk this feed covers)
2. Affected entities (who or what is at risk - organizations, sectors, systems, regions)
3. Recommended actions (2-3 concrete defensive or investigative steps)

Be brief and specific. Use threat intelligence terminology.`,
        response_json_schema: {
          type: "object",
          properties: {
            main_threat: { type: "string" },
            affected_entities: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
          }
        }
      });
      setSummary(result);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-[#00d4ff]">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Analyzing feed...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mt-3 pt-3 border-t border-white/5">
        <Button
          size="sm"
          variant="ghost"
          onClick={generate}
          className="h-6 text-[10px] text-[#00d4ff]/70 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 gap-1 px-2"
        >
          <Sparkles className="w-3 h-3" /> AI Summary
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
        className="flex items-center gap-1.5 text-[10px] text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors w-full"
      >
        <Sparkles className="w-3 h-3" />
        <span className="font-medium">AI Summary</span>
        {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2.5">
          {summary.main_threat && (
            <div className="flex gap-2">
              <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Main Threat</p>
                <p className="text-xs text-gray-300">{summary.main_threat}</p>
              </div>
            </div>
          )}

          {summary.affected_entities?.length > 0 && (
            <div className="flex gap-2">
              <Users className="w-3 h-3 text-[#00d4ff] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Affected Entities</p>
                <div className="flex flex-wrap gap-1">
                  {summary.affected_entities.map((e, i) => (
                    <span key={i} className="text-[10px] bg-white/5 text-gray-400 rounded px-1.5 py-0.5">{e}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {summary.recommended_actions?.length > 0 && (
            <div className="flex gap-2">
              <ShieldCheck className="w-3 h-3 text-[#2ed573] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Recommended Actions</p>
                <ul className="space-y-1">
                  {summary.recommended_actions.map((a, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                      <span className="text-[#2ed573] shrink-0">›</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={generate}
            className="h-5 text-[10px] text-gray-600 hover:text-gray-400 gap-1 px-1 mt-1"
          >
            <Sparkles className="w-2.5 h-2.5" /> Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}