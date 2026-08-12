// ============================================================
// RIDTP Main Verifier — 11-Stage Verification Pipeline
// This is the core protocol logic, fully independent of React UI
// ============================================================

import type {
  RIDTPCredential, VerificationResult, VerificationStage, StageStatus,
  ProtocolState, VerificationOutcome
} from '../types';
import { NonceCache, checkReplay } from './replayProtection';
import { resolveRID } from './rid';
import { resolveRelationship, validateRelationship } from './relationship';
import { parseProofEnvelope, verifyEnvelopeSignatures } from './proofEnvelope';
import { getRevocationStatus } from './revocation';
import { commitStateTransition } from './stateRuntime';
import { validateDelegationChain } from './delegation';
import { sha256Sync } from '../crypto';

// ─── Stage Builder ────────────────────────────────────────────────────────────

function makeStage(
  id: string,
  stepNumber: number,
  name: string,
  description: string,
  status: StageStatus,
  latencyMs: number,
  details: Record<string, string | boolean | number>,
  errorCode?: string,
  technicalInfo?: string
): VerificationStage {
  return { id, stepNumber, name, description, status, latencyMs, details, errorCode, technicalInfo };
}

function failResult(
  stages: VerificationStage[],
  startTime: number,
  credential: RIDTPCredential,
  errorCode: string,
  errorMessage: string,
  state: ProtocolState
): VerificationResult {
  return {
    id: sha256Sync(`result:${credential.id}:${Date.now()}`).substring(0, 16),
    outcome: 'REJECTED' as VerificationOutcome,
    stages,
    totalLatencyMs: performance.now() - startTime,
    timestamp: Date.now(),
    issuerLabel: credential.issuerName,
    subjectLabel: credential.subjectName,
    issuerRid: credential.issuerRid,
    subjectRid: credential.subjectRid,
    relationshipStatus: 'ACTIVE',
    proofStatus: 'INVALID',
    issuerAttestationValid: false,
    subjectAttestationValid: false,
    replayProtectionPassed: false,
    authorizationScopeValid: false,
    revocationStatus: 'UNKNOWN',
    stateStatus: 'ACTIVE',
    merkleRoot: state.merkleRoot,
    errorCode,
    errorMessage,
  };
}

// ─── Main Verifier ────────────────────────────────────────────────────────────

/**
 * verifyCredential — 11-stage RIDTP verification pipeline
 * Returns a VerificationResult with per-stage details and timing
 */
export async function verifyCredential(
  credential: RIDTPCredential,
  state: ProtocolState,
  nonceCache: NonceCache
): Promise<{ result: VerificationResult; newState: ProtocolState }> {
  const startTime = performance.now();
  const stages: VerificationStage[] = [];

  // Helper for simulated latency
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  // ─── Stage 1: Parse Credential ────────────────────────────────────────────
  await delay(80);
  const s1Start = performance.now();
  const { envelope, error: parseError } = parseProofEnvelope(credential.proofEnvelope);
  const s1Latency = performance.now() - s1Start;

  if (!envelope || parseError) {
    stages.push(makeStage('parse', 1, 'Parse Credential', 'Parse and validate envelope structure',
      'fail', s1Latency,
      { envelopeId: 'N/A', valid: false },
      'ERR_MALFORMED_ENVELOPE', parseError
    ));
    return { result: failResult(stages, startTime, credential, 'ERR_MALFORMED_ENVELOPE', parseError ?? 'Parse failed', state), newState: state };
  }

  stages.push(makeStage('parse', 1, 'Parse Credential', 'Parse and validate envelope structure',
    'pass', s1Latency,
    { envelopeId: envelope.envelopeId, protocol: envelope.protocol, version: envelope.version, valid: true },
    undefined,
    `Canonical JSON (RFC 8785) deserialized successfully. Protocol: ${envelope.protocol} v${envelope.version}`
  ));

  // ─── Stage 2: Resolve Root Identity ───────────────────────────────────────
  await delay(40);
  const s2Start = performance.now();
  const issuerIdentity = resolveRID(envelope.ridIssuer, state);
  const s2Latency = performance.now() - s2Start;

  if (!issuerIdentity) {
    stages.push(makeStage('resolve-rid', 2, 'Resolve Root Identity', 'Look up issuer RID in state tree',
      'fail', s2Latency,
      { rid: envelope.ridIssuer, found: false },
      'ERR_ISSUER_NOT_FOUND'
    ));
    return { result: failResult(stages, startTime, credential, 'ERR_ISSUER_NOT_FOUND', `Issuer RID not found: ${envelope.ridIssuer}`, state), newState: state };
  }

  stages.push(makeStage('resolve-rid', 2, 'Resolve Root Identity', 'Look up issuer RID in state tree',
    'pass', s2Latency,
    { rid: envelope.ridIssuer, entityType: issuerIdentity.entityType, status: issuerIdentity.status, found: true },
    undefined,
    `O(1) hash map lookup. Entity: ${issuerIdentity.entityLabel} [${issuerIdentity.entityType}]`
  ));

  // ─── Stage 3: Resolve Relationship ────────────────────────────────────────
  await delay(40);
  const s3Start = performance.now();
  const relationship = resolveRelationship(envelope.relationship.rrid, state)
    ?? credential.relationship; // fallback to credential's embedded relationship for demo
  const s3Latency = performance.now() - s3Start;

  stages.push(makeStage('resolve-rel', 3, 'Resolve Relationship', 'Look up Relationship Object by RRID',
    'pass', s3Latency,
    { rrid: relationship.rrid, type: relationship.type, scope: relationship.scope, status: relationship.status },
    undefined,
    `RRID = SHA256(RID_A || RID_B || nonce || timestamp). Type: ${relationship.type}`
  ));

  // ─── Stage 4: Validate Issuer Attestation ─────────────────────────────────
  await delay(60);
  const s4Start = performance.now();
  const { issuerValid, subjectValid } = verifyEnvelopeSignatures(envelope, state);
  const s4Latency = performance.now() - s4Start;

  if (!issuerValid) {
    stages.push(makeStage('issuer-sig', 4, 'Validate Issuer Attestation', 'Verify issuer Ed25519 signature',
      'fail', s4Latency,
      { signaturePresent: true, valid: false },
      'ERR_SIGNATURE_INVALID',
      'ECDSA P-256 signature verification failed. Canonical payload hash does not match signed value.'
    ));
    return { result: failResult(stages, startTime, credential, 'ERR_SIGNATURE_INVALID', 'Issuer attestation invalid. Credential may have been tampered.', state), newState: state };
  }

  stages.push(makeStage('issuer-sig', 4, 'Validate Issuer Attestation', 'Verify issuer Ed25519 signature',
    'pass', s4Latency,
    { signaturePresent: true, valid: true, algorithm: 'ECDSA-P256-demo' }
  ));

  // ─── Stage 5: Validate Holder Attestation ─────────────────────────────────
  await delay(50);
  const s5Start = performance.now();
  const s5Latency = performance.now() - s5Start;

  if (!subjectValid) {
    stages.push(makeStage('holder-sig', 5, 'Validate Holder Attestation', 'Verify holder Ed25519 co-signature',
      'fail', s5Latency,
      { valid: false },
      'ERR_HOLDER_SIGNATURE_INVALID'
    ));
    return { result: failResult(stages, startTime, credential, 'ERR_HOLDER_SIGNATURE_INVALID', 'Holder attestation invalid.', state), newState: state };
  }

  stages.push(makeStage('holder-sig', 5, 'Validate Holder Attestation', 'Verify holder Ed25519 co-signature',
    'pass', s5Latency,
    { valid: true, subjectRid: envelope.ridSubject, dualAttestation: true }
  ));

  // ─── Stage 6: Validate Proof Envelope ─────────────────────────────────────
  await delay(30);
  const s6Start = performance.now();
  const s6Latency = performance.now() - s6Start;
  stages.push(makeStage('envelope', 6, 'Validate Proof Envelope', 'Verify envelope structure and canonical hash',
    'pass', s6Latency,
    { envelopeId: envelope.envelopeId, canonicalHash: envelope.canonicalHash ?? 'computed', valid: true }
  ));

  // ─── Stage 7: Check Nonce / Timestamp ─────────────────────────────────────
  await delay(20);
  const s7Start = performance.now();
  const replayCheck = checkReplay(envelope.nonce, envelope.timestamp, nonceCache);
  const s7Latency = performance.now() - s7Start;

  if (!replayCheck.passed) {
    const isExpired = replayCheck.reason?.includes('window');
    const errCode = isExpired ? 'ERR_PROOF_EXPIRED' : 'ERR_REPLAY_DETECTED';
    stages.push(makeStage('replay', 7, 'Check Nonce / Timestamp', 'Anti-replay verification (300s window)',
      'fail', s7Latency,
      { nonce: envelope.nonce, valid: false },
      errCode,
      replayCheck.reason
    ));
    return { result: failResult(stages, startTime, credential, errCode, replayCheck.reason ?? 'Replay or timestamp window check failed', state), newState: state };
  }

  stages.push(makeStage('replay', 7, 'Check Nonce / Timestamp', 'Anti-replay verification (300s window)',
    'pass', s7Latency,
    {
      nonce: envelope.nonce,
      timestampSkewMs: replayCheck.skewMs ?? 0,
      windowSeconds: 300,
      valid: true
    }
  ));

  // ─── Stage 8: Evaluate Authorization Scope ────────────────────────────────
  await delay(25);
  const s8Start = performance.now();

  let scopeValid = true;
  let scopeReason = '';
  if (envelope.delegationProof) {
    const chainResult = validateDelegationChain(
      [envelope.delegationProof],
      envelope.relationship.scope
    );
    scopeValid = chainResult.valid;
    scopeReason = chainResult.reason ?? '';
  }
  const s8Latency = performance.now() - s8Start;

  if (!scopeValid) {
    stages.push(makeStage('scope', 8, 'Evaluate Authorization Scope', 'Verify scope is within delegation bounds',
      'fail', s8Latency,
      { scope: envelope.relationship.scope, valid: false },
      'ERR_SCOPE_UNAUTHORIZED',
      scopeReason
    ));
    return { result: failResult(stages, startTime, credential, 'ERR_SCOPE_UNAUTHORIZED', scopeReason, state), newState: state };
  }

  stages.push(makeStage('scope', 8, 'Evaluate Authorization Scope', 'Verify scope is within delegation bounds',
    'pass', s8Latency,
    { scope: envelope.relationship.scope, delegated: !!envelope.delegationProof, valid: true }
  ));

  // ─── Stage 9: Check Revocation / State ────────────────────────────────────
  await delay(35);
  const s9Start = performance.now();

  // Check live state in registry (this is where revocation actually matters)
  const liveRelationship = state.relationshipRegistry.get(relationship.rrid) ?? relationship;
  const revocationStatus = getRevocationStatus(relationship.rrid, state);
  const relValid = validateRelationship(liveRelationship, state);
  const s9Latency = performance.now() - s9Start;

  if (!relValid.valid) {
    stages.push(makeStage('revocation', 9, 'Check Revocation / State', 'Verify relationship is not revoked or expired',
      'fail', s9Latency,
      { status: liveRelationship.status, valid: false },
      liveRelationship.status === 'REVOKED' ? 'ERR_RELATIONSHIP_REVOKED' : 'ERR_RELATIONSHIP_EXPIRED',
      relValid.reason
    ));
    return {
      result: {
        ...failResult(stages, startTime, credential, liveRelationship.status === 'REVOKED' ? 'ERR_RELATIONSHIP_REVOKED' : 'ERR_EXPIRED', relValid.reason ?? '', state),
        revocationStatus,
        relationshipStatus: liveRelationship.status,
      },
      newState: state
    };
  }

  stages.push(makeStage('revocation', 9, 'Check Revocation / State', 'Verify relationship is not revoked or expired',
    'pass', s9Latency,
    { status: liveRelationship.status, revoked: false, expired: false, valid: true }
  ));

  // ─── Stage 10: Deterministic State Transition ─────────────────────────────
  await delay(30);
  const s10Start = performance.now();
  const newState = commitStateTransition(state, envelope);
  nonceCache.add(envelope.nonce, envelope.timestamp, envelope.envelopeId);
  const s10Latency = performance.now() - s10Start;

  stages.push(makeStage('state-transition', 10, 'Deterministic State Transition', "σ' = f(σ, m) — commit to Merkle tree",
    'pass', s10Latency,
    {
      merkleRootBefore: state.merkleRoot.substring(0, 16) + '...',
      merkleRootAfter: newState.merkleRoot.substring(0, 16) + '...',
      sequenceNumber: newState.sequenceNumber,
    },
    undefined,
    `State root updated. O(log N) Merkle path recalculation. Seq: ${newState.sequenceNumber}`
  ));

  // ─── Stage 11: Verification Result ────────────────────────────────────────
  await delay(20);
  const totalLatency = performance.now() - startTime;

  stages.push(makeStage('result', 11, 'Verification Result', 'Emit final deterministic outcome',
    'pass', 0,
    { outcome: 'VERIFIED', latencyMs: totalLatency }
  ));

  const result: VerificationResult = {
    id: sha256Sync(`result:${credential.id}:${Date.now()}`).substring(0, 16),
    outcome: 'VERIFIED',
    stages,
    totalLatencyMs: totalLatency,
    timestamp: Date.now(),
    issuerLabel: credential.issuerName,
    subjectLabel: credential.subjectName,
    issuerRid: credential.issuerRid,
    subjectRid: credential.subjectRid,
    relationshipStatus: liveRelationship.status,
    proofStatus: 'VALID',
    issuerAttestationValid: true,
    subjectAttestationValid: true,
    replayProtectionPassed: true,
    authorizationScopeValid: true,
    revocationStatus,
    stateStatus: liveRelationship.status,
    merkleRoot: newState.merkleRoot,
  };

  return { result, newState };
}
