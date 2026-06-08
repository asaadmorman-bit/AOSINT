/**
 * Radix-44 Encoding Utility
 * Alphabet: 10 digits + 26 uppercase + 8 QR-Mode-safe symbols
 * QR alphanumeric mode supports: 0-9, A-Z, SP, $, %, *, +, -, ., /, :
 * We use 44 of these for a compact, QR-safe, alphanumeric-only encoding.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$%*+-./:';
// Verify length = 44
if (ALPHABET.length !== 44) throw new Error('Radix-44 alphabet must be exactly 44 characters');

const BASE = 44n;

/**
 * Encode a BigInt to a Radix-44 string.
 */
function encodeBigInt(num) {
  if (num === 0n) return ALPHABET[0];
  let result = '';
  while (num > 0n) {
    result = ALPHABET[Number(num % BASE)] + result;
    num = num / BASE;
  }
  return result;
}

/**
 * Decode a Radix-44 string back to a BigInt.
 */
function decodeToBigInt(str) {
  let result = 0n;
  for (const ch of str.toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid Radix-44 character: "${ch}"`);
    result = result * BASE + BigInt(idx);
  }
  return result;
}

/**
 * Encode a plain string (case ID, UUID, etc.) to a Radix-44 URL token.
 * Converts each character's code point to a packed BigInt, then encodes.
 */
export function encodeR44(input) {
  // Pack: hex-encode the string, interpret as hex BigInt
  const hex = Array.from(input)
    .map(c => c.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
  const num = BigInt('0x' + hex);
  return encodeBigInt(num);
}

/**
 * Decode a Radix-44 token back to the original string.
 */
export function decodeR44(token) {
  const num = decodeToBigInt(token);
  let hex = num.toString(16);
  if (hex.length % 4 !== 0) hex = hex.padStart(hex.length + (4 - hex.length % 4), '0');
  let result = '';
  for (let i = 0; i < hex.length; i += 4) {
    result += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  }
  return result;
}

/**
 * Generate a shareable, QR-safe Case Report URL for a given case ID.
 */
export function buildCaseReportURL(caseId, baseUrl = window.location.origin) {
  const token = encodeR44(caseId);
  return `${baseUrl}/CaseReport/${token}`;
}

/**
 * Parse a Case Report URL token back to the original case ID.
 */
export function parseCaseReportToken(token) {
  return decodeR44(token);
}

/**
 * SHA-256 hash of content using Web Crypto API.
 * Returns a hex string. Use for IPFS CID pre-image verification.
 */
export async function sha256Hex(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(typeof content === 'string' ? content : JSON.stringify(content));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Prepare an evidence payload for IPFS storage.
 * Returns: { metadata (store in entity), ipfsPayload (send to IPFS node), hash }
 */
export async function prepareEvidenceForIPFS(evidenceContent, evidenceMeta = {}) {
  const payload = {
    content: evidenceContent,
    meta: evidenceMeta,
    prepared_at: new Date().toISOString(),
    schema_version: '1.0',
  };
  const hash = await sha256Hex(payload);
  const metadata = {
    ...evidenceMeta,
    sha256: hash,
    ipfs_ready: true,
    content_size_bytes: JSON.stringify(payload).length,
    prepared_at: payload.prepared_at,
    // CID would be returned by the IPFS node after pinning
    ipfs_cid: null,
  };
  return { metadata, ipfsPayload: payload, hash };
}