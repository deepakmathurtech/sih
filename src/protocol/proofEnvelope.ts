// ============================================================
// RIDTP Proof Envelope — Construction & Verification
// ============================================================

import type { ProofEnvelope, RelationshipObject, ProtocolState, RIDString } from '../types';
import { sha256Sync, canonicalize, generateDemoNonce } from '../crypto';
import { resolveRID } from './rid';

/**
 * Create a signed ProofEnvelope from a RelationshipObject
 */
export function createProofEnvelope(
  rel: RelationshipObject,
  seedNonce?: string
): ProofEnvelope {
  const nonce = seedNonce
    ? generateDemoNonce(seedNonce)
    : generateDemoNonce(`${rel.rrid}:${Date.now()}`);
  const timestamp = Date.now();

  const payload = {
    nonce,
    protocol: 'RIDTP' as const,
    relationship: { rrid: rel.rrid, scope: rel.scope, type: rel.type },
    ridIssuer: rel.issuerRid,
    ridSubject: rel.subjectRid,
    timestamp,
    ttl: rel.ttl,
    version: '1.0' as const,
  };

  const canonicalStr = canonicalize(payload);
  const envelopeId = `urn:ridtp:env:sha256:${sha256Sync(canonicalStr)}`;
  const canonicalHash = sha256Sync(canonicalStr);

  // Demo signatures (deterministic from canonical hash)
  const signatureIssuer = `ecdsa_p256_demo:${sha256Sync(canonicalHash + ':issuer')}`;
  const signatureSubject = `ecdsa_p256_demo:${sha256Sync(canonicalHash + ':subject')}`;

  return {
    envelopeId,
    protocol: 'RIDTP',
    version: '1.0',
    ridIssuer: rel.issuerRid,
    ridSubject: rel.subjectRid,
    relationship: { rrid: rel.rrid, scope: rel.scope, type: rel.type },
    nonce,
    timestamp,
    ttl: rel.ttl,
    signatureIssuer,
    signatureSubject,
    canonicalHash,
  };
}

/**
 * Create a tampered envelope (invalid signature for demo)
 */
export function createTamperedProofEnvelope(rel: RelationshipObject): ProofEnvelope {
  const env = createProofEnvelope(rel, 'tampered_scenario');
  return {
    ...env,
    signatureIssuer: 'ecdsa_p256_demo:TAMPERED_INVALID_SIGNATURE_AAABBBCCC111222333',
  };
}

/**
 * Create an expired envelope (timestamp far in the past)
 */
export function createExpiredProofEnvelope(rel: RelationshipObject): ProofEnvelope {
  const env = createProofEnvelope(rel, 'expired_scenario');
  return {
    ...env,
    timestamp: Date.now() - 400_000, // 400 seconds ago, outside 300s window
    nonce: generateDemoNonce('expired_nonce_fixed'),
  };
}

/**
 * Parse and validate proof envelope structure
 */
export function parseProofEnvelope(raw: unknown): { envelope: ProofEnvelope | null; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { envelope: null, error: 'ERR_MALFORMED_ENVELOPE: Not an object' };
  }

  const obj = raw as Record<string, unknown>;
  const requiredFields = ['protocol', 'version', 'ridIssuer', 'ridSubject', 'nonce', 'timestamp', 'ttl'];

  for (const field of requiredFields) {
    if (!obj[field]) {
      return { envelope: null, error: `ERR_MALFORMED_ENVELOPE: Missing field '${field}'` };
    }
  }

  if (obj.protocol !== 'RIDTP') {
    return { envelope: null, error: 'ERR_MALFORMED_ENVELOPE: Unknown protocol' };
  }

  return { envelope: raw as ProofEnvelope };
}

/**
 * Verify the cryptographic signatures on a proof envelope
 * DEMO MODE: Verifies deterministic demo signatures
 */
export function verifyEnvelopeSignatures(
  envelope: ProofEnvelope,
  _state: ProtocolState
): { issuerValid: boolean; subjectValid: boolean; reason?: string } {
  // Recompute what the canonical hash should be
  const payload = {
    nonce: envelope.nonce,
    protocol: envelope.protocol,
    relationship: envelope.relationship,
    ridIssuer: envelope.ridIssuer,
    ridSubject: envelope.ridSubject,
    timestamp: envelope.timestamp,
    ttl: envelope.ttl,
    version: envelope.version,
  };

  const canonicalStr = canonicalize(payload);
  const expectedHash = sha256Sync(canonicalStr);

  const expectedIssuerSig = `ecdsa_p256_demo:${sha256Sync(expectedHash + ':issuer')}`;
  const expectedSubjectSig = `ecdsa_p256_demo:${sha256Sync(expectedHash + ':subject')}`;

  const issuerValid = envelope.signatureIssuer === expectedIssuerSig;
  const subjectValid = envelope.signatureSubject === expectedSubjectSig;

  return { issuerValid, subjectValid };
}

/**
 * Resolve issuer RID from state for envelope
 */
export function resolveEnvelopeIssuer(envelope: ProofEnvelope, state: ProtocolState) {
  return resolveRID(envelope.ridIssuer as RIDString, state);
}

/**
 * Verify authorization scope: does the envelope's scope match what's permitted?
 */
export function verifyAuthorizationScope(
  envelopeScope: string,
  allowedScopes: string[]
): { valid: boolean; reason?: string } {
  if (allowedScopes.includes(envelopeScope) || allowedScopes.includes('*')) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: `Scope '${envelopeScope}' not in allowed scopes: [${allowedScopes.join(', ')}]`,
  };
}
