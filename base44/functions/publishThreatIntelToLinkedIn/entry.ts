import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json().catch(() => ({}));

    // Fetch latest threat intelligence report if not specified
    let report;
    if (report_id) {
      report = await base44.entities.IntelligenceReport.get(report_id).catch(() => null);
    } else {
      const reports = await base44.asServiceRole.entities.IntelligenceReport.list('-created_date', 1);
      report = reports[0];
    }

    if (!report) {
      return Response.json({ error: 'No threat intelligence report found' }, { status: 404 });
    }

    // Get LinkedIn access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the LinkedIn member profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    // Format threat intelligence report into LinkedIn post
    const threatLevel = report.threat_level || 'medium';
    const threatEmoji = threatLevel === 'critical' ? '🚨' : threatLevel === 'high' ? '🔴' : threatLevel === 'medium' ? '🟡' : '🟢';
    
    const indicators = report.ioc_count || 0;
    const actors = report.threat_actor_count || 0;
    const affectedSectors = report.affected_sectors || [];

    const summary = report.executive_summary || report.description || 'Latest threat intelligence findings';
    const summaryPreview = summary.substring(0, 280);

    const sectorsList = affectedSectors.length > 0 
      ? `\n\n🎯 **Affected Sectors:**\n${affectedSectors.slice(0, 5).map(s => `• ${s}`).join('\n')}`
      : '';

    const content = `${threatEmoji} **THREAT INTELLIGENCE REPORT**

**Threat Level:** ${threatLevel.toUpperCase()}

${summaryPreview}${summaryPreview.length >= summary.length ? '' : '...'}

📊 **Key Metrics:**
• Indicators of Compromise (IoCs): ${indicators}
• Threat Actors Identified: ${actors}${sectorsList}

🔍 This report synthesizes OSINT, dark web monitoring, and vulnerability intelligence to provide actionable threat context for defensive operations.

📅 Published: ${new Date(report.created_date).toLocaleDateString()}

#ThreatIntelligence #Cybersecurity #OSINT #InfoSec #ThreatsInContext #SecurityAwareness`;

    // Post to LinkedIn personal feed
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return Response.json({ error: `LinkedIn post failed: ${err}` }, { status: 500 });
    }

    const postData = await postRes.json();

    // Log the published post for tracking
    await base44.asServiceRole.entities.LinkedInScheduledPost.create({
      title: `Threat Intel: ${report.title || threatLevel}`,
      content: content,
      report_id: report.id,
      post_to_personal: true,
      company_pages: [],
      status: 'posted',
      linkedin_post_ids: [postData.id],
      created_by: user.email,
      scheduled_for: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      success: true,
      message: 'Threat intelligence report published to LinkedIn',
      linkedin_post_id: postData.id,
      report_id: report.id,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});