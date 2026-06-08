import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { mode, advisory_data, query } = body;

        // --- MODE: AI-enrich a vendor advisory from a text/URL/CVE query ---
        if (mode === 'ai_enrich') {
            const prompt = `You are a cybersecurity and physical security analyst. 
A user provided this vendor advisory input: "${query}"

Extract and return a structured vendor advisory object for an OSINT platform that tracks both DIGITAL and PHYSICAL infrastructure vulnerabilities.

Consider:
- Digital: software, firmware, cloud, network, endpoint, ICS/OT
- Physical: access control, surveillance systems, vehicle systems, tactical comms, physical security hardware

Return a JSON object with these fields:
- advisory_id (string, generate a sensible one if not present)
- vendor_name (string)
- vendor_type: one of [software, hardware, firmware, ics_ot, physical_security, comms_systems, vehicle_systems, tactical_equipment, cloud_provider, other]
- advisory_type: one of [vulnerability, bug_fix, patch, eol_notice, configuration_guidance, security_bulletin, zero_day, supply_chain]
- title (string)
- description (string, detailed)
- severity: one of [critical, high, medium, low, informational]
- cve_ids: array of strings
- cvss_score: number 0-10 or null
- affected_products: array of strings
- affected_domain: one of [digital, physical, hybrid]
- mission_sets: array from [ISR, C2, SIGINT, HUMINT, cyber, logistics, comms, surveillance, physical_security, tactical, ground_operations]
- infrastructure_tags: array from [network, endpoint, cloud, comms, physical_access, tactical, ICS, firmware, vehicle_systems, surveillance]
- fix_available: boolean
- fix_type: one of [patch, firmware_update, configuration_change, workaround, hardware_replacement, no_fix, pending]
- fix_reference: string URL or null
- fix_instructions: string with actionable steps
- priority_score: number 0-100 based on severity + exploit likelihood`;

            const result = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        advisory_id: { type: "string" },
                        vendor_name: { type: "string" },
                        vendor_type: { type: "string" },
                        advisory_type: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string" },
                        cve_ids: { type: "array", items: { type: "string" } },
                        cvss_score: { type: "number" },
                        affected_products: { type: "array", items: { type: "string" } },
                        affected_domain: { type: "string" },
                        mission_sets: { type: "array", items: { type: "string" } },
                        infrastructure_tags: { type: "array", items: { type: "string" } },
                        fix_available: { type: "boolean" },
                        fix_type: { type: "string" },
                        fix_reference: { type: "string" },
                        fix_instructions: { type: "string" },
                        priority_score: { type: "number" }
                    }
                }
            });

            return Response.json({ success: true, advisory: result });
        }

        // --- MODE: Save advisory and match against asset inventory ---
        if (mode === 'ingest') {
            const data = advisory_data || {};
            data.ingestion_source = data.ingestion_source || 'manual';
            data.status = 'new';

            // Match assets by infrastructure_tags, mission_sets, affected_products
            const assets = await base44.entities.Asset.list();
            const matchedAssetIds = [];

            if (assets && assets.length > 0) {
                const searchTerms = [
                    ...(data.affected_products || []),
                    ...(data.infrastructure_tags || []),
                    ...(data.mission_sets || []),
                    data.vendor_name || ''
                ].map(t => t.toLowerCase());

                for (const asset of assets) {
                    const assetStr = [
                        asset.name, asset.asset_type, asset.os_platform,
                        asset.domain, ...(asset.tags || [])
                    ].filter(Boolean).join(' ').toLowerCase();

                    if (searchTerms.some(term => term.length > 2 && assetStr.includes(term))) {
                        matchedAssetIds.push(asset.id);
                    }
                }
            }

            data.matched_assets = matchedAssetIds;

            const created = await base44.entities.VendorAdvisory.create(data);

            // Also create VulnerabilityFindings for matched assets
            const findingIds = [];
            for (const assetId of matchedAssetIds.slice(0, 10)) {
                const asset = assets.find(a => a.id === assetId);
                if (!asset) continue;
                const finding = await base44.entities.VulnerabilityFinding.create({
                    title: `[Vendor Advisory] ${data.title}`,
                    description: data.description || '',
                    cve_id: (data.cve_ids || [])[0] || null,
                    asset_id: assetId,
                    asset_name: asset.name,
                    asset_type: asset.asset_type,
                    cvss_score: data.cvss_score || null,
                    severity: data.severity || 'medium',
                    patch_available: data.fix_available || false,
                    patch_reference: data.fix_reference || null,
                    remediation_guidance: data.fix_instructions || null,
                    status: 'open',
                    tags: ['vendor_advisory', data.vendor_name?.toLowerCase().replace(/\s+/g, '_')].filter(Boolean),
                    first_detected: new Date().toISOString()
                });
                findingIds.push(finding.id);
            }

            return Response.json({
                success: true,
                advisory: created,
                matched_assets: matchedAssetIds.length,
                findings_created: findingIds.length
            });
        }

        return Response.json({ error: 'Invalid mode. Use ai_enrich or ingest.' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});