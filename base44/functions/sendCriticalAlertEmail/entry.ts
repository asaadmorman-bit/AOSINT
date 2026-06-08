import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event, data } = await req.json().catch(() => ({}));

    // Only process if severity is critical
    if (!data || data.severity !== 'critical') {
      return Response.json({ skipped: true, reason: 'Not critical severity' });
    }

    const entityType = event?.entity_name;
    const entityId = event?.entity_id;
    let subject, summary, details;

    // Format based on entity type
    if (entityType === 'IntelligenceReport') {
      subject = `🚨 CRITICAL: New Threat Intelligence Report`;
      summary = data.title || 'Critical Threat Intelligence Report';
      details = `
Title: ${data.title || 'N/A'}
Severity: CRITICAL
Description: ${data.description || data.summary || 'N/A'}
Date: ${new Date(data.created_date).toLocaleString()}
Report ID: ${entityId}
      `;
    } else if (entityType === 'VulnerabilityFinding') {
      subject = `🚨 CRITICAL: New Vulnerability Finding`;
      summary = data.title || 'Critical Vulnerability Finding';
      details = `
Title: ${data.title || 'N/A'}
Severity: CRITICAL
Description: ${data.description || 'N/A'}
Affected Assets: ${data.affected_assets?.length || 0} systems
Due Date: ${data.due_date ? new Date(data.due_date).toLocaleDateString() : 'N/A'}
Finding ID: ${entityId}
      `;
    } else {
      return Response.json({ error: 'Unsupported entity type' }, { status: 400 });
    }

    // Get security team members
    const teams = await base44.asServiceRole.entities.Team.filter({
      type: 'security'
    });

    const securityTeamEmails = [];
    for (const team of teams) {
      const members = await base44.asServiceRole.entities.TeamMember.filter({
        team_id: team.id,
        is_active: true
      });
      securityTeamEmails.push(...members.map(m => m.user_email));
    }

    // Fallback: include report creator if no team found
    if (securityTeamEmails.length === 0) {
      securityTeamEmails.push(user.email);
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(securityTeamEmails)];

    // Send email to each team member
    const emailPromises = uniqueEmails.map(email =>
      base44.integrations.Core.SendEmail({
        to: email,
        subject: subject,
        body: `
Security Alert: Critical Severity Item Recorded

${summary}

---

${details}

---

Entity Type: ${entityType}
Recorded By: ${user.full_name || user.email}
Timestamp: ${new Date().toISOString()}

Please review this critical alert immediately and take appropriate action.

This is an automated alert from your security intelligence system.
        `
      }).catch(err => {
        console.error(`Failed to send email to ${email}:`, err.message);
        return null;
      })
    );

    await Promise.all(emailPromises);

    return Response.json({
      success: true,
      message: `Critical alert email sent to ${uniqueEmails.length} team member(s)`,
      recipients: uniqueEmails,
      entity_type: entityType,
      entity_id: entityId,
    });

  } catch (error) {
    console.error('Email alert function error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});