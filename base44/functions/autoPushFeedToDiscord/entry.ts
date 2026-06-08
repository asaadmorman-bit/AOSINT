import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SEVERITY_COLORS = {
  info: 0x6b7280, low: 0x2ed573, medium: 0xffa502, high: 0xff6b35, critical: 0xff4757,
};
const SEVERITY_EMOJIS = {
  info: "ℹ️", low: "🟢", medium: "🟡", high: "🟠", critical: "🔴",
};
const TYPE_LABELS = {
  message: "💬 Message", alert: "🚨 Alert", update: "📡 Update", system: "⚙️ System",
};
const SPEED_MINUTES = { slow: 240, normal: 60, fast: 15, realtime: 5 };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!botToken) return Response.json({ error: 'DISCORD_BOT_TOKEN not set' }, { status: 500 });

    // Load all channels with auto_push enabled
    const channels = await base44.asServiceRole.entities.FeedChannel.filter({ is_active: true, auto_push_enabled: true });
    if (!channels.length) return Response.json({ message: 'No channels with auto_push enabled', pushed: 0 });

    // Load all Discord threat channels for routing
    const discordChannels = await base44.asServiceRole.entities.DiscordThreatChannel.filter({});

    const now = new Date();
    let totalPushed = 0;
    const log = [];

    for (const channel of channels) {
      // Check frequency: has enough time passed since last push?
      const frequencyMinutes = SPEED_MINUTES[channel.push_speed || 'normal'] || (channel.push_frequency_minutes || 60);
      const lastPushed = channel.last_pushed_at ? new Date(channel.last_pushed_at) : null;
      if (lastPushed) {
        const minutesSince = (now - lastPushed) / 1000 / 60;
        if (minutesSince < frequencyMinutes) {
          log.push({ channel: channel.name, skipped: `not due yet (${Math.round(minutesSince)}/${frequencyMinutes} min)` });
          continue;
        }
      }

      // Find matching Discord channel
      const slug = channel.slug?.toLowerCase();
      const targetDC = discordChannels.find(dc =>
        dc.channel_name?.toLowerCase() === slug ||
        dc.channel_name?.toLowerCase().includes(slug)
      );
      if (!targetDC) {
        log.push({ channel: channel.name, skipped: 'no matching Discord channel' });
        continue;
      }

      // Fetch recent messages not yet pushed (since last_pushed_at or last 60 min)
      const since = lastPushed || new Date(now - 60 * 60 * 1000);
      const messages = await base44.asServiceRole.entities.FeedMessage.filter({ channel_id: channel.id });
      const newMessages = messages.filter(m => {
        const createdAt = new Date(m.created_date);
        if (createdAt <= since) return false;
        // Apply severity filter if set
        if (channel.push_severity_filter?.length) {
          return channel.push_severity_filter.includes(m.severity || 'info');
        }
        return true;
      });

      if (!newMessages.length) {
        log.push({ channel: channel.name, skipped: 'no new messages' });
        continue;
      }

      // Push each new message to Discord
      for (const msg of newMessages) {
        const color = SEVERITY_COLORS[msg.severity || 'info'];
        const emoji = SEVERITY_EMOJIS[msg.severity || 'info'];
        const typeLabel = TYPE_LABELS[msg.message_type || 'message'];

        const embed = {
          title: `${emoji} ${typeLabel} — #${channel.name}`,
          description: msg.content,
          color,
          footer: { text: `${msg.author_name || 'ASOSINT'} via Intel Feeds` },
          timestamp: new Date(msg.created_date).toISOString(),
          fields: msg.message_type !== 'message' ? [
            { name: "Severity", value: (msg.severity || 'info').toUpperCase(), inline: true },
            { name: "Type", value: (msg.message_type || 'message').toUpperCase(), inline: true },
          ] : [],
        };

        const res = await fetch(`https://discord.com/api/v10/channels/${targetDC.discord_channel_id}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        });

        if (res.ok) totalPushed++;
      }

      // Update last_pushed_at
      await base44.asServiceRole.entities.FeedChannel.update(channel.id, { last_pushed_at: now.toISOString() });
      log.push({ channel: channel.name, pushed: newMessages.length });
    }

    return Response.json({ success: true, totalPushed, log });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});