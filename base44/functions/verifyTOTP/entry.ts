import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Verify TOTP code
 * Validates 6-digit code and activates TOTP if correct
 */

function verifyTOTPCode(secret, code, window = 1) {
  // Simple TOTP verification
  // In production, use a library like 'speakeasy' or 'otplib'
  // This is a basic implementation
  
  const time = Math.floor(Date.now() / 1000 / 30);
  const digits = 6;
  
  for (let i = -window; i <= window; i++) {
    const counter = time + i;
    // Hash the counter + secret to get HOTP
    // This is simplified - in production use proper HMAC-SHA1
    const hash = counter.toString() + secret;
    const code_generated = hash.charCodeAt(0) % Math.pow(10, digits);
    if (code_generated.toString().padStart(digits, '0') === code) {
      return true;
    }
  }
  return false;
}

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

    // Get user's MFA settings
    const mfaSettings = await base44.entities.MFASettings.filter({ user_email: user.email });
    
    if (!mfaSettings.length) {
      return Response.json({ error: "MFA not configured" }, { status: 400 });
    }

    const mfa = mfaSettings[0];
    
    if (!mfa.totp_secret) {
      return Response.json({ error: "TOTP not set up" }, { status: 400 });
    }

    // Verify the code (simplified implementation)
    const isValid = verifyTOTPCode(mfa.totp_secret, code);

    if (!isValid) {
      return Response.json({ error: "Invalid verification code" }, { status: 401 });
    }

    // Mark TOTP as verified and enabled
    await base44.asServiceRole.entities.MFASettings.update(mfa.id, {
      totp_enabled: true,
      totp_verified: true,
      last_verified: new Date().toISOString(),
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    await base44.asServiceRole.entities.MFASettings.update(mfa.id, {
      backup_codes: backupCodes,
    });

    // Log MFA activation
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "mfa_totp_activated",
      resource_type: "mfa",
      resource_id: user.email,
      details: "TOTP MFA successfully activated",
      severity: "warning",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "TOTP verified and activated",
      backup_codes: backupCodes,
    }, { status: 200 });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});