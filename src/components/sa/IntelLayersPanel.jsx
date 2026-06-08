import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const C = {
  green:  "#00ff41",
  amber:  "#ffa502",
  red:    "#ff4757",
  cyan:   "#00d4ff",
  border: "rgba(0,255,65,0.12)",
  panel:  "#040d04",
  row:    "#060f06",
};

const LAYERS = [
  {
    id: "satellite",
    icon: "🛰",
    label: "SAT PASSES",
    sublabel: "Maxar · Capella · Gaofen · Planet",
    color: C.cyan,
    useInternet: true,
    prompt: `Search for the latest public satellite pass data and imagery collection activity as of today. Use sources like N2YO.com, Heavens-Above, Celestrak, Planet Labs blog, Maxar OpenData, or USGS EarthExplorer recent acquisitions. Report on REAL currently active satellite passes or recent imagery collection over conflict zones. Include: satellites currently passing over Ukraine, Gaza, Taiwan Strait, Korean Peninsula, South China Sea, Persian Gulf. For each entry report the satellite name, operator, current or next pass region, altitude, resolution if public, tasking focus area, and whether public imagery has been released. If any emergency imaging tasking has been announced publicly include it. Be explicit about what is from open public sources vs estimated.`,
    schema: {
      type: "object",
      properties: {
        passes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              satellite: { type: "string" },
              region: { type: "string" },
              altitude_km: { type: "number" },
              overpass_utc: { type: "string" },
              resolution_m: { type: "string" },
              status: { type: "string" },
              aoi: { type: "string" },
              operator: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    id: "adsb",
    icon: "✈",
    label: "ADS-B TRACK",
    sublabel: "ADSB Exchange · FlightAware · OpenSky",
    color: C.amber,
    useInternet: true,
    prompt: `Search ADSBexchange.com, FlightAware, FlightRadar24, and OpenSky Network RIGHT NOW for notable real military and government aircraft currently airborne. Look for: USAF reconnaissance aircraft (RC-135, E-8, U-2, E-3), NATO AWACS activity, P-8 Poseidon patrols, RAF/French military flights, interesting squawk codes (7700 emergency, 7600 comms loss), VIP/EXECUTIVE flights (callsigns like SAM, VENUS, TORCH, SPAR), any commercial aircraft diversions over conflict areas, and any unusual military activity over Europe, Middle East, Pacific. Report real callsigns, aircraft types, and approximate positions from PUBLICLY AVAILABLE ADS-B data. Clearly note what is from open ADS-B vs estimated. Include the source URL where possible.`,
    schema: {
      type: "object",
      properties: {
        tracks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              callsign: { type: "string" },
              type: { type: "string" },
              origin: { type: "string" },
              destination: { type: "string" },
              region: { type: "string" },
              altitude_ft: { type: "number" },
              speed_kts: { type: "number" },
              squawk: { type: "string" },
              category: { type: "string" },
              anomaly: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    id: "gps_jam",
    icon: "📡",
    label: "GPS JAM/SPOOF",
    sublabel: "GPSJam.org · EUROCONTROL · NOTAM",
    color: C.red,
    useInternet: true,
    prompt: `Search GPSJam.org, EUROCONTROL GNSS pages, aviation NOTAM databases, and recent news for REAL CURRENT GPS jamming and spoofing events. GPSJam.org shows live crowdsourced GPS interference data by region. Look for: current high-interference zones shown on GPSJam.org (typically Eastern Europe/Baltic/Black Sea/Middle East), any recent EUROCONTROL GPS anomaly alerts, NOTAM warnings about GPS unreliability over specific regions, reports from pilots of GPS spoofing (especially in Lebanon/Israel/Cyprus corridor, Baltic states, Kaliningrad area, Black Sea, Persian Gulf, South China Sea). Report ONLY events that have been publicly reported or are visible on open monitoring tools. Include severity, affected area, suspected source, and whether civil aviation has been warned.`,
    schema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              region: { type: "string" },
              area: { type: "string" },
              jammer_type: { type: "string" },
              power_w: { type: "number" },
              radius_km: { type: "number" },
              actor: { type: "string" },
              start_utc: { type: "string" },
              affected_systems: { type: "string" },
              severity: { type: "string" },
              countermeasures: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    id: "ais",
    icon: "⚓",
    label: "AIS MARITIME",
    sublabel: "MarineTraffic · Windward · UKMTO",
    color: C.cyan,
    useInternet: true,
    prompt: `Search MarineTraffic.com, VesselFinder, Windward maritime intelligence, UKMTO (United Kingdom Maritime Trade Operations) advisories, and recent shipping news for REAL current maritime security events. Look for: vessels reported attacked or harassed in Red Sea/Gulf of Aden by Houthis (search recent UKMTO alerts), ships going AIS-dark near Iran or in Gulf, Chinese coastguard incidents in South China Sea (search recent news), any vessels seized or detained, recent piracy incidents, ships diverting away from Red Sea due to Houthi threat, Iranian shadow fleet tankers behaving anomalously. Report vessel names, IMO numbers, incident type, location, and source. Note what is from public AIS data vs reported incidents.`,
    schema: {
      type: "object",
      properties: {
        vessels: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              imo: { type: "string" },
              type: { type: "string" },
              flag: { type: "string" },
              position: { type: "string" },
              speed_kts: { type: "number" },
              heading: { type: "number" },
              last_port: { type: "string" },
              destination: { type: "string" },
              ais_status: { type: "string" },
              threat: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    id: "airspace",
    icon: "🚫",
    label: "AIRSPACE / NFZ",
    sublabel: "FAA NOTAM · EUROCONTROL · ICAO",
    color: C.amber,
    useInternet: true,
    prompt: `Search the FAA NOTAM system (notams.faa.gov), EUROCONTROL NOTAM pages, ICAO, and recent aviation news for REAL CURRENT active airspace closures and no-fly zones globally. Look for: current Ukrainian airspace closure NOTAMs, Israeli restricted airspace zones currently active, any Middle East airspace advisories, Taiwan Strait ADIZs or exercises, North Korea airspace restrictions, any emergency TFRs recently issued, major NATO exercise airspace reservations (EX), any countries that have issued airspace warnings to airlines. Check if any airlines are currently avoiding certain airspace. Report real NOTAM IDs where findable, region, restriction type, altitude limits, reason, and issuing authority. Note whether each is confirmed from official NOTAM source or from news reporting.`,
    schema: {
      type: "object",
      properties: {
        zones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              notam_id: { type: "string" },
              region: { type: "string" },
              type: { type: "string" },
              floor_fl: { type: "string" },
              ceiling_fl: { type: "string" },
              valid_from: { type: "string" },
              valid_to: { type: "string" },
              authority: { type: "string" },
              reason: { type: "string" },
              severity: { type: "string" }
            }
          }
        }
      }
    }
  },
  {
    id: "internet",
    icon: "🌐",
    label: "INTERNET BGP",
    sublabel: "NetBlocks · IODA · Cloudflare Radar",
    color: C.red,
    useInternet: true,
    prompt: `Search NetBlocks.org, IODA (Internet Outage Detection and Analysis), Cloudflare Radar (radar.cloudflare.com), RIPE NCC BGP data, Oracle Internet Intelligence, and recent tech news for REAL CURRENT internet outages, shutdowns, and BGP anomalies. Look for: any government-ordered internet shutdowns currently active (check NetBlocks Twitter/website for recent alerts), BGP route hijacks reported by RIPE or BGPmon, submarine cable cuts recently reported, major DDoS attacks on infrastructure, internet disruptions in conflict zones (Ukraine, Gaza, Sudan, Myanmar), any social media platform blocks by governments. Report country, what is affected, % connectivity loss if measured, ASN details if public, duration, political context, and the source (NetBlocks report URL, Cloudflare Radar, etc). Only report confirmed real events.`,
    schema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              region: { type: "string" },
              asn: { type: "string" },
              outage_type: { type: "string" },
              connectivity_loss_pct: { type: "number" },
              affected_pop: { type: "string" },
              duration: { type: "string" },
              actor: { type: "string" },
              alert_status: { type: "string" },
              context: { type: "string" }
            }
          }
        }
      }
    }
  }
];

const STATUS_COLOR = {
  ACTIVE: C.green, COLLECTING: C.cyan, STANDBY: "#4a5568",
  CRITICAL: "#ff4757", HIGH: "#ffa502", MEDIUM: C.cyan, MODERATE: C.cyan,
  normal: C.green, dark: "#ff4757", spoofed: "#ffa502", anomalous: C.amber,
};

function LayerButton({ layer, active, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded transition-all w-full sm:w-auto"
      style={{
        background: active ? `${layer.color}15` : C.row,
        border: `1px solid ${active ? layer.color : C.border}`,
        color: active ? layer.color : "#4a6a4a",
        minWidth: "140px",
      }}
    >
      <div className="flex items-center gap-1.5 font-black tracking-widest text-[10px]">
        <span>{layer.icon}</span>
        {loading ? <span className="animate-pulse">LOADING...</span> : <span>{layer.label}</span>}
      </div>
      <span className="text-[8px] tracking-wide" style={{ color: active ? layer.color : "#2d4a2d", opacity: 0.8 }}>
        {layer.sublabel}
      </span>
    </button>
  );
}

function SatelliteData({ data }) {
  return (
    <div className="space-y-1.5">
      {(data.passes || []).map((p, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div><div className="font-black" style={{ color: C.cyan }}>{p.satellite}</div><div style={{ color: "#3d5c3d" }}>{p.operator}</div></div>
          <div><div style={{ color: C.green }}>{p.region}</div><div style={{ color: "#3d5c3d" }}>{p.aoi}</div></div>
          <div><div style={{ color: C.amber }}>{p.altitude_km} km · {p.resolution_m}m res</div><div style={{ color: "#3d5c3d" }}>PASS {p.overpass_utc} UTC</div></div>
          <div className="flex justify-end items-start">
            <span className="px-1.5 py-0.5 font-black text-[9px]" style={{ color: STATUS_COLOR[p.status] || C.green, border: `1px solid ${STATUS_COLOR[p.status] || C.green}` }}>{p.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ADSBData({ data }) {
  const catColor = { military: C.red, government: C.amber, civil: C.cyan };
  return (
    <div className="space-y-1.5">
      {(data.tracks || []).map((t, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div><div className="font-black" style={{ color: catColor[t.category?.toLowerCase()] || C.green }}>{t.callsign}</div><div style={{ color: "#3d5c3d" }}>{t.type}</div></div>
          <div><div style={{ color: C.green }}>{t.origin} → {t.destination}</div><div style={{ color: "#3d5c3d" }}>{t.region}</div></div>
          <div><div style={{ color: C.amber }}>FL{Math.round((t.altitude_ft||0)/100)} · {t.speed_kts}kts</div><div style={{ color: "#3d5c3d" }}>SQK {t.squawk}</div></div>
          <div className="flex flex-col items-end gap-0.5">
            {t.anomaly && <span className="px-1 py-0.5 font-black text-[8px]" style={{ color: C.red, border: `1px solid ${C.red}` }}>⚠ {t.anomaly}</span>}
            <span className="text-[8px]" style={{ color: "#3d5c3d" }}>{t.category?.toUpperCase()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GPSJamData({ data }) {
  return (
    <div className="space-y-1.5">
      {(data.events || []).map((e, i) => (
        <div key={i} className="px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-1">
            <div><span className="font-black text-[10px]" style={{ color: STATUS_COLOR[e.severity] || C.amber }}>{e.region}</span><span className="ml-2" style={{ color: "#3d5c3d" }}>{e.area}</span></div>
            <span className="px-1.5 py-0.5 font-black text-[8px] shrink-0" style={{ color: STATUS_COLOR[e.severity] || C.amber, border: `1px solid ${STATUS_COLOR[e.severity] || C.amber}` }}>{e.severity}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px]">
            <div><span style={{ color: "#3d5c3d" }}>Type: </span><span style={{ color: C.green }}>{e.jammer_type}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Power: </span><span style={{ color: C.green }}>{e.power_w}W · {e.radius_km}km</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Actor: </span><span style={{ color: C.red }}>{e.actor}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>CM: </span><span style={{ color: C.cyan }}>{e.countermeasures}</span></div>
          </div>
          <div className="mt-1 text-[8px]" style={{ color: "#3d5c3d" }}>AFFECTS: {e.affected_systems} · SINCE {e.start_utc} UTC</div>
        </div>
      ))}
    </div>
  );
}

function AISData({ data }) {
  return (
    <div className="space-y-1.5">
      {(data.vessels || []).map((v, i) => (
        <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div><div className="font-black" style={{ color: C.cyan }}>{v.name}</div><div style={{ color: "#3d5c3d" }}>IMO {v.imo} · {v.flag}</div></div>
          <div><div style={{ color: C.green }}>{v.position}</div><div style={{ color: "#3d5c3d" }}>{v.type}</div></div>
          <div><div style={{ color: C.amber }}>{v.speed_kts}kts · HDG {v.heading}°</div><div style={{ color: "#3d5c3d" }}>{v.last_port} → {v.destination}</div></div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="px-1.5 py-0.5 font-black text-[8px]" style={{ color: STATUS_COLOR[v.ais_status] || C.green, border: `1px solid ${STATUS_COLOR[v.ais_status] || C.green}` }}>{v.ais_status?.toUpperCase()}</span>
            {v.threat !== "LOW" && <span className="text-[8px]" style={{ color: C.red }}>⚠ {v.threat}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AirspaceData({ data }) {
  return (
    <div className="space-y-1.5">
      {(data.zones || []).map((z, i) => (
        <div key={i} className="px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-1">
            <div><span className="font-black text-[10px] font-mono" style={{ color: C.amber }}>{z.notam_id}</span><span className="ml-2 font-bold" style={{ color: C.green }}>{z.region}</span></div>
            <span className="px-1.5 py-0.5 font-black text-[8px] shrink-0" style={{ color: STATUS_COLOR[z.severity] || C.amber, border: `1px solid ${STATUS_COLOR[z.severity] || C.amber}` }}>{z.severity}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px]">
            <div><span style={{ color: "#3d5c3d" }}>Type: </span><span style={{ color: C.cyan }}>{z.type}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Alt: </span><span style={{ color: C.green }}>FL{z.floor_fl}–FL{z.ceiling_fl}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Auth: </span><span style={{ color: C.green }}>{z.authority}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Until: </span><span style={{ color: C.amber }}>{z.valid_to}</span></div>
          </div>
          <div className="mt-1 text-[8px]" style={{ color: "#3d5c3d" }}>REASON: {z.reason}</div>
        </div>
      ))}
    </div>
  );
}

function InternetData({ data }) {
  return (
    <div className="space-y-1.5">
      {(data.events || []).map((e, i) => (
        <div key={i} className="px-3 py-2 rounded text-[9px]" style={{ background: C.row, border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-1">
            <div><span className="font-black text-[10px]" style={{ color: C.red }}>{e.region}</span><span className="ml-2 font-mono text-[8px]" style={{ color: "#3d5c3d" }}>AS{e.asn}</span></div>
            <span className="px-1.5 py-0.5 font-black text-[8px] shrink-0" style={{ color: e.connectivity_loss_pct > 70 ? C.red : C.amber, border: `1px solid ${e.connectivity_loss_pct > 70 ? C.red : C.amber}` }}>
              -{e.connectivity_loss_pct}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px]">
            <div><span style={{ color: "#3d5c3d" }}>Type: </span><span style={{ color: C.cyan }}>{e.outage_type}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Pop: </span><span style={{ color: C.green }}>{e.affected_pop}</span></div>
            <div><span style={{ color: "#3d5c3d" }}>Duration: </span><span style={{ color: C.amber }}>{e.duration}</span></div>
          </div>
          <div className="mt-1 text-[8px]" style={{ color: "#3d5c3d" }}>ACTOR: <span style={{ color: C.red }}>{e.actor}</span> · STATUS: <span style={{ color: C.green }}>{e.alert_status}</span></div>
          <div className="mt-0.5 text-[8px] italic" style={{ color: "#2d4a2d" }}>{e.context}</div>
        </div>
      ))}
    </div>
  );
}

const DATA_RENDERERS = {
  satellite: SatelliteData,
  adsb:      ADSBData,
  gps_jam:   GPSJamData,
  ais:       AISData,
  airspace:  AirspaceData,
  internet:  InternetData,
};

export default function IntelLayersPanel() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerData, setLayerData] = useState({});
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleLayerClick = async (layer) => {
    // Toggle off
    if (activeLayer === layer.id) {
      setActiveLayer(null);
      return;
    }
    setActiveLayer(layer.id);
    setError(null);

    // Use cache if already loaded
    if (layerData[layer.id]) return;

    setLoading(layer.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: layer.prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: layer.schema,
    });
    setLayerData(prev => ({ ...prev, [layer.id]: result }));
    setLoading(null);
  };

  const activeLayerDef = LAYERS.find(l => l.id === activeLayer);
  const Renderer = activeLayer ? DATA_RENDERERS[activeLayer] : null;
  const currentData = activeLayer ? layerData[activeLayer] : null;

  return (
    <div className="rounded-lg" style={{ background: "#040d04", border: "1px solid rgba(0,255,65,0.12)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,255,65,0.12)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "#00ff41" }}>🔭</span>
          <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: "#00ff41" }}>Intel Data Layers</span>
        </div>
        <span className="text-[9px] font-bold" style={{ color: "#ffa502" }}>● {LAYERS.length} LAYERS AVAILABLE</span>
      </div>

      {/* Layer buttons */}
      <div className="p-3 flex flex-wrap gap-2">
        {LAYERS.map(layer => (
          <LayerButton
            key={layer.id}
            layer={layer}
            active={activeLayer === layer.id}
            loading={loading === layer.id}
            onClick={() => handleLayerClick(layer)}
          />
        ))}
      </div>

      {/* Data pane */}
      {activeLayer && (
        <div className="px-3 pb-3">
          <div className="border-t pt-3" style={{ borderColor: "rgba(0,255,65,0.12)" }}>
            {/* Pane header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{activeLayerDef?.icon}</span>
                <span className="text-[10px] font-black tracking-widest" style={{ color: activeLayerDef?.color }}>
                  {activeLayerDef?.label} — OPEN SOURCE LIVE
                </span>
              </div>
              {currentData && (
                <button
                  onClick={() => setLayerData(prev => { const n = { ...prev }; delete n[activeLayer]; return n; })}
                  className="text-[8px] px-2 py-0.5 rounded"
                  style={{ color: "#3d5c3d", border: "1px solid rgba(0,255,65,0.12)" }}
                >
                  ↻ REFRESH
                </button>
              )}
            </div>

            {/* Loading state */}
            {loading === activeLayer && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="animate-spin w-4 h-4 border-2 rounded-full" style={{ borderColor: `${activeLayerDef?.color}40`, borderTopColor: activeLayerDef?.color }} />
                <span className="text-[10px] animate-pulse" style={{ color: activeLayerDef?.color }}>
                  PULLING {activeLayerDef?.label} DATA...
                </span>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-[10px] py-3 text-center" style={{ color: "#ff4757" }}>⚠ FEED ERROR: {error}</div>
            )}

            {/* Data */}
            {currentData && Renderer && !loading && (
              <Renderer data={currentData} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}