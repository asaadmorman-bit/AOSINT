import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      command, // 'enrich', 'search', 'correlate'
      threat_id,
      channel_id,
      query
    } = await req.json();

    if (!command) {
      return Response.json({ error: 'command required' }, { status: 400 });
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) {
      return Response.json({ error: 'Discord bot token not configured' }, { status: 500 });
    }

    let result;

    if (command === 'enrich' && threat_id) {
      result = await enrichThreat(base44, threat_id);
    } else if (command === 'search' && (threat_id || query)) {
      result = await searchRelatedThreats(base44, threat_id || query);
    } else if (command === 'correlate' && threat_id) {
      result = await correlateThreats(base44, threat_id);
    } else {
      return Response.json({ error: 'Invalid command or missing parameters' }, { status: 400 });
    }

    // Send results back to Discord
    if (channel_id) {
      const embed = formatResultEmbed(command, result);
      await fetch(
        `https://discord.com/api/v10/channels/${channel_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [embed] })
        }
      );
    }

    return Response.json({
      success: true,
      command,
      result
    });
  } catch (error) {
    console.error('Error handling Discord command:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function enrichThreat(base44, threatId) {
  const osintAlerts = await base44.asServiceRole.entities.OsintAlert.filter(
    { id: threatId },
    null,
    1
  );

  if (osintAlerts.length > 0) {
    const threat = osintAlerts[0];
    return {
      type: 'osint_enrichment',
      title: threat.title,
      summary: threat.summary,
      threat_actors: threat.threat_actors || [],
      sectors: threat.sectors || [],
      indicators: threat.indicators || [],
      severity: threat.severity,
      source: threat.source,
      published_date: threat.published_date
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
      type: 'lea_enrichment',
      title: intel.title,
      description: intel.description,
      threat_level: intel.threat_level,
      source_agency: intel.source_agency,
      known_activities: intel.known_activities || [],
      geographic_focus: intel.geographic_focus || [],
      aliases: intel.aliases || []
    };
  }

  return { error: 'Threat not found' };
}

async function searchRelatedThreats(base44, threatIdOrQuery) {
  const threats = await base44.asServiceRole.entities.OsintAlert.filter({}, '-created_date', 50);
  
  const filtered = threats.filter(t => {
    const searchStr = typeof threatIdOrQuery === 'string' ? threatIdOrQuery.toLowerCase() : '';
    return (
      (t.title?.toLowerCase().includes(searchStr)) ||
      (t.description?.toLowerCase().includes(searchStr)) ||
      (t.threat_actors?.some(a => a.toLowerCase().includes(searchStr)))
    );
  });

  return {
    query: threatIdOrQuery,
    count: filtered.length,
    threats: filtered.slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      severity: t.severity,
      threat_actors: t.threat_actors || []
    }))
  };
}

async function correlateThreats(base44, threatId) {
  const threat = await base44.asServiceRole.entities.OsintAlert.filter(
    { id: threatId },
    null,
    1
  );

  if (threat.length === 0) {
    return { error: 'Threat not found' };
  }

  const mainThreat = threat[0];
  const allThreats = await base44.asServiceRole.entities.OsintAlert.filter({}, null, 100);

  const correlations = [];

  // Find threats with shared threat actors
  for (const t of allThreats) {
    if (t.id === threatId) continue;

    const commonActors = (mainThreat.threat_actors || []).filter(a =>
      (t.threat_actors || []).includes(a)
    );

    const commonSectors = (mainThreat.sectors || []).filter(s =>
      (t.sectors || []).includes(s)
    );

    if (commonActors.length > 0 || commonSectors.length > 0) {
      correlations.push({
        id: t.id,
        title: t.title,
        shared_actors: commonActors,
        shared_sectors: commonSectors,
        correlation_strength: commonActors.length + commonSectors.length
      });
    }
  }

  return {
    primary_threat: mainThreat.title,
    correlated_threats: correlations.slice(0, 5),
    total_correlations: correlations.length
  };
}

function formatResultEmbed(command, result) {
  const titles = {
    enrich: '📊 Threat Enrichment',
    search: '🔍 Related Threats Found',
    correlate: '🔗 Threat Correlations'
  };

  const fields = [];

  if (command === 'enrich') {
    fields.push(
      {
        name: 'Title',
        value: result.title || 'N/A',
        inline: false
      },
      {
        name: 'Severity/Level',
        value: result.severity || result.threat_level || 'Unknown',
        inline: true
      }
    );

    if (result.threat_actors?.length > 0) {
      fields.push({
        name: 'Threat Actors',
        value: result.threat_actors.join(', '),
        inline: true
      });
    }
  } else if (command === 'search') {
    fields.push({
      name: 'Results',
      value: `Found ${result.count} threats matching: ${result.query}`,
      inline: false
    });

    result.threats?.slice(0, 3).forEach((t, i) => {
      fields.push({
        name: `${i + 1}. ${t.title}`,
        value: `Severity: ${t.severity}`,
        inline: false
      });
    });
  } else if (command === 'correlate') {
    fields.push({
      name: 'Primary Threat',
      value: result.primary_threat,
      inline: false
    });

    fields.push({
      name: 'Correlations Found',
      value: `${result.total_correlations} threats correlate with this threat`,
      inline: true
    });
  }

  return {
    title: titles[command] || 'Analysis Result',
    fields,
    color: 5793266,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'ASOSINT Discord Intelligence Command'
    }
  };
}