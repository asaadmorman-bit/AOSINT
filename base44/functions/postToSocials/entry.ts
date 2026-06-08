import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { platform, message, content_type, webhook_url } = await req.json();

    if (!platform || !message) {
      return Response.json({ error: 'platform and message are required' }, { status: 400 });
    }

    // Ensure EDS attribution is in the message
    if (!message.includes('Emerging Defense Solutions') && !message.includes('ASOSINT')) {
      return Response.json({ error: 'Message must include ASOSINT attribution' }, { status: 400 });
    }

    let result = {};

    // ── Discord ──────────────────────────────────────────────
    if (platform === 'discord') {
      const discordWebhook = webhook_url || Deno.env.get('DISCORD_WEBHOOK_URL');
      const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
      const channelId = Deno.env.get('DISCORD_CHANNEL_ID');

      if (discordWebhook) {
        // Post via webhook
        const res = await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message,
            username: 'ASOSINT | Emerging Defense Solutions',
            avatar_url: 'https://eds-360.com/logo.png',
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          return Response.json({ error: `Discord webhook failed: ${err}` }, { status: 500 });
        }
        result = { platform: 'discord', method: 'webhook', status: 'posted' };
      } else if (botToken && channelId) {
        // Post via bot token
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: message }),
        });
        if (!res.ok) {
          const err = await res.text();
          return Response.json({ error: `Discord bot post failed: ${err}` }, { status: 500 });
        }
        result = { platform: 'discord', method: 'bot', status: 'posted' };
      } else {
        return Response.json({ error: 'No Discord webhook URL or bot token configured' }, { status: 400 });
      }
    }

    // ── LinkedIn ─────────────────────────────────────────────
    else if (platform === 'linkedin') {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

      // Get the user's LinkedIn person URN
      const profileRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        return Response.json({ error: 'Could not fetch LinkedIn profile' }, { status: 500 });
      }
      const profile = await profileRes.json();
      const authorUrn = `urn:li:person:${profile.id}`;

      const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: message },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }),
      });

      if (!postRes.ok) {
        const err = await postRes.text();
        return Response.json({ error: `LinkedIn post failed: ${err}` }, { status: 500 });
      }
      result = { platform: 'linkedin', status: 'posted' };
    }

    else {
      return Response.json({ error: `Platform "${platform}" not yet supported` }, { status: 400 });
    }

    // Log it
    await base44.asServiceRole.entities.AuditLog.create({
      actor_email: user.email,
      action: 'social_share',
      resource_type: 'social_post',
      details: `Posted ${content_type} to ${platform}`,
      severity: 'info',
      outcome: 'success',
    }).catch(() => {});

    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});