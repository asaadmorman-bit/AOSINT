import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Initiate SMS MFA setup
 * Sends verification code to phone number
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phone_number } = body;

    if (!phone_number || !phone_number.match(/^\+?[1-9]\d{1,14}$/)) {
      return Response.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS code for ${phone_number}: ${code}`);

    // Get or create MFA settings
    const existing = await base44.entities.MFASettings.filter({ user_email: user.email });
    
    if (existing.length > 0) {
      // Store code temporarily (in production, use cache with TTL)
      await base44.asServiceRole.entities.MFASettings.update(existing[0].id, {
        sms_phone: phone_number.slice(-4).padStart(phone_number.length, '*'),
      });
    } else {
      await base44.asServiceRole.entities.MFASettings.create({
        user_email: user.email,
        sms_phone: phone_number.slice(-4).padStart(phone_number.length, '*'),
      });
    }

    // In production, send SMS here
    // await sendSMSViaProvider(phone_number, `Your verification code is: ${code}`);

    return Response.json({
      success: true,
      message: "Verification code sent",
      masked_phone: phone_number.slice(-4).padStart(phone_number.length, '*'),
    }, { status: 200 });
  } catch (error) {
    console.error("SMS setup error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});