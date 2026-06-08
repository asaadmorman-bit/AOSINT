/**
 * AES-256-GCM Encryption Service
 * ─────────────────────────────────────────────────────────────────
 * Provides end-to-end AES-256-GCM encrypt / decrypt for sensitive
 * intel data.  All operations require an authenticated, approved
 * user (admin or approved subscription tier).
 *
 * Endpoints (pass { action, payload } in body):
 *   action: "encrypt"  → { ciphertext, iv, tag, keyId }
 *   action: "decrypt"  → { plaintext }
 *   action: "verify"   → { authorized: bool, identity }  (auth check only)
 *
 * The master key is derived from ENCRYPTION_MASTER_KEY env secret.
 * Each encrypt call generates a fresh random 96-bit IV (GCM standard).
 * ─────────────────────────────────────────────────────────────────
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];
const SENSITIVE_TIER = "pro"; // minimum tier to encrypt/decrypt sensitive data

// ── Key derivation ────────────────────────────────────────────────
async function getMasterKey() {
  const raw = Deno.env.get("ENCRYPTION_MASTER_KEY");
  if (!raw) throw new Error("ENCRYPTION_MASTER_KEY secret is not set");

  // Hash the secret with SHA-256 to get exactly 256 bits
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// ── Auth & tier guard ─────────────────────────────────────────────
async function authorizeUser(base44) {
  const user = await base44.auth.me();
  if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });

  // Admins always pass
  if (user.role === "admin" || user.role === "superuser") return user;

  // Check subscription tier
  const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
  let tier = user.subscription_tier || "community";
  if (subs.length > 0) {
    const active = subs.find(s => s.status === "active" || s.status === "trialing");
    if (active) tier = active.tier;
  }

  const userTierIdx = TIER_ORDER.indexOf(tier);
  const minTierIdx = TIER_ORDER.indexOf(SENSITIVE_TIER);
  if (userTierIdx < minTierIdx) {
    throw Object.assign(
      new Error(`Forbidden: ${SENSITIVE_TIER}+ subscription required for encrypted data access`),
      { status: 403 }
    );
  }

  return user;
}

// ── Encrypt ───────────────────────────────────────────────────────
async function encryptData(plaintext) {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV (GCM recommended)
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoded
  );

  // GCM appends the 16-byte auth tag at the end of cipherBuffer
  const cipherBytes = new Uint8Array(cipherBuffer);
  const ciphertext = bufToBase64(cipherBytes.slice(0, -16));
  const tag = bufToBase64(cipherBytes.slice(-16));

  return {
    ciphertext,
    iv: bufToBase64(iv),
    tag,
    algorithm: "AES-256-GCM",
    keyId: "mk-v1",
  };
}

// ── Decrypt ───────────────────────────────────────────────────────
async function decryptData({ ciphertext, iv, tag }) {
  const key = await getMasterKey();

  // Re-assemble ciphertext + tag (SubtleCrypto expects them concatenated)
  const ctBytes = base64ToBuf(ciphertext);
  const tagBytes = base64ToBuf(tag);
  const combined = new Uint8Array(ctBytes.length + tagBytes.length);
  combined.set(ctBytes);
  combined.set(tagBytes, ctBytes.length);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(iv), tagLength: 128 },
    key,
    combined
  );

  return new TextDecoder().decode(plainBuffer);
}

// ── Main handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await authorizeUser(base44);

    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    // ── verify ────────────────────────────────────────────────────
    if (action === "verify") {
      await base44.asServiceRole.entities.SecurityAuditLog.create({
        actor_email: user.email,
        actor_role: user.role,
        action: "encryption_verify",
        resource_type: "encryption_service",
        severity: "info",
        outcome: "success",
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return Response.json({
        authorized: true,
        identity: { email: user.email, role: user.role },
        algorithm: "AES-256-GCM",
        keyId: "mk-v1",
      });
    }

    // ── encrypt ───────────────────────────────────────────────────
    if (action === "encrypt") {
      if (!payload?.plaintext) {
        return Response.json({ error: "Missing payload.plaintext" }, { status: 400 });
      }

      const result = await encryptData(payload.plaintext);

      await base44.asServiceRole.entities.SecurityAuditLog.create({
        actor_email: user.email,
        actor_role: user.role,
        action: "encrypt",
        resource_type: payload.resource_type || "data",
        resource_id: payload.resource_id || "unknown",
        details: `AES-256-GCM encrypt by ${user.email}`,
        severity: "info",
        outcome: "success",
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return Response.json(result);
    }

    // ── decrypt ───────────────────────────────────────────────────
    if (action === "decrypt") {
      if (!payload?.ciphertext || !payload?.iv || !payload?.tag) {
        return Response.json({ error: "Missing payload fields: ciphertext, iv, tag" }, { status: 400 });
      }

      const plaintext = await decryptData(payload);

      await base44.asServiceRole.entities.SecurityAuditLog.create({
        actor_email: user.email,
        actor_role: user.role,
        action: "decrypt",
        resource_type: payload.resource_type || "data",
        resource_id: payload.resource_id || "unknown",
        details: `AES-256-GCM decrypt by ${user.email}`,
        severity: "info",
        outcome: "success",
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      return Response.json({ plaintext });
    }

    return Response.json({ error: "Invalid action. Use: encrypt | decrypt | verify" }, { status: 400 });

  } catch (err) {
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
});