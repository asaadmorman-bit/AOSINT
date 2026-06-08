import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 72;
const MAX_PULL = 100;

// Scoped keyframe — avoids conflicts with Tailwind's animate-spin
const PTR_STYLE = `
  @keyframes ptr-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY      = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) { startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullY(0); return; }
    e.preventDefault();
    setPullY(Math.min(delta * 0.5, MAX_PULL));
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(PULL_THRESHOLD);
      try { await onRefresh(); } catch (_) {}
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress      = Math.min(pullY / PULL_THRESHOLD, 1);
  const showIndicator = pullY > 4 || refreshing;

  // Glow intensity scales with pull progress
  const glowOpacity  = 0.25 + progress * 0.55;
  const glowBlur     = 4 + progress * 8;
  const glowColor    = `rgba(0,212,255,${glowOpacity})`;

  return (
    <div className="relative flex flex-col flex-1" style={{ minHeight: 0, overflow: "hidden" }}>
      <style>{PTR_STYLE}</style>

      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-all duration-200 pointer-events-none overflow-hidden"
        style={{ height: refreshing ? PULL_THRESHOLD : pullY, opacity: showIndicator ? 1 : 0 }}
      >
        <div
          className="w-8 h-8 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center shadow-lg"
          style={{
            boxShadow: `0 0 ${glowBlur}px ${glowColor}, 0 0 ${glowBlur * 2}px ${glowColor}`,
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshCw
            className="w-4 h-4 text-[#00d4ff]"
            style={{
              opacity: 0.5 + progress * 0.5,
              animation: refreshing ? "ptr-spin 0.7s linear infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          minHeight: 0,
          overscrollBehavior: "none",
          transform: `translateY(${refreshing ? PULL_THRESHOLD : pullY}px)`,
          transition: pullY === 0 ? "transform 0.3s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}