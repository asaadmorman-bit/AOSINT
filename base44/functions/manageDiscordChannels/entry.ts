import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, channel_name, channel_topic, guild_id } = body;

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');

    if (!guild_id) {
      return Response.json({ error: 'Guild ID required' }, { status: 400 });
    }

    if (action === 'create') {
      if (!channel_name) {
        return Response.json({ error: 'Channel name required' }, { status: 400 });
      }

      // Create channel with Discord API
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guild_id}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: channel_name.toLowerCase().replace(/\s+/g, '-'),
            type: 0, // Text channel
            topic: channel_topic || 'Organized threat intelligence alerts',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Discord API error: ${error}`);
      }

      const channelData = await response.json();
      return Response.json({
        status: 'created',
        channel_id: channelData.id,
        channel_name: channelData.name,
      });
    } else if (action === 'list') {
      // List all channels in guild
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guild_id}/channels`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to list Discord channels');
      }

      const channels = await response.json();
      return Response.json({
        status: 'success',
        channels: channels.filter(c => c.type === 0).map(c => ({
          id: c.id,
          name: c.name,
          topic: c.topic,
        })),
      });
    } else if (action === 'organize_alerts') {
      // Organize alerts into channels by category
      const { category } = body;

      const organizationMap = {
        severity: {
          critical: 'critical-threats',
          high: 'high-priority-alerts',
          medium: 'medium-alerts',
          low: 'low-priority-alerts',
        },
        type: {
          vulnerability: 'vulnerability-alerts',
          osint: 'osint-findings',
          campaign: 'campaign-intelligence',
          threat_actor: 'threat-actor-profiles',
          credential_leak: 'credential-leaks',
        },
        status: {
          new: 'new-alerts',
          acknowledged: 'acknowledged',
          resolved: 'resolved',
        },
      };

      const categoryChannels = organizationMap[category] || {};
      return Response.json({
        status: 'organization_map',
        category,
        channels: categoryChannels,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Discord channel management error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});