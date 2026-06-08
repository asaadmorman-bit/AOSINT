import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const VIRUSTOTAL_KEY = Deno.env.get('VIRUSTOTAL_API_KEY');
const ALIENVAULT_KEY = Deno.env.get('ALIENVAULT_OTX_API_KEY');
const ABUSEIPDB_KEY = Deno.env.get('ABUSEIPDB_API_KEY');
const SHODAN_KEY = Deno.env.get('SHODAN_API_KEY');

// Helper: safe fetch with timeout
async function safeFetch(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Query HaveIBeenPwned-style via AlienVault OTX for email
async function queryAlienVaultEmail(email) {
  if (!email || !ALIENVAULT_KEY) return null;
  return await safeFetch(`https://otx.alienvault.com/api/v1/indicators/email/${encodeURIComponent(email)}/general`, {
    headers: { 'X-OTX-API-KEY': ALIENVAULT_KEY }
  });
}

// Query AlienVault OTX for a domain (from email)
async function queryAlienVaultDomain(domain) {
  if (!domain || !ALIENVAULT_KEY) return null;
  return await safeFetch(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`, {
    headers: { 'X-OTX-API-KEY': ALIENVAULT_KEY }
  });
}

// Query VirusTotal for domain/username as URL search
async function queryVirusTotalDomain(domain) {
  if (!domain || !VIRUSTOTAL_KEY) return null;
  return await safeFetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
    headers: { 'x-apikey': VIRUSTOTAL_KEY }
  });
}

// Query Shodan for any IP associated with domain
async function queryShodanDomain(domain) {
  if (!domain || !SHODAN_KEY) return null;
  return await safeFetch(`https://api.shodan.io/dns/domain/${domain}?key=${SHODAN_KEY}`);
}

// Query Shodan host search for username or name
async function queryShodanSearch(query) {
  if (!query || !SHODAN_KEY) return null;
  return await safeFetch(`https://api.shodan.io/shodan/host/search?key=${SHODAN_KEY}&query=${encodeURIComponent(query)}&minify=true`);
}

// Query AbuseIPDB for an IP
async function queryAbuseIPDB(ip) {
  if (!ip || !ABUSEIPDB_KEY) return null;
  return await safeFetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`, {
    headers: { 'Key': ABUSEIPDB_KEY, 'Accept': 'application/json' }
  });
}

// Extract domain from email
function emailToDomain(email) {
  if (!email) return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      full_name, email, phone, username, organization, location, additional_notes
    } = await req.json();

    if (!full_name && !email && !username) {
      return Response.json({ error: 'At least one of full_name, email, or username is required' }, { status: 400 });
    }

    const domain = emailToDomain(email);

    // Run all OSINT API queries in parallel
    const [
      otxEmailData,
      otxDomainData,
      vtDomainData,
      shodanDomainData,
      shodanSearchData,
    ] = await Promise.all([
      queryAlienVaultEmail(email),
      queryAlienVaultDomain(domain),
      queryVirusTotalDomain(domain),
      queryShodanDomain(domain),
      queryShodanSearch(username || full_name),
    ]);

    // Build OSINT intel summary from real API results
    const osintFindings = [];

    if (otxEmailData) {
      const pulseCount = otxEmailData.pulse_info?.count || 0;
      const validation = otxEmailData.validation || [];
      osintFindings.push(`AlienVault OTX Email Intel: ${pulseCount} threat pulses referencing this email. Validation tags: ${validation.map(v=>v.name).join(', ') || 'none'}.`);
    }

    if (otxDomainData) {
      const pulseCount = otxDomainData.pulse_info?.count || 0;
      const malicious = otxDomainData.analysis?.plugins?.clamav?.result || 'unknown';
      const country = otxDomainData.indicator?.country_name || '';
      osintFindings.push(`AlienVault OTX Domain (${domain}): ${pulseCount} threat pulses. Country: ${country}. Malware scan: ${malicious}.`);
    }

    if (vtDomainData?.data?.attributes) {
      const attr = vtDomainData.data.attributes;
      const malicious = attr.last_analysis_stats?.malicious || 0;
      const suspicious = attr.last_analysis_stats?.suspicious || 0;
      const categories = Object.values(attr.categories || {}).join(', ');
      const reputation = attr.reputation || 0;
      osintFindings.push(`VirusTotal Domain (${domain}): ${malicious} malicious detections, ${suspicious} suspicious. Reputation score: ${reputation}. Categories: ${categories || 'N/A'}.`);
    }

    if (shodanDomainData) {
      const subdomains = (shodanDomainData.subdomains || []).slice(0, 10).join(', ');
      const ips = (shodanDomainData.data || []).slice(0, 5).map(d => `${d.value} (${d.type})`).join(', ');
      osintFindings.push(`Shodan DNS (${domain}): Subdomains: ${subdomains || 'none'}. DNS records: ${ips || 'none'}.`);
    }

    if (shodanSearchData?.matches?.length > 0) {
      const matches = shodanSearchData.matches.slice(0, 3);
      const details = matches.map(m => `${m.ip_str} [${m.org || 'unknown org'}] port ${m.port}`).join('; ');
      osintFindings.push(`Shodan Host Search for "${username || full_name}": ${shodanSearchData.total} results. Top matches: ${details}.`);
    }

    const osintContext = osintFindings.length > 0
      ? `\n\nREAL OSINT API FINDINGS (use these as primary evidence):\n${osintFindings.map((f, i) => `${i+1}. ${f}`).join('\n')}`
      : '\n\nNo direct API hits found for provided identifiers — base analysis on subject profile and OSINT tradecraft.';

    const subjectSummary = [
      full_name && `Name: ${full_name}`,
      email && `Email: ${email}`,
      phone && `Phone: ${phone}`,
      username && `Username/Handle: ${username}`,
      organization && `Organization: ${organization}`,
      location && `Location: ${location}`,
      additional_notes && `Additional context: ${additional_notes}`,
    ].filter(Boolean).join('\n');

    const prompt = `You are a senior OSINT analyst. Analyze the following individual for security risk assessment. Use the real API findings provided as your primary evidence source — treat them as ground truth from live threat intelligence databases (AlienVault OTX, VirusTotal, Shodan).

SUBJECT:
${subjectSummary}
${osintContext}

Produce a comprehensive intelligence report. Reference the real API findings explicitly where relevant.

1. DIGITAL FOOTPRINT & EXPOSURE
   - Social media presence (LinkedIn, Twitter/X, GitHub, Facebook, Instagram, Reddit, TikTok, Discord)
   - Sherlock/username enumeration assessment across major platforms
   - theHarvester-style email/domain exposure
   - Data breach / leaked credential exposure (reference OTX/VirusTotal findings)
   - Dark web exposure indicators
   - Domain/website registrations
   - SpiderFoot-style passive recon findings

2. PROFESSIONAL PROFILE
   - Inferred professional background, roles, industry
   - Known affiliations, organizations, networks
   - Public-facing work, publications, or contributions

3. SECURITY RISK ASSESSMENT
   - Insider threat indicators
   - Social engineering susceptibility vectors
   - Credential compromise risk (reference any breach data)
   - Identity theft risk
   - Physical security concerns
   - Reputational risk factors
   - Infrastructure exposure (reference Shodan findings if any)

4. THREAT ACTOR INTEREST LIKELIHOOD
   - Nation-state interest likelihood
   - Organized crime targeting likelihood
   - Hacktivism targeting likelihood
   - Corporate espionage risk

5. RISK FORECAST (6-12 months)
   - Predicted risk trajectory (increasing/stable/decreasing)
   - Top 3 most likely threat scenarios with probability estimates
   - Early warning indicators to watch

6. RECOMMENDED PROTECTIVE ACTIONS
   - Immediate actions (within 1 week)
   - Short-term hardening (1-3 months)
   - Long-term security posture

Be specific and actionable. Flag confidence levels for each finding.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          subject: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              risk_score: { type: 'number' },
              risk_label: { type: 'string' },
              summary: { type: 'string' },
            }
          },
          digital_footprint: {
            type: 'object',
            properties: {
              social_media_presence: { type: 'array', items: { type: 'object', properties: { platform: { type: 'string' }, likelihood: { type: 'string' }, notes: { type: 'string' } } } },
              breach_exposure: { type: 'object', properties: { risk_level: { type: 'string' }, known_breaches: { type: 'array', items: { type: 'string' } }, details: { type: 'string' } } },
              public_records_exposure: { type: 'string' },
              dark_web_indicators: { type: 'string' },
              domain_registrations: { type: 'array', items: { type: 'string' } },
            }
          },
          professional_profile: {
            type: 'object',
            properties: {
              inferred_background: { type: 'string' },
              known_affiliations: { type: 'array', items: { type: 'string' } },
              industry: { type: 'string' },
              public_contributions: { type: 'array', items: { type: 'string' } },
            }
          },
          security_risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                risk_category: { type: 'string' },
                severity: { type: 'string' },
                description: { type: 'string' },
                confidence: { type: 'string' },
              }
            }
          },
          threat_actor_interest: {
            type: 'object',
            properties: {
              nation_state: { type: 'string' },
              organized_crime: { type: 'string' },
              hacktivism: { type: 'string' },
              corporate_espionage: { type: 'string' },
              overall_target_attractiveness: { type: 'string' },
            }
          },
          risk_forecast: {
            type: 'object',
            properties: {
              trajectory: { type: 'string' },
              trajectory_reason: { type: 'string' },
              top_scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenario: { type: 'string' },
                    probability: { type: 'string' },
                    impact: { type: 'string' },
                    timeframe: { type: 'string' },
                  }
                }
              },
              early_warning_indicators: { type: 'array', items: { type: 'string' } },
            }
          },
          recommended_actions: {
            type: 'object',
            properties: {
              immediate: { type: 'array', items: { type: 'string' } },
              short_term: { type: 'array', items: { type: 'string' } },
              long_term: { type: 'array', items: { type: 'string' } },
            }
          },
          dark_web_findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                threat_type: { type: 'string' },
                source: { type: 'string' },
                severity: { type: 'string' },
                description: { type: 'string' },
                discovered: { type: 'string' },
              }
            }
          },
          analyst_notes: { type: 'string' },
          osint_sources_queried: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    return Response.json({
      status: 'success',
      queried_at: new Date().toISOString(),
      queried_by: user.email,
      input: { full_name, email, phone, username, organization, location },
      osint_api_hits: osintFindings.length,
      report: result,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});