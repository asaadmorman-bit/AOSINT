import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json().catch(() => ({}));

    // Only post public vendor advisories — never internal security reports
    const { advisory_id } = await req.json().catch(() => ({}));

    let advisory;
    if (advisory_id) {
      const results = await base44.asServiceRole.entities.VendorAdvisory.filter({ id: advisory_id }, '-created_date', 1);
      advisory = results[0];
    } else {
      const results = await base44.asServiceRole.entities.VendorAdvisory.filter({ ingestion_source: 'nvd_api' }, '-publish_date', 1);
      advisory = results[0];
    }

    if (!advisory) {
      return Response.json({ error: 'No public vendor advisory found to post' }, { status: 404 });
    }

    // Get LinkedIn access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the LinkedIn member profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    // Format public advisory for LinkedIn (no internal data)
    const severity = advisory.severity || 'medium';
    const severityEmoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '🔍' : '✅';

    const description = (advisory.description || '').substring(0, 300);
    const cves = advisory.cve_ids?.length ? `CVEs: ${advisory.cve_ids.slice(0, 3).join(', ')}` : '';
    const cvss = advisory.cvss_score ? `CVSS: ${advisory.cvss_score}` : '';

    const content = `${severityEmoji} PUBLIC SECURITY ADVISORY

${advisory.vendor_name} — ${advisory.title}
Severity: ${severity.toUpperCase()}${cvss ? ` | ${cvss}` : ''}
${cves}

${description}${description.length >= (advisory.description || '').length ? '' : '...'}

${advisory.fix_available ? '✅ Patch Available' : '⚠️ No fix available yet — apply mitigations if possible.'}
${advisory.fix_reference ? `🔗 Reference: ${advisory.fix_reference}` : ''}

Stay informed on public disclosures to protect your infrastructure.

#CyberSecurity #VulnerabilityDisclosure #PublicAdvisory #PatchManagement #InfoSec`;

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
      title: `Public Advisory: ${advisory.title || severity}`,
      content: content,
      report_id: advisory.id,
      post_to_personal: true,
      company_pages: [],
      status: 'posted',
      linkedin_post_ids: [postData.id],
      created_by: user.email,
      scheduled_for: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({
      success: true,
      message: 'Security report published to LinkedIn',
      linkedin_post_id: postData.id,
      report_id: report.id,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});