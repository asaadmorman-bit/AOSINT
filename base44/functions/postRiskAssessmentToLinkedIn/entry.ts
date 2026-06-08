import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assessment_id } = await req.json().catch(() => ({}));

    // Fetch latest risk assessment if not specified
    let assessment;
    if (assessment_id) {
      assessment = await base44.entities.RiskAssessment.get(assessment_id).catch(() => null);
    } else {
      const assessments = await base44.asServiceRole.entities.RiskAssessment.list('-created_date', 1);
      assessment = assessments[0];
    }

    if (!assessment) {
      return Response.json({ error: 'No risk assessment found' }, { status: 404 });
    }

    // Get LinkedIn access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the LinkedIn member profile (sub = person URN)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    // Format the risk assessment into a LinkedIn post
    const criticalCount = assessment.critical_findings || 0;
    const highCount = assessment.high_findings || 0;
    const riskLevel = assessment.overall_risk_level || 'medium';
    const affectedAssets = assessment.affected_assets_count || 0;

    const riskEmoji = riskLevel === 'critical' ? '🚨' : riskLevel === 'high' ? '⚠️' : riskLevel === 'medium' ? '⚡' : '✅';

    const content = `${riskEmoji} **THREAT RISK ASSESSMENT UPDATE**

🔍 Latest Infrastructure Vulnerability Report

**Risk Level:** ${riskLevel.toUpperCase()}
**Critical Findings:** ${criticalCount}
**High-Severity Issues:** ${highCount}
**Affected Assets:** ${affectedAssets}

Our continuous threat intelligence and vulnerability management system has identified these risks across our infrastructure. Immediate remediation actions are underway.

🛡️ Key Actions:
• Prioritizing critical vulnerabilities for immediate patching
• Coordinating with infrastructure teams on asset hardening
• Implementing compensating controls where needed

📊 Assessment Date: ${new Date(assessment.created_date).toLocaleDateString()}

Stay tuned for updates on our security posture improvements. Cybersecurity is a continuous process.

#CyberSecurity #ThreatIntelligence #InfrastructureHardening #RiskManagement #OSINT`;

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

    // Create a record of the post for tracking
    await base44.asServiceRole.entities.LinkedInScheduledPost.create({
      title: `Risk Assessment: ${riskLevel}`,
      content: content,
      assessment_id: assessment.id,
      post_to_personal: true,
      company_pages: [],
      status: 'posted',
      linkedin_post_ids: [postData.id],
      created_by: user.email,
      scheduled_for: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      success: true,
      message: 'Risk assessment posted to LinkedIn',
      linkedin_post_id: postData.id,
      assessment_id: assessment.id,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});