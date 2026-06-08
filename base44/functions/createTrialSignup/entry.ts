import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Create trial signup with domain validation for enterprise tier
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const {
      email,
      full_name,
      company_name,
      company_domain,
      tier,
      use_case,
    } = body;

    if (!email || !full_name || !company_name || !tier) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate tier
    if (!["pro", "enterprise", "gov"].includes(tier)) {
      return Response.json({ error: "Invalid tier" }, { status: 400 });
    }

    // For enterprise tier, validate company domain
    let domainValidated = false;

    if (tier === "enterprise" || tier === "gov") {
      if (!company_domain) {
        return Response.json({ 
          error: "Company domain required for enterprise tier",
          tier_requirement: "enterprise",
        }, { status: 400 });
      }

      // Validate email domain matches company domain
      const emailDomain = email.split("@")[1];
      if (emailDomain !== company_domain && !emailDomain.endsWith(`.${company_domain}`)) {
        return Response.json({ 
          error: "Email domain must match company domain for enterprise tier",
          expected_domain: company_domain,
          provided_domain: emailDomain,
        }, { status: 400 });
      }

      domainValidated = true;
    }

    // Check for existing signup
    const existing = await base44.asServiceRole.entities.TrialSignup.filter({
      email,
      tier,
    });

    if (existing.length) {
      return Response.json({ 
        error: "Trial signup already exists for this email and tier",
        existing_id: existing[0].id,
      }, { status: 409 });
    }

    // Generate activation token
    const activationToken = generateToken(32);
    const trialDays = tier === "enterprise" ? 30 : 14; // Enterprise: 30 days, Pro: 14 days

    // Create trial signup
    const signup = await base44.asServiceRole.entities.TrialSignup.create({
      email,
      full_name,
      company_name,
      company_domain: company_domain || null,
      tier,
      use_case,
      domain_validated: domainValidated,
      status: "pending",
      activation_token: activationToken,
      trial_expires: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Send activation email
    try {
      const activationUrl = `${req.headers.get("origin")}/activate-trial?token=${activationToken}`;
      
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Welcome to ASOSINT ${tier.charAt(0).toUpperCase() + tier.slice(1)} Trial!`,
        body: `
          <h2>Welcome ${full_name}!</h2>
          <p>Your ${tier.toUpperCase()} tier trial for ASOSINT has been created.</p>
          <p><strong>Company:</strong> ${company_name}</p>
          <p><strong>Trial Duration:</strong> ${trialDays} days</p>
          <p><strong>Expires:</strong> ${new Date(signup.trial_expires).toLocaleDateString()}</p>
          <p><a href="${activationUrl}" style="background-color: #00d4ff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Activate Trial</a></p>
          <p style="color: #999; font-size: 12px;">If you did not request this trial, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send activation email:", emailError);
    }

    // Log signup
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: email,
      actor_role: "user",
      action: "trial_signup_created",
      resource_type: "trial",
      resource_id: signup.id,
      details: `${tier.toUpperCase()} trial signup for ${company_name}`,
      severity: "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      signup_id: signup.id,
      email,
      tier,
      domain_validated: domainValidated,
      trial_expires: signup.trial_expires,
      message: "Trial signup created. Check your email for activation link.",
    }, { status: 201 });
  } catch (error) {
    console.error("Trial signup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateToken(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}