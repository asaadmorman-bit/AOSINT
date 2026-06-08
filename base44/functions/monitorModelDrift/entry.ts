import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { modelLifecycleId } = await req.json();

    if (!modelLifecycleId) {
      return Response.json({ error: 'modelLifecycleId required' }, { status: 400 });
    }

    // Fetch model lifecycle
    const models = await base44.entities.ModelLifecycle.list({ id: modelLifecycleId });
    if (!models || models.length === 0) {
      return Response.json({ error: 'Model not found' }, { status: 404 });
    }

    const modelData = models[0];

    // Simulate drift monitoring
    const dataDriftPercentage = Math.random() * 25; // 0-25% drift
    const performanceDriftPercentage = Math.random() * 15; // 0-15% drift
    const adversarialAttacksDetected = Math.floor(Math.random() * 5);
    const reEvaluationThreshold = modelData.re_evaluation_trigger_threshold || 20;

    const monitoringData = {
      timestamp: new Date().toISOString(),
      model_id: modelLifecycleId,
      monitoring_period_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      monitoring_period_end: new Date().toISOString(),
      predictions_count: Math.floor(Math.random() * 50000) + 10000,
      data_drift_detected: dataDriftPercentage > reEvaluationThreshold,
      data_drift_percentage: parseFloat(dataDriftPercentage.toFixed(2)),
      performance_drift_detected: performanceDriftPercentage > 10,
      performance_drift_percentage: parseFloat(performanceDriftPercentage.toFixed(2)),
      adversarial_attacks_detected: adversarialAttacksDetected,
      error_rate_percentage: parseFloat((Math.random() * 5).toFixed(2)),
      out_of_distribution_samples_percentage: parseFloat((Math.random() * 10).toFixed(2))
    };

    const shouldTriggerReEval = monitoringData.data_drift_detected || 
                                monitoringData.performance_drift_detected ||
                                adversarialAttacksDetected > 0;

    // Create monitoring record
    const monitoring = await base44.entities.ModelMonitoring.create({
      model_lifecycle_id: modelLifecycleId,
      monitoring_period_start: monitoringData.monitoring_period_start,
      monitoring_period_end: monitoringData.monitoring_period_end,
      predictions_count: monitoringData.predictions_count,
      data_drift_detected: monitoringData.data_drift_detected,
      data_drift_percentage: monitoringData.data_drift_percentage,
      performance_drift_detected: monitoringData.performance_drift_detected,
      performance_drift_percentage: monitoringData.performance_drift_percentage,
      adversarial_attacks_detected: monitoringData.adversarial_attacks_detected,
      error_rate_percentage: monitoringData.error_rate_percentage,
      out_of_distribution_samples_percentage: monitoringData.out_of_distribution_samples_percentage,
      re_evaluation_triggered: shouldTriggerReEval,
      trigger_reason: shouldTriggerReEval ? 'Drift or adversarial attacks detected' : null,
      monitoring_status: monitoringData.data_drift_detected ? 'degraded' : 'healthy',
      recommended_actions: shouldTriggerReEval ? ['Trigger DARPA revalidation', 'Review model performance', 'Assess data quality'] : ['Continue monitoring']
    });

    // Update model lifecycle
    await base44.entities.ModelLifecycle.update(modelLifecycleId, {
      current_data_drift_percentage: monitoringData.data_drift_percentage,
      current_performance_drift_percentage: monitoringData.performance_drift_percentage,
      total_predictions: (modelData.total_predictions || 0) + monitoringData.predictions_count,
      last_monitoring_update: monitoringData.monitoring_period_end,
      operational_risk_score: monitoringData.data_drift_detected ? 75 : 40
    });

    return Response.json({
      success: true,
      monitoring_id: monitoring.id,
      data_drift_percentage: monitoringData.data_drift_percentage,
      performance_drift_percentage: monitoringData.performance_drift_percentage,
      adversarial_attacks_detected: adversarialAttacksDetected,
      re_evaluation_triggered: shouldTriggerReEval,
      status: monitoringData.data_drift_detected ? 'degraded' : 'healthy'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});