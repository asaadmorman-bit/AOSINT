import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const CISA_KEV_API = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

// Map NVD severity to our enum
function normalizeSeverity(cvss) {
  if (!cvss) return "medium";
  if (cvss >= 9.0) return "critical";
  if (cvss >= 7.0) return "high";
  if (cvss >= 4.0) return "medium";
  if (cvss > 0) return "low";
  return "informational";
}

// Guess vendor type from product/vendor name
function inferVendorType(vendorName, product) {
  const s = (vendorName + " " + (product || "")).toLowerCase();
  if (/cisco|juniper|palo alto|fortinet|checkpoint/.test(s)) return "network";
  if (/windows|office|azure|microsoft/.test(s)) return "software";
  if (/redhat|ubuntu|linux|centos|debian/.test(s)) return "software";
  if (/ios|android|apple|mobile/.test(s)) return "mobile";
  if (/aws|gcp|azure|cloud/.test(s)) return "cloud";
  if (/siemens|rockwell|ics|scada|ot|plc/.test(s)) return "ics_ot";
  if (/camera|badge|access control|physical|door|lock/.test(s)) return "physical_security";
  if (/firmware|bios|uefi|driver/.test(s)) return "firmware";
  if (/router|switch|firewall|ap|access point/.test(s)) return "hardware";
  return "software";
}

// Guess domain from vendor type
function inferDomain(vendorType) {
  if (vendorType === "physical_security") return "physical";
  if (vendorType === "ics_ot") return "hybrid";
  return "digital";
}

// Map CVE affected products to our asset types
function inferAffectedAssetTypes(description, vendorType) {
  const d = (description || "").toLowerCase();
  const types = [];
  if (/server|database|backend/.test(d)) types.push("server");
  if (/windows|endpoint|workstation|desktop|laptop/.test(d)) types.push("endpoint");
  if (/router|switch|firewall|network/.test(d)) types.push("network_device");
  if (/cloud|aws|azure|gcp|s3/.test(d)) types.push("cloud_service");
  if (/web|api|application|cms|wordpress/.test(d)) types.push("application");
  if (/database|mysql|postgres|oracle|sql/.test(d)) types.push("database");
  if (/iot|camera|device|sensor|embedded/.test(d)) types.push("iot_device");
  if (/physical|facility|building|access/.test(d)) types.push("physical_facility");
  if (vendorType === "ics_ot") types.push("iot_device");
  return types.length ? [...new Set(types)] : ["endpoint"];
}

// Match advisories against org assets
async function matchAdvisoriesToAssets(base44, advisories) {
  const assets = await base44.asServiceRole.entities.Asset.list();
  return advisories.map(adv => {
    const matched = assets.filter(asset => {
      const domainMatch = adv.domain === "digital" ? asset.domain !== "physical" :
                          adv.domain === "physical" ? asset.domain !== "digital" : true;
      const typeMatch = adv.affected_asset_types?.includes(asset.asset_type);
      const nameMatch = adv.affected_products?.some(p =>
        asset.name?.toLowerCase().includes(p.toLowerCase()) ||
        asset.os_platform?.toLowerCase().includes(p.toLowerCase())
      );
      return domainMatch && (typeMatch || nameMatch);
    });
    return {
      ...adv,
      matched_assets: matched.map(a => a.id),
      matched_asset_count: matched.length
    };
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      source = "nvd",           // nvd | cisa_kev | manual
      keywords = [],            // e.g. ["cisco", "windows", "scada"]
      days_back = 7,
      manual_advisory = null,   // for manual ingestion
      auto_create_findings = false
    } = body;

    let advisories = [];

    // --- MANUAL ADVISORY ---
    if (source === "manual" && manual_advisory) {
      const vendorType = inferVendorType(manual_advisory.vendor || "", manual_advisory.title);
      const adv = {
        advisory_id: manual_advisory.advisory_id || `MANUAL-${Date.now()}`,
        title: manual_advisory.title,
        description: manual_advisory.description || "",
        vendor: manual_advisory.vendor || "Unknown",
        vendor_type: manual_advisory.vendor_type || vendorType,
        domain: manual_advisory.domain || inferDomain(vendorType),
        cve_ids: manual_advisory.cve_ids || [],
        affected_products: manual_advisory.affected_products || [],
        affected_asset_types: manual_advisory.affected_asset_types || [],
        mission_sets: manual_advisory.mission_sets || [],
        severity: manual_advisory.severity || "medium",
        cvss_score: manual_advisory.cvss_score || null,
        fix_available: manual_advisory.fix_available || false,
        fix_type: manual_advisory.fix_type || "workaround",
        fix_url: manual_advisory.fix_url || "",
        fix_description: manual_advisory.fix_description || "",
        published_date: manual_advisory.published_date || new Date().toISOString(),
        last_updated: new Date().toISOString(),
        ingestion_source: "manual",
        tags: manual_advisory.tags || [],
        status: "new"
      };
      advisories = [adv];
    }

    // --- NVD INGESTION ---
    else if (source === "nvd") {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days_back);
      const pubStartDate = startDate.toISOString().replace("Z", "%2B00%3A00");
      const pubEndDate = new Date().toISOString().replace("Z", "%2B00%3A00");

      let nvdUrl = `${NVD_API}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=50`;
      if (keywords.length) {
        nvdUrl += `&keywordSearch=${encodeURIComponent(keywords.join(" "))}&keywordExactMatch=false`;
      }

      const nvdResp = await fetch(nvdUrl, {
        headers: { "User-Agent": "ASOSINT-Threat-Platform/1.0" }
      });
      if (!nvdResp.ok) {
        return Response.json({ error: `NVD API error: ${nvdResp.status}` }, { status: 502 });
      }
      const nvdData = await nvdResp.json();
      const cves = nvdData.vulnerabilities || [];

      advisories = cves.map(item => {
        const cve = item.cve;
        const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
        const cvssScore = metrics?.cvssData?.baseScore || null;
        const description = cve.descriptions?.find(d => d.lang === "en")?.value || "";
        const vendorNames = [...new Set(
          (cve.configurations || [])
            .flatMap(c => c.nodes || [])
            .flatMap(n => n.cpeMatch || [])
            .map(m => m.criteria?.split(":")[3] || "")
            .filter(Boolean)
        )].slice(0, 3);
        const primaryVendor = vendorNames[0] || keywords[0] || "NVD";
        const vendorType = inferVendorType(primaryVendor, description);

        const affectedProducts = [...new Set(
          (cve.configurations || [])
            .flatMap(c => c.nodes || [])
            .flatMap(n => n.cpeMatch || [])
            .map(m => {
              const parts = m.criteria?.split(":") || [];
              return parts[4] ? `${parts[3]} ${parts[4]}` : parts[3] || "";
            })
            .filter(Boolean)
        )].slice(0, 10);

        const refs = (cve.references || []).map(r => r.url).slice(0, 3);
        const patchRef = refs.find(r => /patch|update|advisory|fix|download/i.test(r)) || refs[0] || "";

        return {
          advisory_id: cve.id,
          cve_ids: [cve.id],
          title: cve.id + (description ? " — " + description.slice(0, 80) + (description.length > 80 ? "…" : "") : ""),
          description,
          vendor: primaryVendor.charAt(0).toUpperCase() + primaryVendor.slice(1),
          vendor_type: vendorType,
          domain: inferDomain(vendorType),
          affected_products: affectedProducts,
          affected_asset_types: inferAffectedAssetTypes(description, vendorType),
          mission_sets: [],
          severity: normalizeSeverity(cvssScore),
          cvss_score: cvssScore,
          fix_available: !!patchRef,
          fix_type: patchRef ? "patch" : "no_fix",
          fix_url: patchRef,
          fix_description: "",
          published_date: cve.published || new Date().toISOString(),
          last_updated: cve.lastModified || new Date().toISOString(),
          ingestion_source: "nvd",
          tags: vendorNames.concat(keywords).filter(Boolean).slice(0, 5),
          status: "new"
        };
      });
    }

    // --- CISA KEV ---
    else if (source === "cisa_kev") {
      const resp = await fetch(CISA_KEV_API);
      if (!resp.ok) return Response.json({ error: "CISA KEV fetch failed" }, { status: 502 });
      const data = await resp.json();
      const vulns = (data.vulnerabilities || []).slice(0, 50);

      advisories = vulns.map(v => {
        const vendorType = inferVendorType(v.vendorProject || "", v.product);
        return {
          advisory_id: `KEV-${v.cveID}`,
          cve_ids: [v.cveID],
          title: `[CISA KEV] ${v.cveID} — ${v.vulnerabilityName || v.product}`,
          description: v.shortDescription || "",
          vendor: v.vendorProject || "Unknown",
          vendor_type: vendorType,
          domain: inferDomain(vendorType),
          affected_products: [v.product].filter(Boolean),
          affected_asset_types: inferAffectedAssetTypes(v.shortDescription || "", vendorType),
          mission_sets: [],
          severity: "critical",
          cvss_score: null,
          fix_available: !!v.requiredAction && !/no fix/i.test(v.requiredAction),
          fix_type: "patch",
          fix_url: "",
          fix_description: v.requiredAction || "",
          published_date: v.dateAdded ? new Date(v.dateAdded).toISOString() : new Date().toISOString(),
          last_updated: new Date().toISOString(),
          ingestion_source: "cisa_kev",
          tags: ["actively_exploited", "cisa_kev"],
          status: "new"
        };
      });
    }

    // Match to assets
    const matched = await matchAdvisoriesToAssets(base44, advisories);

    // Deduplicate against existing advisories
    const existing = await base44.asServiceRole.entities.VendorAdvisory.list();
    const existingIds = new Set(existing.map(e => e.advisory_id));
    const newAdvisories = matched.filter(a => !existingIds.has(a.advisory_id));

    // Bulk create
    let created = [];
    if (newAdvisories.length) {
      created = await base44.asServiceRole.entities.VendorAdvisory.bulkCreate(newAdvisories);
    }

    // Auto-create VulnerabilityFindings for matched assets
    let findingsCreated = 0;
    if (auto_create_findings) {
      const assets = await base44.asServiceRole.entities.Asset.list();
      const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));

      for (const adv of newAdvisories.filter(a => a.matched_asset_count > 0)) {
        for (const assetId of (adv.matched_assets || [])) {
          const asset = assetMap[assetId];
          if (!asset) continue;
          await base44.asServiceRole.entities.VulnerabilityFinding.create({
            title: adv.title,
            description: adv.description,
            cve_id: adv.cve_ids?.[0] || "",
            asset_id: assetId,
            asset_name: asset.name,
            asset_type: asset.asset_type,
            cvss_score: adv.cvss_score,
            severity: adv.severity,
            patch_available: adv.fix_available,
            patch_reference: adv.fix_url,
            remediation_guidance: adv.fix_description,
            status: "open",
            first_detected: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            tags: adv.tags || [],
          });
          findingsCreated++;
        }
      }
    }

    return Response.json({
      success: true,
      source,
      total_fetched: advisories.length,
      new_ingested: created.length,
      duplicates_skipped: advisories.length - newAdvisories.length,
      asset_matches: newAdvisories.reduce((s, a) => s + (a.matched_asset_count || 0), 0),
      findings_created: findingsCreated
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});