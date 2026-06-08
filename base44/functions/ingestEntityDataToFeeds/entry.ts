import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Pulls real data from entities and pushes them as FeedMessages into the correct channels.
 * Then auto-pushes to Discord if those channels have auto_push_enabled.
 *
 * Mapping:
 *   OsintAlert        → community-alerts, osint-feed
 *   ThreatIndicator   → ioc-exchange, community-alerts (critical/high)
 *   ThreatActor       → threat-actors, enterprise-intel
 *   LEAIntelligence   → lea-intel, gov-osint
 *   VulnerabilityFinding → vuln-briefings
 *   Campaign          → enterprise-intel, threat-actors
 */

// How far back to look for new data (in minutes) — avoids re-ingesting old records
const LOOKBACK_MINUTES = 120;

const SEVERITY_MAP = {
  critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'info',
  CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low',
  Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low',
};

function normSev(val) { return SEVERITY_MAP[val] || 'info'; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both admin-triggered and scheduled (no auth for scheduled)
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAdmin = true;
    } catch (_) {}

    const body = await req.json().catch(() => ({}));
    const { force = false } = body;

    const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000).toISOString();

    // Load all channels indexed by slug
    const channels = await base44.asServiceRole.entities.FeedChannel.filter({ is_active: true });
    const channelBySlug = {};
    for (const ch of channels) channelBySlug[ch.slug] = ch;

    // Load existing FeedMessages to deduplicate (check source_ref)
    const existingMessages = await base44.asServiceRole.entities.FeedMessage.filter({});
    const existingSourceRefs = new Set(existingMessages.map(m => m.source_ref).filter(Boolean));

    const created = [];
    const skipped = [];

    // Helper: create a FeedMessage if not already ingested
    async function ingest({ channel_slug, content, severity, message_type, author_name, source_ref, tags }) {
      const ch = channelBySlug[channel_slug];
      if (!ch) { skipped.push({ source_ref, reason: `channel ${channel_slug} not found` }); return; }
      if (existingSourceRefs.has(source_ref)) { skipped.push({ source_ref, reason: 'already ingested' }); return; }

      const msg = await base44.asServiceRole.entities.FeedMessage.create({
        channel_id: ch.id,
        channel_slug,
        author_name: author_name || 'ASOSINT Intel Engine',
        author_email: 'intel@asosint.com',
        content,
        message_type: message_type || 'alert',
        severity: normSev(severity),
        tags: tags || [],
        source_ref,
      });
      existingSourceRefs.add(source_ref);
      created.push({ source_ref, channel_slug });
      return msg;
    }

    // ── 1. OsintAlert → community-alerts + osint-feed ──
    const osintAlerts = await base44.asServiceRole.entities.OsintAlert.filter({});
    for (const a of osintAlerts) {
      const ref = `osint-alert-${a.id}`;
      const content = `**${a.title}**\n${a.description || ''}\n> Type: \`${a.alert_type}\` | Confidence: ${a.confidence_score || 'N/A'}%${a.recommended_actions?.length ? '\n\n**Actions:** ' + a.recommended_actions.slice(0, 3).join(' · ') : ''}`;
      await ingest({ channel_slug: 'community-alerts', content, severity: a.severity, message_type: 'alert', source_ref: ref + '-ca', tags: a.tags });
      await ingest({ channel_slug: 'osint-feed', content, severity: a.severity, message_type: 'alert', source_ref: ref + '-of', tags: a.tags });
    }

    // ── 2. ThreatIndicator → ioc-exchange, high/critical → community-alerts ──
    const indicators = await base44.asServiceRole.entities.ThreatIndicator.filter({});
    for (const i of indicators) {
      const ref = `indicator-${i.id}`;
      const content = `**${i.title}**\n\`${i.indicator_type?.toUpperCase()}\`: \`${i.value}\`\n> Confidence: ${i.confidence || 'N/A'}% | Status: \`${i.status}\`${i.related_actors?.length ? '\n> Actors: ' + i.related_actors.join(', ') : ''}${i.tags?.length ? '\n> Tags: ' + i.tags.join(', ') : ''}`;
      await ingest({ channel_slug: 'ioc-exchange', content, severity: i.severity, message_type: 'alert', source_ref: ref + '-ioc', tags: i.tags });
      if (['high', 'critical'].includes(normSev(i.severity))) {
        await ingest({ channel_slug: 'community-alerts', content, severity: i.severity, message_type: 'alert', source_ref: ref + '-ca', tags: i.tags });
      }
    }

    // ── 3. ThreatActor → threat-actors + enterprise-intel ──
    const threatActors = await base44.asServiceRole.entities.ThreatActor.filter({});
    for (const a of threatActors) {
      const ref = `threat-actor-${a.id}`;
      const sev = a.convergence_score > 75 ? 'critical' : a.convergence_score > 50 ? 'high' : 'medium';
      const content = `**${a.name}** ${a.aliases?.length ? `*(${a.aliases.slice(0, 3).join(', ')})*` : ''}\n> Type: \`${a.actor_type}\` | Country: ${a.attributed_country || 'Unknown'} | Status: \`${a.status}\`${a.target_sectors?.length ? '\n> Targets: ' + a.target_sectors.slice(0, 4).join(', ') : ''}${a.notes ? '\n\n' + a.notes : ''}`;
      await ingest({ channel_slug: 'threat-actors', content, severity: sev, message_type: 'update', source_ref: ref + '-ta', tags: a.tags });
      await ingest({ channel_slug: 'enterprise-intel', content, severity: sev, message_type: 'update', source_ref: ref + '-ei', tags: a.tags });
    }

    // ── 4. LEAIntelligence → lea-intel + gov-osint (high/critical → ci-alerts) ──
    const leaItems = await base44.asServiceRole.entities.LEAIntelligence.filter({});
    for (const l of leaItems) {
      const ref = `lea-${l.id}`;
      const content = `**${l.title}** — ${l.entity_name || ''}\n> Agency: \`${l.source_agency?.toUpperCase()}\` | Type: \`${l.intel_type}\` | Threat: \`${l.threat_level}\`${l.description ? '\n\n' + l.description.slice(0, 400) : ''}${l.law_enforcement_tags?.length ? '\n> Designations: ' + l.law_enforcement_tags.join(', ') : ''}${l.fbi_designation ? '\n> FBI: ' + l.fbi_designation : ''}`;
      await ingest({ channel_slug: 'lea-intel', content, severity: l.threat_level, message_type: 'alert', source_ref: ref + '-li', tags: l.tags });
      await ingest({ channel_slug: 'gov-osint', content, severity: l.threat_level, message_type: 'update', source_ref: ref + '-go', tags: l.tags });
      if (['high', 'critical'].includes(normSev(l.threat_level))) {
        await ingest({ channel_slug: 'ci-alerts', content, severity: l.threat_level, message_type: 'alert', source_ref: ref + '-ci', tags: l.tags });
      }
    }

    // ── 5. VulnerabilityFinding → vuln-briefings + enterprise-intel (critical → community-alerts) ──
    const vulns = await base44.asServiceRole.entities.VulnerabilityFinding.filter({});
    for (const v of vulns) {
      const ref = `vuln-${v.id}`;
      const content = `**${v.title || v.cve_id || 'Vulnerability'}**\n> CVE: \`${v.cve_id || 'N/A'}\` | CVSS: ${v.cvss_score || 'N/A'} | Severity: \`${v.severity}\`${v.description ? '\n\n' + v.description.slice(0, 400) : ''}${v.affected_systems?.length ? '\n> Affected: ' + v.affected_systems.slice(0, 3).join(', ') : ''}`;
      await ingest({ channel_slug: 'vuln-briefings', content, severity: v.severity, message_type: 'alert', source_ref: ref + '-vb', tags: v.tags });
      await ingest({ channel_slug: 'enterprise-intel', content, severity: v.severity, message_type: 'alert', source_ref: ref + '-ei', tags: v.tags });
      if (normSev(v.severity) === 'critical') {
        await ingest({ channel_slug: 'community-alerts', content, severity: v.severity, message_type: 'alert', source_ref: ref + '-ca', tags: v.tags });
      }
    }

    // ── 6. Campaign → enterprise-intel + threat-actors ──
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({});
    for (const c of campaigns) {
      const ref = `campaign-${c.id}`;
      const sev = c.severity || c.threat_level || 'medium';
      const content = `**Campaign: ${c.name || c.title}**\n> Status: \`${c.status || 'active'}\`${c.description ? '\n\n' + c.description.slice(0, 400) : ''}${c.target_sectors?.length ? '\n> Sectors: ' + c.target_sectors.slice(0, 4).join(', ') : ''}`;
      await ingest({ channel_slug: 'enterprise-intel', content, severity: sev, message_type: 'update', source_ref: ref + '-ei', tags: c.tags });
      await ingest({ channel_slug: 'threat-actors', content, severity: sev, message_type: 'update', source_ref: ref + '-ta', tags: c.tags });
    }

    // ── Now trigger Discord push for channels with auto_push_enabled ──
    const pushRes = await base44.asServiceRole.functions.invoke('autoPushFeedToDiscord', {}).catch(() => null);

    return Response.json({
      success: true,
      ingested: created.length,
      skipped: skipped.length,
      discord_push: pushRes?.totalPushed ?? 'triggered',
      breakdown: {
        osint_alerts: osintAlerts.length,
        indicators: indicators.length,
        threat_actors: threatActors.length,
        lea_intelligence: leaItems.length,
        vulnerabilities: vulns.length,
        campaigns: campaigns.length,
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});