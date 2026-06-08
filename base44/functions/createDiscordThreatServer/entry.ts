import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, organization_id, organization_name, server_type, threat_focus, dashboard_ids } = await req.json();

    if (!name || !organization_id || !server_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get bot token from env
    const accessToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Create Discord server
    const serverData = {
      name: name,
      description: `Threat Intelligence Hub for ${organization_name || 'Organization'}`,
      icon: null
    };

    const discordRes = await fetch('https://discord.com/api/v10/guilds', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverData)
    });

    if (!discordRes.ok) {
      const error = await discordRes.text();
      console.error('Discord API error:', error);
      throw new Error(`Failed to create Discord server: ${discordRes.statusText}`);
    }

    const discordServer = await discordRes.json();

    // Create server record in ASOSINT
    const threatServer = await base44.entities.DiscordThreatServer.create({
      name: name,
      organization_id: organization_id,
      organization_name: organization_name,
      discord_server_id: discordServer.id,
      discord_invite_url: `https://discord.gg/${discordServer.id}`,
      server_type: server_type,
      threat_focus: threat_focus || [],
      dashboard_sync_enabled: true,
      dashboard_ids: dashboard_ids || [],
      created_by: user.email,
      is_active: true
    });

    // Create initial channels based on threat focus
    const channels = await createInitialChannels(base44, threatServer, threat_focus, accessToken, discordServer.id);

    return Response.json({
      success: true,
      server: threatServer,
      discord_server_id: discordServer.id,
      invite_url: `https://discord.gg/${discordServer.id}`,
      channels_created: channels.length,
      message: `Discord threat server '${name}' created successfully with ${channels.length} channels`
    });
  } catch (error) {
    console.error('Error creating Discord threat server:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createInitialChannels(base44, threatServer, threatFocus, accessToken, serverId) {
  const channels = [];
  const defaultChannels = [
    { name: 'threats-overview', type: 'threat_actor' },
    { name: 'critical-alerts', type: 'incident' },
    { name: 'intelligence-updates', type: 'custom' }
  ];

  const customChannels = (threatFocus || []).map(focus => ({
    name: focus.toLowerCase().replace(/_/g, '-'),
    type: focus
  }));

  const allChannels = [...defaultChannels, ...customChannels];

  for (const channelConfig of allChannels) {
    try {
      const discordRes = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: channelConfig.name,
          type: 0, // text channel
          topic: `Intelligence focused on ${channelConfig.type.replace(/_/g, ' ')}`
        })
      });

      if (discordRes.ok) {
        const discordChannel = await discordRes.json();
        const channel = await base44.entities.DiscordThreatChannel.create({
          server_id: threatServer.id,
          discord_server_id: serverId,
          discord_channel_id: discordChannel.id,
          channel_name: channelConfig.name,
          channel_type: channelConfig.type,
          created_by: threatServer.created_by
        });
        channels.push(channel);
      }
    } catch (err) {
      console.error(`Failed to create channel ${channelConfig.name}:`, err);
    }
  }

  // Update server with channel count
  await base44.entities.DiscordThreatServer.update(threatServer.id, {
    channel_count: channels.length
  });

  return channels;
}