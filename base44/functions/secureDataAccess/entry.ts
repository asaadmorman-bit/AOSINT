/**
 * Secure Data Access Gateway
 * ─────────────────────────────────────────────────────────────────
 * Enforces end-to-end AES-256-GCM encryption on reads/writes of
 * sensitive intel entities.  Only authenticated + approved users
 * (correct tier or admin) may read decrypted data.
 *
 * POST body:
 *   { entity, operation, id?, filter?, data?, encrypt_fields? }
 *
 * encrypt_fields: array of field names to transparently encrypt on
 *   write and decrypt on read.
 * ─────────────────────────────────────────────────────────────────
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

// Which entities require encryption and their minimum access tier
const PROTECTED_ENTITIES = {
  LEAIntelligence: { min_tier: "enterprise", encrypt_fields: ["description", "operator_notes", "leadership", "weapons_intelligence"] },
  OsintAlert:      { min_tier: "pro",         encrypt_fields: ["description", "recommended_actions"] },
  ThreatIndicator: { min_tier: "pro",         encrypt_fields: ["value", "notes", "enrichment_data"] },
  ThreatActor:     { min_tier: "pro",         encrypt_fields: ["notes"] },
  VulnerabilityFinding: { min_tier: "enterprise", encrypt_fields: ["description", "remediation_guidance"] },
  FeedMessage:     { min_tier: "pro",         encrypt_fields: ["content"] },
};

// ── Key derivation (same logic as encryptionService) ─────────────
async function getMasterKey() {
  const raw = Deno.env.get("ENCRYPTION_MASTER_KEY");
  if (!raw) throw new Error("ENCRYPTION_MASTER_KEY secret is not set");
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return crypto.subtle.importKey("raw", hashBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function bufToBase64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function base64ToBuf(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

async function encrypt(plaintext) {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, new TextEncoder().encode(plaintext));
  const bytes = new Uint8Array(cipherBuffer);
  return `enc::${bufToBase64(iv)}::${bufToBase64(bytes.slice(0, -16))}::${bufToBase64(bytes.slice(-16))}`;
}

async function decrypt(token) {
  if (!token || !token.startsWith("enc::")) return token; // not encrypted
  const [, ivB64, ctB64, tagB64] = token.split("::");
  const key = await getMasterKey();
  const ct = base64ToBuf(ctB64);
  const tag = base64ToBuf(tagB64);
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct); combined.set(tag, ct.length);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBuf(ivB64), tagLength: 128 }, key, combined);
  return new TextDecoder().decode(plain);
}

// ── Encrypt/decrypt entire record fields ─────────────────────────
async function encryptRecord(record, fields) {
  const out = { ...record };
  for (const f of fields) {
    if (out[f] != null) {
      const val = typeof out[f] === "string" ? out[f] : JSON.stringify(out[f]);
      out[f] = await encrypt(val);
    }
  }
  return out;
}

async function decryptRecord(record, fields) {
  const out = { ...record };
  for (const f of fields) {
    if (out[f] && typeof out[f] === "string" && out[f].startsWith("enc::")) {
      const plain = await decrypt(out[f]);
      try { out[f] = JSON.parse(plain); } catch { out[f] = plain; }
    }
  }
  return out;
}

// ── Auth guard ────────────────────────────────────────────────────
async function authorizeUser(base44, min_tier) {
  const user = await base44.auth.me();
  if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  if (user.role === "admin" || user.role === "superuser") return user;

  const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
  let tier = user.subscription_tier || "community";
  if (subs.length) {
    const active = subs.find(s => s.status === "active" || s.status === "trialing");
    if (active) tier = active.tier;
  }

  if (TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(min_tier)) {
    throw Object.assign(
      new Error(`Forbidden: requires ${min_tier}+ subscription`),
      { status: 403 }
    );
  }
  return user;
}

// ── Handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { entity, operation, id, filter, data } = body;

    const config = PROTECTED_ENTITIES[entity];
    if (!config) return Response.json({ error: `Entity '${entity}' is not a protected entity` }, { status: 400 });

    const user = await authorizeUser(base44, config.min_tier);
    const fields = config.encrypt_fields || [];
    const ent = base44.asServiceRole.entities[entity];

    let result;

    if (operation === "read") {
      // Single record
      const record = await ent.get(id);
      result = await decryptRecord(record, fields);
    } else if (operation === "list") {
      const records = await ent.filter(filter || {});
      result = await Promise.all(records.map(r => decryptRecord(r, fields)));
    } else if (operation === "create") {
      const encrypted = await encryptRecord(data || {}, fields);
      result = await ent.create(encrypted);
    } else if (operation === "update") {
      const encrypted = await encryptRecord(data || {}, fields);
      result = await ent.update(id, encrypted);
    } else if (operation === "delete") {
      await ent.delete(id);
      result = { deleted: true, id };
    } else {
      return Response.json({ error: "Invalid operation: read|list|create|update|delete" }, { status: 400 });
    }

    // Audit log
    await base44.asServiceRole.entities.SecurityAuditLog.create({
      actor_email: user.email,
      actor_role: user.role,
      action: `secure_${operation}`,
      resource_type: entity,
      resource_id: id || "bulk",
      details: `AES-256-GCM secured ${operation} on ${entity}`,
      severity: "info",
      outcome: "success",
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    return Response.json({ success: true, result });

  } catch (err) {
    return Response.json({ error: err.message }, { status: err.status || 500 });
  }
});