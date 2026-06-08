import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parent_server_id, organizations } = await req.json();

    if (!parent_server_id || !organizations || organizations.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parentServer = await base44.entities.DiscordThreatServer.get(parent_server_id);
    if (!parentServer) {
      return Response.json({ error: 'Parent server not found' }, { status: 404 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');
    const createdServers = [];

    for (const org of organizations) {
      try {
        // Create Discord server
        const discordRes = await fetch('https://discord.com/api/v10/guilds', {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `🏢 ${org.name} - Threat Intel`,
            icon: null,
            region: 'us-east'
          })
        });

        if (!discordRes.ok) {
          throw new Error(`Failed to create Discord server: ${discordRes.statusText}`);
        }

        const discordServer = await discordRes.json();

        // Create sub-server record
        const subServer = await base44.entities.DiscordThreatServer.create({
          name: `${org.name} - Threat Intelligence`,
          description: `Threat intelligence organized for ${org.name} (${org.type})`,
          organization_id: org.id,
          discord_server_id: discordServer.id,
          discord_invite_url: `https://discord.gg/${discordServer.id}`,
          server_type: `${org.type}_threat_intel`,
          organization_name: org.name,
          threat_focus: org.threat_focus || ['threat_actors', 'vulnerabilities', 'campaigns'],
          dashboard_sync_enabled: true,
          created_by: user.email
        });

        // Create severity-based channels
        const severityChannels = await createSeverityChannels(
          base44,
          discordServer.id,
          accessToken,
          subServer.id
        );

        // Create organization-specific category channels
        const categoryChannels = await createCategoryChannels(
          base44,
          discordServer.id,
          accessToken,
          subServer.id,
          org
        );

        createdServers.push({
          organization: org.name,
          discord_server_id: discordServer.id,
          severity_channels: severityChannels.length,
          category_channels: categoryChannels.length,
          invite_url: `https://discord.gg/${discordServer.id}`
        });
      } catch (e) {
        console.error(`Error creating server for ${org.name}:`, e);
      }
    }

    return Response.json({
      success: true,
      parent_server: parentServer.name,
      org_sub_servers_created: createdServers.length,
      servers: createdServers
    });
  } catch (error) {
    console.error('Error creating organization sub-servers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createSeverityChannels(base44, discordServerId, accessToken, subServerId) {
  const severities = [
    { name: 'critical-threats', color: 15158332, topic: '🔴 Critical threats requiring immediate action' },
    { name: 'high-priority', color: 15105570, topic: '🟠 High priority threats' },
    { name: 'medium-threats', color: 15844367, topic: '🟡 Medium priority threats' },
    { name: 'low-threats', color: 3447003, topic: '🟢 Low priority threats' }
  ];

  const created = [];

  for (const severity of severities) {
    try {
      const channelRes = await fetch(`https://discord.com/api/v10/guilds/${discordServerId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: severity.name,
          type: 0,
          topic: severity.topic
        })
      });

      if (channelRes.ok) {
        const channel = await channelRes.json();
        await base44.entities.DiscordThreatChannel.create({
          server_id: subServerId,
          discord_server_id: discordServerId,
          discord_channel_id: channel.id,
          channel_name: severity.name,
          channel_type: 'custom',
          threat_name: `${severity.name} threats`,
          severity_level: severity.name.replace('-threats', '').replace('-priority', ''),
          is_custom: false
        });
        created.push(severity.name);
      }
    } catch (e) {
      console.error(`Error creating severity channel ${severity.name}:`, e);
    }
  }

  return created;
}

async function createCategoryChannels(base44, discordServerId, accessToken, subServerId, org) {
  const categories = [
    { name: 'threat-actors', emoji: '👾', topic: 'Tracked threat actors and campaigns' },
    { name: 'vulnerabilities', emoji: '🔓', topic: 'Known vulnerabilities and exploits' },
    { name: 'incidents', emoji: '⚠️', topic: 'Recent security incidents and breaches' },
    { name: 'malware', emoji: '🦠', topic: 'Malware families and IOCs' },
    { name: 'intel-reports', emoji: '📋', topic: 'Threat intelligence reports and analysis' }
  ];

  const created = [];

  for (const category of categories) {
    try {
      const channelRes = await fetch(`https://discord.com/api/v10/guilds/${discordServerId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${category.emoji}-${category.name}`,
          type: 0,
          topic: category.topic
        })
      });

      if (channelRes.ok) {
        const channel = await channelRes.json();
        await base44.entities.DiscordThreatChannel.create({
          server_id: subServerId,
          discord_server_id: discordServerId,
          discord_channel_id: channel.id,
          channel_name: `${category.emoji}-${category.name}`,
          channel_type: category.name,
          threat_name: category.name,
          is_custom: false
        });
        created.push(`${category.emoji}-${category.name}`);
      }
    } catch (e) {
      console.error(`Error creating category channel ${category.name}:`, e);
    }
  }

  return created;
}