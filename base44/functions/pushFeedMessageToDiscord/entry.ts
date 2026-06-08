import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SEVERITY_COLORS = {
  info: 0x6b7280,
  low: 0x2ed573,
  medium: 0xffa502,
  high: 0xff6b35,
  critical: 0xff4757,
};

const SEVERITY_EMOJIS = {
  info: "ℹ️",
  low: "🟢",
  medium: "🟡",
  high: "🟠",
  critical: "🔴",
};

const TYPE_LABELS = {
  message: "💬 Message",
  alert: "🚨 Alert",
  update: "📡 Update",
  system: "⚙️ System",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channel_name, channel_slug, message_type, severity, content, author_name } = await req.json();

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) return Response.json({ error: 'DISCORD_BOT_TOKEN not set' }, { status: 500 });

    // Find matching DiscordThreatChannels — look for channels that match the feed slug or name
    const discordChannels = await base44.asServiceRole.entities.DiscordThreatChannel.filter({});

    // Find the best matching Discord channel by name similarity
    const slug = (channel_slug || "").toLowerCase();
    const feedName = (channel_name || "").toLowerCase();

    let targetDiscordChannel = discordChannels.find(dc =>
      dc.channel_name?.toLowerCase().includes(slug) ||
      slug.includes(dc.channel_name?.toLowerCase()) ||
      dc.channel_name?.toLowerCase().includes(feedName.split(" ")[0])
    );

    // Fallback: find a general/announcements channel
    if (!targetDiscordChannel) {
      targetDiscordChannel = discordChannels.find(dc =>
        dc.channel_name?.toLowerCase().includes("general") ||
        dc.channel_name?.toLowerCase().includes("intel") ||
        dc.channel_name?.toLowerCase().includes("alert")
      );
    }

    if (!targetDiscordChannel) {
      return Response.json({ pushed: false, reason: 'No matching Discord channel found' });
    }

    const discordChannelId = targetDiscordChannel.discord_channel_id;

    // Build the embed
    const color = SEVERITY_COLORS[severity || "info"] || SEVERITY_COLORS.info;
    const emoji = SEVERITY_EMOJIS[severity || "info"] || "";
    const typeLabel = TYPE_LABELS[message_type || "message"] || "💬 Message";

    const embed = {
      title: `${emoji} ${typeLabel} — #${channel_name}`,
      description: content,
      color,
      footer: {
        text: `Posted by ${author_name} via ASOSINT Intel Feeds`,
      },
      timestamp: new Date().toISOString(),
      fields: message_type !== "message" ? [
        { name: "Severity", value: (severity || "info").toUpperCase(), inline: true },
        { name: "Type", value: (message_type || "message").toUpperCase(), inline: true },
      ] : [],
    };

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${discordChannelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const err = await discordRes.text();
      return Response.json({ pushed: false, reason: err }, { status: 200 });
    }

    return Response.json({ pushed: true, discord_channel: targetDiscordChannel.channel_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});