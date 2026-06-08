import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Ensure a Discord channel exists (find or create), return channel id
async function ensureChannel(guildId, channelName, botToken) {
  // Fetch existing channels
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch channels: ${res.status}`);
  const channels = await res.json();
  const textChannels = channels.filter(c => c.type === 0);

  // Try to find existing
  const existing = textChannels.find(c =>
    c.name.toLowerCase() === channelName.toLowerCase().replace(/\s+/g, '-')
  );
  if (existing) return { id: existing.id, created: false };

  // Create new channel
  const createRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: channelName.toLowerCase().replace(/\s+/g, '-'),
      type: 0,
      topic: `ASOSINT threat intelligence — ${channelName}`,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create channel "${channelName}": ${createRes.status} — ${err}`);
  }
  const created = await createRes.json();
  return { id: created.id, created: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, mapping } = body;

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'DISCORD_BOT_TOKEN not configured' }, { status: 400 });

    // action: "save" — upsert a channel mapping and optionally create the channel
    if (action === 'save') {
      if (!mapping?.server_id || !mapping?.discord_server_id || !mapping?.data_type || !mapping?.channel_name) {
        return Response.json({ error: 'Missing required fields: server_id, discord_server_id, data_type, channel_name' }, { status: 400 });
      }

      let channelId = mapping.channel_id || null;
      let channelCreated = false;

      if (mapping.auto_create !== false) {
        const result = await ensureChannel(mapping.discord_server_id, mapping.channel_name, botToken);
        channelId = result.id;
        channelCreated = result.created;
      }

      // Check if mapping already exists for this server + data_type
      const existing = await base44.asServiceRole.entities.DiscordChannelMapping.filter({
        server_id: mapping.server_id,
        data_type: mapping.data_type,
      });

      let saved;
      if (existing && existing.length > 0) {
        saved = await base44.asServiceRole.entities.DiscordChannelMapping.update(existing[0].id, {
          ...mapping,
          channel_id: channelId,
        });
      } else {
        saved = await base44.asServiceRole.entities.DiscordChannelMapping.create({
          ...mapping,
          channel_id: channelId,
        });
      }

      return Response.json({ success: true, mapping: saved, channel_created: channelCreated, channel_id: channelId });
    }

    // action: "list" — list all mappings for a given server_id
    if (action === 'list') {
      const { server_id } = body;
      if (!server_id) return Response.json({ error: 'server_id required' }, { status: 400 });
      const mappings = await base44.asServiceRole.entities.DiscordChannelMapping.filter({ server_id });
      return Response.json({ success: true, mappings });
    }

    // action: "delete" — delete a mapping by id
    if (action === 'delete') {
      const { mapping_id } = body;
      if (!mapping_id) return Response.json({ error: 'mapping_id required' }, { status: 400 });
      await base44.asServiceRole.entities.DiscordChannelMapping.delete(mapping_id);
      return Response.json({ success: true });
    }

    // action: "sync_channels" — fetch live Discord channels for a guild
    if (action === 'sync_channels') {
      const { discord_server_id } = body;
      if (!discord_server_id) return Response.json({ error: 'discord_server_id required' }, { status: 400 });
      const res = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}/channels`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!res.ok) return Response.json({ error: `Discord API error: ${res.status}` }, { status: 502 });
      const all = await res.json();
      const textChannels = all.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }));
      return Response.json({ success: true, channels: textChannels });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});