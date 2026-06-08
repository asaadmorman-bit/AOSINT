import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    
    if (!botToken) {
      return Response.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Handle Discord ping
    if (body.type === 1) {
      return Response.json({ type: 1 });
    }

    // Handle commands and buttons
    if (body.type === 2) {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();

      if (!user) {
        return Response.json({ type: 4, data: { content: 'Unauthorized' } });
      }

      const command = body.data.name;
      const options = body.data.options || [];
      const guildId = body.guild_id;
      const channelId = body.channel_id;
      const userId = body.member.user.id;

      let response;

      if (command === 'enrich-threat') {
        const threatId = options.find(o => o.name === 'threat_id')?.value;
        response = await handleEnrichThreat(base44, threatId);
      } else if (command === 'search-threats') {
        const query = options.find(o => o.name === 'query')?.value;
        response = await handleSearchThreats(base44, query);
      } else if (command === 'correlate-threat') {
        const threatId = options.find(o => o.name === 'threat_id')?.value;
        response = await handleCorrelateThreat(base44, threatId);
      } else if (command === 'create-alert-rule') {
        const ruleName = options.find(o => o.name === 'rule_name')?.value;
        const channelId = options.find(o => o.name === 'target_channel')?.value;
        const threatActors = options.find(o => o.name === 'threat_actors')?.value?.split(',') || [];
        const sectors = options.find(o => o.name === 'sectors')?.value?.split(',') || [];
        const severities = options.find(o => o.name === 'severities')?.value?.split(',') || [];
        
        response = await handleCreateAlertRule(base44, {
          name: ruleName,
          target_channel_id: channelId,
          threat_actors: threatActors,
          sectors: sectors,
          severities: severities,
          guild_id: guildId,
          creator_id: userId
        });
      } else if (command === 'list-alert-rules') {
        response = await handleListAlertRules(base44, guildId);
      } else if (command === 'delete-alert-rule') {
        const ruleId = options.find(o => o.name === 'rule_id')?.value;
        response = await handleDeleteAlertRule(base44, ruleId, userId);
      } else {
        response = { content: 'Unknown command' };
      }

      return Response.json({ type: 4, data: response });
    }

    // Handle button interactions
    if (body.type === 3) {
      const customId = body.data.custom_id;
      const channelId = body.channel_id;
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();

      if (!user) {
        return Response.json({ type: 4, data: { content: 'Unauthorized' } });
      }

      let response;

      if (customId.startsWith('enrich_')) {
        const threatId = customId.replace('enrich_', '');
        response = await handleEnrichThreat(base44, threatId);
      } else if (customId.startsWith('search_')) {
        const threatId = customId.replace('search_', '');
        response = await handleSearchThreats(base44, threatId);
      } else if (customId.startsWith('manage_rule_')) {
        const ruleId = customId.replace('manage_rule_', '');
        response = await handleManageRule(base44, ruleId, user.id);
      }

      return Response.json({ type: 4, data: response });
    }

    return Response.json({ type: 4, data: { content: 'Unhandled interaction' } });
  } catch (error) {
    console.error('Error handling Discord interaction:', error);
    return Response.json({ type: 4, data: { content: `Error: ${error.message}` } });
  }
});

async function handleEnrichThreat(base44, threatId) {
  const osintAlerts = await base44.asServiceRole.entities.OsintAlert.filter(
    { id: threatId },
    null,
    1
  );

  if (osintAlerts.length > 0) {
    const threat = osintAlerts[0];
    return {
      embeds: [{
        title: '📊 Threat Enrichment - OSINT Alert',
        description: threat.description?.substring(0, 300) || 'No description',
        fields: [
          { name: 'Title', value: threat.title, inline: false },
          { name: 'Severity', value: threat.severity || 'unknown', inline: true },
          { name: 'Source', value: threat.source || 'N/A', inline: true },
          ...(threat.threat_actors?.length > 0 ? [{ name: 'Threat Actors', value: threat.threat_actors.slice(0, 3).join(', '), inline: false }] : []),
          ...(threat.indicators?.length > 0 ? [{ name: 'Indicators', value: threat.indicators.slice(0, 3).join(', '), inline: false }] : [])
        ],
        color: 3447003,
        timestamp: new Date().toISOString()
      }]
    };
  }

  const leaIntel = await base44.asServiceRole.entities.LEAIntelligence.filter(
    { id: threatId },
    null,
    1
  );

  if (leaIntel.length > 0) {
    const intel = leaIntel[0];
    return {
      embeds: [{
        title: '📊 Threat Enrichment - LEA Intelligence',
        description: intel.description?.substring(0, 300) || 'No description',
        fields: [
          { name: 'Title', value: intel.title, inline: false },
          { name: 'Threat Level', value: intel.threat_level || 'unknown', inline: true },
          { name: 'Source Agency', value: intel.source_agency || 'N/A', inline: true },
          ...(intel.known_activities?.length > 0 ? [{ name: 'Known Activities', value: intel.known_activities.slice(0, 3).join(', '), inline: false }] : [])
        ],
        color: 15105570,
        timestamp: new Date().toISOString()
      }]
    };
  }

  return { content: 'Threat not found' };
}

async function handleSearchThreats(base44, query) {
  const threats = await base44.asServiceRole.entities.OsintAlert.filter({}, '-created_date', 50);
  
  const filtered = threats.filter(t => {
    const searchStr = query.toLowerCase();
    return (
      t.title?.toLowerCase().includes(searchStr) ||
      t.description?.toLowerCase().includes(searchStr) ||
      t.threat_actors?.some(a => a.toLowerCase().includes(searchStr))
    );
  });

  const threatList = filtered.slice(0, 5).map(t => 
    `**${t.title}** (${t.severity})\n${t.threat_actors?.slice(0, 2).join(', ') || 'N/A'}`
  ).join('\n\n');

  return {
    embeds: [{
      title: '🔍 Related Threats Found',
      description: threatList || 'No threats found',
      fields: [
        { name: 'Total Results', value: filtered.length.toString(), inline: true },
        { name: 'Query', value: query, inline: true }
      ],
      color: 3447003,
      timestamp: new Date().toISOString()
    }]
  };
}

async function handleCorrelateThreat(base44, threatId) {
  const threats = await base44.asServiceRole.entities.OsintAlert.filter(
    { id: threatId },
    null,
    1
  );

  if (threats.length === 0) {
    return { content: 'Threat not found' };
  }

  const mainThreat = threats[0];
  const allThreats = await base44.asServiceRole.entities.OsintAlert.filter({}, null, 100);

  const correlations = allThreats
    .filter(t => t.id !== threatId)
    .map(t => {
      const sharedActors = (mainThreat.threat_actors || []).filter(a =>
        (t.threat_actors || []).includes(a)
      );
      const sharedSectors = (mainThreat.sectors || []).filter(s =>
        (t.sectors || []).includes(s)
      );
      return {
        threat: t,
        score: sharedActors.length + sharedSectors.length,
        actors: sharedActors,
        sectors: sharedSectors
      };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const correlationList = correlations.map(c =>
    `**${c.threat.title}** (Score: ${c.score})\nActors: ${c.actors.join(', ') || 'None'}`
  ).join('\n\n');

  return {
    embeds: [{
      title: '🔗 Threat Correlations',
      description: correlationList || 'No correlations found',
      fields: [
        { name: 'Primary Threat', value: mainThreat.title, inline: false },
        { name: 'Related Threats', value: correlations.length.toString(), inline: true }
      ],
      color: 15844367,
      timestamp: new Date().toISOString()
    }]
  };
}

async function handleCreateAlertRule(base44, ruleData) {
  const rule = await base44.asServiceRole.entities.AlertRule.create({
    name: ruleData.name,
    target_channel_id: ruleData.target_channel_id,
    guild_id: ruleData.guild_id,
    creator_id: ruleData.creator_id,
    rule_type: 'discord_alert',
    enabled: true,
    filters: JSON.stringify({
      threat_actors: ruleData.threat_actors,
      sectors: ruleData.sectors,
      severities: ruleData.severities
    })
  });

  return {
    embeds: [{
      title: '✅ Alert Rule Created',
      description: `Rule "${ruleData.name}" has been created and activated.`,
      fields: [
        { name: 'Target Channel', value: `<#${ruleData.target_channel_id}>`, inline: true },
        { name: 'Threat Actors', value: ruleData.threat_actors.join(', ') || 'Any', inline: true },
        { name: 'Sectors', value: ruleData.sectors.join(', ') || 'Any', inline: true },
        { name: 'Severities', value: ruleData.severities.join(', ') || 'Any', inline: true }
      ],
      color: 3066993,
      timestamp: new Date().toISOString()
    }]
  };
}

async function handleListAlertRules(base44, guildId) {
  const rules = await base44.asServiceRole.entities.AlertRule.filter(
    { guild_id: guildId, rule_type: 'discord_alert' },
    '-created_date',
    10
  );

  const ruleList = rules.map(r => {
    const filters = JSON.parse(r.filters || '{}');
    return `**${r.name}** (${r.enabled ? '✅' : '❌'})\nChannel: <#${r.target_channel_id}>\nFilters: ${Object.keys(filters).filter(k => filters[k]?.length > 0).join(', ') || 'None'}`;
  }).join('\n\n');

  return {
    embeds: [{
      title: '📋 Alert Rules',
      description: ruleList || 'No alert rules configured',
      fields: [
        { name: 'Total Rules', value: rules.length.toString(), inline: true }
      ],
      color: 3447003,
      timestamp: new Date().toISOString()
    }]
  };
}

async function handleDeleteAlertRule(base44, ruleId, userId) {
  const rules = await base44.asServiceRole.entities.AlertRule.filter(
    { id: ruleId },
    null,
    1
  );

  if (rules.length === 0) {
    return { content: 'Rule not found' };
  }

  const rule = rules[0];
  
  // Only allow creator or admins to delete
  if (rule.creator_id !== userId) {
    return { content: 'You can only delete your own alert rules' };
  }

  await base44.asServiceRole.entities.AlertRule.delete(ruleId);

  return {
    embeds: [{
      title: '✅ Alert Rule Deleted',
      description: `Rule "${rule.name}" has been deleted.`,
      color: 15158332,
      timestamp: new Date().toISOString()
    }]
  };
}

async function handleManageRule(base44, ruleId, userId) {
  const rules = await base44.asServiceRole.entities.AlertRule.filter(
    { id: ruleId },
    null,
    1
  );

  if (rules.length === 0) {
    return { content: 'Rule not found' };
  }

  const rule = rules[0];
  const filters = JSON.parse(rule.filters || '{}');

  return {
    embeds: [{
      title: `⚙️ Manage Rule: ${rule.name}`,
      description: 'Use the buttons below to toggle or modify this rule',
      fields: [
        { name: 'Status', value: rule.enabled ? '✅ Active' : '❌ Inactive', inline: true },
        { name: 'Target', value: `<#${rule.target_channel_id}>`, inline: true },
        { name: 'Threat Actors', value: filters.threat_actors?.join(', ') || 'Any', inline: false },
        { name: 'Sectors', value: filters.sectors?.join(', ') || 'Any', inline: false },
        { name: 'Severities', value: filters.severities?.join(', ') || 'Any', inline: false }
      ],
      color: 3447003
    }]
  };
}