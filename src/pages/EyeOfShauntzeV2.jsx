import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Eye, Radio, Zap, Target, Activity, Crosshair, Shield, X, MapPin, Satellite, Globe2
} from "lucide-react";
import Earth3D from "@/components/gsa/Earth3D";
import ThreatTimeSlider from "@/components/gsa/ThreatTimeSlider";

// ── Severity config ──────────────────────────────────────
const SEV = {
  critical: { color: "#ff4757", label: "CRITICAL", glow: 18, dot: 4.5 },
  high:     { color: "#ff6b6b", label: "HIGH",     glow: 14, dot: 3.5 },
  medium:   { color: "#ffa502", label: "MEDIUM",   glow: 10, dot: 2.5 },
  low:      { color: "#2ed573", label: "LOW",       glow: 7,  dot: 2   },
  info:     { color: "#00d4ff", label: "INFO",      glow: 6,  dot: 1.5 },
};

// ── Static known threat locations ────────────────────────
const STATIC_POINTS = [
  { lat: 39.9,  lng: 116.4, severity: "critical", label: "APT41 C2",          detail: "Beijing, CN · Active C2 Infrastructure"       },
  { lat: 55.7,  lng: 37.6,  severity: "critical", label: "Sandworm",           detail: "Moscow, RU · GRU Unit 74455"                  },
  { lat: 39.0,  lng: 125.7, severity: "critical", label: "Lazarus Group",      detail: "Pyongyang, KP · DPRK State Actor"             },
  { lat: 35.7,  lng: 51.4,  severity: "high",     label: "APT34 / OilRig",     detail: "Tehran, IR · MOIS-linked"                    },
  { lat: 37.5,  lng: 127.0, severity: "high",     label: "IOC Cluster",        detail: "Seoul, KR · Recon Activity"                  },
  { lat: 35.7,  lng: 139.7, severity: "high",     label: "Malware Host",       detail: "Tokyo, JP · Cobalt Strike Beacon"            },
  { lat: 51.5,  lng: -0.1,  severity: "medium",   label: "Phishing C2",        detail: "London, UK · Credential Harvester"           },
  { lat: 40.7,  lng: -74.0, severity: "high",     label: "Ransomware Node",    detail: "New York, US · BlackCat Affiliate"           },
  { lat: 48.9,  lng: 2.3,   severity: "medium",   label: "DDoS Source",        detail: "Paris, FR · Botnet Node"                     },
  { lat: -23.5, lng: -46.6, severity: "low",      label: "Scan Origin",        detail: "São Paulo, BR · Port Scanner"                },
  { lat: 28.6,  lng: 77.2,  severity: "medium",   label: "Malware Host",       detail: "New Delhi, IN · Phishing Kit"                },
  { lat: 1.35,  lng: 103.8, severity: "low",      label: "Proxy Node",         detail: "Singapore, SG · Anonymization Layer"         },
  { lat: 52.5,  lng: 13.4,  severity: "medium",   label: "Tor Exit Node",      detail: "Berlin, DE · Known Exit Relay"               },
  { lat: 25.2,  lng: 55.3,  severity: "high",     label: "C2 Infrastructure",  detail: "Dubai, AE · Fast-Flux Domain"                },
  { lat: 41.0,  lng: 28.9,  severity: "medium",   label: "Phishing Origin",    detail: "Istanbul, TR · BEC Campaign"                 },
  { lat: 37.8,  lng: -122.4,severity: "low",      label: "Scan Activity",      detail: "San Francisco, US · Shodan Crawler"          },
  { lat: -33.9, lng: 18.4,  severity: "low",      label: "Botnet Node",        detail: "Cape Town, ZA · Mirai Variant"               },
  { lat: 59.9,  lng: 30.3,  severity: "high",     label: "APT29 / Cozy Bear",  detail: "St. Petersburg, RU · SVR-linked"             },
  { lat: 31.2,  lng: 121.5, severity: "critical", label: "APT10 / Stone Panda",detail: "Shanghai, CN · MSS-linked"                   },
  { lat: 19.4,  lng: -99.1, severity: "medium",   label: "Cartel Cyber Ops",   detail: "Mexico City, MX · Criminal Actor"            },
];

// ── Globe math ───────────────────────────────────────────
const toRad = d => d * Math.PI / 180;
function latLngToXYZ(lat, lng) {
  const phi = toRad(90 - lat), theta = toRad(lng + 180);
  return { x: -Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) };
}
function rotateY(p, a) { return { x: p.x*Math.cos(a)+p.z*Math.sin(a), y: p.y, z: -p.x*Math.sin(a)+p.z*Math.cos(a) }; }
function rotateX(p, a) { return { x: p.x, y: p.y*Math.cos(a)-p.z*Math.sin(a), z: p.y*Math.sin(a)+p.z*Math.cos(a) }; }
function rotate(p, yaw, pitch) { return rotateX(rotateY(p, yaw), pitch); }
function project(p, cx, cy, r) { return { x: cx + p.x * r, y: cy - p.y * r, z: p.z }; }

function drawGrid(ctx, yaw, pitch, cx, cy, r) {
  // Latitude lines
  for (let lat = -80; lat <= 80; lat += 20) {
    const phi = toRad(90 - lat), y3 = Math.cos(phi), rL = Math.sin(phi);
    ctx.beginPath(); let s = false;
    for (let i = 0; i <= 120; i++) {
      const lng = -180 + 3 * i, theta = toRad(lng + 180);
      const rot = rotate({ x: -rL*Math.cos(theta), y: y3, z: rL*Math.sin(theta) }, yaw, pitch);
      if (rot.z < 0) { s = false; continue; }
      const p = project(rot, cx, cy, r);
      s ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), s = true);
    }
    ctx.strokeStyle = lat === 0 ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.06)";
    ctx.lineWidth = lat === 0 ? 1 : 0.5; ctx.stroke();
  }
  // Longitude lines
  for (let lng = -180; lng < 180; lng += 20) {
    ctx.beginPath(); let s = false;
    for (let i = 0; i <= 80; i++) {
      const lat = -90 + i * (180/80);
      const rot = rotate(latLngToXYZ(lat, lng), yaw, pitch);
      if (rot.z < 0) { s = false; continue; }
      const p = project(rot, cx, cy, r);
      s ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), s = true);
    }
    ctx.strokeStyle = "rgba(0,212,255,0.05)"; ctx.lineWidth = 0.5; ctx.stroke();
  }
}

function drawArc(ctx, from, to, yaw, pitch, cx, cy, r, color) {
  ctx.beginPath(); let s = false;
  for (let i = 0; i <= 50; i++) {
    const t = i / 50, lat = from.lat + (to.lat - from.lat) * t, lng = from.lng + (to.lng - from.lng) * t;
    const rot = rotate(latLngToXYZ(lat, lng), yaw, pitch);
    if (rot.z < 0) { s = false; continue; }
    const p = project(rot, cx, cy, r);
    s ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), s = true);
  }
  ctx.strokeStyle = color; ctx.globalAlpha = 0.18; ctx.lineWidth = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
}

function drawRealisticEarth(ctx, cx, cy, r, yaw, pitch) {
  // Draw base sphere with radial gradient (ocean)
  const baseGrad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.2, cx, cy, r);
  baseGrad.addColorStop(0, "#2a5a8a");
  baseGrad.addColorStop(0.6, "#1a3a5a");
  baseGrad.addColorStop(1, "#0a1a2a");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Draw continents as dots/pixels for better globe appearance
  const continents = [
    // North America
    ...Array.from({length: 200}, () => [30 + Math.random()*30, -130 + Math.random()*50]),
    // South America  
    ...Array.from({length: 120}, () => [-30 + Math.random()*40, -80 + Math.random()*35]),
    // Europe
    ...Array.from({length: 80}, () => [40 + Math.random()*25, -10 + Math.random()*40]),
    // Africa
    ...Array.from({length: 150}, () => [-10 + Math.random()*45, 5 + Math.random()*45]),
    // Asia
    ...Array.from({length: 250}, () => [20 + Math.random()*50, 60 + Math.random()*90]),
    // Australia
    ...Array.from({length: 60}, () => [-35 + Math.random()*25, 120 + Math.random()*30]),
  ];

  continents.forEach(([lat, lng]) => {
    const xyz = latLngToXYZ(lat, lng);
    const rot = rotate(xyz, yaw, pitch);
    if (rot.z > 0) {
      const p = project(rot, cx, cy, r);
      const brightness = Math.max(0, rot.z);
      ctx.fillStyle = `rgba(34, 139, 34, ${brightness * 0.9})`;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  });

  // Add terminator (day/night) effect
  const termGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  termGrad.addColorStop(0, "rgba(0,0,0,0.5)");
  termGrad.addColorStop(0.3, "rgba(0,0,0,0)");
  termGrad.addColorStop(0.7, "rgba(0,0,0,0)");
  termGrad.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = termGrad;
  ctx.fill();

  // Specular highlight (sun reflection)
  const specGrad = ctx.createRadialGradient(cx - r*0.25, cy - r*0.25, 0, cx - r*0.25, cy - r*0.25, r*0.5);
  specGrad.addColorStop(0, "rgba(255,255,255,0.25)");
  specGrad.addColorStop(0.5, "rgba(255,255,255,0.08)");
  specGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();
}

// ── Main Component ───────────────────────────────────────
export default function EyeOfShauntzeV2() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [livePoints, setLivePoints]   = useState([]);
  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [feed, setFeed]               = useState([]);
  const [deepDiving, setDeepDiving]   = useState(false);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [regionalStats, setRegionalStats] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [autoDeepDive, setAutoDeepDive] = useState(false);

  // ── Time replay state ──────────────────────────────────
  const [replayTime, setReplayTime] = useState(null); // null = show all
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRange, setTimeRange] = useState({ min: null, max: null });

  // ── Load live data ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingStats(true);
      const [iocs, cases] = await Promise.all([
        base44.entities.IOCRecord?.list().catch(() => []),
        base44.entities.IncidentCase?.list().catch(() => []),
      ]);
      const iocList  = iocs  || [];
      const caseList = cases || [];

      // Build live geo points from enriched IOCs
      const enrichedPts = iocList
        .filter(i => i.enrichment_data?.ipinfo?.loc)
        .map(i => {
          const [lat, lng] = i.enrichment_data.ipinfo.loc.split(",").map(Number);
          return { lat, lng, severity: i.severity || "medium", label: i.value, detail: `${i.ioc_type?.toUpperCase()} · ${i.enrichment_data?.ipinfo?.city || ""}, ${i.enrichment_data?.ipinfo?.country || ""}` };
        });

      setLivePoints(enrichedPts);

      const critical = iocList.filter(i => i.severity === "critical").length;
      const high     = iocList.filter(i => i.severity === "high").length;
      const openC    = caseList.filter(c => !["closed","false_positive"].includes(c.status)).length;
      const score    = Math.min(100, critical * 8 + high * 4 + openC * 3);

      setStats({ critical, high, openCases: openC, totalIOCs: iocList.length, score });

      // Calculate regional statistics
      const regions = {};
      [...STATIC_POINTS, ...enrichedPts].forEach(p => {
        const region = getRegionFromCoords(p.lat, p.lng);
        if (!regions[region]) {
          regions[region] = { name: region, total: 0, critical: 0, high: 0, medium: 0, low: 0 };
        }
        regions[region].total++;
        regions[region][p.severity]++;
      });
      setRegionalStats(Object.values(regions).sort((a, b) => b.total - a.total));

      // Simulated live feed ticker
      const events = [
        ...iocList.slice(0,3).map(i => ({ type: "ioc",  msg: `IOC detected: ${i.value}`,           time: new Date(i.created_date), sev: i.severity })),
        ...caseList.slice(0,3).map(c => ({ type: "case", msg: `Case opened: ${c.title||c.case_id}`, time: new Date(c.created_date), sev: c.severity })),
        { type: "sys", msg: "ASOSINT threat feeds synchronized", time: new Date(), sev: "info" },
        { type: "sys", msg: "Eye of Shauntze SA feed active",    time: new Date(), sev: "info" },
      ].sort((a,b) => b.time - a.time).slice(0,8);
      setFeed(events);
      setLoadingStats(false);
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  // Assign deterministic timestamps to static points spanning the last 90 days
  const now = Date.now();
  const day90 = 90 * 24 * 60 * 60 * 1000;
  const staticWithTimestamps = STATIC_POINTS.map((p, i) => ({
    ...p,
    timestamp: new Date(now - day90 + (i / STATIC_POINTS.length) * day90),
    severity: p.severity || "medium",
  }));

  const liveWithTimestamps = livePoints.map(p => ({
    ...p,
    timestamp: new Date(),
    severity: p.severity || "medium",
  }));

  const allPoints = [...staticWithTimestamps, ...liveWithTimestamps];

  // Compute time range from all points
  useEffect(() => {
    if (!allPoints.length) return;
    const times = allPoints.map(p => new Date(p.timestamp).getTime()).filter(Boolean);
    const min = Math.min(...times);
    const max = Math.max(...times);
    setTimeRange({ min, max });
    setReplayTime(max); // default: show everything
  }, [livePoints]);

  // Filtered points for globe (by replayTime)
  const visiblePoints = replayTime
    ? allPoints.filter(p => new Date(p.timestamp).getTime() <= replayTime)
    : allPoints;

  // Auto deep dive when a point is clicked
  useEffect(() => {
    if (selectedPoint && autoDeepDive) {
      handleDeepDive(null, true);
      setAutoDeepDive(false);
    }
  }, [selectedPoint, autoDeepDive]);



  const sevColor = { critical:"#ff4757", high:"#ff6b6b", medium:"#ffa502", low:"#2ed573", info:"#00d4ff" };

  const getRegionFromCoords = (lat, lng) => {
    // Middle East (priority check)
    if (lat > 12 && lat < 42 && lng > 25 && lng < 65) return "Middle East";
    // North Africa
    if (lat > 15 && lat < 38 && lng > -18 && lng < 52) return "North Africa";
    // Sub-Saharan Africa
    if (lat > -35 && lat < 15 && lng > -20 && lng < 52) return "Sub-Saharan Africa";
    // Europe
    if (lat > 35 && lat < 72 && lng > -10 && lng < 40) return "Europe";
    // East Asia
    if (lat > 20 && lat < 55 && lng > 100 && lng < 145) return "East Asia";
    // South Asia
    if (lat > 5 && lat < 40 && lng > 60 && lng < 100) return "South Asia";
    // Southeast Asia
    if (lat > -10 && lat < 25 && lng > 95 && lng < 145) return "Southeast Asia";
    // Central Asia
    if (lat > 35 && lat < 55 && lng > 45 && lng < 95) return "Central Asia";
    // Russia/CIS
    if (lat > 40 && lng > 20 && lng < 180) return "Russia/CIS";
    // North America
    if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return "North America";
    // Central America & Caribbean
    if (lat > 7 && lat < 33 && lng > -120 && lng < -60) return "Central America & Caribbean";
    // South America
    if (lat > -56 && lat < 15 && lng > -82 && lng < -35) return "South America";
    // Oceania
    if (lat > -50 && lat < -10 && lng > 110 && lng < 180) return "Oceania";
    // Pacific Islands
    if (lat > -30 && lat < 30 && lng > 130 || lng < -130) return "Pacific Islands";
    // Arctic
    if (lat > 65) return "Arctic";
    // Antarctica
    if (lat < -60) return "Antarctica";
    return "Other";
  };

  const handleDeepDive = async (context = null, autoTrigger = false) => {
    setDeepDiving(true);
    setDeepDiveData(null);

    try {
      let prompt;
      if (context?.type === 'region') {
        const regionData = regionalStats.find(r => r.name === context.region);
        prompt = `You are an elite threat intelligence analyst. Provide a comprehensive regional threat analysis for ${context.region}:

Region: ${context.region}
Total Threats: ${regionData.total}
Critical: ${regionData.critical} | High: ${regionData.high} | Medium: ${regionData.medium} | Low: ${regionData.low}

Provide:
1. Regional Threat Landscape Overview (geopolitical context, key threat actors)
2. Dominant Threat Types & Attack Vectors
3. Critical Infrastructure at Risk
4. Attribution Analysis (state-sponsored vs criminal groups)
5. Trend Analysis (escalation patterns, emerging threats)
6. Recommended Regional Defense Posture
7. Intelligence Gaps & Collection Priorities

Be specific, actionable, and intelligence-focused for this region.`;
      } else if (selectedPoint) {
        prompt = `You are an elite threat intelligence analyst. Provide a comprehensive deep dive analysis of the following threat intelligence event:

Event: ${selectedPoint.label}
Location: ${selectedPoint.detail}
Severity: ${selectedPoint.severity?.toUpperCase()}
Coordinates: ${selectedPoint.lat?.toFixed(2)}°, ${selectedPoint.lng?.toFixed(2)}°

Provide:
1. Threat Summary (2-3 sentences)
2. Attribution & Actor Profile (known TTPs, infrastructure, motivations)
3. Geopolitical Context (why this location, regional dynamics)
4. Technical Indicators (IOCs, malware families, attack vectors if applicable)
5. Recommended Actions (immediate steps, long-term mitigation)
6. Risk Assessment (potential impact, likelihood of escalation)

Be specific, actionable, and intelligence-focused.`;
      } else {
        setDeepDiving(false);
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setDeepDiveData(response);
    } catch (error) {
      console.error('Deep dive failed:', error);
      setDeepDiveData("Analysis failed. Please try again.");
    } finally {
      setDeepDiving(false);
    }
  };

  return (
    <div className="space-y-3 lg:space-y-4 p-2 lg:p-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 lg:gap-3">
        <div>
          <h1 className="text-lg lg:text-xl font-black text-white flex items-center gap-2">
            <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-[#00d4ff]" /> Eye of Shauntze
            <span className="text-[9px] lg:text-[10px] text-[#00d4ff] font-mono bg-[#00d4ff]/10 px-1.5 lg:px-2 py-0.5 rounded-full border border-[#00d4ff]/20 animate-pulse">LIVE SA</span>
          </h1>
          <p className="text-[10px] lg:text-xs text-gray-500 mt-0.5 hidden sm:block">Real-time Earth monitoring · Satellites · Conflicts · OSINT feeds · Drag to rotate · Scroll to zoom</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2ed573] animate-pulse" />
          FEED ACTIVE · {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* ── Regional Stats Bar ── */}
      <div className="bg-[#0d1220] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-[#00d4ff]" /> Regional Threat Distribution
          </p>
          {selectedRegion && (
            <button onClick={() => setSelectedRegion(null)} className="text-[9px] text-gray-500 hover:text-gray-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto gap-2 p-2">
          {regionalStats.slice(0, 8).map(region => (
            <button
              key={region.name}
              onClick={() => {
                setSelectedRegion(region);
                handleDeepDive({ type: 'region', region: region.name });
              }}
              className={`shrink-0 px-3 py-2 rounded-lg border transition-all ${
                selectedRegion?.name === region.name
                  ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30'
                  : 'bg-[#0a0f1e] border-white/5 hover:border-[#00d4ff]/20'
              }`}
            >
              <p className="text-xs font-bold text-white mb-1">{region.name}</p>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-gray-500">Total:</span>
                <span className="text-xs font-mono text-white">{region.total}</span>
              </div>
              <div className="flex gap-1">
                {region.critical > 0 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20">
                    C:{region.critical}
                  </span>
                )}
                {region.high > 0 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20">
                    H:{region.high}
                  </span>
                )}
                {region.medium > 0 && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-[#ffa502]/10 text-[#ffa502] border border-[#ffa502]/20">
                    M:{region.medium}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 lg:gap-2">
        {[
          { label: "Threat Score",   value: loadingStats ? "—" : stats?.score,        color: "#ff4757", icon: Activity   },
          { label: "Critical IOCs",  value: loadingStats ? "—" : stats?.critical,      color: "#ff4757", icon: Crosshair  },
          { label: "Open Cases",     value: loadingStats ? "—" : stats?.openCases,     color: "#ffa502", icon: Shield     },
          { label: "Total IOCs",     value: loadingStats ? "—" : stats?.totalIOCs,     color: "#00d4ff", icon: Target     },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#0d1220] border border-white/5 rounded-lg lg:rounded-xl px-2 py-2 lg:px-3 lg:py-2.5 flex items-center gap-2 lg:gap-2.5">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor:`${m.color}15`, border:`1px solid ${m.color}25` }}>
                <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5" style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-base lg:text-lg font-black text-white leading-none">{m.value}</p>
                <p className="text-[8px] lg:text-[9px] text-gray-600">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Globe + side panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-4">

        {/* Globe — 3 cols */}
        <div className="lg:col-span-3 bg-[#0a0f1e] border border-[#00d4ff]/15 rounded-xl lg:rounded-2xl overflow-hidden relative" style={{ height: 600 }}>
          <Earth3D 
            events={visiblePoints}
            onEventClick={(event) => {
              setSelectedPoint(event);
              setDeepDiveData(null);
              setAutoDeepDive(true);
            }}
            selectedEvent={selectedPoint}
          />
          
          {/* Time slider — overlaid at bottom center */}
          {timeRange.min && timeRange.max && (
            <div className="absolute bottom-14 left-3 right-3 z-20">
              <ThreatTimeSlider
                minTime={timeRange.min}
                maxTime={timeRange.max}
                currentTime={replayTime ?? timeRange.max}
                onChange={(updater) => setReplayTime(prev => updater(prev ?? timeRange.max))}
                isPlaying={isPlaying}
                onPlayPause={setIsPlaying}
                onReset={() => { setReplayTime(timeRange.min); setIsPlaying(false); }}
                visibleCount={visiblePoints.length}
                totalCount={allPoints.length}
              />
            </div>
          )}

          {/* Status bar — bottom */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
            <div className="bg-[#0a0f1e]/85 border border-white/8 rounded-lg px-2 py-1 flex items-center gap-1.5">
              <Satellite className="w-3 h-3 text-[#00d4ff]" />
              <span className="text-[9px] font-mono text-gray-600">6 satellites</span>
            </div>
            <div className="bg-[#0a0f1e]/85 border border-white/8 rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-gray-600">{visiblePoints.length} / {allPoints.length} threats</span>
            </div>
          </div>

          {/* Legend — bottom right */}
          <div className="absolute bottom-3 right-3 bg-[#0a0f1e]/85 border border-white/8 rounded-lg px-2 py-1.5 space-y-0.5 z-10 pointer-events-none">
            {Object.entries(SEV).filter(([k])=>k!=="info").map(([k,v])=>(
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:v.color}}/>
                <span className="text-[8px] text-gray-500 capitalize font-mono">{k}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel — 1 col */}
        <div className="lg:col-span-1 space-y-3">
          {/* Selected point detail */}
          {selectedPoint ? (
            <div className="bg-[#0d1220] border border-white/8 rounded-xl p-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-black text-xs">Threat Intelligence</p>
                <button onClick={()=>{setSelectedPoint(null);setDeepDiveData(null);}}><X className="w-3.5 h-3.5 text-gray-500 hover:text-white"/></button>
              </div>
              
              {/* Event summary */}
              <div className="mb-3 pb-3 border-b border-white/5">
                <p className="text-sm font-bold mb-1" style={{color:sevColor[selectedPoint.severity]}}>{selectedPoint.label}</p>
                <p className="text-gray-400 text-[10px] leading-relaxed">{selectedPoint.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[8px] px-1.5 py-0.5 rounded border font-mono" style={{color:sevColor[selectedPoint.severity],borderColor:`${sevColor[selectedPoint.severity]}30`,backgroundColor:`${sevColor[selectedPoint.severity]}10`}}>
                    {selectedPoint.severity?.toUpperCase()}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded border border-white/10 text-gray-500 font-mono">
                    {selectedPoint.lat?.toFixed(2)}°N {selectedPoint.lng?.toFixed(2)}°E
                  </span>
                </div>
              </div>

              {/* Deep Dive button */}
              {!deepDiveData && !selectedRegion && (
                <button
                  onClick={() => handleDeepDive()}
                  disabled={deepDiving}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 hover:border-[#00d4ff]/40 text-[#00d4ff] font-bold rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deepDiving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target className="w-3.5 h-3.5" />
                      Deep Dive Analysis
                    </>
                  )}
                </button>
              )}

              {/* Deep dive results */}
              {deepDiveData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#00d4ff] flex items-center gap-1">
                      <Target className="w-3 h-3" /> {selectedRegion ? `Regional Analysis: ${selectedRegion.name}` : 'Deep Dive Analysis'}
                    </p>
                    <button
                      onClick={() => setDeepDiveData(null)}
                      className="text-[8px] text-gray-500 hover:text-gray-300 underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="bg-[#0a0f1e] border border-[#00d4ff]/10 rounded-lg p-3 text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {deepDiveData}
                  </div>
                  <button
                    onClick={() => selectedRegion ? handleDeepDive({ type: 'region', region: selectedRegion.name }) : handleDeepDive()}
                    disabled={deepDiving}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold rounded-lg text-[10px] transition-all"
                  >
                    Refresh Analysis
                  </button>
                </div>
              )}
            </div>
          ) : selectedRegion ? (
            <div className="bg-[#0d1220] border border-white/8 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-black text-xs">Region Overview</p>
                <button onClick={()=>{setSelectedRegion(null);setDeepDiveData(null);}}><X className="w-3.5 h-3.5 text-gray-500 hover:text-white"/></button>
              </div>
              <p className="text-sm font-bold mb-1 text-[#00d4ff]">{selectedRegion.name}</p>
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Total Threats:</span>
                  <span className="text-white font-mono">{selectedRegion.total}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Critical:</span>
                  <span className="text-[#ff4757] font-mono">{selectedRegion.critical}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">High:</span>
                  <span className="text-[#ff6b6b] font-mono">{selectedRegion.high}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">Medium:</span>
                  <span className="text-[#ffa502] font-mono">{selectedRegion.medium}</span>
                </div>
              </div>
              {!deepDiveData && (
                <button
                  onClick={() => handleDeepDive({ type: 'region', region: selectedRegion.name })}
                  disabled={deepDiving}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 hover:border-[#00d4ff]/40 text-[#00d4ff] font-bold rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deepDiving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target className="w-3.5 h-3.5" />
                      Regional Deep Dive
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#0d1220] border border-white/5 rounded-xl p-3 text-center">
              <MapPin className="w-5 h-5 mx-auto text-gray-700 mb-1"/>
              <p className="text-[10px] text-gray-600">Click a threat marker or region to inspect</p>
            </div>
          )}

          {/* Live event feed */}
          <div className="bg-[#0d1220] border border-white/8 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
              <Radio className="w-3.5 h-3.5 text-[#ff4757] animate-pulse"/>
              <p className="text-white font-black text-xs">Live Event Feed</p>
            </div>
            <div className="divide-y divide-white/4 max-h-64 overflow-y-auto">
              {feed.length === 0 ? (
                <div className="px-3 py-4 text-center text-gray-600 text-xs">No events yet</div>
              ) : feed.map((ev, i) => (
                <div key={i} className="px-3 py-2 flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{backgroundColor: sevColor[ev.sev]||"#666"}}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-[10px] leading-snug">{ev.msg}</p>
                    <p className="text-gray-700 text-[8px] font-mono mt-0.5">{ev.time?.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat breakdown */}
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-3">
            <p className="text-white font-black text-xs mb-2.5 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#ffa502]"/> Node Breakdown</p>
            {Object.entries(SEV).filter(([k])=>k!=="info").map(([sev,cfg])=>{
              const cnt = visiblePoints.filter(p=>p.severity===sev).length;
              const pct = visiblePoints.length ? Math.round(cnt/visiblePoints.length*100) : 0;
              return (
                <div key={sev} className="mb-2">
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="font-mono capitalize" style={{color:cfg.color}}>{sev}</span>
                    <span className="text-gray-600">{cnt}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:cfg.color}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}