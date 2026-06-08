import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const COUNTRY_TO_REGION = {
  CN: "East Asia", JP: "East Asia", KR: "East Asia", TW: "East Asia", HK: "East Asia",
  RU: "Eastern Europe", UA: "Eastern Europe", BY: "Eastern Europe", PL: "Eastern Europe", CZ: "Eastern Europe",
  IR: "Middle East", SA: "Middle East", IL: "Middle East", AE: "Middle East", TR: "Middle East", IQ: "Middle East",
  US: "North America", CA: "North America", MX: "North America",
  GB: "Western Europe", DE: "Western Europe", FR: "Western Europe", NL: "Western Europe", IT: "Western Europe", ES: "Western Europe",
  IN: "South Asia", PK: "South Asia", BD: "South Asia", LK: "South Asia",
  TH: "Southeast Asia", VN: "Southeast Asia", SG: "Southeast Asia", MY: "Southeast Asia", PH: "Southeast Asia", ID: "Southeast Asia",
  BR: "Latin America", AR: "Latin America", CL: "Latin America", CO: "Latin America", PE: "Latin America",
  NG: "Africa", ZA: "Africa", KE: "Africa", EG: "Africa", ET: "Africa",
  KZ: "Central Asia", UZ: "Central Asia", TM: "Central Asia", KG: "Central Asia",
};

const ACTOR_TO_REGION = {
  "APT28": "Eastern Europe", "APT29": "Eastern Europe", "Turla": "Eastern Europe",
  "APT1": "East Asia", "APT10": "East Asia", "APT41": "East Asia", "Stone Panda": "East Asia",
  "Lazarus": "East Asia", "Kimsuky": "East Asia",
  "APT33": "Middle East", "APT34": "Middle East", "MuddyWater": "Middle East",
  "Sandworm": "Eastern Europe", "Gamaredon": "Eastern Europe",
};

function inferRegion(ioc, cases) {
  // Priority 1: Direct country code in tags or metadata
  const tags = ioc.tags || [];
  for (const tag of tags) {
    const upper = tag.toUpperCase();
    if (COUNTRY_TO_REGION[upper]) return { region: COUNTRY_TO_REGION[upper], country: upper };
  }

  // Priority 2: Extract from IP geolocation (if stored)
  if (ioc.notes && ioc.notes.includes("Country:")) {
    const match = ioc.notes.match(/Country:\s*([A-Z]{2})/i);
    if (match && COUNTRY_TO_REGION[match[1].toUpperCase()]) {
      return { region: COUNTRY_TO_REGION[match[1].toUpperCase()], country: match[1].toUpperCase() };
    }
  }

  // Priority 3: Check threat actor attribution
  const relatedCases = cases.filter(c => (c.iocs || []).some(i => i.value === ioc.value));
  for (const c of relatedCases) {
    for (const actor of (c.tags || [])) {
      if (ACTOR_TO_REGION[actor]) return { region: ACTOR_TO_REGION[actor], actor };
    }
  }

  // Priority 4: Malware family hints (basic heuristics)
  const noteText = (ioc.notes || "").toLowerCase();
  if (noteText.includes("emotet") || noteText.includes("trickbot")) return { region: "Eastern Europe" };
  if (noteText.includes("lazarus") || noteText.includes("kimsuky")) return { region: "East Asia" };

  return { region: "Unknown" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch IOCs and cases
    const [iocs, cases] = await Promise.all([
      base44.entities.IOCRecord.list("-created_date", 500),
      base44.entities.IncidentCase.list("-created_date", 200),
    ]);

    const regions = {};
    const summary = {
      total: iocs.length,
      attributed: 0,
      unattributed: 0,
      live: iocs.filter(i => i.active).length,
      feeds: {
        cisa_kev: { ok: true, count: iocs.filter(i => i.source?.includes("CISA KEV")).length },
        feodo: { ok: true, count: iocs.filter(i => i.source?.includes("Feodo")).length },
        threatfox: { ok: true, count: iocs.filter(i => i.source?.includes("ThreatFox")).length },
        urlhaus: { ok: true, count: iocs.filter(i => i.source?.includes("URLhaus")).length },
        advisories: { ok: true, count: iocs.filter(i => i.source?.includes("Advisories")).length },
      }
    };

    for (const ioc of iocs) {
      const { region, country, actor } = inferRegion(ioc, cases);
      if (!regions[region]) {
        regions[region] = {
          total: 0, critical: 0, high: 0, medium: 0, low: 0,
          by_source: {}, by_type: {}, by_country: {}, malware_families: {}, top_iocs: []
        };
      }

      const r = regions[region];
      r.total++;
      if (ioc.severity === "critical") r.critical++;
      else if (ioc.severity === "high") r.high++;
      else if (ioc.severity === "medium") r.medium++;
      else if (ioc.severity === "low") r.low++;

      r.by_source[ioc.source || "ASOSINT DB"] = (r.by_source[ioc.source || "ASOSINT DB"] || 0) + 1;
      r.by_type[ioc.ioc_type] = (r.by_type[ioc.ioc_type] || 0) + 1;
      if (country) r.by_country[country] = (r.by_country[country] || 0) + 1;

      // Extract malware family from notes/threat_type
      const malware = ioc.threat_type || ioc.notes?.match(/([A-Z][a-z]+(?:bot|rat|trojan|worm|ransom))/i)?.[1];
      if (malware) r.malware_families[malware] = (r.malware_families[malware] || 0) + 1;

      // Sample top IOCs
      if (r.top_iocs.length < 15) {
        r.top_iocs.push({
          value: ioc.value,
          severity: ioc.severity,
          ioc_type: ioc.ioc_type,
          description: ioc.notes || ioc.threat_type || "No description"
        });
      }

      if (region !== "Unknown") summary.attributed++;
    }

    summary.unattributed = summary.total - summary.attributed;

    return Response.json({ ok: true, regions, summary });
  } catch (error) {
    console.error("threatByRegion error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});