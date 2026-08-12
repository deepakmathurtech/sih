// ============================================================
// RIDTP Cryptographic Primitives
// Uses Web Crypto API (ECDSA P-256) as browser-safe Ed25519 equivalent
// In production: replace with libsodium-wrappers or @noble/ed25519
// ============================================================

/**
 * Canonical JSON serialization (RFC 8785 JCS)
 * Keys sorted lexicographically, no whitespace, UTF-8
 */
export function canonicalize(obj: unknown): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return JSON.stringify(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const sorted = Object.keys(obj as Record<string, unknown>)
      .sort()
      .map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k]))
      .join(',');
    return '{' + sorted + '}';
  }
  return JSON.stringify(obj);
}

/**
 * SHA-256 hash using Web Crypto API
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Synchronous SHA-256 simulation (deterministic for demo data)
 * Uses a seeded hash for reproducible demo identifiers
 */
export function sha256Sync(data: string): string {
  // Deterministic pseudo-hash for demo purposes
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  // Expand to 64 hex chars (256 bits simulated)
  let result = '';
  let seed = hash;
  for (let i = 0; i < 8; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    result += seed.toString(16).padStart(8, '0');
  }
  return result;
}

/**
 * Generate a cryptographic keypair (ECDSA P-256)
 * DEMO MODE: Returns deterministic hex strings for reproducibility
 */
export async function generateKeyPair(): Promise<{ publicKeyHex: string; privateKeyHex: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const pubRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKeyHex: Array.from(new Uint8Array(pubRaw)).map(b => b.toString(16).padStart(2, '0')).join(''),
    privateKeyHex: Array.from(new Uint8Array(privRaw)).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

/**
 * Sign a payload with ECDSA P-256 (demo Ed25519 equivalent)
 */
export async function signPayload(privateKeyHex: string, payload: unknown): Promise<string> {
  const canonical = canonicalize(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  // Import private key
  const keyBytes = hexToBytes(privateKeyHex);
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );

  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, data);
  return Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an ECDSA P-256 signature
 */
export async function verifySignature(
  publicKeyHex: string,
  payload: unknown,
  signatureHex: string
): Promise<boolean> {
  try {
    const canonical = canonicalize(payload);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    const pubKeyBytes = hexToBytes(publicKeyHex);
    const sigBytes = hexToBytes(signatureHex);

    const publicKey = await crypto.subtle.importKey(
      'raw', pubKeyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
    );

    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' }, publicKey, sigBytes, data
    );
  } catch {
    return false;
  }
}

/**
 * Derive Root Identity (RID) from public key
 * RID = urn:ridtp:root:sha256:<SHA256(canonical(pubkey))>
 */
export async function deriveRID(publicKeyHex: string, entityType: string): Promise<string> {
  const payload = { alg: 'ECDSA-P256-demo', entityType, pub: publicKeyHex };
  const digest = await sha256(canonicalize(payload));
  return `urn:ridtp:root:sha256:${digest}`;
}

/**
 * Derive Relationship ID (RRID)
 * RRID = urn:ridtp:rel:sha256:<SHA256(ridA || ridB || nonce || timestamp)>
 */
export async function deriveRRID(
  ridA: string, ridB: string, nonce: string, timestamp: number
): Promise<string> {
  const payload = canonicalize({ nonce, ridA, ridB, timestamp });
  const digest = await sha256(payload);
  return `urn:ridtp:rel:sha256:${digest}`;
}

/**
 * Generate a cryptographically random nonce
 */
export function generateNonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a deterministic demo nonce (for reproducible scenarios)
 */
export function generateDemoNonce(seed: string): string {
  return sha256Sync(seed + ':nonce').substring(0, 32);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

export function truncateRID(rid: string, chars = 12): string {
  const hash = rid.split(':').pop() || '';
  return hash.substring(0, chars) + '...' + hash.slice(-6);
}

export function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  return `${ms.toFixed(2)} ms`;
}
