import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { finding_id, finding } = body;

    // Support both direct call (with finding data) and entity automation (with finding_id)
    let vuln = finding;

    if (!vuln && finding_id) {
      const results = await base44.asServiceRole.entities.VulnerabilityFinding.filter({ id: finding_id }, '-created_date', 1);
      vuln = results[0];
    }

    if (!vuln) {
      return Response.json({ error: 'No vulnerability data provided' }, { status: 400 });
    }

    // Only send alerts for critical/high severity
    const alertableSeverities = ['critical', 'high'];
    if (!alertableSeverities.includes(vuln.severity)) {
      return Response.json({ skipped: true, reason: 'Severity below alert threshold' });
    }

    // Get all active subscriptions that want this severity
    const allSubs = await base44.asServiceRole.entities.FeedAlertSubscription.filter({ is_active: true }, '-created_date', 200);

    const matchingSubs = allSubs.filter(sub => {
      if (!sub.email_enabled) return false;
      if (!sub.alert_severities?.includes(vuln.severity)) return false;
      if (!sub.alert_types?.includes('vulnerability')) return false;
      return true;
    });

    if (matchingSubs.length === 0) {
      return Response.json({ sent: 0, reason: 'No matching subscribers' });
    }

    // Build asset link
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'https://app.asosint.com';
    const assetLink = vuln.asset_id
      ? `${appBaseUrl}/Assets?asset_id=${vuln.asset_id}`
      : `${appBaseUrl}/VulnerabilityManagement`;

    const severityColor = vuln.severity === 'critical' ? '#ff4757' : '#ffa502';
    const severityIcon = vuln.severity === 'critical' ? '🚨' : '⚠️';

    const cvssText = vuln.cvss_score ? `CVSS Score: ${vuln.cvss_score}` : '';
    const cveText = vuln.cve_id ? `CVE: ${vuln.cve_id}` : '';
    const patchText = vuln.patch_available ? '✅ Patch Available' : '⚠️ No patch available — apply mitigations';
    const exploitText = vuln.actively_exploited ? '🔴 ACTIVELY EXPLOITED IN THE WILD' : '';
    const assetText = vuln.asset_name ? `Affected Asset: ${vuln.asset_name}` : '';
    const affectedSoftware = vuln.affected_software ? `Software: ${vuln.affected_software}` : '';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0d1220;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${severityColor}18;border-bottom:2px solid ${severityColor};padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:11px;font-weight:700;color:${severityColor};letter-spacing:2px;text-transform:uppercase;">ASOSINT Security Alert</span>
                    <h1 style="margin:8px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">${severityIcon} ${vuln.severity.toUpperCase()} Vulnerability Detected</h1>
                    <p style="margin:0;font-size:13px;color:#94a3b8;">${new Date().toUTCString()}</p>
                  </td>
                  <td align="right" style="padding-left:16px;">
                    <span style="display:inline-block;background:${severityColor};color:#fff;font-weight:900;font-size:12px;padding:6px 14px;border-radius:6px;text-transform:uppercase;">${vuln.severity}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0 0 12px;font-size:18px;color:#ffffff;font-weight:700;">${vuln.title}</h2>
              ${vuln.description ? `<p style="margin:0 0 20px;color:#94a3b8;font-size:14px;line-height:1.6;">${vuln.description.substring(0, 400)}${vuln.description.length > 400 ? '...' : ''}</p>` : ''}

              <!-- Details Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:8px;padding:16px;margin-bottom:20px;">
                <tr>
                  <td style="padding:6px 0;">
                    ${cveText ? `<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><span style="color:#00d4ff;font-weight:600;">CVE ID:</span> ${vuln.cve_id}</p>` : ''}
                    ${cvssText ? `<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><span style="color:#00d4ff;font-weight:600;">CVSS Score:</span> ${vuln.cvss_score}/10</p>` : ''}
                    ${assetText ? `<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><span style="color:#00d4ff;font-weight:600;">Affected Asset:</span> ${vuln.asset_name}</p>` : ''}
                    ${affectedSoftware ? `<p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><span style="color:#00d4ff;font-weight:600;">Software:</span> ${vuln.affected_software}</p>` : ''}
                    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><span style="color:#00d4ff;font-weight:600;">Patch Status:</span> ${patchText}</p>
                    ${exploitText ? `<p style="margin:0;font-size:13px;font-weight:700;color:#ff4757;">${exploitText}</p>` : ''}
                  </td>
                </tr>
              </table>

              ${vuln.remediation_guidance ? `
              <div style="background:#0a2a1a;border:1px solid #2ed57320;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#2ed573;text-transform:uppercase;letter-spacing:1px;">Remediation Guidance</p>
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${vuln.remediation_guidance.substring(0, 500)}</p>
              </div>` : ''}

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td align="center" style="border-radius:8px;background:#00d4ff;">
                    <a href="${assetLink}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#000000;text-decoration:none;border-radius:8px;">
                      View Affected Asset →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#4a5568;text-align:center;">
                Direct link: <a href="${assetLink}" style="color:#00d4ff;">${assetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#080c18;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 6px;font-size:12px;color:#4a5568;">You are receiving this because you subscribed to ASOSINT vulnerability alerts.</p>
              <p style="margin:0;font-size:12px;color:#4a5568;">
                Manage preferences at <a href="${appBaseUrl}/FeedSubscriptions" style="color:#00d4ff;">ASOSINT Feed Subscriptions</a> |
                <a href="https://www.linkedin.com/company/emerging-defense-solutions" style="color:#00d4ff;">Follow on LinkedIn</a> |
                <a href="https://discord.gg/asosint" style="color:#7289da;">Join Discord</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#2d3748;">© 2026 Emerging Defense Solutions · ASOSINT</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subject = `${severityIcon} [ASOSINT] ${vuln.severity.toUpperCase()} Vulnerability: ${vuln.title.substring(0, 60)}`;

    // Send emails to all matching subscribers
    let sentCount = 0;
    const errors = [];

    for (const sub of matchingSubs) {
      // For realtime subscribers — send immediately
      // For digest subscribers — they'd be handled by a separate scheduled digest function
      if (sub.frequency !== 'realtime') continue;

      const emailTo = sub.notification_email || sub.user_email;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: emailTo,
        subject: subject,
        body: htmlBody,
        from_name: 'ASOSINT Security Alerts'
      });

      // Update alert count
      await base44.asServiceRole.entities.FeedAlertSubscription.update(sub.id, {
        last_alerted_at: new Date().toISOString(),
        alert_count: (sub.alert_count || 0) + 1
      }).catch(() => {});

      sentCount++;
    }

    return Response.json({
      success: true,
      sent: sentCount,
      total_matching_subs: matchingSubs.length,
      vuln_id: vuln.id,
      severity: vuln.severity
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});