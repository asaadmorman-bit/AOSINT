import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only post public vendor advisory remediation guidance — never internal vulnerability findings
    const { advisory_id } = await req.json().catch(() => ({}));

    let advisory;
    if (advisory_id) {
      const results = await base44.asServiceRole.entities.VendorAdvisory.filter({ id: advisory_id }, '-created_date', 1);
      advisory = results[0];
    } else {
      // Find a public advisory with a fix available that hasn't been posted yet
      const results = await base44.asServiceRole.entities.VendorAdvisory.filter({ fix_available: true }, '-publish_date', 1);
      advisory = results[0];
    }

    if (!advisory) {
      return Response.json({ error: 'No public advisory with remediation guidance found' }, { status: 404 });
    }

    if (!advisory.fix_instructions && !advisory.fix_reference) {
      return Response.json({ error: 'Advisory has no public remediation guidance to share' }, { status: 404 });
    }

    // Get LinkedIn access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    // Get the LinkedIn member profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    // Format public remediation guidance — no internal asset/org data
    const severity = advisory.severity || 'medium';
    const severityEmoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';

    const instructions = advisory.fix_instructions
      ? advisory.fix_instructions.split('\n').filter(s => s.trim()).slice(0, 5).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')
      : 'See vendor reference for remediation steps.';

    const cves = advisory.cve_ids?.length ? `CVEs: ${advisory.cve_ids.slice(0, 3).join(', ')}` : '';

    const content = `${severityEmoji} PUBLIC REMEDIATION GUIDANCE

${advisory.vendor_name} — ${advisory.title}
Severity: ${severity.toUpperCase()}
${cves}

📋 Remediation Steps (via vendor advisory):
${instructions}

Fix Type: ${advisory.fix_type || 'See vendor guidance'}
${advisory.fix_reference ? `🔗 Reference: ${advisory.fix_reference}` : ''}

Apply vendor patches promptly to reduce exposure on affected systems.

#PatchManagement #VulnerabilityRemediation #CyberSecurity #InfoSec #PublicAdvisory`;

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
      title: `Public Remediation: ${advisory.title || severity}`,
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
      message: 'Public remediation guidance published to LinkedIn',
      linkedin_post_id: postData.id,
      advisory_id: advisory.id,
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});