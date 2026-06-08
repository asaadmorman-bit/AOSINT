import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Searches for alerts across Discord channels
 * Allows full-text search, filtering by channel, and severity
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const channel = url.searchParams.get('channel') || '';
    const severity = url.searchParams.get('severity') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    if (!query) {
      return Response.json({ error: 'Search query required (q parameter)' }, { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const results = [];

    try {
      // Get all guilds
      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { 'Authorization': `Bot ${botToken}` },
      });

      if (!guildsRes.ok) {
        return Response.json({ error: 'Failed to fetch guilds' }, { status: 500 });
      }

      const guilds = await guildsRes.json();

      for (const guild of guilds.slice(0, 1)) {
        // Get all channels
        const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
          headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (!channelsRes.ok) continue;

        const channels = await channelsRes.json();
        const textChannels = channels.filter(ch => ch.type === 0); // Text channels only

        // Filter channels if specified
        const targetChannels = channel
          ? textChannels.filter(ch => ch.name.toLowerCase().includes(channel.toLowerCase()))
          : textChannels;

        for (const ch of targetChannels) {
          if (results.length >= limit) break;

          try {
            // Search messages in channel using Discord API query
            const searchUrl = `https://discord.com/api/v10/channels/${ch.id}/messages?limit=100`;
            const messagesRes = await fetch(searchUrl, {
              headers: { 'Authorization': `Bot ${botToken}` },
            });

            if (!messagesRes.ok) continue;

            const messages = await messagesRes.json();

            // Filter messages by query and severity
            for (const msg of messages) {
              if (results.length >= limit) break;

              const content = (msg.content || '').toLowerCase();
              const hasQuery = content.includes(query.toLowerCase());

              // Check embeds for severity and query
              let hasSeverity = !severity;
              let matchFound = hasQuery;

              if (msg.embeds && msg.embeds.length > 0) {
                for (const embed of msg.embeds) {
                  const embedText = `${embed.title || ''} ${embed.description || ''} ${embed.fields?.map(f => `${f.name} ${f.value}`).join(' ') || ''}`.toLowerCase();

                  if (embedText.includes(query.toLowerCase())) {
                    matchFound = true;
                  }

                  if (severity && embedText.includes(severity.toLowerCase())) {
                    hasSeverity = true;
                  }
                }
              }

              if (matchFound && hasSeverity) {
                results.push({
                  id: msg.id,
                  channel: ch.name,
                  channel_id: ch.id,
                  author: msg.author?.username || 'Unknown',
                  content: msg.content?.substring(0, 200) || '',
                  embeds: msg.embeds?.length || 0,
                  timestamp: msg.timestamp,
                  url: `https://discord.com/channels/${guild.id}/${ch.id}/${msg.id}`,
                });
              }
            }
          } catch (e) {
            console.error(`Failed to search channel ${ch.name}:`, e.message);
          }
        }
      }
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return Response.json({
      success: true,
      query,
      filters: {
        channel: channel || 'all',
        severity: severity || 'all',
      },
      total_results: results.length,
      results: results.slice(0, limit),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});