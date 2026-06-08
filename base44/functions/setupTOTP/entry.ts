import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate TOTP secret for user
 * Returns QR code and secret for manual entry
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a random TOTP secret (base32)
    const randomBytes = crypto.getRandomValues(new Uint8Array(20));
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < randomBytes.length; i += 5) {
      const chunk = (randomBytes[i] << 32) | (randomBytes[i + 1] << 24) | (randomBytes[i + 2] << 16) | (randomBytes[i + 3] << 8) | randomBytes[i + 4];
      for (let j = 0; j < 8; j++) {
        secret += base32Chars[(chunk >> (35 - (j * 5))) & 31];
      }
    }
    secret = secret.substring(0, 32);

    // Create or update MFA settings (unverified)
    const existing = await base44.entities.MFASettings.filter({ user_email: user.email });
    
    if (existing.length > 0) {
      await base44.asServiceRole.entities.MFASettings.update(existing[0].id, {
        totp_secret: secret,
        totp_verified: false,
      });
    } else {
      await base44.asServiceRole.entities.MFASettings.create({
        user_email: user.email,
        totp_secret: secret,
        totp_verified: false,
      });
    }

    // Generate QR code URL (using standard TOTP URI format)
    const appName = "ASOSINT";
    const otpauth = `otpauth://totp/${appName}:${user.email}?secret=${secret}&issuer=${appName}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauth)}`;

    return Response.json({
      success: true,
      secret,
      qr_code_url: qrCodeUrl,
      manual_entry_key: secret,
      message: "Scan the QR code or enter the secret manually in your authenticator app"
    }, { status: 200 });
  } catch (error) {
    console.error("TOTP setup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});