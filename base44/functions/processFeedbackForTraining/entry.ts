import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { datasetId, feedbackIds } = await req.json();

    if (!datasetId || !feedbackIds || feedbackIds.length === 0) {
      return Response.json(
        { error: 'datasetId and feedbackIds are required' },
        { status: 400 }
      );
    }

    // Fetch feedback records
    const feedbackRecords = await Promise.all(
      feedbackIds.map(id => base44.asServiceRole.entities.AgentTrainingFeedback.list({ id }))
    );

    const feedback = feedbackRecords.map(r => r[0]).filter(Boolean);

    // Fetch existing dataset
    const datasets = await base44.asServiceRole.entities.AgentTrainingDataset.list({ id: datasetId });
    const dataset = datasets[0];

    if (!dataset) {
      return Response.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Convert feedback to training examples
    const trainingExamples = feedback.map(f => ({
      features: {
        accuracy: f.accuracy_rating,
        effectiveness: f.effectiveness_rating,
        detection_accuracy: f.threat_detection_accuracy,
        false_positives: f.false_positive_count,
        false_negatives: f.false_negative_count,
        speed: f.speed_rating,
      },
      label: f.feedback_type === 'positive' ? 'positive' : 'negative',
      feedback_id: f.id,
      task_id: f.task_id,
      metadata: {
        operator: f.operator_id,
        timestamp: f.timestamp,
        decision_quality: f.decision_quality,
      },
    }));

    // Merge with existing training data
    let existingData = [];
    try {
      existingData = JSON.parse(dataset.training_data || '[]');
    } catch {
      existingData = [];
    }

    const mergedData = [...existingData, ...trainingExamples];

    // Calculate dataset metrics
    const positiveCount = mergedData.filter(d => d.label === 'positive').length;
    const negativeCount = mergedData.filter(d => d.label === 'negative').length;
    const balanceRatio = negativeCount > 0 ? positiveCount / negativeCount : 0;

    // Calculate quality score
    const qualityScore = calculateQualityMetrics(mergedData);

    // Update dataset
    await base44.asServiceRole.entities.AgentTrainingDataset.update(datasetId, {
      training_data: JSON.stringify(mergedData),
      record_count: mergedData.length,
      positive_examples: positiveCount,
      negative_examples: negativeCount,
      balance_ratio: balanceRatio,
      quality_score: qualityScore,
      last_used: new Date().toISOString(),
      usage_count: (dataset.usage_count || 0) + 1,
    });

    // Mark feedback as incorporated
    await Promise.all(
      feedbackIds.map(id =>
        base44.asServiceRole.entities.AgentTrainingFeedback.update(id, {
          incorporated_into_training: true,
        })
      )
    );

    // Calculate expected improvements
    const improvements = calculateExpectedImprovements(feedback);

    return Response.json({
      status: "success",
      dataset_id: datasetId,
      feedback_incorporated: feedback.length,
      total_training_samples: mergedData.length,
      balance_ratio: balanceRatio.toFixed(2),
      quality_score: qualityScore,
      expected_improvements: improvements,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateQualityMetrics(data) {
  if (data.length === 0) return 0;

  // Check completeness
  const completeness =
    data.filter(d => d.features && d.label && d.metadata).length / data.length;

  // Check balance
  const positive = data.filter(d => d.label === 'positive').length;
  const negative = data.filter(d => d.label === 'negative').length;
  const balance = Math.min(positive, negative) / Math.max(positive, negative);

  // Check variance in features
  const accuracies = data.map(d => d.features?.accuracy || 0);
  const variance = calculateVariance(accuracies);
  const varianceScore = Math.min(1, variance / 50);

  return Math.round((completeness * 0.4 + balance * 0.4 + varianceScore * 0.2) * 100);
}

function calculateVariance(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b) / arr.length;
  const sq = arr.map(x => (x - mean) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b) / arr.length);
}

function calculateExpectedImprovements(feedback) {
  const avgAccuracy = feedback.reduce((sum, f) => sum + f.accuracy_rating, 0) / feedback.length;
  const avgDetection = feedback.reduce((sum, f) => sum + f.threat_detection_accuracy, 0) / feedback.length;

  const improvements = [];

  if (avgAccuracy > 80) {
    improvements.push(`Expected ${Math.round(avgAccuracy - 75)}% improvement in task accuracy`);
  }

  if (avgDetection > 80) {
    improvements.push(`Expected ${Math.round(avgDetection - 75)}% improvement in threat detection`);
  }

  const falsePositives = feedback.reduce((sum, f) => sum + f.false_positive_count, 0);
  if (falsePositives > 0) {
    improvements.push(`Can reduce false positives through training on ${falsePositives} correction samples`);
  }

  const falseNegatives = feedback.reduce((sum, f) => sum + f.false_negative_count, 0);
  if (falseNegatives > 0) {
    improvements.push(`Can reduce false negatives through training on ${falseNegatives} correction samples`);
  }

  return improvements.length > 0
    ? improvements
    : ['Dataset will improve general agent performance'];
}