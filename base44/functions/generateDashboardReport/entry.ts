import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dashboardId, reportFormat = 'json' } = await req.json();

    // Fetch dashboard
    const dashboard = await base44.entities.CustomDashboard.list(undefined, 1).catch(() => [])
      .then(dashboards => dashboards.find(d => d.id === dashboardId));

    if (!dashboard) {
      return Response.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // Fetch associated watch lists
    const watchLists = [];
    for (const watchListId of dashboard.watch_list_ids || []) {
      try {
        const watchList = await base44.entities.WatchList.list(undefined, 1).catch(() => [])
          .then(lists => lists.find(w => w.id === watchListId));
        if (watchList) watchLists.push(watchList);
      } catch (error) {
        console.error('Error fetching watch list:', error);
      }
    }

    // Compile report data
    const reportData = {
      dashboard_name: dashboard.name,
      dashboard_description: dashboard.description,
      generated_date: new Date().toISOString(),
      watch_lists: watchLists.map(w => ({
        name: w.name,
        type: w.watch_list_type,
        item_count: (w.items || []).length,
        items: w.items || []
      })),
      summary: {
        total_watch_lists: watchLists.length,
        total_items: watchLists.reduce((sum, w) => sum + (w.items || []).length, 0),
        threat_levels: aggregateThreatLevels(watchLists),
        geographic_distribution: aggregateGeographic(watchLists)
      }
    };

    // Use LLM to generate narrative report
    const narrativeReport = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional threat intelligence report based on the following dashboard and watch list data:

${JSON.stringify(reportData, null, 2)}

Include:
1. Executive Summary: Key threats and trends
2. Watch List Analysis: Critical items requiring attention
3. Threat Assessment: Risk evaluation and recommendations
4. Geographic Analysis: Regional threat distribution
5. Actionable Intelligence: Specific recommendations for operators`,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          watch_list_analysis: { type: "string" },
          threat_assessment: { type: "string" },
          geographic_analysis: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    });

    const finalReport = {
      ...reportData,
      narrative: narrativeReport
    };

    return Response.json(finalReport);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function aggregateThreatLevels(watchLists) {
  const levels = {};
  watchLists.forEach(w => {
    w.items?.forEach(item => {
      const level = item.threat_level || 'unknown';
      levels[level] = (levels[level] || 0) + 1;
    });
  });
  return levels;
}

function aggregateGeographic(watchLists) {
  const regions = {};
  watchLists.forEach(w => {
    w.geographic_scope?.forEach(region => {
      regions[region] = (regions[region] || 0) + 1;
    });
  });
  return regions;
}