import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { BigQuery } from 'npm:@google-cloud/bigquery@7.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token for BigQuery
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlebigquery');

    // Initialize BigQuery client with the access token
    const bigquery = new BigQuery({
      projectId: 'asosint-intelligence', // Replace with your BigQuery project ID
      authClient: {
        getAccessToken: async () => ({ token: accessToken }),
      },
    });

    // Query threat intelligence data by region
    const query = `
      SELECT
        region,
        COUNT(*) as threat_count,
        AVG(severity_score) as avg_severity,
        MAX(severity_score) as max_severity,
        COUNT(DISTINCT threat_actor) as unique_actors,
        COUNT(DISTINCT indicator_type) as indicator_types,
        ARRAY_AGG(DISTINCT indicator_type LIMIT 5) as top_indicators,
        ARRAY_AGG(DISTINCT threat_actor LIMIT 3) as top_actors,
        MAX(last_seen) as latest_activity
      FROM
        \`asosint-intelligence.threat_intel.indicators\`
      WHERE
        last_seen >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      GROUP BY
        region
      ORDER BY
        threat_count DESC
    `;

    const options = {
      query: query,
      location: 'US',
    };

    const [rows] = await bigquery.query(options);

    // Transform data for frontend consumption
    const regionalData = rows.map(row => ({
      region: row.region || 'Unknown',
      threatCount: parseInt(row.threat_count) || 0,
      avgSeverity: parseFloat(row.avg_severity?.toFixed(2)) || 0,
      maxSeverity: parseInt(row.max_severity) || 0,
      uniqueActors: parseInt(row.unique_actors) || 0,
      indicatorTypes: parseInt(row.indicator_types) || 0,
      topIndicators: row.top_indicators || [],
      topActors: row.top_actors || [],
      latestActivity: row.latest_activity ? new Date(row.latest_activity).toISOString() : null,
    }));

    // Calculate aggregate metrics
    const totalThreats = regionalData.reduce((sum, r) => sum + r.threatCount, 0);
    const avgSeverityOverall = (regionalData.reduce((sum, r) => sum + r.avgSeverity, 0) / regionalData.length).toFixed(2);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      queryUser: user.email,
      aggregates: {
        totalRegions: regionalData.length,
        totalThreats,
        avgSeverityOverall: parseFloat(avgSeverityOverall),
        highestRiskRegion: regionalData[0]?.region,
      },
      data: regionalData,
    });
  } catch (error) {
    console.error('BigQuery threat intel query error:', error);
    return Response.json(
      { error: error.message || 'Failed to query threat intelligence data' },
      { status: 500 }
    );
  }
});