import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { query, query_type = 'domain' } = await req.json();
  if (!query) return Response.json({ error: 'query required' }, { status: 400 });

  const results = {};

  // ── GitHub ──────────────────────────────────────────────────
  try {
    const ghUser = await fetch(`https://api.github.com/users/${encodeURIComponent(query)}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ASOSINT/1.0' }
    });
    if (ghUser.ok) {
      const profile = await ghUser.json();
      const reposResp = await fetch(`https://api.github.com/users/${encodeURIComponent(query)}/repos?per_page=10&sort=updated`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ASOSINT/1.0' }
      });
      const repos = reposResp.ok ? await reposResp.json() : [];
      results.github = {
        login: profile.login, name: profile.name, email: profile.email,
        public_repos: profile.public_repos, followers: profile.followers,
        company: profile.company, location: profile.location,
        created_at: profile.created_at, bio: profile.bio,
        repos: repos.slice(0,8).map(r => ({ name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count })),
        email_exposed: !!profile.email
      };
    } else {
      results.github = { not_found: true };
    }
  } catch(e) {
    results.github = { error: e.message };
  }

  // ── crt.sh (subdomain enum) ──────────────────────────────────
  const domain = query.replace(/^https?:\/\//, '').split('/')[0];
  try {
    const crtResp = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
      headers: { 'Accept': 'application/json' }
    });
    if (crtResp.ok) {
      const certs = await crtResp.json();
      const subdomains = [...new Set(certs.flatMap(c =>
        (c.name_value || '').split('\n').filter(s => s.includes(domain))
      ))].slice(0, 30);
      results.crt = {
        total_certs: certs.length,
        subdomains,
        issuers: [...new Set(certs.slice(0,20).map(c => c.issuer_name))].slice(0,5),
        oldest_cert: certs[certs.length-1]?.not_before,
        newest_cert: certs[0]?.not_before
      };
    }
  } catch(e) {
    results.crt = { error: e.message };
  }

  // ── URLScan.io ───────────────────────────────────────────────
  try {
    const urlResp = await fetch(`https://urlscan.io/api/v1/search/?q=domain:${domain}&size=10`, {
      headers: { 'Accept': 'application/json' }
    });
    if (urlResp.ok) {
      const urlData = await urlResp.json();
      const scans = (urlData.results || []).slice(0,8).map(r => ({
        task: r.task?.url, time: r.task?.time,
        malicious: r.verdicts?.overall?.malicious,
        score: r.verdicts?.overall?.score,
        categories: r.verdicts?.overall?.categories,
        country: r.page?.country, ip: r.page?.ip, server: r.page?.server
      }));
      results.urlscan = {
        total: urlData.total,
        malicious_count: scans.filter(s => s.malicious).length,
        scans
      };
    }
  } catch(e) {
    results.urlscan = { error: e.message };
  }

  // ── HaveIBeenPwned ───────────────────────────────────────────
  const isEmail = query.includes('@');
  if (isEmail) {
    try {
      const hibpResp = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(query)}?truncateResponse=false`, {
        headers: { 'hibp-api-key': 'none', 'User-Agent': 'ASOSINT/1.0' }
      });
      if (hibpResp.status === 200) {
        const breaches = await hibpResp.json();
        results.breaches = {
          found: true,
          count: breaches.length,
          breaches: breaches.slice(0,10).map(b => ({ name: b.Name, domain: b.Domain, date: b.BreachDate, data_classes: b.DataClasses?.slice(0,5), pwn_count: b.PwnCount }))
        };
      } else if (hibpResp.status === 404) {
        results.breaches = { found: false, count: 0, breaches: [] };
      } else {
        results.breaches = { error: `Status ${hibpResp.status}` };
      }
    } catch(e) {
      results.breaches = { error: e.message };
    }
  } else {
    results.breaches = { skipped: 'Email required for breach lookup' };
  }

  // ── Reddit mentions (pushshift-style via search) ─────────────
  try {
    const redditResp = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=10`, {
      headers: { 'User-Agent': 'ASOSINT/1.0' }
    });
    if (redditResp.ok) {
      const rd = await redditResp.json();
      const posts = (rd.data?.children || []).map(c => ({
        title: c.data.title, subreddit: c.data.subreddit,
        score: c.data.score, url: c.data.url,
        created: new Date(c.data.created_utc * 1000).toISOString().split('T')[0]
      }));
      results.reddit = { total: rd.data?.dist, posts };
    }
  } catch(e) {
    results.reddit = { error: e.message };
  }

  // ── DNS (SPF / DMARC / MX) via Google DoH ───────────────────
  try {
    const [spfResp, dmarcResp, mxResp] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=TXT`),
      fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`),
      fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
    ]);
    const [spfData, dmarcData, mxData] = await Promise.all([
      spfResp.json(), dmarcResp.json(), mxResp.json()
    ]);
    const txts = (spfData.Answer || []).map(a => a.data);
    const spfRecord = txts.find(t => t.includes('v=spf1')) || null;
    const dmarcRecord = (dmarcData.Answer || [])[0]?.data || null;
    const mxRecords = (mxData.Answer || []).map(a => a.data);
    results.dns = {
      spf: { found: !!spfRecord, record: spfRecord, hardFail: spfRecord?.includes('-all'), softFail: spfRecord?.includes('~all') },
      dmarc: { found: !!dmarcRecord, record: dmarcRecord, policy: dmarcRecord?.match(/p=(\w+)/)?.[1] },
      mx: { found: mxRecords.length > 0, records: mxRecords.slice(0,5) }
    };
  } catch(e) {
    results.dns = { error: e.message };
  }

  // ── AI risk scoring + gap analysis + threat matrix ───────────
  try {
    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an OSINT threat intelligence analyst. Based on this raw intelligence data for target "${query}" (type: ${query_type}):

GITHUB: ${JSON.stringify(results.github).slice(0,800)}
CRT.SH SUBDOMAINS: ${JSON.stringify(results.crt).slice(0,500)}
URLSCAN: ${JSON.stringify(results.urlscan).slice(0,500)}
BREACHES: ${JSON.stringify(results.breaches).slice(0,500)}
DNS: ${JSON.stringify(results.dns).slice(0,400)}
REDDIT: ${JSON.stringify(results.reddit?.posts?.slice(0,3)).slice(0,300)}

Produce:
1. risk_score: integer 0-100
2. risk_level: one of CRITICAL/HIGH/MEDIUM/LOW
3. summary: 2-3 sentence executive summary
4. social_footprint: object with platform presences, exposure level
5. gap_analysis: array of 5 objects each with { gap_id, title, mitre_technique_id, description, remediation, severity }
6. threat_matrix: array of 9 objects, one per MITRE tactic (Reconnaissance, Resource Development, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Command and Control, Impact), each with { tactic, likelihood (0-100), impact (0-100), risk_score (0-100), indicators: string[], notes: string }`,
      response_json_schema: {
        type: "object",
        properties: {
          risk_score: { type: "number" },
          risk_level: { type: "string" },
          summary: { type: "string" },
          social_footprint: { type: "object" },
          gap_analysis: { type: "array", items: { type: "object" } },
          threat_matrix: { type: "array", items: { type: "object" } }
        }
      }
    });
    results.ai = aiResult;
  } catch(e) {
    results.ai = { error: e.message };
  }

  return Response.json({ ok: true, query, query_type, results });
});