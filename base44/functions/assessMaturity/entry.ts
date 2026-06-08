import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { program_id, assessment_data } = await req.json();

    const program = await base44.entities.IntelligenceProgram.filter({ id: program_id }).then(r => r?.[0]);
    if (!program) return Response.json({ error: 'Program not found' }, { status: 404 });

    // Score each category (1-5 scale)
    const category_scores = {
      governance: scoreGovernance(assessment_data),
      collection: scoreCollection(assessment_data),
      analysis: scoreAnalysis(assessment_data),
      fusion: scoreFusion(assessment_data),
      scenario_planning: scoreScenarioPlanning(assessment_data),
      training_readiness: scoreTrainingReadiness(assessment_data),
      technology_integration: scoreTechnologyIntegration(assessment_data),
      community_alignment: scoreCommunityAlignment(assessment_data),
    };

    // Calculate overall maturity
    const scores = Object.values(category_scores);
    const overall_maturity = Math.round(scores.reduce((a, b) => a + b) / scores.length);

    // Identify gaps
    const gaps = identifyGaps(category_scores, program);

    // Generate recommendations
    const recommendations = generateRecommendations(gaps, program);

    // Create assessment
    const assessment = await base44.entities.MaturityAssessment.create({
      program_id,
      assessment_date: new Date().toISOString(),
      overall_maturity,
      category_scores,
      gaps,
      recommendations,
      next_milestone: getNextMilestone(overall_maturity),
      assessor: user.email,
    });

    // Update program maturity level
    await base44.entities.IntelligenceProgram.update(program_id, {
      maturity_level: overall_maturity,
    });

    return Response.json({
      assessment_id: assessment.id,
      overall_maturity,
      category_scores,
      gap_count: gaps.length,
      recommendation_count: recommendations.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function scoreGovernance(data) {
  let score = 1;
  if (data.has_policies) score++;
  if (data.has_oversight_board) score++;
  if (data.has_audit_program) score++;
  if (data.has_formal_governance) score++;
  return Math.min(5, score);
}

function scoreCollection(data) {
  let score = 1;
  if (data.has_defined_collection_plan) score++;
  if (data.multiple_collection_sources) score++;
  if (data.automated_collection) score++;
  if (data.collection_validated) score++;
  return Math.min(5, score);
}

function scoreAnalysis(data) {
  let score = 1;
  if (data.has_analysis_workflows) score++;
  if (data.has_senior_analysts) score++;
  if (data.uses_analysis_frameworks) score++;
  if (data.produces_finished_intelligence) score++;
  return Math.min(5, score);
}

function scoreFusion(data) {
  let score = 1;
  if (data.has_fusion_center) score++;
  if (data.cross_domain_correlation) score++;
  if (data.real_time_fusion) score++;
  if (data.fusion_integrated) score++;
  return Math.min(5, score);
}

function scoreScenarioPlanning(data) {
  let score = 1;
  if (data.has_scenarios) score++;
  if (data.forecasting_capability) score++;
  if (data.red_blue_exercises) score++;
  if (data.scenario_results_actionable) score++;
  return Math.min(5, score);
}

function scoreTrainingReadiness(data) {
  let score = 1;
  if (data.has_training_program) score++;
  if (data.has_certifications) score++;
  if (data.regular_training) score++;
  if (data.high_readiness) score++;
  return Math.min(5, score);
}

function scoreTechnologyIntegration(data) {
  let score = 1;
  if (data.uses_asoint_modules) score++;
  if (data.integrated_data_lake) score++;
  if (data.automated_analytics) score++;
  if (data.modern_tech_stack) score++;
  return Math.min(5, score);
}

function scoreCommunityAlignment(data) {
  let score = 1;
  if (data.community_partnerships) score++;
  if (data.public_safety_integration) score++;
  if (data.stakeholder_engagement) score++;
  if (data.mission_impact_demonstrated) score++;
  return Math.min(5, score);
}

function identifyGaps(scores, program) {
  const gaps = [];
  
  for (const [category, score] of Object.entries(scores)) {
    if (score < 3) {
      gaps.push({
        category,
        description: `${category} capability is at level ${score} and needs development`,
        severity: score === 1 ? 'critical' : 'high',
        remediation: getRemediationFor(category),
      });
    }
  }

  return gaps;
}

function getRemediationFor(category) {
  const remediations = {
    governance: 'Establish formal governance board and policy framework',
    collection: 'Expand collection sources and automate where possible',
    analysis: 'Hire senior analysts and implement analysis frameworks',
    fusion: 'Deploy Fusion Center and establish correlation rules',
    scenario_planning: 'Implement Scenario Engine and conduct exercises',
    training_readiness: 'Create training curriculum and certification paths',
    technology_integration: 'Deploy ASOINT modules and integrate data lake',
    community_alignment: 'Establish partnerships and demonstrate impact',
  };

  return remediations[category] || 'Develop capability roadmap';
}

function generateRecommendations(gaps, program) {
  const recommendations = [];
  const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };

  // Sort gaps by priority
  const sortedGaps = [...gaps].sort((a, b) => 
    priorityMap[a.severity] - priorityMap[b.severity]
  );

  sortedGaps.forEach((gap, idx) => {
    recommendations.push({
      priority: idx + 1,
      recommendation: gap.remediation,
      timeline: idx === 0 ? '0-30 days' : idx === 1 ? '30-90 days' : '90-180 days',
      asoint_module: getModuleFor(gap.category),
    });
  });

  return recommendations;
}

function getModuleFor(category) {
  const modules = {
    governance: 'Compliance & Governance Engine',
    collection: 'Data Lake',
    analysis: 'Fusion Center',
    fusion: 'Fusion Center',
    scenario_planning: 'Scenario Engine',
    training_readiness: 'Training Portal',
    technology_integration: 'All Modules',
    community_alignment: 'Partner Portal',
  };

  return modules[category] || 'Core Platform';
}

function getNextMilestone(maturity) {
  const milestones = {
    1: 'Establish governance and foundational processes',
    2: 'Operationalize collection and analysis workflows',
    3: 'Integrate data lake and Fusion Center',
    4: 'Deploy predictive analytics and scenarios',
    5: 'Achieve adaptive, AI-enhanced operations',
  };

  return milestones[maturity + 1] || 'Continue optimization';
}