import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const results = {};

    // ── TASK 1: Auto-acknowledge all CorrelationAnalysis records not yet acknowledged ──
    console.log('Task 1: Fetching CorrelationAnalysis records...');
    const allCorrelations = await base44.asServiceRole.entities.CorrelationAnalysis.list('-created_date', 200);

    // Use tags to track acknowledgment (no acknowledged_at field on this entity)
    const unacknowledged = allCorrelations.filter(c => {
      const tags = c.tags || [];
      return !tags.includes('auto-acknowledged');
    });

    const ackPromises = unacknowledged.map(c => {
      const updatedTags = [...(c.tags || []), 'auto-acknowledged', 'ack-by:ASOSINT-AI', `ack-at:${now}`];
      return base44.asServiceRole.entities.CorrelationAnalysis.update(c.id, { tags: updatedTags });
    });
    await Promise.all(ackPromises);
    results.task1 = { acknowledged: unacknowledged.length, total: allCorrelations.length };
    console.log(`✓ Task 1 complete: acknowledged ${unacknowledged.length} CorrelationAnalysis records`);

    // ── TASK 2: Update ThreatFeed records + create 2 new ones ──
    // ThreatIntelligenceFeed entity doesn't exist — using ThreatFeed
    console.log('Task 2: Updating ThreatFeed records...');
    const feedIdsToUpdate = [
      '69b2999bfcf9e198461dd04f',
      '69b2999bfcf9e198461dd050',
      '69b2999bfcf9e198461dd051',
      '69b2999bfcf9e198461dd052'
    ];

    const updateFeedPromises = feedIdsToUpdate.map(id =>
      base44.asServiceRole.entities.ThreatFeed.update(id, {
        source_url: 'manual_classified_feed',
        description: 'Manual classified feed — endpoint updated by ASOSINT workflow'
      }).catch(e => ({ error: e.message, id }))
    );
    const feedUpdateResults = await Promise.all(updateFeedPromises);
    const feedUpdateErrors = feedUpdateResults.filter(r => r?.error);

    const [vtFeed, abuseIpdbFeed] = await Promise.all([
      base44.asServiceRole.entities.ThreatFeed.create({
        name: 'VirusTotal — Live IP/Domain Enrichment',
        feed_type: 'cyber',
        source_url: 'https://www.virustotal.com/api/v3/ip_addresses/{indicator}',
        refresh_interval: '15min',
        status: 'active',
        confidence_level: 'high',
        description: 'Live IP/domain enrichment via VirusTotal API v3'
      }),
      base44.asServiceRole.entities.ThreatFeed.create({
        name: 'AbuseIPDB — IP Reputation Feed',
        feed_type: 'cyber',
        source_url: 'https://api.abuseipdb.com/api/v2/check',
        refresh_interval: '1hr',
        status: 'active',
        confidence_level: 'medium',
        description: 'IP reputation scoring via AbuseIPDB API v2'
      })
    ]);

    results.task2 = {
      feedUpdates: feedIdsToUpdate.length - feedUpdateErrors.length,
      feedUpdateErrors: feedUpdateErrors.length,
      createdFeeds: [vtFeed.id, abuseIpdbFeed.id]
    };
    console.log(`✓ Task 2 complete: updated feeds, created VT (${vtFeed.id}) and AbuseIPDB (${abuseIpdbFeed.id})`);

    // ── TASK 3: Build IntelligenceReport from live data + publish to LinkedIn ──
    console.log('Task 3: Building IntelligenceReport...');
    const criticalCorrelations = allCorrelations.filter(c => c.confidence_score > 85);

    const executiveSummary = `Weekly global threat assessment — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Analysis of ${allCorrelations.length} correlation records reveals ${criticalCorrelations.length} high-confidence (>85%) cross-domain threat linkages. Primary threat vectors include campaign attribution, infrastructure pivoting, and behavioral pattern matching. Elevated operational risk posture requires immediate command attention and SOC tasking.`;

    const keyFindings = allCorrelations.slice(0, 5).map(c =>
      `${(c.correlation_type || 'correlation').replace(/_/g, ' ').toUpperCase()} [${c.confidence_score || 0}% confidence]: ${c.analysis_reasoning?.slice(0, 120) || 'Cross-domain threat activity detected'}`
    );

    const threatLandscape = JSON.stringify({
      overall_threat_level: criticalCorrelations.length > 3 ? 'CRITICAL' : criticalCorrelations.length > 1 ? 'HIGH' : 'ELEVATED',
      total_correlations: allCorrelations.length,
      high_confidence: criticalCorrelations.length,
      primary_domains: ['cyber', 'geopolitical', 'hybrid'],
      assessment_timestamp: now
    });

    const recommendations = [
      ...allCorrelations.slice(0, 3).map(c => c.recommended_action).filter(Boolean),
      'Escalate high-confidence correlations to command staff for immediate review',
      'Activate enhanced monitoring on all critical enriched indicators',
      'Brief SOC watch teams on current threat posture within 2 hours'
    ].filter(Boolean).slice(0, 5);

    const avgConfidence = allCorrelations.length > 0
      ? Math.round(allCorrelations.reduce((s, c) => s + (c.confidence_score || 0), 0) / allCorrelations.length)
      : 0;

    const report = await base44.asServiceRole.entities.IntelligenceReport.create({
      title: 'IR-2026-031301 — Weekly Global Threat Summary',
      report_type: 'threat_assessment',
      classification_level: 'confidential',
      full_report: executiveSummary,
      key_findings: keyFindings,
      recommended_actions: recommendations,
      intel_layers: { osint: threatLandscape },
      subject_entities: ['global', 'cyber', 'geopolitical'],
      confidence: avgConfidence,
      time_sensitivity: 'hours'
    });
    console.log(`✓ Created IntelligenceReport: ${report.id}`);

    // Publish to LinkedIn
    let linkedinStatus = 'skipped';
    try {
      const linkedinContent = `🛡️ ${report.title}\n\n📋 EXECUTIVE SUMMARY\n${executiveSummary}\n\n🎯 KEY FINDINGS\n${keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n✅ RECOMMENDED ACTIONS\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n#ThreatIntelligence #OSINT #CyberSecurity #ASOSINT`;

      await base44.functions.invoke('shareToLinkedIn', {
        title: report.title,
        content: linkedinContent,
        reportId: report.id
      });
      linkedinStatus = 'published';
      console.log('✓ Published to LinkedIn');
    } catch (liErr) {
      linkedinStatus = `failed: ${liErr.message}`;
      console.warn('⚠ LinkedIn publish failed (non-blocking):', liErr.message);
    }

    results.task3 = {
      reportId: report.id,
      correlationsUsed: allCorrelations.length,
      avgConfidence,
      linkedin: linkedinStatus
    };

    console.log('✅ All 3 tasks complete');
    return Response.json({ success: true, timestamp: now, results });

  } catch (error) {
    console.error('Workflow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});