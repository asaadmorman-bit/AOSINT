import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      server_name,
      server_type,
      organization_name,
      threat_focus,
      description,
      discord_server_id  // User provides their existing Discord server ID
    } = await req.json();

    if (!server_name || !server_type) {
      return Response.json({ error: 'server_name and server_type required' }, { status: 400 });
    }

    if (!discord_server_id) {
      return Response.json({ error: 'discord_server_id is required. Please provide your existing Discord server ID.' }, { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    // Verify the bot has access to this server
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });

    if (!guildRes.ok) {
      const err = await guildRes.text();
      return Response.json({ 
        error: `Cannot access Discord server ${discord_server_id}. Make sure the bot is invited to your server first. (${guildRes.status}: ${err})` 
      }, { status: 400 });
    }

    const guildData = await guildRes.json();

    // Create server record in database
    const serverRecord = await base44.asServiceRole.entities.DiscordThreatServer.create({
      name: server_name || guildData.name,
      description: description || `${server_type} threat intelligence server`,
      organization_id: user.id,
      discord_server_id: discord_server_id,
      discord_invite_url: `https://discord.com/channels/${discord_server_id}`,
      server_type,
      organization_name: organization_name || user.email,
      threat_focus: threat_focus || [],
      dashboard_sync_enabled: true,
      created_by: user.email
    });

    // Create base channels in the existing Discord server
    const baseChannels = await createBaseChannels(
      base44,
      discord_server_id,
      botToken,
      serverRecord.id,
      server_type
    );

    return Response.json({
      success: true,
      server_id: serverRecord.id,
      discord_server_id: discord_server_id,
      server_name: server_name,
      guild_name: guildData.name,
      channels_created: baseChannels.length,
      channels: baseChannels,
      message: `Discord server configured with ${baseChannels.length} threat intelligence channels`
    });

  } catch (error) {
    console.error('Error configuring Discord server:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createBaseChannels(base44, discordServerId, botToken, serverRecordId, serverType) {
  const baseChannels = [
    { name: 'threat-general', type: 0, topic: 'General threat intelligence discussion' },
    { name: 'threat-alerts', type: 0, topic: 'Critical threat alerts - high and critical severity' },
    { name: 'intel-resources', type: 0, topic: 'Intelligence resources and reports' }
  ];

  const typeChannels = {
    organization: [
      { name: 'threat-actors', topic: 'Threat actors targeting this organization' },
      { name: 'vulnerabilities', topic: 'Relevant vulnerabilities and exploits' },
      { name: 'campaigns', topic: 'Active campaigns' }
    ],
    sector: [
      { name: 'sector-trends', topic: 'Industry-specific threats' },
      { name: 'threat-actors', topic: 'Threat actors targeting this sector' },
      { name: 'compliance-alerts', topic: 'Regulatory and compliance alerts' }
    ],
    geographic: [
      { name: 'regional-actors', topic: 'Threat actors in this region' },
      { name: 'geopolitical', topic: 'Geopolitical threat context' },
      { name: 'regional-vulns', topic: 'Regional vulnerabilities' }
    ],
    threat_actor: [
      { name: 'actor-activity', topic: 'Latest actor activity and TTPs' },
      { name: 'ioc-indicators', topic: 'IOCs and indicators of compromise' },
      { name: 'known-targets', topic: 'Known and potential targets' }
    ]
  };

  const allChannels = [
    ...baseChannels,
    ...(typeChannels[serverType] || []).map(ch => ({ ...ch, type: 0 }))
  ];

  const created = [];

  for (const channel of allChannels) {
    try {
      const channelRes = await fetch(
        `https://discord.com/api/v10/guilds/${discordServerId}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: channel.name,
            type: channel.type || 0,
            topic: channel.topic
          })
        }
      );

      if (channelRes.ok) {
        const ch = await channelRes.json();
        await base44.asServiceRole.entities.DiscordThreatChannel.create({
          server_id: serverRecordId,
          discord_server_id: discordServerId,
          discord_channel_id: ch.id,
          channel_name: channel.name,
          channel_type: 'custom',
          threat_name: channel.name,
          is_custom: false
        });
        created.push(channel.name);
      } else {
        const errText = await channelRes.text();
        console.warn(`Failed to create channel ${channel.name}: ${errText}`);
      }
    } catch (e) {
      console.error(`Error creating channel ${channel.name}:`, e);
    }
  }

  return created;
}