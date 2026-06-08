import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId, dealData } = await req.json();

    if (!dealId || !dealData) {
      return Response.json({ error: 'Missing required deal data' }, { status: 400 });
    }

    // Fetch historical deal performance data
    const allDeals = await base44.entities.HubSpotThreatDeal.list('-last_activity', 100).catch(() => []);
    const historicalWinRate = calculateHistoricalWinRate(allDeals, dealData);

    // Build comprehensive prompt for forecasting
    const forecastPrompt = buildForecastPrompt(dealData, allDeals, historicalWinRate);

    // Use LLM to generate forecast
    const forecast = await base44.integrations.Core.InvokeLLM({
      prompt: forecastPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          win_probability: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Win likelihood percentage'
          },
          estimated_value: {
            type: 'number',
            description: 'Estimated deal value'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Forecast confidence'
          },
          analysis: {
            type: 'string',
            description: 'Detailed forecast analysis'
          },
          trend: {
            type: 'string',
            enum: ['improving', 'declining', 'stable'],
            description: 'Deal trend'
          },
          key_factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factor: { type: 'string' },
                impact: { type: 'string' },
                weight: { type: 'number' }
              }
            },
            description: 'Key influencing factors'
          },
          recommended_actions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Recommended actions'
          }
        }
      }
    });

    // Store forecast in database
    const forecastRecord = await base44.entities.DealForecast.create({
      deal_id: dealId,
      hubspot_deal_id: dealData.hubspot_deal_id,
      win_probability: forecast.win_probability,
      estimated_value: forecast.estimated_value,
      confidence_level: forecast.confidence,
      forecast_analysis: forecast.analysis,
      key_factors: forecast.key_factors,
      trend: forecast.trend,
      recommended_actions: forecast.recommended_actions,
      forecast_date: new Date().toISOString(),
      tags: ['auto_forecast']
    });

    return Response.json({
      success: true,
      forecast: {
        win_probability: forecast.win_probability,
        estimated_value: forecast.estimated_value,
        confidence: forecast.confidence,
        trend: forecast.trend
      },
      forecast_id: forecastRecord.id
    });
  } catch (error) {
    console.error('Error forecasting deal outcome:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateHistoricalWinRate(allDeals, currentDeal) {
  // Filter deals by similar threat severity
  const similarDeals = allDeals.filter(
    d => d.threat_severity === currentDeal.threat_severity
  );

  if (similarDeals.length === 0) {
    // Return overall win rate if no similar deals
    const won = allDeals.filter(d => d.deal_stage === 'won').length;
    return allDeals.length > 0 ? Math.round((won / allDeals.length) * 100) : 50;
  }

  const won = similarDeals.filter(d => d.deal_stage === 'won').length;
  return Math.round((won / similarDeals.length) * 100);
}

function buildForecastPrompt(dealData, historicalDeals, baselineWinRate) {
  const recentDeals = historicalDeals.slice(0, 10);
  const avgDealValue = historicalDeals.length > 0
    ? historicalDeals.reduce((sum, d) => sum + (d.deal_amount || 0), 0) / historicalDeals.length
    : dealData.deal_amount;

  return `You are an expert sales forecast analyst specializing in threat intelligence deal prediction.

CURRENT DEAL DETAILS:
Name: ${dealData.deal_name}
Threat Title: ${dealData.threat_title}
Threat Severity: ${dealData.threat_severity}
Deal Stage: ${dealData.deal_stage}
Deal Amount: $${dealData.deal_amount?.toLocaleString() || 'Unknown'}
Associated Company: ${dealData.associated_contact_company || 'Unknown'}
Last Activity: ${dealData.last_activity ? new Date(dealData.last_activity).toLocaleDateString() : 'Never'}
Days in Current Stage: ${calculateDaysInStage(dealData.last_activity)}

HISTORICAL CONTEXT:
- Baseline win rate for similar threats: ${baselineWinRate}%
- Average deal value: $${Math.round(avgDealValue).toLocaleString()}
- Total historical deals: ${historicalDeals.length}

DEAL STAGE ANALYSIS:
${mapStageToProbability(dealData.deal_stage)}

THREAT SEVERITY FACTORS:
${mapSeverityToValue(dealData.threat_severity)}

MARKET & TREND ANALYSIS:
- Critical threats have 65-75% close rates (high urgency = faster decisions)
- High threats average 50-60% close rates
- Medium threats average 35-45% close rates
- Active pursuit (recent activity) increases win probability by 15-25%

FORECAST REQUIREMENTS:
1. Generate win probability (0-100%) accounting for deal stage, severity, and activity
2. Estimate deal value based on threat severity and historical data
3. Rate confidence in the forecast
4. Identify key factors influencing the prediction
5. Assess trend (improving/declining/stable) based on recent activity
6. Recommend specific actions to improve win likelihood

Provide a comprehensive JSON forecast that accounts for:
- Deal progression through HubSpot stages
- Threat severity impact on customer urgency
- Time-based factors (deal aging, recent activity)
- Historical performance of similar deals`;
}

function calculateDaysInStage(lastActivity) {
  if (!lastActivity) return 999;
  const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

function mapStageToProbability(stage) {
  const stageMaps = {
    negotiation: 'Stage: Early negotiation phase - typically 20-35% conversion',
    presentation_scheduled: 'Stage: Presentation scheduled - momentum present, 35-50% conversion',
    qualified_to_buy: 'Stage: Qualified buyer confirmed - strong signal, 55-70% conversion',
    decision_pending: 'Stage: Final decision phase - high probability, 70-85% conversion',
    won: 'Stage: Won - deal closed',
    lost: 'Stage: Lost - deal closed'
  };
  return stageMaps[stage] || 'Unknown stage';
}

function mapSeverityToValue(severity) {
  const severityMaps = {
    critical: 'Critical threats drive immediate customer action and justify higher deal values ($40K-$75K range)',
    high: 'High threats create urgency and justify mid-range values ($25K-$50K range)',
    medium: 'Medium threats show steady interest, typical values ($15K-$35K range)',
    low: 'Low threats have longer sales cycles, lower values ($5K-$20K range)'
  };
  return severityMaps[severity] || 'Unknown severity';
}