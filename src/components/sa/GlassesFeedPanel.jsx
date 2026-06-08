import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const C = {
  green:  "#00ff41",
  amber:  "#ffa502",
  red:    "#ff4757",
  cyan:   "#00d4ff",
  border: "rgba(0,255,65,0.12)",
  panel:  "#040d04",
};

const SEV_COLOR = { CRIT: C.red, HIGH: C.amber, MED: C.cyan, LOW: C.green, CLEAR: "#3d5c3d" };
const DEVICES   = ["Meta Ray-Ban", "Solos Airgo 3", "Even G2", "Vuzix Blade 2", "XREAL Air 2"];
const AGENTS    = ["ALPHA-1", "BRAVO-3", "CHARLIE-7", "DELTA-2", "ECHO-5"];
const LOCATIONS = ["Beirut", "Bogota", "Istanbul", "Dubai", "Nairobi", "Kyiv", "Seoul"];

export default function GlassesFeedPanel() {
  const queryClient = useQueryClient();
  const fileRef     = useRef(null);

  const [form, setForm]       = useState({ agent_id: AGENTS[0], device: DEVICES[0], location: LOCATIONS[0] });
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [frameB64, setFrameB64] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Poll GlassesFeed every 5 seconds
  const { data: feeds = [] } = useQuery({
    queryKey: ["glasses-feed"],
    queryFn: () => base44.entities.GlassesFeed.list("-created_date", 20),
    refetchInterval: 5000,
  });

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.GlassesFeed.subscribe((event) => {
      if (event.type === "create") {
        queryClient.setQueryData(["glasses-feed"], (old = []) => [event.data, ...old].slice(0, 20));
      }
    });
    return unsub;
  }, [queryClient]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setFrameB64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setLastError(null);
    try {
      await base44.functions.invoke("analyzeGlassesFrame", {
        ...form,
        frame_base64: frameB64 || undefined,
      });
      setPreview(null);
      setFrameB64(null);
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setLastError(err?.response?.data?.error || err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const critCount = feeds.filter(f => f.severity === "CRIT").length;
  const highCount = feeds.filter(f => f.severity === "HIGH").length;

  return (
    <div className="rounded-lg font-mono text-xs" style={{ background: C.panel, border: `1px solid ${C.border}` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-2">
          <span style={{ color: C.green }}>👓</span>
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: C.green }}>AI Glasses Feed</span>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
        </div>
        <div className="flex items-center gap-3">
          {critCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 border" style={{ color: C.red, borderColor: C.red }}>{critCount} CRIT</span>
          )}
          {highCount > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 border" style={{ color: C.amber, borderColor: C.amber }}>{highCount} HIGH</span>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="text-[9px] font-black px-2 py-1 border transition-opacity hover:opacity-80"
            style={{ color: C.cyan, borderColor: C.cyan }}
          >
            {showForm ? "✕ CLOSE" : "+ SUBMIT FRAME"}
          </button>
        </div>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="px-4 py-3 border-b space-y-3" style={{ borderColor: C.border, background: "#020702" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-[9px] mb-1" style={{ color: "#3d5c3d" }}>AGENT ID</div>
              <select
                value={form.agent_id}
                onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))}
                className="w-full px-2 py-1.5 text-[11px] font-mono rounded"
                style={{ background: "#060f06", border: `1px solid ${C.border}`, color: C.green, outline: "none" }}
              >
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: "#3d5c3d" }}>DEVICE</div>
              <select
                value={form.device}
                onChange={e => setForm(f => ({ ...f, device: e.target.value }))}
                className="w-full px-2 py-1.5 text-[11px] font-mono rounded"
                style={{ background: "#060f06", border: `1px solid ${C.border}`, color: C.green, outline: "none" }}
              >
                {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[9px] mb-1" style={{ color: "#3d5c3d" }}>LOCATION</div>
              <select
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-2 py-1.5 text-[11px] font-mono rounded"
                style={{ background: "#060f06", border: `1px solid ${C.border}`, color: C.green, outline: "none" }}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Frame upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-3 rounded cursor-pointer transition-opacity hover:opacity-80"
            style={{ border: `1px dashed ${C.border}`, background: "#060f06" }}
          >
            {preview ? (
              <img src={preview} alt="frame" className="max-h-32 rounded" />
            ) : (
              <span className="text-[10px]" style={{ color: "#3d5c3d" }}>📷 Upload camera frame (optional — AI will assess based on location if none)</span>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {lastError && <div className="text-[10px] px-2 py-1 rounded" style={{ color: C.red, background: "rgba(255,71,87,0.08)" }}>{lastError}</div>}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-2 text-[11px] font-black tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: analyzing ? "#0a1a0a" : "#001a00", border: `1px solid ${C.green}`, color: C.green }}
          >
            {analyzing ? "⟳ AI ANALYZING FRAME..." : "▶ ANALYZE & STREAM"}
          </button>
        </div>
      )}

      {/* Feed list */}
      <div className="divide-y" style={{ borderColor: C.border }}>
        {feeds.length === 0 ? (
          <div className="px-4 py-6 text-center text-[10px]" style={{ color: "#3d5c3d" }}>
            No feeds yet — submit a camera frame to begin AI analysis
          </div>
        ) : feeds.map(f => (
          <div key={f.id} className="px-4 py-3 flex items-start gap-3">
            {f.frame_url && (
              <img src={f.frame_url} alt="frame" className="w-12 h-12 object-cover rounded shrink-0" style={{ border: `1px solid ${C.border}` }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-[10px]" style={{ color: C.amber }}>{f.agent_id}</span>
                <span style={{ color: "#3d5c3d" }}>·</span>
                <span className="text-[9px]" style={{ color: "#4a7a4a" }}>{f.device}</span>
                <span style={{ color: "#3d5c3d" }}>·</span>
                <span className="text-[9px]" style={{ color: "#4a7a4a" }}>📍{f.location}</span>
                {f.confidence != null && (
                  <span className="text-[9px]" style={{ color: "#3d5c3d" }}>conf: {f.confidence}%</span>
                )}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed" style={{ color: "#7aad7a" }}>{f.ai_description}</div>
              {f.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {f.tags.map(tag => (
                    <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,65,0.06)", color: C.green, border: `1px solid ${C.border}` }}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="text-[8px] mt-1" style={{ color: "#2d4a2d" }}>
                {f.created_date ? format(new Date(f.created_date), "HH:mm:ss") : ""}
              </div>
            </div>
            <span className="text-[9px] font-black px-1.5 py-0.5 shrink-0 self-start" style={{ color: SEV_COLOR[f.severity] || C.green, border: `1px solid ${SEV_COLOR[f.severity] || C.green}` }}>
              {f.severity || "CLEAR"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}