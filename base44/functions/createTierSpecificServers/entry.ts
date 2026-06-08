import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { discord_server_id } = await req.json();
    if (!discord_server_id) {
      return Response.json({ error: 'discord_server_id required' }, { status: 400 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('discord');
    const tiers = [
      {
        name: 'Community',
        key: 'community',
        emoji: '🌍',
        description: 'Community Threat Intelligence',
        features: ['threat_actors', 'public_vulns'],
        maxThreatsDaily: 50
      },
      {
        name: 'Pro',
        key: 'pro',
        emoji: '⭐',
        description: 'Professional Threat Intelligence',
        features: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware'],
        maxThreatsDaily: 200
      },
      {
        name: 'Enterprise',
        key: 'enterprise',
        emoji: '👑',
        description: 'Enterprise Threat Intelligence & LEA Intel',
        features: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware', 'incidents', 'lea_intel'],
        maxThreatsDaily: 1000
      },
      {
        name: 'Gov/CI',
        key: 'gov',
        emoji: '🛡️',
        description: 'Government & Critical Infrastructure Intel',
        features: ['threat_actors', 'vulnerabilities', 'campaigns', 'malware', 'incidents', 'lea_intel', 'crit_infra'],
        maxThreatsDaily: 5000
      }
    ];

    const createdTiers = [];

    // Create tier categories
    for (const tier of tiers) {
      try {
        // Create tier category (channel group)
        const categoryRes = await fetch(
          `https://discord.com/api/v10/guilds/${discord_server_id}/channels`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: `${tier.emoji} ${tier.name} Tier`,
              type: 4, // Category type
              topic: tier.description
            })
          }
        );

        if (!categoryRes.ok) {
          throw new Error(`Failed to create category: ${categoryRes.statusText}`);
        }

        const category = await categoryRes.json();
        const channels = await createTierChannels(
          base44,
          discord_server_id,
          category.id,
          accessToken,
          tier,
          user.email
        );

        createdTiers.push({
          tier: tier.name,
          category_id: category.id,
          channels_created: channels.length,
          max_threats_daily: tier.maxThreatsDaily,
          features: tier.features
        });
      } catch (e) {
        console.error(`Error creating category for ${tier.name}:`, e);
      }
    }

    return Response.json({
      success: true,
      discord_server_id,
      tiers_created: createdTiers.length,
      tiers: createdTiers,
      message: 'Tier categories and channels created in your Discord server'
    });
  } catch (error) {
    console.error('Error creating tier channels:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function createTierChannels(base44, discordServerId, categoryId, accessToken, tier, createdBy) {
  const channelDefinitions = [
    {
      name: 'critical-alerts',
      emoji: '🚨',
      topic: 'Critical threats requiring immediate attention',
      requiredForTiers: ['community', 'pro', 'enterprise', 'gov']
    },
    {
      name: 'threat-actors',
      emoji: '👾',
      topic: 'Tracked threat actors and groups',
      requiredForTiers: ['community', 'pro', 'enterprise', 'gov']
    },
    {
      name: 'vulnerabilities',
      emoji: '🔓',
      topic: 'Vulnerability disclosures and exploits',
      requiredForTiers: ['pro', 'enterprise', 'gov']
    },
    {
      name: 'campaigns',
      emoji: '🎯',
      topic: 'Active threat campaigns',
      requiredForTiers: ['pro', 'enterprise', 'gov']
    },
    {
      name: 'malware',
      emoji: '🦠',
      topic: 'Malware families and analysis',
      requiredForTiers: ['pro', 'enterprise', 'gov']
    },
    {
      name: 'incidents',
      emoji: '⚠️',
      topic: 'Security incidents and breaches',
      requiredForTiers: ['enterprise', 'gov']
    },
    {
      name: 'lea-intel',
      emoji: '🛡️',
      topic: 'Law Enforcement & Government Intelligence',
      requiredForTiers: ['enterprise', 'gov']
    },
    {
      name: 'critical-infrastructure',
      emoji: '🏗️',
      topic: 'Critical infrastructure threats',
      requiredForTiers: ['gov']
    },
    {
      name: 'intel-reports',
      emoji: '📋',
      topic: 'Detailed threat intelligence reports',
      requiredForTiers: ['pro', 'enterprise', 'gov']
    }
  ];

  const created = [];

  for (const channelDef of channelDefinitions) {
    if (!channelDef.requiredForTiers.includes(tier.key)) {
      continue;
    }

    try {
      const channelRes = await fetch(
        `https://discord.com/api/v10/guilds/${discordServerId}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `${channelDef.emoji}-${channelDef.name}`,
            type: 0, // Text channel
            topic: channelDef.topic,
            parent_id: categoryId
          })
        }
      );

      if (channelRes.ok) {
        const channel = await channelRes.json();
        created.push(channelDef.name);
      }
    } catch (e) {
      console.error(`Error creating channel ${channelDef.name}:`, e);
    }
  }

  return created;
}