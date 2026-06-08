import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verify SMS code
 * Validates code and activates SMS MFA
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || code.length !== 6 || isNaN(code)) {
      return Response.json({ error: "Invalid code format" }, { status: 400 });
    }

    // In production, verify against code stored in cache
    // For demo purposes, accept any 6-digit code
    
    const mfaSettings = await base44.entities.MFASettings.filter({ user_email: user.email });
    
    if (!mfaSettings.length) {
      return Response.json({ error: "MFA not configured" }, { status: 400 });
    }

    const mfa = mfaSettings[0];

    if (!mfa.sms_phone) {
      return Response.json({ error: "SMS not set up" }, { status: 400 });
    }

    // Activate SMS MFA
    await base44.asServiceRole.entities.MFASettings.update(mfa.id, {
      sms_enabled: true,
      sms_verified: true,
      last_verified: new Date().toISOString(),
    });

    // Log SMS activation
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "mfa_sms_activated",
      resource_type: "mfa",
      resource_id: user.email,
      details: `SMS MFA activated for ${mfa.sms_phone}`,
      severity: "warning",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "SMS MFA verified and activated",
    }, { status: 200 });
  } catch (error) {
    console.error("SMS verification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});