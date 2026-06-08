import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { docType, audience, section } = await req.json();

    const docPrompts = {
      setup: {
        executive: `Generate a concise executive summary (200 words) for setting up ASOSINT for C-suite stakeholders. Include: value proposition, deployment time, required resources, immediate ROI, and key success metrics.`,
        analyst: `Create a detailed setup guide (500 words) for SOC analysts on deploying ASOSINT. Include: system requirements, agent configuration, threat feed setup, hunt ticket creation, and initial playbook activation.`,
        admin: `Write a comprehensive implementation guide (700 words) for system administrators. Include: infrastructure requirements, multi-tenant configuration, user role setup, data source integration, compliance logging, and backup/disaster recovery.`,
        developer: `Create a technical integration guide (600 words) for developers. Include: API endpoints, SDK usage, backend function development, custom agent deployment, webhook configuration, and testing procedures.`,
      },
      compliance: {
        soc2: `Generate SOC 2 Type 2 compliance documentation (800 words) covering: access controls, encryption, audit logging, incident response procedures, vendor management, change management, and evidence collection for Type 2 audits.`,
        iso27001: `Create ISO 27001 compliance mapping (700 words) for ASOSINT, including: information security policy alignment, risk assessment framework, asset management controls, access control implementation, cryptography, and monitoring/logging.`,
        scap: `Generate SCAP (Security Content Automation Protocol) documentation (600 words) including: vulnerability configuration baseline, policy compliance checks, scanning procedures, remediation workflows, and evidence export for compliance audits.`,
      },
      userguide: {
        threatHunting: `Write a comprehensive threat hunting guide (800 words) covering: hunt hypothesis development, IOC enrichment workflow, anomaly detection procedures, MITRE ATT&CK mapping, confidence scoring, and automated playbook triggering.`,
        vulnerability: `Create a vulnerability management guide (700 words) including: scan types and configuration, CVSS prioritization, remediation task generation, agent-assisted patching, compliance mapping, and reporting for stakeholders.`,
        incidentResponse: `Generate an IR playbook guide (750 words) covering: incident classification, automated response workflows, escalation procedures, forensic data collection, stakeholder notification, and post-incident review processes.`,
      },
      marketing: {
        soc2: `Create marketing copy (400 words) highlighting ASOSINT's SOC 2 Type 2 compliance capabilities for security teams and agencies. Emphasize audit readiness, continuous monitoring, and reduced compliance overhead.`,
        government: `Write marketing content (500 words) for government and critical infrastructure clients, emphasizing compliance with FedRAMP, CMMC, RMF, and JSIG. Include sovereign deployment options and classified data handling.`,
        enterprise: `Generate enterprise sales materials (600 words) positioning ASOSINT as the unified intelligence platform for Fortune 500 security operations, including multi-region deployment, advanced analytics, and agent autonomy.`,
      },
    };

    const prompt = docPrompts[docType]?.[audience];
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Invalid docType or audience' }), { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${prompt}\n\nFormat the response with clear sections using markdown headers. Be specific, detailed, and action-oriented.`,
      add_context_from_internet: true,
    });

    return new Response(JSON.stringify({
      success: true,
      docType,
      audience,
      content: response,
      generated_at: new Date().toISOString(),
    }), { status: 200 });
  } catch (error) {
    console.error('[generateAIDocumentation] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});