import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Create security event notification
 * Handles notifications for login attempts, RADIUS, MFA, vulnerabilities
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      notification_type,
      recipient_email,
      title,
      message,
      severity = "info",
      resource_type,
      resource_id,
      metadata = {},
      action_url,
      in_app_only = false,
    } = body;

    if (!notification_type || !recipient_email || !title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get notification settings for recipient
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({
      user_email: recipient_email,
    });

    const notifSettings = settings.length ? settings[0] : null;

    // Check if notification type is enabled
    const typeKey = `${notification_type}_enabled`;
    if (notifSettings && !notifSettings[typeKey]) {
      return Response.json({ success: true, skipped: true }, { status: 200 });
    }

    // Create notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email,
      notification_type,
      title,
      message,
      severity,
      resource_type,
      resource_id,
      metadata: JSON.stringify(metadata),
      action_url,
      in_app_only,
      triggered_by: user.email,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    // Send email if enabled
    const emailKey = `${notification_type}_email`;
    const shouldEmail = !in_app_only && (notifSettings?.[emailKey] ?? true);

    if (shouldEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          to: recipient_email,
          subject: `🚨 ${title}`,
          body: `
            <h2>${title}</h2>
            <p>${message}</p>
            ${action_url ? `<p><a href="${action_url}" style="background-color: #00d4ff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View Details</a></p>` : ''}
            <p style="color: #999; font-size: 12px;">Severity: ${severity}</p>
          `,
        });

        await base44.asServiceRole.entities.Notification.update(notification.id, {
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to send email:", error);
      }
    }

    // Log event
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "notification_created",
      resource_type: "notification",
      resource_id: notification.id,
      details: `${notification_type} notification sent to ${recipient_email}`,
      severity: severity === "critical" ? "warning" : "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      notification_id: notification.id,
      email_sent: shouldEmail,
    }, { status: 201 });
  } catch (error) {
    console.error("Notification creation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});