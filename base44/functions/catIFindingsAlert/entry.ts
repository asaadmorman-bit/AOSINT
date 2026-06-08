import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));

    // Called from automation (entity event) or manually
    const { feed_id, feed_name, cat1_count, compliance_score, platform, stig_version, triggered_by } = body;

    // If called from entity automation, re-fetch the feed to get latest data
    let alertFeedName = feed_name;
    let alertCat1 = cat1_count;
    let alertScore = compliance_score;
    let alertPlatform = platform;
    let alertVersion = stig_version;

    if (body?.event?.entity_id) {
      // Triggered from entity automation
      const feedData = body.data;
      if (!feedData) {
        return Response.json({ skipped: true, reason: "no feed data" });
      }
      // Only alert for scap_stig / mobile_security / compliance feeds
      const trackedTypes = ["scap_stig", "mobile_security", "compliance", "vulnerability"];
      if (!trackedTypes.includes(feedData.feed_type)) {
        return Response.json({ skipped: true, reason: "not a compliance feed type" });
      }

      // Derive CAT I count from compliance_score and open_findings
      const score = feedData.compliance_score ?? 0;
      const openFindings = feedData.open_findings ?? 0;
      const estimatedCat1 = openFindings > 0 ? Math.ceil(openFindings * (1 - score / 100) * 0.35) : 0;

      if (estimatedCat1 === 0 && feedData.status !== "error") {
        return Response.json({ skipped: true, reason: "no CAT I findings detected" });
      }

      alertFeedName = feedData.name;
      alertCat1 = estimatedCat1;
      alertScore = feedData.compliance_score;
      alertPlatform = feedData.platform;
      alertVersion = feedData.stig_version;
    }

    const discordToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!discordToken) {
      return Response.json({ error: "DISCORD_BOT_TOKEN not set" }, { status: 500 });
    }

    // Find notification settings for Discord channel
    const notifSettings = await base44.asServiceRole.entities.NotificationSettings.list();
    const discordSettings = notifSettings.find(s => s.notification_channels?.includes("discord"));

    if (!discordSettings?.discord_channel_id) {
      // Log the alert internally even if no Discord channel configured
      await base44.asServiceRole.entities.OsintAlert.create({
        alert_type: "new_indicator",
        title: `CAT I Finding Detected: ${alertFeedName}`,
        description: `${alertCat1 || "New"} CAT I finding(s) detected in feed "${alertFeedName}"${alertPlatform ? ` (${alertPlatform})` : ""}. Compliance score: ${alertScore ?? "N/A"}%. Immediate remediation required.`,
        severity: "critical",
        status: "new",
        source_agent: "cat1_findings_monitor",
        triggered_at: new Date().toISOString(),
        tags: ["cat-i", "scap", "stig", "compliance", "auto-detected"],
        recommended_actions: [
          "Review all CAT I findings immediately",
          "Assign remediation tasks to responsible teams",
          "Re-run SCAP scan after remediation",
          "Update POAM with findings"
        ]
      });
      return Response.json({ success: true, method: "dashboard_alert_only", reason: "no discord channel configured" });
    }

    // Build Discord embed message
    const embed = {
      title: "🔴 CAT I Finding Alert",
      description: `New **CAT I (Critical)** findings detected in monitored feed.`,
      color: 0xff4757,
      fields: [
        { name: "📋 Feed", value: alertFeedName || "Unknown", inline: true },
        { name: "⚠️ CAT I Findings", value: String(alertCat1 ?? "Detected"), inline: true },
        { name: "🖥️ Platform", value: alertPlatform || "N/A", inline: true },
        { name: "📌 Version", value: alertVersion || "N/A", inline: true },
        { name: "📊 Compliance Score", value: alertScore != null ? `${alertScore}%` : "N/A", inline: true },
        { name: "🚨 Action Required", value: "Immediate remediation required. Review findings in SCAP/STIG dashboard.", inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "ASOSINT · SCAP/STIG Monitor" }
    };

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${discordSettings.discord_channel_id}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${discordToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ embeds: [embed] })
    });

    const discordJson = await discordRes.json().catch(() => ({}));

    // Also create an internal OsintAlert
    await base44.asServiceRole.entities.OsintAlert.create({
      alert_type: "new_indicator",
      title: `CAT I Finding Detected: ${alertFeedName}`,
      description: `${alertCat1 || "New"} CAT I finding(s) detected in "${alertFeedName}"${alertPlatform ? ` (${alertPlatform})` : ""}. Compliance score: ${alertScore ?? "N/A"}%.`,
      severity: "critical",
      status: "new",
      source_agent: "cat1_findings_monitor",
      triggered_at: new Date().toISOString(),
      tags: ["cat-i", "scap", "stig", "compliance", "auto-detected"],
      recommended_actions: [
        "Review all CAT I findings immediately",
        "Assign remediation tasks to responsible teams",
        "Re-run SCAP scan after remediation"
      ]
    });

    return Response.json({
      success: true,
      discord_status: discordRes.status,
      discord_ok: discordRes.ok,
      message_id: discordJson.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});