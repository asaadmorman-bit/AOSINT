import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * SOINT Partner Application Submission
 * Submits a partner application and creates KYC workflow
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      company_name, partner_type, website, industries, regions,
      primary_contact_name, primary_contact_email, company_size,
      requested_tier = "registered"
    } = body;

    if (!company_name || !partner_type || !primary_contact_email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create Partner record
    const partner = await base44.asServiceRole.entities.Partner.create({
      company_name,
      partner_type,
      tier: requested_tier,
      status: "application",
      primary_contact_email,
      primary_contact_name,
      website,
      industries: industries || [],
      regions: regions || [],
      company_size,
      kyc_verified: false,
    });

    // Create Application record
    const application = await base44.asServiceRole.entities.PartnerApplication.create({
      partner_id: partner.id,
      company_name,
      partner_type,
      status: "submitted",
      submission_date: new Date().toISOString(),
      submitted_by_email: user.email,
      requested_tier,
      kyc_status: "pending",
      compliance_checklist: {
        data_protection_agreement: false,
        code_of_conduct: false,
        insurance_provided: false,
        security_assessment_passed: false,
        msa_signed: false,
      },
    });

    // Log activity
    await base44.asServiceRole.entities.PartnerActivity.create({
      partner_id: partner.id,
      activity_type: "application_submitted",
      actor_email: user.email,
      resource_type: "PartnerApplication",
      resource_id: application.id,
      details: {
        company_name,
        partner_type,
        requested_tier,
      },
      occurred_at: new Date().toISOString(),
    });

    return Response.json({
      partner_id: partner.id,
      application_id: application.id,
      company_name,
      status: "submitted",
      next_step: "KYC verification in progress",
    }, { status: 201 });
  } catch (error) {
    console.error("Partner application error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});