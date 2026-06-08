import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const COMMANDS = [
  {
    name: 'enrich-threat',
    description: 'Get detailed enrichment for a threat',
    options: [
      {
        name: 'threat_id',
        description: 'The threat ID to enrich',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'search-threats',
    description: 'Search for related threats',
    options: [
      {
        name: 'query',
        description: 'Search query',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'correlate-threat',
    description: 'Find correlated threats',
    options: [
      {
        name: 'threat_id',
        description: 'The threat ID to correlate',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'create-alert-rule',
    description: 'Create a new alert rule',
    options: [
      { name: 'rule_name', description: 'Rule name', type: 3, required: true },
      { name: 'target_channel', description: 'Target channel ID', type: 3, required: true },
      { name: 'threat_actors', description: 'Threat actors (comma-separated)', type: 3 },
      { name: 'sectors', description: 'Sectors (comma-separated)', type: 3 },
      { name: 'severities', description: 'Severities (comma-separated)', type: 3 }
    ]
  },
  {
    name: 'list-alert-rules',
    description: 'List all active alert rules'
  },
  {
    name: 'delete-alert-rule',
    description: 'Delete an alert rule',
    options: [
      {
        name: 'rule_id',
        description: 'The rule ID to delete',
        type: 3,
        required: true
      }
    ]
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
    }

    const { clientId, guildId } = await req.json();

    if (!clientId || !guildId) {
      return new Response(JSON.stringify({ error: 'clientId and guildId are required' }), { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return new Response(JSON.stringify({ error: 'Discord bot token not configured' }), { status: 400 });
    }

    const url = `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(COMMANDS),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ 
        error: 'Failed to register commands',
        details: error,
        status: response.status
      }), { status: response.status });
    }

    const result = await response.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Discord commands registered successfully',
      commands_registered: result.length || COMMANDS.length,
      commands: result
    }), { status: 200 });

  } catch (error) {
    console.error('[registerDiscordCommands] Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), { status: 500 });
  }
});