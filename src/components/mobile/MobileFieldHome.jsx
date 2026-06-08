import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Map, Radio, Shield, QrCode, Copy, CheckCircle2,
  Navigation, AlertTriangle, Wifi, WifiOff, Activity,
  ChevronRight, Lock, Crosshair
} from "lucide-react";
import { buildCaseReportURL, encodeR44 } from "@/utils/radix44";

// Register service worker for offline caching
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

// Cache last-known location via SW message
function cacheLocation(coords) {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_LOCATION",
      payload: { ...coords, cached_at: new Date().toISOString() },
    });
  }
}

export default function MobileFieldHome({ user }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState(null);
  const [qrInput, setQrInput] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    registerSW();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    // Get and cache last-known location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setLocation(coords);
          cacheLocation(coords);
        },
        () => {}
      );
    }

    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const generateR44 = () => {
    if (!qrInput.trim()) return;
    try { setQrToken(encodeR44(qrInput.trim())); } catch { setQrToken("ERROR"); }
  };

  const copyToken = () => {
    if (!qrToken) return;
    navigator.clipboard?.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const QUICK_ACTIONS = [
    { label: "E&E Map", icon: Navigation, color: "#2ed573", to: "OperatorDashboard", desc: "Live routes" },
    { label: "Live Feeds", icon: Radio, color: "#00d4ff", to: "IntelFeeds", desc: "Intel feeds" },
    { label: "Workbench", icon: Shield, color: "#a855f7", to: "OsintWorkbench", desc: "OSINT cases" },
    { label: "Alerts", icon: AlertTriangle, color: "#ff4757", to: "Dashboard", desc: "Active alerts" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
          <span className="text-[10px] font-mono text-gray-500">
            {online ? "CONNECTED" : "OFFLINE MODE"}
          </span>
          {!online && <WifiOff className="w-3 h-3 text-[#ffa502]" />}
        </div>
        {location && (
          <span className="text-[9px] font-mono text-gray-700">
            {location.lat.toFixed(4)}°N {Math.abs(location.lng).toFixed(4)}°W
          </span>
        )}
      </div>

      {/* Offline banner */}
      {!online && (
        <div className="rounded-xl border border-[#ffa502]/20 bg-[#ffa502]/5 px-4 py-3 flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-[#ffa502] shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#ffa502]">Offline Mode Active</p>
            <p className="text-[10px] text-gray-600">Last-known location cached · Core features available</p>
          </div>
        </div>
      )}

      {/* R44 QR Scanner — prominently at top */}
      <div className="rounded-2xl border border-[#00d4ff]/20 bg-[#0d1220]">
        <button
          onClick={() => setQrOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-4 min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-[#00d4ff]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">R44 Site Check-In</p>
              <p className="text-[10px] text-gray-600 font-mono">Radix-44 QR · Quick case access</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${qrOpen ? "rotate-90" : ""}`} />
        </button>

        {qrOpen && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            <p className="text-[10px] text-gray-600 font-mono">Enter a Case ID or any text to generate a QR-safe Radix-44 token:</p>
            <div className="flex gap-2">
              <input
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                placeholder="e.g. CASE-7X9K2"
                className="flex-1 bg-[#060a14] border border-white/8 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#00d4ff]/30 font-mono min-h-[48px]"
                onKeyDown={e => e.key === "Enter" && generateR44()}
              />
              <button
                onClick={generateR44}
                className="bg-[#00d4ff] text-black font-bold text-xs px-4 rounded-xl min-h-[48px] min-w-[64px] hover:bg-[#38bfff] transition-colors"
              >
                Encode
              </button>
            </div>

            {qrToken && (
              <div className="rounded-xl bg-[#060a14] border border-[#00d4ff]/15 p-3 space-y-2">
                <p className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">Radix-44 Token (QR-safe)</p>
                <p className="text-sm font-mono text-[#00d4ff] break-all">{qrToken}</p>
                <button
                  onClick={copyToken}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors min-h-[44px] px-2"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy token"}
                </button>
              </div>
            )}

            <p className="text-[9px] text-gray-700 font-mono">
              Uses 44-char alphabet: 0–9 · A–Z · $%*+-./: · Compatible with QR Alphanumeric Mode
            </p>
          </div>
        )}
      </div>

      {/* Quick action grid — 2×2 on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, color, to, desc }) => (
          <Link
            key={to}
            to={createPageUrl(to)}
            className="flex flex-col gap-2 p-4 rounded-2xl border border-white/5 bg-[#0d1220] hover:border-white/10 transition-all min-h-[96px] active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{label}</p>
              <p className="text-[10px] text-gray-600">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Operator status */}
      <div className="rounded-2xl border border-white/5 bg-[#0d1220] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-[#2ed573]" />
          <p className="text-xs font-bold text-white">Field Status</p>
          <span className="ml-auto text-[9px] font-mono text-[#2ed573] bg-[#2ed573]/10 px-2 py-0.5 rounded border border-[#2ed573]/20">ACTIVE</span>
        </div>
        <div className="space-y-2">
          {[
            { k: "Operator", v: user?.full_name || "—" },
            { k: "Location", v: location ? `${location.lat.toFixed(3)}°N, ${Math.abs(location.lng).toFixed(3)}°W` : "Acquiring…" },
            { k: "Connectivity", v: online ? "Online" : "Offline (cached)", color: online ? "#2ed573" : "#ffa502" },
          ].map(({ k, v, color }) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-gray-600">{k}</span>
              <span className="font-mono" style={{ color: color || "#9ca3af" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}