import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { action } = body;

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { discord_server_id, channel_name, topic, category, is_private, allowed_user_ids, preferences } = body;

      if (!discord_server_id || !channel_name) {
        return Response.json({ error: 'discord_server_id and channel_name are required' }, { status: 400 });
      }

      // Sanitize channel name for Discord (lowercase, hyphens, max 100 chars)
      const sanitizedName = channel_name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 100);

      // If private, create a role first to restrict access
      let privateRoleId = null;
      if (is_private) {
        // Get guild roles to check bot permissions
        const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}`, {
          headers: { 'Authorization': `Bot ${botToken}` }
        });
        if (!guildRes.ok) {
          return Response.json({ error: 'Cannot access Discord server. Ensure the bot is a member.' }, { status: 400 });
        }

        // Create a private role for this channel
        const roleRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}/roles`, {
          method: 'POST',
          headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `community-${sanitizedName}`, mentionable: false, permissions: '0' })
        });
        if (roleRes.ok) {
          const role = await roleRes.json();
          privateRoleId = role.id;
        }
      }

      // Build permission overwrites for private channels
      const permissionOverwrites = [];
      if (is_private && privateRoleId) {
        // Deny @everyone, allow the private role
        permissionOverwrites.push({
          id: discord_server_id, // @everyone role has same ID as guild
          type: 0,
          deny: '1024', // VIEW_CHANNEL
        });
        permissionOverwrites.push({
          id: privateRoleId,
          type: 0,
          allow: '1024', // VIEW_CHANNEL
        });
      }

      // Create the Discord channel
      const channelPayload = {
        name: sanitizedName,
        type: 0,
        topic: topic || `Community channel created by ${user.full_name || user.email} · Focus: ${preferences?.join(', ') || 'general'}`,
        ...(permissionOverwrites.length ? { permission_overwrites: permissionOverwrites } : {}),
      };

      const channelRes = await fetch(
        `https://discord.com/api/v10/guilds/${discord_server_id}/channels`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(channelPayload),
        }
      );

      if (!channelRes.ok) {
        const err = await channelRes.text();
        return Response.json({ error: `Failed to create Discord channel: ${err}` }, { status: 400 });
      }

      const discordChannel = await channelRes.json();

      // Send a welcome message to the new channel
      const welcomeMsg = [
        `👋 **Welcome to #${sanitizedName}!**`,
        '',
        topic ? `📌 **Purpose:** ${topic}` : '',
        preferences?.length ? `🎯 **Focus Areas:** ${preferences.join(' · ')}` : '',
        `👤 **Created by:** ${user.full_name || user.email}`,
        is_private ? '\n🔒 This is a **private community channel** — access is restricted to invited members.' : '\n🌐 This is an **open community channel** — all server members can join.',
        '',
        '_Powered by ASOSINT Community Hub · Emerging Defense Solutions_',
      ].filter(Boolean).join('\n');

      await fetch(`https://discord.com/api/v10/channels/${discordChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: welcomeMsg }),
      });

      // Assign private role to allowed users if provided
      const assignedUsers = [];
      if (is_private && privateRoleId && allowed_user_ids?.length) {
        for (const discordUserId of allowed_user_ids) {
          const assignRes = await fetch(
            `https://discord.com/api/v10/guilds/${discord_server_id}/members/${discordUserId}/roles/${privateRoleId}`,
            { method: 'PUT', headers: { 'Authorization': `Bot ${botToken}` } }
          );
          if (assignRes.ok || assignRes.status === 204) assignedUsers.push(discordUserId);
        }
      }

      // Save to DB
      const record = await base44.asServiceRole.entities.DiscordThreatChannel.create({
        server_id: body.server_record_id || discord_server_id,
        discord_server_id,
        discord_channel_id: discordChannel.id,
        channel_name: sanitizedName,
        channel_type: 'community',
        threat_name: channel_name,
        is_custom: true,
      });

      return Response.json({
        success: true,
        channel_id: discordChannel.id,
        channel_name: sanitizedName,
        is_private,
        private_role_id: privateRoleId,
        assigned_users: assignedUsers,
        db_record_id: record.id,
        discord_url: `https://discord.com/channels/${discord_server_id}/${discordChannel.id}`,
      });
    }

    // ── INVITE USER ─────────────────────────────────────────────────────────
    if (action === 'invite_user') {
      const { discord_server_id, discord_user_id, private_role_id } = body;
      if (!discord_server_id || !discord_user_id || !private_role_id) {
        return Response.json({ error: 'discord_server_id, discord_user_id, and private_role_id are required' }, { status: 400 });
      }

      const res = await fetch(
        `https://discord.com/api/v10/guilds/${discord_server_id}/members/${discord_user_id}/roles/${private_role_id}`,
        { method: 'PUT', headers: { 'Authorization': `Bot ${botToken}` } }
      );

      if (res.ok || res.status === 204) {
        return Response.json({ success: true, message: `User ${discord_user_id} granted access` });
      }
      const err = await res.text();
      return Response.json({ error: `Failed to assign role: ${err}` }, { status: 400 });
    }

    // ── DELETE CHANNEL ──────────────────────────────────────────────────────
    if (action === 'delete') {
      const { discord_channel_id } = body;
      if (!discord_channel_id) {
        return Response.json({ error: 'discord_channel_id is required' }, { status: 400 });
      }

      const res = await fetch(`https://discord.com/api/v10/channels/${discord_channel_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bot ${botToken}` }
      });

      return Response.json({ success: res.ok || res.status === 200, status: res.status });
    }

    return Response.json({ error: 'Unknown action. Use: create, invite_user, delete' }, { status: 400 });

  } catch (error) {
    console.error('manageCommunityChannel error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});