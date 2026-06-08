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
    const costHistories = await base44.asServiceRole.entities.CostHistoryRecord.list('-timestamp', 1000);
    const existingAlerts = await base44.asServiceRole.entities.AnomalyAlert.filter(
      { status: 'active' },
      '-detection_timestamp',
      100
    );

    const anomalies = [];
    const now = new Date();

    for (const pool of resourcePools) {
      // Get recent cost data for this pool
      const recentCosts = costHistories.filter(c => c.resource_pool_id === pool.id);
      
      if (recentCosts.length === 0) continue;

      const last24h = recentCosts.filter(c => {
        const recordTime = new Date(c.timestamp).getTime();
        return (now.getTime() - recordTime) <= 24 * 60 * 60 * 1000;
      });

      if (last24h.length === 0) continue;

      const last7d = recentCosts.filter(c => {
        const recordTime = new Date(c.timestamp).getTime();
        return (now.getTime() - recordTime) <= 7 * 24 * 60 * 60 * 1000;
      });

      // Calculate statistics
      const costs24h = last24h.map(c => c.amount_usd);
      const costs7d = last7d.map(c => c.amount_usd);
      
      const avg24h = costs24h.reduce((a, b) => a + b, 0) / costs24h.length;
      const avg7d = costs7d.reduce((a, b) => a + b, 0) / costs7d.length;
      const latest = costs24h[costs24h.length - 1];
      
      // Calculate standard deviation for z-score
      const variance7d = costs7d.reduce((sum, cost) => sum + Math.pow(cost - avg7d, 2), 0) / costs7d.length;
      const stdDev7d = Math.sqrt(variance7d);
      const zscore = stdDev7d > 0 ? (latest - avg7d) / stdDev7d : 0;

      // 1. COST SPIKE DETECTION
      if (latest > avg7d * 1.5 && zscore > 2) {
        const deviation = ((latest - avg7d) / avg7d) * 100;
        const alertExists = existingAlerts.some(a => 
          a.resource_pool_id === pool.id && 
          a.anomaly_type === 'cost_spike' &&
          a.status === 'active'
        );

        if (!alertExists) {
          anomalies.push({
            resource_pool_id: pool.id,
            anomaly_type: 'cost_spike',
            severity: deviation > 100 ? 'critical' : 'warning',
            metric_name: 'cost_per_minute',
            current_value: latest,
            predicted_value: avg7d,
            deviation_percent: deviation,
            deviation_zscore: zscore,
            detection_timestamp: new Date().toISOString(),
            start_time: new Date(last24h[last24h.length - 1].timestamp).toISOString(),
            context: JSON.stringify({
              avg24h,
              avg7d,
              utilizationPercent: last24h[last24h.length - 1].resource_utilization_percent,
              jobCount: last24h[last24h.length - 1].job_count_at_time,
            }),
            potential_causes: [
              'High job concurrency increasing queue depth',
              'Resource scaling triggered by utilization threshold',
              'Maintenance or thermal management overhead',
              'Increased problem complexity or circuit depth'
            ],
            recommended_actions: [
              'Check current job queue and reduce if necessary',
              'Review resource allocation strategy',
              'Consider time-shifting jobs to off-peak periods',
              'Analyze job parameters for efficiency'
            ],
          });
        }
      }

      // 2. PERFORMANCE DROP DETECTION
      const performances = last24h.map(c => c.performance_score_achieved || 75);
      const avgPerf = performances.reduce((a, b) => a + b, 0) / performances.length;
      const latestPerf = performances[performances.length - 1];
      const perfPerfStdDev = Math.sqrt(
        performances.reduce((sum, p) => sum + Math.pow(p - avgPerf, 2), 0) / performances.length
      );
      const perfZscore = perfPerfStdDev > 0 ? (latestPerf - avgPerf) / perfPerfStdDev : 0;

      if (latestPerf < avgPerf * 0.8 && perfZscore < -1.5) {
        const alertExists = existingAlerts.some(a => 
          a.resource_pool_id === pool.id && 
          a.anomaly_type === 'performance_drop' &&
          a.status === 'active'
        );

        if (!alertExists) {
          anomalies.push({
            resource_pool_id: pool.id,
            anomaly_type: 'performance_drop',
            severity: (avgPerf - latestPerf) > 20 ? 'critical' : 'warning',
            metric_name: 'performance_score',
            current_value: latestPerf,
            predicted_value: avgPerf,
            deviation_percent: ((avgPerf - latestPerf) / avgPerf) * 100,
            deviation_zscore: perfZscore,
            detection_timestamp: new Date().toISOString(),
            start_time: new Date(last24h[last24h.length - 1].timestamp).toISOString(),
            context: JSON.stringify({
              avgPerformance: avgPerf,
              latestPerformance: latestPerf,
              errorRate: last24h[last24h.length - 1].error_rate,
              thermalEvents: last24h[last24h.length - 1].thermal_events
            }),
            potential_causes: [
              'Error rate increase in circuit execution',
              'Thermal throttling reducing performance',
              'Gate fidelity degradation',
              'High circuit depth exceeding optimal performance'
            ],
            recommended_actions: [
              'Review circuit error rates and complexity',
              'Check thermal management system status',
              'Consider reducing circuit depth or job batch size',
              'Validate gate calibration and hardware health'
            ],
          });
        }
      }

      // 3. USAGE DEVIATION DETECTION
      const utilizationRates = last24h.map(c => c.resource_utilization_percent || 0);
      const avgUtil = utilizationRates.reduce((a, b) => a + b, 0) / utilizationRates.length;
      const latestUtil = utilizationRates[utilizationRates.length - 1];
      const utilVariance = utilizationRates.reduce((sum, u) => sum + Math.pow(u - avgUtil, 2), 0) / utilizationRates.length;
      const utilStdDev = Math.sqrt(utilVariance);
      const utilZscore = utilStdDev > 0 ? (latestUtil - avgUtil) / utilStdDev : 0;

      if (Math.abs(latestUtil - pool.optimal_utilization_target_percent || 75) > 30 && Math.abs(utilZscore) > 2) {
        const alertExists = existingAlerts.some(a => 
          a.resource_pool_id === pool.id && 
          a.anomaly_type === 'usage_deviation' &&
          a.status === 'active'
        );

        if (!alertExists) {
          anomalies.push({
            resource_pool_id: pool.id,
            anomaly_type: 'usage_deviation',
            severity: latestUtil > 95 ? 'critical' : 'warning',
            metric_name: 'qubit_utilization',
            current_value: latestUtil,
            predicted_value: pool.optimal_utilization_target_percent || 75,
            deviation_percent: ((latestUtil - (pool.optimal_utilization_target_percent || 75)) / (pool.optimal_utilization_target_percent || 75)) * 100,
            deviation_zscore: utilZscore,
            detection_timestamp: new Date().toISOString(),
            start_time: new Date(last24h[last24h.length - 1].timestamp).toISOString(),
            context: JSON.stringify({
              currentUtilization: latestUtil,
              targetUtilization: pool.optimal_utilization_target_percent,
              jobCount: last24h[last24h.length - 1].job_count_at_time,
              availableQubits: pool.available_qubits
            }),
            potential_causes: [
              latestUtil > 90 ? 'Job queue overflow' : 'Unexpected low utilization',
              'Scaling strategy not responding appropriately',
              'Job submission pattern change',
              'Resource pool capacity mismatch'
            ],
            recommended_actions: [
              latestUtil > 90 ? 'Add resources or throttle incoming jobs' : 'Investigate job submission delays',
              'Review and adjust auto-scaling thresholds',
              'Monitor job submission patterns',
              'Consider load balancing across pools'
            ],
          });
        }
      }

      // 4. ERROR RATE INCREASE
      const errorRates = last24h.map(c => c.error_rate || 0);
      const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
      const latestErrorRate = errorRates[errorRates.length - 1];

      if (latestErrorRate > avgErrorRate * 2 && latestErrorRate > 5) {
        const alertExists = existingAlerts.some(a => 
          a.resource_pool_id === pool.id && 
          a.anomaly_type === 'error_rate_increase' &&
          a.status === 'active'
        );

        if (!alertExists) {
          anomalies.push({
            resource_pool_id: pool.id,
            anomaly_type: 'error_rate_increase',
            severity: latestErrorRate > 15 ? 'critical' : 'warning',
            metric_name: 'error_rate',
            current_value: latestErrorRate,
            predicted_value: avgErrorRate,
            deviation_percent: ((latestErrorRate - avgErrorRate) / avgErrorRate) * 100,
            deviation_zscore: 0,
            detection_timestamp: new Date().toISOString(),
            start_time: new Date(last24h[last24h.length - 1].timestamp).toISOString(),
            context: JSON.stringify({
              currentErrorRate: latestErrorRate,
              avgErrorRate,
              thermalEvents: last24h[last24h.length - 1].thermal_events
            }),
            potential_causes: [
              'Thermal stress or temperature drift',
              'Gate calibration degradation',
              'Environmental electromagnetic interference',
              'Hardware component aging or malfunction'
            ],
            recommended_actions: [
              'Run diagnostic gate calibration',
              'Check thermal management system',
              'Review hardware diagnostic logs',
              'Consider scheduled maintenance'
            ],
          });
        }
      }
    }

    // Create anomaly alerts
    if (anomalies.length > 0) {
      await base44.asServiceRole.entities.AnomalyAlert.bulkCreate(anomalies);
    }

    return Response.json({ 
      anomaliesDetected: anomalies.length,
      details: anomalies
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});