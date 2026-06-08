import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Rotate RADIUS key/secret
 * Generates new key and manages old key lifecycle
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { key_management_id } = body;

    if (!key_management_id) {
      return Response.json({ error: "Missing key_management_id" }, { status: 400 });
    }

    // Get current key
    const keyData = await base44.asServiceRole.entities.RadiusKeyManagement.filter({ 
      id: key_management_id 
    });

    if (!keyData.length) {
      return Response.json({ error: "Key not found" }, { status: 404 });
    }

    const oldKey = keyData[0];

    // Generate new secret
    const newSecret = generateSecureSecret(32);
    const keyHash = await hashKey(newSecret);

    // Create new key version
    const newKeyRecord = await base44.asServiceRole.entities.RadiusKeyManagement.create({
      key_name: `${oldKey.key_name}_v${Date.now()}`,
      key_type: oldKey.key_type,
      encrypted_value: newSecret,
      key_hash: keyHash,
      rotation_enabled: oldKey.rotation_enabled,
      rotation_days: oldKey.rotation_days,
      last_rotated: new Date().toISOString(),
      next_rotation: calculateNextRotation(oldKey.rotation_days),
      created_by: user.email,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    // Deactivate old key
    await base44.asServiceRole.entities.RadiusKeyManagement.update(oldKey.id, {
      is_active: false,
    });

    // Log rotation
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: "radius_key_rotation",
      resource_type: "radius_key",
      resource_id: key_management_id,
      details: `RADIUS key rotated by ${user.email}`,
      severity: "warning",
      outcome: "success",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "Key rotated successfully",
      new_key_id: newKeyRecord.id,
      old_key_deactivated: true,
    }, { status: 200 });
  } catch (error) {
    console.error("Key rotation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSecureSecret(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let secret = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    secret += chars[bytes[i] % chars.length];
  }
  return secret;
}

async function hashKey(secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function calculateNextRotation(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}