import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { program_id, program_data } = await req.json();

    // Fetch program
    const program = await base44.entities.IntelligenceProgram.filter({ id: program_id }).then(r => r?.[0]);
    if (!program) return Response.json({ error: 'Program not found' }, { status: 404 });

    // Generate charter
    const charter = {
      mission_statement: program.mission_statement,
      scope: `Intelligence program covering ${program.domain_coverage?.join(', ') || 'all domains'}`,
      roles_and_responsibilities: generateRoleMatrix(program),
      governance_structure: generateGovernanceStructure(program),
    };

    // Generate operational playbooks
    const operational_playbooks = generatePlaybooks(program);

    // Generate escalation matrix
    const escalation_matrix = generateEscalationMatrix(program);

    // Generate fusion center plan
    const fusion_center_plan = {
      data_sources: generateDataSources(program),
      verification_layers: 'Multi-layer verification with automated + manual review',
      correlation_rules: 'Cross-domain correlation based on observable patterns',
      analyst_workflows: 'Daily intel cycle with hourly updates for critical indicators',
    };

    // Generate scenario engine plan
    const scenario_engine_plan = {
      scenario_types: ['Convergence', 'Fragmentation', 'Escalation', 'Narrative'],
      forecasting_workflows: 'Weekly scenario forecasting with 30/60/90 day forecasts',
      red_blue_integration: 'Integrated Red/Blue cell exercises monthly',
    };

    // Generate compliance plan
    const compliance_plan = {
      frameworks: ['NIST Cyber', 'ISO 27001', 'Internal Policy'],
      controls: generateControls(program),
      audit_schedule: 'Quarterly internal audits, annual external audit',
    };

    // Create blueprint
    const blueprint = await base44.entities.ProgramBlueprint.create({
      program_id,
      charter,
      operational_playbooks,
      escalation_matrix,
      fusion_center_plan,
      scenario_engine_plan,
      compliance_plan,
      generated_date: new Date().toISOString(),
    });

    // Update program with blueprint reference
    await base44.entities.IntelligenceProgram.update(program_id, {
      blueprint_id: blueprint.id,
    });

    return Response.json({
      blueprint_id: blueprint.id,
      program_id,
      status: 'generated',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateRoleMatrix(program) {
  const baseRoles = {
    'enterprise': ['Director', 'Analysis Manager', 'Senior Analyst', 'Analyst', 'Technician'],
    'government': ['Intelligence Chief', 'Deputy Chief', 'Principal Analyst', 'Analyst', 'Collection Manager'],
    'public_safety': ['Intelligence Commander', 'Analysis Lead', 'Tactical Analyst', 'Community Safety Officer'],
  };

  return baseRoles[program.program_type] || baseRoles.enterprise;
}

function generateGovernanceStructure(program) {
  return `
Leadership: Director/Chief
Advisory: Stakeholder council (quarterly)
Operations: Daily standups, weekly reviews
Oversight: Monthly governance board
Escalation: Clear authority matrix by severity
  `;
}

function generatePlaybooks(program) {
  const playbooks = [
    {
      name: 'Daily Intelligence Cycle',
      description: 'Morning briefing, collection review, analysis prioritization',
      workflow: 'Collect → Verify → Analyze → Brief',
      tools_required: ['Fusion Center', 'Data Lake', 'Knowledge Graph'],
    },
    {
      name: 'Incident Triage',
      description: 'Rapid assessment of security incidents and threats',
      workflow: 'Alert → Assess → Escalate → Investigate',
      tools_required: ['Observable Enrichment', 'Scenario Engine', 'Escalation Matrix'],
    },
    {
      name: 'Narrative Monitoring',
      description: 'Track and analyze narrative propagation',
      workflow: 'Monitor → Cluster → Analyze Velocity → Report',
      tools_required: ['NLP Agents', 'Narrative Tracker', 'Observatory'],
    },
    {
      name: 'Protective Intelligence',
      description: 'Monitor threats to critical assets',
      workflow: 'Identify → Monitor → Alert → Protect',
      tools_required: ['Entity Graph', 'Pattern of Life Analysis', 'Alert System'],
    },
  ];

  if (program.program_type === 'government') {
    playbooks.push({
      name: 'Geopolitical Monitoring',
      description: 'Track regional instability and state actor activities',
      workflow: 'Monitor → Correlate → Forecast → Brief Leadership',
      tools_required: ['Observatory', 'Scenario Engine', 'Executive Dashboard'],
    });
  }

  return playbooks;
}

function generateEscalationMatrix(program) {
  return {
    levels: [
      { level: 1, name: 'Informational', escalate_after: 'Next brief' },
      { level: 2, name: 'Standard', escalate_after: '4 hours' },
      { level: 3, name: 'Urgent', escalate_after: '1 hour' },
      { level: 4, name: 'Critical', escalate_after: 'Immediate' },
    ],
    notification_paths: [
      { level: 1, notify: ['Analyst Manager'] },
      { level: 2, notify: ['Analysis Director', 'Operations Chief'] },
      { level: 3, notify: ['Executive Leadership', 'External Partners'] },
      { level: 4, notify: ['Organization Leadership', 'Emergency Response'] },
    ],
  };
}

function generateDataSources(program) {
  const sources = [
    'ASOINT Threat Feeds',
    'Internal Security Events',
    'Public OSINT Feeds',
    'Partner Intelligence',
  ];

  if (program.program_type === 'government') {
    sources.push('Classified Feeds', 'Inter-agency Intelligence');
  }

  return sources;
}

function generateControls(program) {
  return [
    { control: 'Access Control', description: 'Role-based access enforcement' },
    { control: 'Data Handling', description: 'Anonymization and minimization' },
    { control: 'Audit Logging', description: 'Complete audit trail' },
    { control: 'Data Retention', description: 'Policy-compliant retention' },
    { control: 'Encryption', description: 'Data at rest and in transit' },
  ];
}