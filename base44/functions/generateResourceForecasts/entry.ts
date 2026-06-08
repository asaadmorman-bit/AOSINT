import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all resource pools
    const resourcePools = await base44.entities.QuantumResourcePool.list();
    const costHistories = await base44.asServiceRole.entities.CostHistoryRecord.list('-timestamp', 2000);
    
    const forecasts = [];
    const now = new Date();

    for (const pool of resourcePools) {
      const poolHistory = costHistories.filter(c => c.resource_pool_id === pool.id);
      
      if (poolHistory.length < 7) continue; // Need at least 7 data points

      // Sort by timestamp ascending
      poolHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Generate forecasts for multiple periods
      for (const period of ['24h', '7d', '30d']) {
        // 1. COST FORECAST
        const costForecast = generateForecast(
          poolHistory,
          'cost',
          period,
          pool.id,
          now
        );
        if (costForecast) forecasts.push(costForecast);

        // 2. UTILIZATION FORECAST
        const utilizationForecast = generateForecast(
          poolHistory,
          'utilization',
          period,
          pool.id,
          now
        );
        if (utilizationForecast) forecasts.push(utilizationForecast);

        // 3. DEMAND FORECAST (job count)
        const demandForecast = generateForecast(
          poolHistory,
          'demand',
          period,
          pool.id,
          now
        );
        if (demandForecast) forecasts.push(demandForecast);

        // 4. QUEUE DEPTH FORECAST
        const queueForecast = generateForecast(
          poolHistory,
          'queue_depth',
          period,
          pool.id,
          now
        );
        if (queueForecast) forecasts.push(queueForecast);
      }
    }

    // Mark old forecasts as outdated
    const oldForecasts = await base44.asServiceRole.entities.ResourceForecast.filter(
      { status: 'current' },
      '-generated_at',
      500
    );

    for (const oldForecast of oldForecasts) {
      await base44.asServiceRole.entities.ResourceForecast.update(oldForecast.id, {
        status: 'outdated'
      });
    }

    // Create new forecasts
    if (forecasts.length > 0) {
      await base44.asServiceRole.entities.ResourceForecast.bulkCreate(forecasts);
    }

    return Response.json({
      forecastsGenerated: forecasts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateForecast(history, forecastType, period, poolId, now) {
  let values, label;

  // Extract relevant values based on forecast type
  if (forecastType === 'cost') {
    values = history.map(h => ({
      timestamp: new Date(h.timestamp).getTime(),
      value: h.amount_usd
    }));
    label = 'cost';
  } else if (forecastType === 'utilization') {
    values = history.map(h => ({
      timestamp: new Date(h.timestamp).getTime(),
      value: h.resource_utilization_percent || 0
    }));
    label = 'utilization';
  } else if (forecastType === 'demand') {
    values = history.map(h => ({
      timestamp: new Date(h.timestamp).getTime(),
      value: h.job_count_at_time || 0
    }));
    label = 'demand';
  } else if (forecastType === 'queue_depth') {
    // Estimate queue depth from job count and utilization
    values = history.map(h => ({
      timestamp: new Date(h.timestamp).getTime(),
      value: (h.job_count_at_time || 0) * (1 + (h.resource_utilization_percent || 50) / 100)
    }));
    label = 'queue_depth';
  }

  if (values.length < 7) return null;

  // Calculate statistics
  const valueArray = values.map(v => v.value);
  const mean = valueArray.reduce((a, b) => a + b, 0) / valueArray.length;
  const variance = valueArray.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valueArray.length;
  const stdDev = Math.sqrt(variance);

  // Simple linear regression for trend
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = valueArray.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, v, i) => sum + i * v.value, 0);
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate trend
  const firstVal = valueArray[0];
  const lastVal = valueArray[valueArray.length - 1];
  const percentChange = ((lastVal - firstVal) / firstVal) * 100;
  const trend = Math.abs(percentChange) < 5 ? 'stable' : percentChange > 0 ? 'increasing' : 'decreasing';

  // Generate forecast points
  const periodMs = getPeriodMs(period);
  const pointCount = period === '24h' ? 24 : period === '7d' ? 7 : 30;
  const interval = periodMs / pointCount;
  const forecastedValues = [];
  let maxValue = lastVal;
  let maxTime = now.getTime();

  for (let i = 1; i <= pointCount; i++) {
    const futureTime = now.getTime() + interval * i;
    const indexProjection = n + i;
    const predictedValue = Math.max(0, intercept + slope * indexProjection);
    
    // Add confidence interval (±1.96 * stdDev for 95% CI)
    const ci = 1.96 * stdDev;
    
    forecastedValues.push({
      timestamp: new Date(futureTime).toISOString(),
      predicted_value: parseFloat(predictedValue.toFixed(2)),
      confidence_interval_lower: parseFloat(Math.max(0, predictedValue - ci).toFixed(2)),
      confidence_interval_upper: parseFloat((predictedValue + ci).toFixed(2))
    });

    if (predictedValue > maxValue) {
      maxValue = predictedValue;
      maxTime = futureTime;
    }
  }

  // Detect seasonality (simple: check if weekend/weekday pattern exists)
  const hourlyValues = {};
  values.forEach(v => {
    const hour = new Date(v.timestamp).getHours();
    if (!hourlyValues[hour]) hourlyValues[hour] = [];
    hourlyValues[hour].push(v.value);
  });

  const hourlyMeans = Object.entries(hourlyValues)
    .map(([h, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length);
  const hourlyVariance = Math.max(...hourlyMeans) - Math.min(...hourlyMeans);
  const seasonalityDetected = hourlyVariance > stdDev * 0.5;

  // Calculate model accuracy (R-squared)
  const predictions = values.map((v, i) => intercept + slope * i);
  const ss_res = values.reduce((sum, v, i) => sum + Math.pow(v.value - predictions[i], 2), 0);
  const ss_tot = values.reduce((sum, v) => sum + Math.pow(v.value - mean, 2), 0);
  const rsquared = ss_tot === 0 ? 0 : (1 - ss_res / ss_tot) * 100;

  // Generate recommendations
  const recommendations = [];
  if (trend === 'increasing' && Math.abs(percentChange) > 15) {
    recommendations.push(`Strong ${forecastType} increase detected. Consider scaling resources proactively.`);
  } else if (trend === 'decreasing' && Math.abs(percentChange) > 15) {
    recommendations.push(`${forecastType.charAt(0).toUpperCase() + forecastType.slice(1)} declining. Evaluate resource consolidation.`);
  }
  
  if (maxValue > mean * 1.5) {
    recommendations.push(`Peak ${forecastType} expected around ${new Date(maxTime).toLocaleDateString()}. Pre-allocate capacity.`);
  }

  if (seasonalityDetected) {
    recommendations.push(`Hourly patterns detected in ${forecastType}. Implement time-based auto-scaling.`);
  }

  return {
    resource_pool_id: poolId,
    forecast_type: forecastType,
    forecast_period: period,
    forecast_start_date: new Date(now.getTime()).toISOString(),
    forecast_end_date: new Date(now.getTime() + periodMs).toISOString(),
    generated_at: now.toISOString(),
    forecasted_values: JSON.stringify(forecastedValues),
    model_accuracy: Math.round(rsquared),
    training_data_points: values.length,
    trend,
    trend_strength: Math.abs(percentChange),
    seasonality_detected: seasonalityDetected,
    seasonality_pattern: seasonalityDetected ? 'hourly' : null,
    peak_predicted_value: maxValue,
    peak_predicted_time: new Date(maxTime).toISOString(),
    recommendations: recommendations.length > 0 ? recommendations : ['Monitor forecast accuracy and adjust as needed']
  };
}

function getPeriodMs(period) {
  const ms = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  return ms[period] || ms['24h'];
}